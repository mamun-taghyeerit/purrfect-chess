import "./styles.css";
import {
  initGame,
  startNewGame,
  attemptMove,
  getGame,
  getFen,
  getPgn,
  getClocks,
  getTimeControl,
  loadFen,
  loadPgn,
} from "./game.js";
import { createBoard, renderPosition } from "./board.js";
import { initEngine, analyze, stop as stopEngine } from "./engine.js";
import { initUI } from "./ui.js";

const state = {
  selectedSquare: null,
  legalMoves: new Set(),
  captureMoves: new Set(),
  customHighlights: new Set(),
  lastMove: null,
  engineHighlights: [],
  engineDisplayMode: "arrows",
  engineBusy: false,
  boardLocked: false,
};

let ui;
let boardController;
let engineReady = false;
let clockInterval = null;
let autoEvalToken = 0;
let autoEvalActive = false;
let autoEvalDepth = 22;

function formatMatchDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatTimeControl({ minutes, increment }) {
  return `${minutes} + ${increment}`;
}

function selectEngineDepth({ minutes }) {
  return minutes > 10 ? 18 : 22;
}

function updateDepthFromControl(control) {
  autoEvalDepth = selectEngineDepth(control);
  if (ui && typeof ui.setEngineDepth === "function") {
    ui.setEngineDepth(autoEvalDepth);
  }
}

function refreshMatchDetails() {
  const control = getTimeControl();
  const now = new Date();
  ui.updateMatchInfo({
    title: "Purrfect Chess Arena",
    event: `Purrfect Game - ${control.minutes}+${control.increment}`,
    date: formatMatchDate(now),
    timeControl: formatTimeControl(control),
    site: "Purrfect Universe (Online)",
  });
}

function renderBoard() {
  renderPosition(getGame(), {
    selectedSquare: state.selectedSquare,
    legalMoves: Array.from(state.legalMoves),
    captureMoves: Array.from(state.captureMoves),
    lastMove: state.lastMove,
    customHighlights: Array.from(state.customHighlights),
    engineHighlights: state.engineHighlights,
    engineDisplayMode: state.engineDisplayMode,
  });
}

function cancelAutoEvaluation({ stopEngine: shouldStop = true } = {}) {
  if (autoEvalActive && shouldStop && engineReady && !state.engineBusy) {
    try {
      stopEngine();
    } catch (error) {
      // ignore engine stop errors for auto-eval
    }
  }
  autoEvalActive = false;
  autoEvalToken += 1;
  return autoEvalToken;
}

function queueAutoEvaluation() {
  if (!ui || typeof ui.updateEvalBar !== "function") return;
  if (!engineReady || state.engineBusy) return;

  const token = cancelAutoEvaluation();
  autoEvalActive = true;
  const fen = getFen();

  if (typeof ui.setEvalBarAnalyzing === "function") {
    ui.setEvalBarAnalyzing(true);
  }

  analyze(fen, { depth: autoEvalDepth, multipv: 1 })
    .then((lines) => {
      if (token !== autoEvalToken) return;

      const bestLine = Array.isArray(lines) && lines.length > 0 ? lines[0] : null;
      if (!bestLine) {
        ui.updateEvalBar(0);
        return;
      }

      if (bestLine.scoreType === "mate") {
        const advantage = bestLine.score > 0 ? 500 : -500;
        ui.updateEvalBar(advantage);
        return;
      }

      ui.updateEvalBar(bestLine.score);
    })
    .catch((error) => {
      if (token !== autoEvalToken) return;
      if (error && error.message === "Analysis stopped") {
        return;
      }
      ui.updateEvalBar(null);
    })
    .finally(() => {
      if (token !== autoEvalToken) return;
      autoEvalActive = false;
      if (typeof ui.setEvalBarAnalyzing === "function") {
        ui.setEvalBarAnalyzing(false);
      }
    });
}

function clearSelection() {
  state.selectedSquare = null;
  state.legalMoves.clear();
  state.captureMoves.clear();
}

function computeMoves(square) {
  const moves = getGame().moves({ square, verbose: true });
  state.legalMoves.clear();
  state.captureMoves.clear();
  moves.forEach((move) => {
    if (move.flags.includes("c") || move.flags.includes("e")) {
      state.captureMoves.add(move.to);
    } else {
      state.legalMoves.add(move.to);
    }
  });
}

function attemptPlayerMove(from, to) {
  const result = attemptMove(from, to, {});
  if (!result.success) {
    ui.showMessage("error", "Illegal move.");
    return false;
  }
  return true;
}

function updateMoveList() {
  const history = getGame().history({ verbose: true });
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      index: i / 2 + 1,
      white: history[i] ? history[i].san : "",
      black: history[i + 1] ? history[i + 1].san : "",
    });
  }
  ui.updateMoveList(pairs);
}

function updateNotation() {
  ui.updateNotation({ pgn: getPgn(), fen: getFen() });
}

function handleMove(event) {
  const { move, status } = event;
  if (state.engineBusy) {
    stopAnalysis({ quiet: true });
  } else {
    state.engineHighlights = [];
    ui.updateEngineLines([]);
  }
  if (move) {
    state.lastMove = { from: move.from, to: move.to };
  } else {
    state.lastMove = null;
  }
  clearSelection();
  renderBoard();
  updateMoveList();
  updateNotation();
  ui.updateClocks(getClocks());

  if (status?.type === "reset") {
    ui.updateEvalBar(0);
  }

  if (status?.type === "reset") {
    updateDepthFromControl(getTimeControl());
    if (boardController && typeof boardController.clearArrows === "function") {
      boardController.clearArrows();
    }
    refreshMatchDetails();
    ui.showMessage("info", "New game started.");
    boardController.setInteractive(true);
    state.boardLocked = false;
  } else if (status?.type === "load") {
    updateDepthFromControl(getTimeControl());
    if (boardController && typeof boardController.clearArrows === "function") {
      boardController.clearArrows();
    }
    boardController.setInteractive(true);
    state.boardLocked = false;
  }

  queueAutoEvaluation();
}

function handleGameOver(payload) {
  state.boardLocked = true;
  boardController.setInteractive(false);

  switch (payload.reason) {
    case "checkmate": {
      const winner = payload.winner === "w" ? "White" : "Black";
      ui.showMessage("success", `${winner} wins by checkmate.`);
      break;
    }
    case "timeout": {
      const winner = payload.winner === "w" ? "White" : "Black";
      ui.showMessage("error", `${winner} wins on time.`);
      break;
    }
    case "stalemate":
      ui.showMessage("info", "Stalemate. The game is drawn.");
      break;
    case "threefold":
      ui.showMessage("info", "Draw by threefold repetition.");
      break;
    case "insufficient":
      ui.showMessage("info", "Draw by insufficient material.");
      break;
    case "draw":
      ui.showMessage("info", "Draw by the fifty-move rule.");
      break;
    default:
      break;
  }
}

function highlightSquare(square) {
  if (state.customHighlights.has(square)) {
    state.customHighlights.delete(square);
  } else {
    state.customHighlights.add(square);
  }
  renderBoard();
}

function handleSquareClick(square) {
  if (state.boardLocked) return;
  const game = getGame();
  const piece = game.get(square);

  const isTarget =
    state.legalMoves.has(square) || state.captureMoves.has(square);
  if (state.selectedSquare && isTarget) {
    if (attemptPlayerMove(state.selectedSquare, square)) {
      clearSelection();
      renderBoard();
    }
    return;
  }

  if (state.selectedSquare === square) {
    clearSelection();
    renderBoard();
    return;
  }

  if (piece && piece.color === game.turn()) {
    state.selectedSquare = square;
    computeMoves(square);
  } else {
    if (piece && piece.color !== game.turn()) {
      state.customHighlights.clear();
      state.engineHighlights = [];
      ui.updateEngineLines([]);
      if (boardController && typeof boardController.clearArrows === "function") {
        boardController.clearArrows();
      }
    }
    clearSelection();
  }
  renderBoard();
}

function handleDrop(from, to) {
  if (state.boardLocked) return;
  if (attemptPlayerMove(from, to)) {
    clearSelection();
    renderBoard();
  }
}

function stopAnalysis({ quiet = false } = {}) {
  cancelAutoEvaluation();
  state.engineBusy = false;
  ui.setEngineBusy(false);
  state.engineHighlights = [];
  ui.updateEngineLines([]);
  if (!quiet) {
    ui.showMessage("info", "Engine analysis stopped.");
  }
  renderBoard();
  if (!engineReady) return;
  try {
    stopEngine();
  } catch (error) {
    // ignore engine stop errors
  }
  if (!quiet) {
    queueAutoEvaluation();
  }
}

function startAnalysis({ depth }) {
  cancelAutoEvaluation();
  if (!engineReady) {
    ui.showMessage("error", "Engine is not ready yet.");
    return;
  }
  if (state.engineBusy) {
    return;
  }

  state.engineBusy = true;
  ui.setEngineBusy(true);
  ui.showMessage("info", "Engine analysis started.");

  const fen = getFen();
  analyze(fen, { depth, multipv: 3 })
    .then((lines) => {
      if (!Array.isArray(lines) || lines.length === 0) {
        ui.showMessage("error", "Engine could not find a suitable move.");
        state.engineHighlights = [];
        ui.updateEngineLines([]);
      } else {
        ui.updateEngineLines(lines);
        state.engineHighlights = lines.map((line, index) => ({
          from: line.from,
          to: line.to,
          rank: index + 1,
        }));
        renderBoard();
      }
    })
    .catch((error) => {
      if (error && error.message !== "Analysis stopped") {
        ui.showMessage("error", "Engine analysis failed.");
      }
    })
    .finally(() => {
      state.engineBusy = false;
      ui.setEngineBusy(false);
    });
}

function setupClockUpdater() {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  clockInterval = setInterval(() => {
    ui.updateClocks(getClocks());
  }, 200);
}

function initialize() {
  initGame({ onMove: handleMove, onGameOver: handleGameOver });
  ui = initUI(document.getElementById("app"), {
    onTimePreset: ({ minutes, increment }) => {
      stopAnalysis({ quiet: true });
      const control = { minutes, increment };
      updateDepthFromControl(control);
      if (ui && typeof ui.updateEvalBar === "function") {
        ui.updateEvalBar(0);
      }
      startNewGame(control);
      queueAutoEvaluation();
    },
    onStartNewGame: ({ minutes, increment }) => {
      stopAnalysis({ quiet: true });
      const control = { minutes, increment };
      updateDepthFromControl(control);
      if (ui && typeof ui.updateEvalBar === "function") {
        ui.updateEvalBar(0);
      }
      startNewGame(control);
      queueAutoEvaluation();
    },
    onResetGame: () => {
      stopAnalysis({ quiet: true });
      const control = getTimeControl();
      updateDepthFromControl(control);
      if (ui && typeof ui.updateEvalBar === "function") {
        ui.updateEvalBar(0);
      }
      startNewGame(control);
      queueAutoEvaluation();
    },
    onCopyFen: () => getFen(),
    onCopyPgn: () => getPgn(),
    onSetFen: (fen) => {
      stopAnalysis({ quiet: true });
      const result = loadFen(fen);
      if (result.success) {
        state.engineHighlights = [];
        ui.updateEngineLines([]);
        ui.updateEvalBar(0);
        queueAutoEvaluation();
      }
      return result;
    },
    onSetPgn: (pgn) => {
      stopAnalysis({ quiet: true });
      const result = loadPgn(pgn);
      if (result.success) {
        state.engineHighlights = [];
        ui.updateEngineLines([]);
        ui.updateEvalBar(0);
        queueAutoEvaluation();
      }
      return result;
    },
    onStartAnalysis: ({ depth }) => startAnalysis({ depth }),
    onStopAnalysis: () => stopAnalysis({ quiet: true }),
    onRevealEnginePanel: () => {
      ui.showMessage("success", "Engine panel unlocked!");
    },
    onEngineOverlayModeChange: (mode) => {
      state.engineDisplayMode = mode;
      renderBoard();
    },
  });

  if (typeof ui.setEngineOverlayMode === "function") {
    ui.setEngineOverlayMode(state.engineDisplayMode);
  }

  const boardElement = ui.getBoardElement();
  const controller = createBoard(boardElement, {
    onSquareClick: handleSquareClick,
    onDrop: handleDrop,
    onSquareContext: highlightSquare,
  });
  boardController = controller;

  renderBoard();
  updateMoveList();
  updateNotation();
  setupClockUpdater();

  const initialControl = ui.getCurrentTimeControl();
  updateDepthFromControl(initialControl);
  if (ui && typeof ui.updateEvalBar === "function") {
    ui.updateEvalBar(0);
  }
  startNewGame(initialControl);
  queueAutoEvaluation();

  refreshMatchDetails();

  initEngine()
    .then(() => {
      engineReady = true;
      queueAutoEvaluation();
    })
    .catch(() => {
      ui.showMessage("error", "Unable to initialize Stockfish.");
    });
}

initialize();
