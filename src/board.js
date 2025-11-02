const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const pieceImages = {
  w: {
    p: "/assets/w_pawn.png",
    r: "/assets/w_rook.png",
    n: "/assets/w_knight.png",
    b: "/assets/w_bishop.png",
    q: "/assets/w_queen.png",
    k: "/assets/w_king.png",
  },
  b: {
    p: "/assets/b_pawn.png",
    r: "/assets/b_rook.png",
    n: "/assets/b_knight.png",
    b: "/assets/b_bishop.png",
    q: "/assets/b_queen.png",
    k: "/assets/b_king.png",
  },
};

const SVG_NS = "http://www.w3.org/2000/svg";
const ARROW_STROKE = "rgba(145, 152, 229, 0.85)";
const ARROW_PREVIEW_STROKE = "rgba(145, 152, 229, 0.6)";
const ARROW_THICKNESS = 0.24;
const ARROW_HEAD_ID = "board-arrow-head";
const ARROW_DRAG_THRESHOLD = 6;

const boardState = {
  root: null,
  squares: new Map(),
  callbacks: {
    onSquareClick: null,
    onDrop: null,
    onSquareContext: null,
  },
  dragFrom: null,
  interactive: true,
  arrowLayer: null,
  arrowPreview: null,
  arrows: new Map(),
  arrowDrag: null,
  listenersBound: false,
};

function algebraicAt(fileIndex, rankIndex) {
  const file = files[fileIndex];
  const rank = 8 - rankIndex;
  return `${file}${rank}`;
}

function parseSquare(square) {
  if (typeof square !== "string" || square.length < 2) return null;
  const fileIndex = files.indexOf(square[0]);
  const rankValue = Number.parseInt(square[1], 10);
  if (fileIndex === -1 || Number.isNaN(rankValue)) return null;
  const rankIndex = 8 - rankValue;
  if (rankIndex < 0 || rankIndex > 7) return null;
  return { fileIndex, rankIndex };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function squareCenter(square) {
  const coords = parseSquare(square);
  if (!coords) return null;
  return {
    x: coords.fileIndex + 0.5,
    y: coords.rankIndex + 0.5,
  };
}

function boardCoordsFromClient(clientX, clientY) {
  if (!boardState.root) return null;
  const rect = boardState.root.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return { x, y };
}

function squareFromClient(clientX, clientY) {
  const coords = boardCoordsFromClient(clientX, clientY);
  if (!coords) return null;
  if (coords.x < 0 || coords.x >= 1 || coords.y < 0 || coords.y >= 1) {
    return null;
  }
  const fileIndex = clamp(Math.floor(coords.x * 8), 0, 7);
  const rankIndex = clamp(Math.floor(coords.y * 8), 0, 7);
  return algebraicAt(fileIndex, rankIndex);
}

function pointFromClient(clientX, clientY) {
  const coords = boardCoordsFromClient(clientX, clientY);
  if (!coords) return null;
  const x = clamp(coords.x * 8, 0, 8);
  const y = clamp(coords.y * 8, 0, 8);
  return {
    x: clamp(x, 0.5, 7.5),
    y: clamp(y, 0.5, 7.5),
  };
}

function isKnightMove(from, to) {
  const start = parseSquare(from);
  const end = parseSquare(to);
  if (!start || !end) return false;
  const dx = Math.abs(end.fileIndex - start.fileIndex);
  const dy = Math.abs(end.rankIndex - start.rankIndex);
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

function buildArrowPath(from, to) {
  const start = squareCenter(from);
  const end = squareCenter(to);
  if (!start || !end) return null;

  if (!isKnightMove(from, to)) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  let bend;

  if (absDx > absDy) {
    bend = { x: end.x, y: start.y };
  } else {
    bend = { x: start.x, y: end.y };
  }

  return `M ${start.x} ${start.y} L ${bend.x} ${bend.y} L ${end.x} ${end.y}`;
}

function ensureArrowLayer() {
  if (!boardState.root) return null;
  if (boardState.arrowLayer) return boardState.arrowLayer;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("board-arrow-layer");
  svg.setAttribute("viewBox", "0 0 8 8");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.pointerEvents = "none";
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.right = "0";
  svg.style.bottom = "0";
  svg.style.left = "0";

  const defs = document.createElementNS(SVG_NS, "defs");
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", ARROW_HEAD_ID);
  marker.setAttribute("markerWidth", "0.8");
  marker.setAttribute("markerHeight", "0.8");
  marker.setAttribute("refX", "0.8");
  marker.setAttribute("refY", "0.4");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");

  const markerPath = document.createElementNS(SVG_NS, "path");
  markerPath.setAttribute("d", "M 0 0 L 1 0.4 L 0 0.8 z");
  markerPath.setAttribute("fill", "context-stroke");

  marker.appendChild(markerPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  boardState.root.appendChild(svg);
  boardState.arrowLayer = svg;
  boardState.arrowPreview = null;
  return svg;
}

function ensureArrowPreview() {
  const layer = ensureArrowLayer();
  if (!layer) return null;
  if (
    boardState.arrowPreview &&
    boardState.arrowPreview.parentElement === layer
  ) {
    return boardState.arrowPreview;
  }
  const path = document.createElementNS(SVG_NS, "path");
  path.dataset.arrowPreview = "true";
  path.classList.add("board-arrow", "board-arrow-preview");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", ARROW_PREVIEW_STROKE);
  path.setAttribute("stroke-width", ARROW_THICKNESS);
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("marker-end", `url(#${ARROW_HEAD_ID})`);
  path.style.display = "none";
  layer.appendChild(path);
  boardState.arrowPreview = path;
  return path;
}

function renderArrows() {
  const layer = ensureArrowLayer();
  if (!layer) return;
  layer.querySelectorAll("[data-arrow-line]").forEach((node) => node.remove());
  boardState.arrows.forEach((arrow, key) => {
    const pathData = buildArrowPath(arrow.from, arrow.to);
    if (!pathData) return;
    const path = document.createElementNS(SVG_NS, "path");
    path.dataset.arrowLine = key;
    path.classList.add("board-arrow");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", ARROW_STROKE);
    path.setAttribute("stroke-width", ARROW_THICKNESS);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("marker-end", `url(#${ARROW_HEAD_ID})`);
    layer.appendChild(path);
  });
  if (boardState.arrowPreview) {
    layer.appendChild(boardState.arrowPreview);
  } else {
    ensureArrowPreview();
  }
}

function toggleArrow(from, to) {
  if (from === to) return;
  const key = `${from}-${to}`;
  if (boardState.arrows.has(key)) {
    boardState.arrows.delete(key);
  } else {
    boardState.arrows.set(key, { from, to });
  }
  renderArrows();
}

function updateArrowPreview(event) {
  const drag = boardState.arrowDrag;
  if (!drag) return;
  const preview = ensureArrowPreview();
  if (!preview) return;

  const fromPoint = squareCenter(drag.fromSquare);
  if (!fromPoint) {
    preview.style.display = "none";
    return;
  }

  if (drag.currentSquare && isKnightMove(drag.fromSquare, drag.currentSquare)) {
    const knightPath = buildArrowPath(drag.fromSquare, drag.currentSquare);
    if (knightPath) {
      preview.setAttribute("d", knightPath);
      preview.style.display = "block";
      return;
    }
  }

  const targetPoint = pointFromClient(event.clientX, event.clientY);
  if (!targetPoint) {
    preview.style.display = "none";
  } else {
    preview.setAttribute(
      "d",
      `M ${fromPoint.x} ${fromPoint.y} L ${targetPoint.x} ${targetPoint.y}`
    );
    preview.style.display = "block";
  }

  const targetSquare = squareFromClient(event.clientX, event.clientY);
  if (targetSquare) {
    drag.currentSquare = targetSquare;
  }
  const distance = Math.hypot(
    event.clientX - drag.startX,
    event.clientY - drag.startY
  );
  drag.dragDistance = Math.max(drag.dragDistance, distance);
}

function finalizeArrowDrag(event, { canceled = false } = {}) {
  const drag = boardState.arrowDrag;
  boardState.arrowDrag = null;

  if (boardState.arrowPreview) {
    boardState.arrowPreview.style.display = "none";
  }

  if (!drag) return;
  if (canceled) {
    return;
  }

  const targetSquare =
    drag.currentSquare ||
    squareFromClient(event.clientX, event.clientY) ||
    drag.fromSquare;
  const dragDistance = Math.max(
    drag.dragDistance,
    Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
  );

  // Treat small drags as highlights and longer drags as arrows.
  if (dragDistance < ARROW_DRAG_THRESHOLD || targetSquare === drag.fromSquare) {
    if (boardState.callbacks.onSquareContext) {
      boardState.callbacks.onSquareContext(targetSquare);
    }
    return;
  }

  toggleArrow(drag.fromSquare, targetSquare);
}

function handleMouseDown(event) {
  if (event.button !== 2) return;
  if (!boardState.interactive) return;
  const square = event.currentTarget.dataset.square;
  const fromPoint = squareCenter(square);
  if (!fromPoint) return;

  event.preventDefault();

  ensureArrowLayer();
  ensureArrowPreview();

  boardState.arrowDrag = {
    fromSquare: square,
    startX: event.clientX,
    startY: event.clientY,
    dragDistance: 0,
    currentSquare: square,
  };

  const preview = boardState.arrowPreview;
  if (preview) {
    preview.setAttribute(
      "d",
      `M ${fromPoint.x} ${fromPoint.y} L ${fromPoint.x} ${fromPoint.y}`
    );
    preview.style.display = "none";
  }
}

function handleDocumentMouseMove(event) {
  if (!boardState.arrowDrag) return;
  if (event.buttons !== undefined && (event.buttons & 2) === 0) {
    finalizeArrowDrag(event, { canceled: true });
    return;
  }
  updateArrowPreview(event);
}

function handleDocumentMouseUp(event) {
  if (event.button !== 2) return;
  if (!boardState.arrowDrag) return;
  event.preventDefault();
  finalizeArrowDrag(event);
}

function handleClick(event) {
  if (!boardState.interactive) return;
  const square = event.currentTarget.dataset.square;
  if (boardState.callbacks.onSquareClick) {
    boardState.callbacks.onSquareClick(square, { event });
  }
}

function handleContext(event) {
  event.preventDefault();
}

function handleDragStart(event) {
  if (!boardState.interactive) {
    event.preventDefault();
    return;
  }
  const square = event.currentTarget.parentElement.dataset.square;
  boardState.dragFrom = square;
  event.dataTransfer.setData("text/plain", square);
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  if (!boardState.interactive) return;
  event.preventDefault();
  const square = event.currentTarget.dataset.square;
  const squareEl = boardState.squares.get(square);
  if (squareEl) {
    squareEl.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const square = event.currentTarget.dataset.square;
  const squareEl = boardState.squares.get(square);
  if (squareEl) {
    squareEl.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  if (!boardState.interactive) return;
  event.preventDefault();
  const targetSquare = event.currentTarget.dataset.square;
  const fromSquare =
    boardState.dragFrom || event.dataTransfer.getData("text/plain");
  const targetEl = boardState.squares.get(targetSquare);
  if (targetEl) {
    targetEl.classList.remove("drag-over");
  }
  if (fromSquare && targetSquare && boardState.callbacks.onDrop) {
    boardState.callbacks.onDrop(fromSquare, targetSquare);
  }
  boardState.dragFrom = null;
}

function handleDragEnd() {
  boardState.squares.forEach((el) => el.classList.remove("drag-over"));
  boardState.dragFrom = null;
}

export function createBoard(
  rootEl,
  { onSquareClick, onDrop, onSquareContext } = {}
) {
  boardState.root = rootEl;
  if (!rootEl.style.position) {
    rootEl.style.position = "relative";
  }
  boardState.callbacks.onSquareClick = onSquareClick;
  boardState.callbacks.onDrop = onDrop;
  boardState.callbacks.onSquareContext = onSquareContext;

  boardState.squares.clear();
  rootEl.innerHTML = "";
  boardState.arrowLayer = null;
  boardState.arrowPreview = null;
  boardState.arrowDrag = null;
  rootEl.addEventListener("contextmenu", handleContext);

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const squareName = algebraicAt(file, rank);
      const squareEl = document.createElement("div");
      squareEl.className = `square ${(rank + file) % 2 === 0 ? "dark" : "light"}`;
      squareEl.dataset.square = squareName;

      const img = document.createElement("img");
      img.draggable = false;
      img.alt = "";

      img.addEventListener("dragstart", handleDragStart);
      img.addEventListener("dragend", handleDragEnd);

      squareEl.appendChild(img);

      squareEl.addEventListener("click", handleClick);
      squareEl.addEventListener("contextmenu", handleContext);
      squareEl.addEventListener("mousedown", handleMouseDown);
      squareEl.addEventListener("dragover", handleDragOver);
      squareEl.addEventListener("dragleave", handleDragLeave);
      squareEl.addEventListener("drop", handleDrop);

      rootEl.appendChild(squareEl);
      boardState.squares.set(squareName, squareEl);
    }
  }

  renderArrows();

  if (!boardState.listenersBound) {
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    boardState.listenersBound = true;
  }

  return {
    setInteractive(value) {
      boardState.interactive = Boolean(value);
      boardState.root.style.pointerEvents = boardState.interactive
        ? "auto"
        : "none";
      if (!boardState.interactive && boardState.arrowDrag) {
        const drag = boardState.arrowDrag;
        finalizeArrowDrag(
          { clientX: drag.startX, clientY: drag.startY },
          { canceled: true }
        );
      }
    },
    clearArrows() {
      boardState.arrows.clear();
      renderArrows();
      if (boardState.arrowPreview) {
        boardState.arrowPreview.style.display = "none";
      }
    },
  };
}

function clearClasses(squareEl) {
  squareEl.classList.remove(
    "selected",
    "last-move",
    "legal-move-hint",
    "legal-capture-hint",
    "user-highlight",
    "engine-move-1",
    "engine-move-2",
    "engine-move-3"
  );
  squareEl.classList.remove("white-piece", "black-piece");
}

export function renderPosition(game, options = {}) {
  if (!boardState.root) return;
  const {
    selectedSquare = null,
    legalMoves = [],
    captureMoves = [],
    lastMove = null,
    customHighlights = [],
    engineHighlights = [],
  } = options;

  const legalSet = new Set(legalMoves);
  const captureSet = new Set(captureMoves);
  const customSet = new Set(customHighlights);

  const engineMap = new Map();
  engineHighlights.forEach((square, index) => {
    engineMap.set(square, index + 1);
  });

  const boardMatrix = game.board();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const squareName = algebraicAt(file, rank);
      const piece = boardMatrix[rank][file];
      const squareEl = boardState.squares.get(squareName);
      if (!squareEl) continue;

      clearClasses(squareEl);

      if (piece) {
        const img = squareEl.querySelector("img");
        const src = pieceImages[piece.color][piece.type];
        if (src) {
          img.src = src;
          img.style.display = "block";
          img.draggable = true;
        }
        squareEl.classList.add(
          piece.color === "w" ? "white-piece" : "black-piece"
        );
      } else {
        const img = squareEl.querySelector("img");
        img.src = "";
        img.style.display = "none";
        img.draggable = false;
      }

      if (squareName === selectedSquare) {
        squareEl.classList.add("selected");
      }
      if (
        lastMove &&
        (squareName === lastMove.from || squareName === lastMove.to)
      ) {
        squareEl.classList.add("last-move");
      }
      if (legalSet.has(squareName)) {
        squareEl.classList.add("legal-move-hint");
      }
      if (captureSet.has(squareName)) {
        squareEl.classList.add("legal-capture-hint");
      }
      if (customSet.has(squareName)) {
        squareEl.classList.add("user-highlight");
      }
      if (engineMap.has(squareName)) {
        squareEl.classList.add(`engine-move-${engineMap.get(squareName)}`);
      }
    }
  }
}
