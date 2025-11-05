import { types, Instance, SnapshotIn, flow } from 'mobx-state-tree';
import { Chess } from 'chess.js';

/**
 * Time Control Model
 */
const TimeControlModel = types.model('TimeControl', {
  minutes: types.number,
  increment: types.number,
});

/**
 * Game State Model
 * Manages chess game state including position, history, time controls
 */
const GameStateModel = types
  .model('GameState', {
    fen: types.optional(types.string, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    whiteTime: types.number,
    blackTime: types.number,
    timeControl: TimeControlModel,
    isGameOver: types.optional(types.boolean, false),
    isTimerRunning: types.optional(types.boolean, false),
  })
  .volatile(() => ({
    // Chess.js instance is volatile (not serialized)
    chessInstance: new Chess(),
  }))
  .views((self) => ({
    get position() {
      const board = self.chessInstance.board();
      const position: Record<string, { type: string; color: string } | null> = {};
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      board.forEach((row, rankIndex) => {
        const rank = 8 - rankIndex;
        row.forEach((piece, fileIndex) => {
          const square = `${files[fileIndex]}${rank}`;
          position[square] = piece;
        });
      });

      return position;
    },
    get history() {
      return self.chessInstance.history({ verbose: true });
    },
    get turn() {
      return self.chessInstance.turn();
    },
    get check() {
      return self.chessInstance.isCheck();
    },
    get checkmate() {
      return self.chessInstance.isCheckmate();
    },
    get stalemate() {
      return self.chessInstance.isStalemate();
    },
    get threefoldRepetition() {
      return self.chessInstance.isThreefoldRepetition();
    },
    get insufficientMaterial() {
      return self.chessInstance.isInsufficientMaterial();
    },
    get draw() {
      return self.chessInstance.isDraw();
    },
  }))
  .actions((self) => ({
    movePiece(from: string, to: string, promotion?: string) {
      try {
        const move = self.chessInstance.move({ from, to, promotion: promotion || 'q' });
        if (move) {
          // Update FEN after successful move
          self.fen = self.chessInstance.fen();
          
          // Add increment to the player who just moved
          const incrementMs = self.timeControl.increment * 1000;
          if (move.color === 'w') {
            self.whiteTime += incrementMs;
          } else {
            self.blackTime += incrementMs;
          }
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Invalid move:', error);
        return false;
      }
    },
    resetGame() {
      self.chessInstance.reset();
      self.fen = self.chessInstance.fen();
      self.whiteTime = self.timeControl.minutes * 60 * 1000;
      self.blackTime = self.timeControl.minutes * 60 * 1000;
      self.isGameOver = false;
      self.isTimerRunning = false;
    },
    setTimeControl(minutes: number, increment: number) {
      self.timeControl = TimeControlModel.create({ minutes, increment });
      self.whiteTime = minutes * 60 * 1000;
      self.blackTime = minutes * 60 * 1000;
      self.isTimerRunning = false;
    },
    loadFen(fen: string) {
      try {
        self.chessInstance.load(fen.trim());
        self.fen = self.chessInstance.fen();
        self.isTimerRunning = false;
        return true;
      } catch (error) {
        console.error('Invalid FEN:', error);
        return false;
      }
    },
    loadPgn(pgn: string) {
      try {
        self.chessInstance.loadPgn(pgn.trim());
        self.fen = self.chessInstance.fen();
        self.isTimerRunning = false;
        return true;
      } catch (error) {
        console.error('Invalid PGN:', error);
        return false;
      }
    },
    getPgn() {
      return self.chessInstance.pgn();
    },
    startTimer() {
      self.isTimerRunning = true;
    },
    stopTimer() {
      self.isTimerRunning = false;
    },
    tickTimer(delta: number) {
      if (self.isGameOver || !self.isTimerRunning) {
        return;
      }

      if (self.turn === 'w') {
        self.whiteTime = Math.max(0, self.whiteTime - delta);
        if (self.whiteTime === 0) {
          self.isGameOver = true;
          self.isTimerRunning = false;
        }
      } else {
        self.blackTime = Math.max(0, self.blackTime - delta);
        if (self.blackTime === 0) {
          self.isGameOver = true;
          self.isTimerRunning = false;
        }
      }
    },
    afterCreate() {
      // Load FEN on creation with error handling
      if (self.fen) {
        try {
          self.chessInstance.load(self.fen);
        } catch (error) {
          console.error('[GameStore] Failed to load FEN on initialization:', error);
          // Fall back to default position if FEN is invalid
          self.chessInstance.reset();
        }
      }
    },
  }));

/**
 * UI State Model
 * Manages transient UI state (not persisted)
 */
const UIStateModel = types
  .model('UIState', {
    isEnginePanelVisible: types.optional(types.boolean, false),
    isEvalBarVisible: types.optional(types.boolean, false),
    isBoardFlipped: types.optional(types.boolean, false),
    engineDisplayMode: types.optional(
      types.enumeration('EngineDisplayMode', ['squares', 'arrows', 'both', 'none']),
      'both'
    ),
  })
  .views((self) => ({
    get engineDisplayModeValue(): 'squares' | 'arrows' | 'both' | 'none' {
      return self.engineDisplayMode as 'squares' | 'arrows' | 'both' | 'none';
    },
  }))
  .actions((self) => ({
    toggleEnginePanel() {
      self.isEnginePanelVisible = !self.isEnginePanelVisible;
    },
    showEnginePanel() {
      self.isEnginePanelVisible = true;
    },
    hideEnginePanel() {
      self.isEnginePanelVisible = false;
    },
    toggleEvalBar() {
      self.isEvalBarVisible = !self.isEvalBarVisible;
    },
    toggleBoardFlip() {
      self.isBoardFlipped = !self.isBoardFlipped;
    },
    setEngineDisplayMode(mode: 'squares' | 'arrows' | 'both' | 'none') {
      self.engineDisplayMode = mode;
    },
  }));

/**
 * Settings Model
 * Manages persistent user preferences
 */
const SettingsModel = types
  .model('Settings', {
    defaultTimeMinutes: types.optional(types.number, 5),
    defaultTimeIncrement: types.optional(types.number, 0),
    defaultEngineDepth: types.optional(types.number, 22),
    // Add more persistent settings as needed
  })
  .actions((self) => ({
    setDefaultTime(minutes: number, increment: number) {
      self.defaultTimeMinutes = minutes;
      self.defaultTimeIncrement = increment;
    },
    setDefaultEngineDepth(depth: number) {
      self.defaultEngineDepth = depth;
    },
  }));

/**
 * Root Store Model
 * Combines all store slices
 */
const RootStoreModel = types
  .model('RootStore', {
    game: GameStateModel,
    ui: UIStateModel,
    settings: SettingsModel,
  })
  .actions((self) => ({
    hydrateStore() {
      // Called after rehydration from storage
      // Can be used to restore derived state or perform migrations
      console.log('[RootStore] Store hydrated successfully');
    },
  }));

// Create default snapshot for initialization
export const createDefaultSnapshot = () => ({
  game: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    whiteTime: 5 * 60 * 1000,
    blackTime: 5 * 60 * 1000,
    timeControl: {
      minutes: 5,
      increment: 0,
    },
    isGameOver: false,
    isTimerRunning: false,
  },
  ui: {
    isEnginePanelVisible: false,
    isEvalBarVisible: false,
    isBoardFlipped: false,
    engineDisplayMode: 'both' as const,
  },
  settings: {
    defaultTimeMinutes: 5,
    defaultTimeIncrement: 0,
    defaultEngineDepth: 22,
  },
});

export type RootStore = Instance<typeof RootStoreModel>;
export type RootStoreSnapshot = SnapshotIn<typeof RootStoreModel>;

export default RootStoreModel;
