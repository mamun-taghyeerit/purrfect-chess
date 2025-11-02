const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const pieceImages = {
  w: {
    p: '/assets/w_pawn.png',
    r: '/assets/w_rook.png',
    n: '/assets/w_knight.png',
    b: '/assets/w_bishop.png',
    q: '/assets/w_queen.png',
    k: '/assets/w_king.png'
  },
  b: {
    p: '/assets/b_pawn.png',
    r: '/assets/b_rook.png',
    n: '/assets/b_knight.png',
    b: '/assets/b_bishop.png',
    q: '/assets/b_queen.png',
    k: '/assets/b_king.png'
  }
};

const boardState = {
  root: null,
  squares: new Map(),
  callbacks: {
    onSquareClick: null,
    onDrop: null,
    onSquareContext: null
  },
  dragFrom: null,
  interactive: true
};

function algebraicAt(fileIndex, rankIndex) {
  const file = files[fileIndex];
  const rank = 8 - rankIndex;
  return `${file}${rank}`;
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
  if (!boardState.interactive) return;
  const square = event.currentTarget.dataset.square;
  if (boardState.callbacks.onSquareContext) {
    boardState.callbacks.onSquareContext(square);
  }
}

function handleDragStart(event) {
  if (!boardState.interactive) {
    event.preventDefault();
    return;
  }
  const square = event.currentTarget.parentElement.dataset.square;
  boardState.dragFrom = square;
  event.dataTransfer.setData('text/plain', square);
  event.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(event) {
  if (!boardState.interactive) return;
  event.preventDefault();
  const square = event.currentTarget.dataset.square;
  const squareEl = boardState.squares.get(square);
  if (squareEl) {
    squareEl.classList.add('drag-over');
  }
}

function handleDragLeave(event) {
  const square = event.currentTarget.dataset.square;
  const squareEl = boardState.squares.get(square);
  if (squareEl) {
    squareEl.classList.remove('drag-over');
  }
}

function handleDrop(event) {
  if (!boardState.interactive) return;
  event.preventDefault();
  const targetSquare = event.currentTarget.dataset.square;
  const fromSquare = boardState.dragFrom || event.dataTransfer.getData('text/plain');
  const targetEl = boardState.squares.get(targetSquare);
  if (targetEl) {
    targetEl.classList.remove('drag-over');
  }
  if (fromSquare && targetSquare && boardState.callbacks.onDrop) {
    boardState.callbacks.onDrop(fromSquare, targetSquare);
  }
  boardState.dragFrom = null;
}

function handleDragEnd() {
  boardState.squares.forEach((el) => el.classList.remove('drag-over'));
  boardState.dragFrom = null;
}

export function createBoard(rootEl, { onSquareClick, onDrop, onSquareContext } = {}) {
  boardState.root = rootEl;
  boardState.callbacks.onSquareClick = onSquareClick;
  boardState.callbacks.onDrop = onDrop;
  boardState.callbacks.onSquareContext = onSquareContext;

  boardState.squares.clear();
  rootEl.innerHTML = '';

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const squareName = algebraicAt(file, rank);
      const squareEl = document.createElement('div');
      squareEl.className = `square ${(rank + file) % 2 === 0 ? 'dark' : 'light'}`;
      squareEl.dataset.square = squareName;

      const img = document.createElement('img');
      img.draggable = false;
      img.alt = '';

      img.addEventListener('dragstart', handleDragStart);
      img.addEventListener('dragend', handleDragEnd);

      squareEl.appendChild(img);

      squareEl.addEventListener('click', handleClick);
      squareEl.addEventListener('contextmenu', handleContext);
      squareEl.addEventListener('dragover', handleDragOver);
      squareEl.addEventListener('dragleave', handleDragLeave);
      squareEl.addEventListener('drop', handleDrop);

      rootEl.appendChild(squareEl);
      boardState.squares.set(squareName, squareEl);
    }
  }

  return {
    setInteractive(value) {
      boardState.interactive = Boolean(value);
      boardState.root.style.pointerEvents = boardState.interactive ? 'auto' : 'none';
    }
  };
}

function clearClasses(squareEl) {
  squareEl.classList.remove(
    'selected',
    'last-move',
    'legal-move-hint',
    'legal-capture-hint',
    'user-highlight',
    'engine-move-1',
    'engine-move-2',
    'engine-move-3'
  );
  squareEl.classList.remove('white-piece', 'black-piece');
}

export function renderPosition(game, options = {}) {
  if (!boardState.root) return;
  const {
    selectedSquare = null,
    legalMoves = [],
    captureMoves = [],
    lastMove = null,
    customHighlights = [],
    engineHighlights = []
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
        const img = squareEl.querySelector('img');
        const src = pieceImages[piece.color][piece.type];
        if (src) {
          img.src = src;
          img.style.display = 'block';
          img.draggable = true;
        }
        squareEl.classList.add(piece.color === 'w' ? 'white-piece' : 'black-piece');
      } else {
        const img = squareEl.querySelector('img');
        img.src = '';
        img.style.display = 'none';
        img.draggable = false;
      }

      if (squareName === selectedSquare) {
        squareEl.classList.add('selected');
      }
      if (lastMove && (squareName === lastMove.from || squareName === lastMove.to)) {
        squareEl.classList.add('last-move');
      }
      if (legalSet.has(squareName)) {
        squareEl.classList.add('legal-move-hint');
      }
      if (captureSet.has(squareName)) {
        squareEl.classList.add('legal-capture-hint');
      }
      if (customSet.has(squareName)) {
        squareEl.classList.add('user-highlight');
      }
      if (engineMap.has(squareName)) {
        squareEl.classList.add(`engine-move-${engineMap.get(squareName)}`);
      }
    }
  }
}
