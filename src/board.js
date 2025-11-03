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
const ARROW_THICKNESS = 0.16;
const ARROW_HEAD_ID = "board-arrow-head";
const ARROW_HEAD_SIZE = 0.35;
const ARROW_HEAD_LENGTH = 0.1;
const ARROW_TAIL_OFFSET = 0.32;
const ARROW_DRAG_THRESHOLD = 6;
const ARROW_HIT_TOLERANCE = 0.22;
const ARROW_ORIGIN_PROTECT_RADIUS = 0.35;

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
  engineArrows: [],
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

function shortenLastSegment(points, offset) {
  if (!Array.isArray(points) || points.length < 2) return points;
  const result = points.map((pt) => ({ x: pt.x, y: pt.y }));
  const lastIndex = result.length - 1;
  const from = result[lastIndex - 1];
  const to = result[lastIndex];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < offset) {
    return result;
  }
  const scale = (length - offset) / length;
  result[lastIndex] = {
    x: from.x + dx * scale,
    y: from.y + dy * scale,
  };
  return result;
}

function buildPath(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const [first, ...rest] = points;
  const commands = [`M ${first.x} ${first.y}`];
  rest.forEach((pt) => {
    commands.push(`L ${pt.x} ${pt.y}`);
  });
  return commands.join(" ");
}

function buildPreviewPath(fromPoint, toPoint) {
  if (!fromPoint || !toPoint) return null;
  const points = shortenLastSegment([fromPoint, toPoint], ARROW_HEAD_LENGTH);
  return buildPath(points);
}

function buildArrowPoints(from, to) {
  const start = squareCenter(from);
  const end = squareCenter(to);
  if (!start || !end) return null;

  if (!isKnightMove(from, to)) {
    return shortenLastSegment([start, end], ARROW_HEAD_LENGTH);
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

  const tailDx = bend.x === start.x ? 0 : Math.sign(bend.x - start.x);
  const tailDy = bend.y === start.y ? 0 : Math.sign(bend.y - start.y);
  const tailPoint = {
    x: start.x + tailDx * ARROW_TAIL_OFFSET,
    y: start.y + tailDy * ARROW_TAIL_OFFSET,
  };

  return shortenLastSegment([start, tailPoint, bend, end], ARROW_HEAD_LENGTH);
}

function buildArrowPath(from, to) {
  const points = buildArrowPoints(from, to);
  if (!points) return null;
  return buildPath(points);
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const clampedT = clamp(t, 0, 1);
  const cx = ax + dx * clampedT;
  const cy = ay + dy * clampedT;
  return Math.hypot(px - cx, py - cy);
}

function findArrowHit(point, tolerance = ARROW_HIT_TOLERANCE) {
  if (!point) return null;
  for (const [key, arrow] of boardState.arrows.entries()) {
    const points = buildArrowPoints(arrow.from, arrow.to);
    if (!points || points.length < 2) continue;
    const origin = points[0];
    const originSquareEl = boardState.squares.get(arrow.from);
    const originHasPiece =
      originSquareEl &&
      (originSquareEl.classList.contains("white-piece") ||
        originSquareEl.classList.contains("black-piece"));
    if (originHasPiece) {
      const originDistance = Math.hypot(point.x - origin.x, point.y - origin.y);
      if (originDistance <= ARROW_ORIGIN_PROTECT_RADIUS) {
        continue;
      }
    }
    for (let index = 0; index < points.length - 1; index += 1) {
      const a = points[index];
      const b = points[index + 1];
      const distance = distancePointToSegment(
        point.x,
        point.y,
        a.x,
        a.y,
        b.x,
        b.y
      );
      if (distance <= tolerance) {
        return key;
      }
    }
  }
  return null;
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
  marker.setAttribute("markerWidth", `${ARROW_HEAD_SIZE}`);
  marker.setAttribute("markerHeight", `${ARROW_HEAD_SIZE}`);
  marker.setAttribute("refX", "1");
  marker.setAttribute("refY", "0.5");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "userSpaceOnUse");
  marker.setAttribute("viewBox", "0 0 1 1");

  const markerPath = document.createElementNS(SVG_NS, "path");
  markerPath.setAttribute("d", "M 0 0 L 1 0.5 L 0 1 Z");
  markerPath.setAttribute("fill", "context-stroke");
  markerPath.setAttribute("stroke", "none");

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
  path.setAttribute("stroke-linecap", "butt");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("marker-end", `url(#${ARROW_HEAD_ID})`);
  path.setAttribute("pointer-events", "none");
  path.style.display = "none";
  layer.appendChild(path);
  boardState.arrowPreview = path;
  return path;
}

function setEngineArrows(arrows) {
  if (!Array.isArray(arrows)) {
    boardState.engineArrows = [];
  } else {
    boardState.engineArrows = arrows;
  }
  renderArrows();
}

function removeArrow(key) {
  if (!boardState.arrows.has(key)) return;
  boardState.arrows.delete(key);
  renderArrows();
}

function renderArrows() {
  const layer = ensureArrowLayer();
  if (!layer) return;
  layer.querySelectorAll("[data-arrow-line]").forEach((node) => node.remove());
  const preview = boardState.arrowPreview;
  if (preview && preview.parentElement) {
    preview.parentElement.removeChild(preview);
  }

  boardState.engineArrows.forEach((arrow, index) => {
    const pathData = buildArrowPath(arrow.from, arrow.to);
    if (!pathData) return;
    const rank = Math.min(Math.max(Number.parseInt(arrow.rank, 10) || index + 1, 1), 3);
    const path = document.createElementNS(SVG_NS, "path");
    path.dataset.arrowLine = `engine-${index}`;
    path.classList.add("board-arrow", "engine-arrow", `engine-arrow-${rank}`);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", ARROW_THICKNESS);
    path.setAttribute("stroke-linecap", "butt");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("marker-end", `url(#${ARROW_HEAD_ID})`);
    path.setAttribute("pointer-events", "none");
    layer.appendChild(path);
  });

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
    path.setAttribute("stroke-linecap", "butt");
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
    removeArrow(key);
  } else {
    boardState.arrows.set(key, { from, to });
  }
  renderArrows();
}

function startArrowDrag(square, event) {
  if (event.button !== 2) return;
  if (!boardState.interactive) return;
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

  const targetPoint = pointFromClient(event.clientX, event.clientY);
  const targetSquare = squareFromClient(event.clientX, event.clientY);
  let pathData = null;
  if (!targetPoint) {
    preview.style.display = "none";
  } else {
    if (targetSquare) {
      drag.currentSquare = targetSquare;
      pathData = buildArrowPath(drag.fromSquare, targetSquare);
    } else {
      pathData = buildPreviewPath(fromPoint, targetPoint);
    }
    if (pathData) {
      preview.setAttribute("d", pathData);
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
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
  const square = event.currentTarget.dataset.square;
  startArrowDrag(square, event);
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
  if (event.button !== undefined && event.button === 0) {
    const pointer = pointFromClient(event.clientX, event.clientY);
    const hitKey = findArrowHit(pointer);
    if (hitKey) {
      removeArrow(hitKey);
      return;
    }
  }
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
  boardState.arrows.clear();
  boardState.arrowLayer = null;
  boardState.arrowPreview = null;
  boardState.arrowDrag = null;
  rootEl.addEventListener("contextmenu", handleContext);

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const squareName = algebraicAt(file, rank);
      const squareEl = document.createElement("div");
      squareEl.className = `square ${(rank + file) % 2 === 0 ? "light" : "dark"}`;
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
    engineDisplayMode = "both",
  } = options;

  const legalSet = new Set(legalMoves);
  const captureSet = new Set(captureMoves);
  const customSet = new Set(customHighlights);

  const normalizedHighlights = Array.isArray(engineHighlights)
    ? engineHighlights
        .map((entry, index) => ({
          from: entry?.from,
          to: entry?.to,
          rank: Number.isFinite(entry?.rank)
            ? entry.rank
            : Number.parseInt(entry?.rank, 10) || index + 1,
        }))
        .filter((entry) => entry.from || entry.to)
    : [];

  const showEngineSquares =
    engineDisplayMode === "both" || engineDisplayMode === "squares";
  const showEngineArrows =
    engineDisplayMode === "both" || engineDisplayMode === "arrows";

  const engineSquareMap = new Map();
  const engineArrows = [];

  normalizedHighlights.forEach((entry, index) => {
    const rank = Math.min(Math.max(Number.parseInt(entry.rank, 10) || index + 1, 1), 3);
    if (showEngineSquares) {
      [entry.from, entry.to].forEach((square) => {
        if (!square) return;
        const existing = engineSquareMap.get(square);
        if (!existing || rank < existing) {
          engineSquareMap.set(square, rank);
        }
      });
    }
    if (showEngineArrows && entry.from && entry.to) {
      engineArrows.push({ from: entry.from, to: entry.to, rank });
    }
  });

  if (showEngineArrows) {
    setEngineArrows(engineArrows);
  } else {
    setEngineArrows([]);
  }

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
      if (engineSquareMap.has(squareName)) {
        squareEl.classList.add(
          `engine-move-${engineSquareMap.get(squareName)}`
        );
      }
    }
  }
}
