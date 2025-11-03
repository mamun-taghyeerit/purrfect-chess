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
  getLastMoveInfo,
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
  isDragging: false,  // Guard against multiple simultaneous drags
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
let evalBarVisible = false;
let enginePanelVisible = false;

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
    isDragging: state.isDragging,  // Pass drag state to render lighter highlights
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
  
  // Only run auto-evaluation if eval bar or engine panel is visible
  if (!evalBarVisible && !enginePanelVisible) return;

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
  // Prevent selection during drag operations
  if (state.boardLocked || state.isDragging) return;
  
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

function handleDragStart(square) {
  // Guard against multiple simultaneous drags or selections
  if (state.isDragging || state.boardLocked) return;
  
  const game = getGame();
  const piece = game.get(square);
  
  // Only allow dragging player's own pieces
  if (!piece || piece.color !== game.turn()) {
    return;
  }
  
  // Set drag flag to prevent multiple simultaneous operations
  state.isDragging = true;
  
  // Set selected square and compute legal moves (for highlighting)
  state.selectedSquare = square;
  computeMoves(square);
  
  // Render board to show highlights in lighter shade during drag
  renderBoard();
}

function handleDragEnd() {
  // Clear drag flag
  state.isDragging = false;
  
  // Clear selection and highlights
  clearSelection();
  renderBoard();
}

function handleDrop(from, to) {
  if (state.boardLocked) return;
  
  // Clear drag flag when drop occurs
  state.isDragging = false;
  
  if (attemptPlayerMove(from, to)) {
    clearSelection();
    renderBoard();
  } else {
    // If move failed, still clear selection
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
      // DIAGNOSTIC: Log received analysis results in main thread
      console.log('[MAIN DIAGNOSTICS] Received analysis results from engine:', {
        isArray: Array.isArray(lines),
        length: lines?.length,
        lines: lines
      });

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

async function reviewLastMove() {
  const lastMoveInfo = getLastMoveInfo();
  
  if (!lastMoveInfo) {
    ui.showMessage('info', 'No move to review.');
    return;
  }

  if (!engineReady) {
    ui.showMessage('error', 'Engine is not ready yet.');
    return;
  }

  if (state.engineBusy) {
    ui.showMessage('info', 'Engine is busy. Stop current analysis first.');
    return;
  }

  try {
    ui.showMessage('info', 'Analyzing move...');

    // Analyze position before the move
    const preAnalysis = await analyze(lastMoveInfo.preFen, { movetime: 5000, multipv: 1 });
    const preEval = preAnalysis && preAnalysis.length > 0 ? preAnalysis[0] : null;

    // Analyze position after the move
    const postAnalysis = await analyze(lastMoveInfo.postFen, { movetime: 5000, multipv: 1 });
    const postEval = postAnalysis && postAnalysis.length > 0 ? postAnalysis[0] : null;

    // Classify the move
    const classification = classifyMove(lastMoveInfo, preEval, postEval);

    // Display the badge
    displayMoveBadge(classification, lastMoveInfo.to);

    ui.showMessage('success', `Move classified as: ${classification.type}`);
  } catch (error) {
    if (error && error.message !== 'Analysis stopped' && error.message !== 'Analysis superseded') {
      ui.showMessage('error', 'Failed to analyze move.');
    }
  }
}

function classifyMove(moveInfo, preEval, postEval) {
  // Build played UCI
  const playedUci = moveInfo.from + moveInfo.to + (moveInfo.promotion || '');

  // Extract scores with proper POV handling
  const preCp = preEval?.scoreType === 'cp' ? preEval.score : null;
  const postCp = postEval?.scoreType === 'cp' ? -postEval.score : null;
  const delta = (preCp != null && postCp != null) ? (postCp - preCp) : null;

  const engineMove = preEval?.uci || null;
  const wasWinningBefore = preCp !== null && preCp >= 150;
  const wasMuchWorseBefore = preCp !== null && preCp <= -150;
  const nowEqual = postCp !== null && Math.abs(postCp) <= 30;

  // If engine data missing, classify as inaccuracy
  if (delta === null) {
    return {
      type: 'inaccuracy',
      asset: getAssetPath('inaccuracy'),
      delta: null,
    };
  }

  // 1. forced
  if (preEval?.scoreType === 'mate' && playedUci === engineMove) {
    return { type: 'forced', asset: getAssetPath('forced'), delta };
  }
  if (playedUci === engineMove && Math.abs(delta) <= 15) {
    return { type: 'forced', asset: getAssetPath('forced'), delta };
  }

  // 2. great
  if (playedUci === engineMove && (preCp <= -120 || preEval?.scoreType === 'mate') && delta >= -20) {
    return { type: 'great', asset: getAssetPath('great'), delta };
  }

  // 3. book
  if (moveInfo.moveNumber <= 10 && Math.abs(delta) <= 10) {
    return { type: 'book', asset: getAssetPath('book'), delta };
  }

  // 4. best
  if (playedUci === engineMove) {
    return { type: 'best', asset: getAssetPath('best'), delta };
  }

  // 5. brilliant
  if (playedUci !== engineMove && delta >= 120 && TACTICAL_MOVE_PATTERN.test(moveInfo.san)) {
    return { type: 'brilliant', asset: getAssetPath('brilliant'), delta };
  }

  // 6. miss
  // Case A: missed win
  if (wasWinningBefore && delta <= -120) {
    return { type: 'miss', asset: getAssetPath('miss'), delta };
  }
  // Case B: missed equalizer
  // Check if we were worse, and the engine's best move would have led to equality
  if (wasMuchWorseBefore && playedUci !== engineMove) {
    // The engine evaluation shows what the position would be after the engine's move
    // Since preEval is from the mover's POV, a score near 0 means equality
    const engineLeadsToEquality = preEval?.scoreType === 'cp' && Math.abs(preEval.score) <= 30;
    // And our move didn't achieve equality
    if (engineLeadsToEquality && !nowEqual) {
      return { type: 'miss', asset: getAssetPath('miss'), delta };
    }
  }

  // 7. excellent
  if (delta >= -20) {
    return { type: 'excellent', asset: getAssetPath('excellent'), delta };
  }

  // 8. good
  if (delta >= -90) {
    return { type: 'good', asset: getAssetPath('good'), delta };
  }

  // 9. inaccuracy
  if (delta >= -200) {
    return { type: 'inaccuracy', asset: getAssetPath('inaccuracy'), delta };
  }

  // 10. mistake
  if (delta >= -400) {
    return { type: 'mistake', asset: getAssetPath('mistake'), delta };
  }

  // 11. blunder
  return { type: 'blunder', asset: getAssetPath('blunder'), delta };
}

function getAssetPath(type) {
  // Use relative path that works in all deployment scenarios
  const assetPath = `assets/${type}.png`;
  return assetPath;
}

let currentBadge = null;

// Pattern to identify tactical moves (captures, promotions, checks)
const TACTICAL_MOVE_PATTERN = /[x=+]/;

function displayMoveBadge(classification, targetSquare) {
  // Remove existing badge
  if (currentBadge) {
    currentBadge.remove();
    currentBadge = null;
  }

  const boardContainer = ui.getBoardContainer();
  if (!boardContainer) return;

  // Create badge element
  const badge = document.createElement('img');
  badge.className = `move-badge move-badge--${classification.type}`;
  badge.src = classification.asset;
  badge.alt = classification.type;

  // Handle image load error - fall back to good.png
  badge.onerror = () => {
    if (badge.src !== 'assets/good.png' && !badge.src.endsWith('/good.png')) {
      badge.src = 'assets/good.png';
    }
  };

  boardContainer.appendChild(badge);
  currentBadge = badge;

  // Get target square position
  const boardElement = ui.getBoardElement();
  const squares = boardElement.querySelectorAll('.square');
  let targetSquareElement = null;
  
  for (const square of squares) {
    if (square.dataset.square === targetSquare) {
      targetSquareElement = square;
      break;
    }
  }

  // Start animation after a brief delay to ensure the badge is rendered
  requestAnimationFrame(() => {
    if (targetSquareElement) {
      // Calculate the position of the target square relative to the board container
      const containerRect = boardContainer.getBoundingClientRect();
      const squareRect = targetSquareElement.getBoundingClientRect();
      
      // Position at top-right corner, more towards the outer edge
      const badgeSize = 24; // Final badge size (smaller)
      const edgeOffset = 4; // Pixels from the edge
      const offsetX = squareRect.left - containerRect.left + squareRect.width - edgeOffset;
      const offsetY = squareRect.top - containerRect.top + edgeOffset;
      
      // Set CSS custom properties for the target position
      badge.style.setProperty('--target-x', `${offsetX}px`);
      badge.style.setProperty('--target-y', `${offsetY}px`);
      badge.setAttribute('data-target', targetSquare);
      
      // Trigger animation by adding the animated class
      requestAnimationFrame(() => {
        badge.classList.add('move-badge--animated');
      });
    } else {
      // No target square, just fade in at center
      badge.classList.add('move-badge--animated');
    }
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
      // Clear any existing move review badge
      if (currentBadge) {
        currentBadge.remove();
        currentBadge = null;
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
      // Clear any existing move review badge
      if (currentBadge) {
        currentBadge.remove();
        currentBadge = null;
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
      // Clear any existing move review badge
      if (currentBadge) {
        currentBadge.remove();
        currentBadge = null;
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
    onEvalBarVisibilityChange: (visible) => {
      evalBarVisible = visible;
      if (visible) {
        queueAutoEvaluation();
      } else {
        cancelAutoEvaluation({ stopEngine: true });
      }
    },
    onEnginePanelVisibilityChange: (visible) => {
      enginePanelVisible = visible;
      if (visible) {
        queueAutoEvaluation();
      } else if (!evalBarVisible) {
        // Only cancel if eval bar is also hidden
        cancelAutoEvaluation({ stopEngine: true });
      }
    },
    onMoveReview: () => reviewLastMove(),
  });

  if (typeof ui.setEngineOverlayMode === "function") {
    ui.setEngineOverlayMode(state.engineDisplayMode);
  }

  // Initialize visibility states
  evalBarVisible = typeof ui.isEvalBarVisible === "function" ? ui.isEvalBarVisible() : false;
  enginePanelVisible = false; // Engine panel starts hidden

  const boardElement = ui.getBoardElement();
  const controller = createBoard(boardElement, {
    onSquareClick: handleSquareClick,
    onDrop: handleDrop,
    onSquareContext: highlightSquare,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
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
