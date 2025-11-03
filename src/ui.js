const timePresets = [
  { label: '3 + 0', minutes: 3, increment: 0 },
  { label: '5 + 1', minutes: 5, increment: 1 },
  { label: '10 + 0', minutes: 10, increment: 0 },
  { label: '15 + 10', minutes: 15, increment: 10 },
  { label: '30 + 0', minutes: 30, increment: 0 },
  { label: '30 + 30', minutes: 30, increment: 30 }
];

const appearanceDefaults = {
  light: { hue: 0, saturation: 100, brightness: 100 },
  dark: { hue: 0, saturation: 100, brightness: 100 },
  whitePieces: { hue: 0, saturation: 100, brightness: 100, scale: 100 },
  blackPieces: { hue: 0, saturation: 100, brightness: 100, scale: 100 }
};

const appearanceGroupConfig = {
  light: {
    key: 'light',
    label: 'Light Squares',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` }
    ]
  },
  dark: {
    key: 'dark',
    label: 'Dark Squares',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` }
    ]
  },
  whitePieces: {
    key: 'whitePieces',
    label: 'White Pieces',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` }
    ]
  },
  blackPieces: {
    key: 'blackPieces',
    label: 'Black Pieces',
    sliders: [
      { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
      { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
      { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` }
    ]
  }
};

const appearanceState = JSON.parse(JSON.stringify(appearanceDefaults));
const appearanceInputs = new Map();

let messageTimeout = null;
let confirmationState = { onConfirm: null };
let cheatPrimed = false;
let cheatProgress = 0;
const cheatSequence = 'gmmamun';

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function cloneDefaults(groupKey) {
  return { ...appearanceDefaults[groupKey] };
}

function applyAppearance() {
  const root = document.documentElement;
  const groups = Object.keys(appearanceState);
  groups.forEach((key) => {
    const group = appearanceState[key];
    const filter = `hue-rotate(${group.hue}deg) saturate(${group.saturation / 100}) brightness(${group.brightness / 100})`;
    if (key === 'light') {
      root.style.setProperty('--light-square-filter', filter);
    } else if (key === 'dark') {
      root.style.setProperty('--dark-square-filter', filter);
    } else if (key === 'whitePieces') {
      root.style.setProperty('--white-piece-filter', filter);
      root.style.setProperty('--white-piece-scale', (group.scale / 100).toFixed(2));
    } else if (key === 'blackPieces') {
      root.style.setProperty('--black-piece-filter', filter);
      root.style.setProperty('--black-piece-scale', (group.scale / 100).toFixed(2));
    }
  });
}

function createMessageBox() {
  let existing = document.getElementById('message-box');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'message-box';
    document.body.appendChild(existing);
  }
  return existing;
}

function createConfirmationOverlay() {
  let overlay = document.getElementById('confirmation-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirmation-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="modal-title" data-role="title"></h3>
        <p class="modal-message" data-role="message"></p>
        <div class="modal-actions">
          <button type="button" class="button button-muted" data-role="cancel">Cancel</button>
          <button type="button" class="button button-accent" data-role="confirm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-role="cancel"]').addEventListener('click', () => {
      overlay.classList.remove('active');
      confirmationState.onConfirm = null;
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.classList.remove('active');
        confirmationState.onConfirm = null;
      }
    });
    overlay.querySelector('[data-role="confirm"]').addEventListener('click', () => {
      overlay.classList.remove('active');
      if (confirmationState.onConfirm) {
        confirmationState.onConfirm();
      }
      confirmationState.onConfirm = null;
    });
  }
  return overlay;
}

function buildAppearanceControls(container, keys) {
  if (!container || !Array.isArray(keys)) return;

  keys.forEach((groupKey) => {
    const group = appearanceGroupConfig[groupKey];
    if (!group) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'appearance-group control-group-inner';
    const header = document.createElement('h4');
    header.textContent = group.label;

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset-group-btn';
    reset.textContent = '↻';
    reset.addEventListener('click', () => {
      appearanceState[group.key] = cloneDefaults(group.key);
      const controls = appearanceInputs.get(group.key) || {};
      Object.entries(appearanceState[group.key]).forEach(([key, value]) => {
        if (controls[key]) {
          controls[key].input.value = value;
          controls[key].value.textContent = controls[key].format(value);
        }
      });
      applyAppearance();
    });

    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'appearance-group-header';
    headerWrapper.appendChild(header);
    headerWrapper.appendChild(reset);

    const slidersWrapper = document.createElement('div');
    slidersWrapper.className = 'appearance-sliders';

    const groupInputs = {};

    group.sliders.forEach((slider) => {
      const label = document.createElement('label');
      label.className = 'slider-control';
      label.textContent = slider.label;

      const range = document.createElement('input');
      range.type = 'range';
      range.className = 'slider-input';
      range.min = slider.min;
      range.max = slider.max;
      range.step = slider.step;
      range.value = appearanceState[group.key][slider.key];

      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'slider-value';
      valueDisplay.textContent = slider.format(range.value);

      range.addEventListener('input', () => {
        const numericValue = Number(range.value);
        appearanceState[group.key][slider.key] = numericValue;
        valueDisplay.textContent = slider.format(numericValue);
        applyAppearance();
      });

      label.appendChild(range);
      label.appendChild(valueDisplay);
      slidersWrapper.appendChild(label);

      groupInputs[slider.key] = {
        input: range,
        value: valueDisplay,
        format: slider.format
      };
    });

    appearanceInputs.set(group.key, groupInputs);

    wrapper.appendChild(headerWrapper);
    wrapper.appendChild(slidersWrapper);

    container.appendChild(wrapper);
  });
}

function handleSelection(cheatTextEl) {
  const selection = window.getSelection();
  if (!selection) return;
  const selected = selection.toString().trim();
  if (!selected) return;
  try {
    if (typeof selection.containsNode === 'function' && selection.containsNode(cheatTextEl, true)) {
      cheatPrimed = true;
      cheatProgress = 0;
    }
  } catch (error) {
    // ignore selection errors
  }
}

function setupCheatcode(cheatTextEl, enginePanelEl, onReveal) {
  cheatTextEl.addEventListener('mouseup', () => handleSelection(cheatTextEl));
  cheatTextEl.addEventListener('keyup', () => handleSelection(cheatTextEl));
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection) return;
    if (!selection.toString()) {
      return;
    }
    try {
      if (typeof selection.containsNode === 'function' && selection.containsNode(cheatTextEl, true)) {
        cheatPrimed = true;
        cheatProgress = 0;
      }
    } catch (error) {
      // ignore selection errors
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!cheatPrimed) return;
    const key = event.key.toLowerCase();
    if (key === cheatSequence[cheatProgress]) {
      cheatProgress += 1;
      if (cheatProgress === cheatSequence.length) {
        cheatPrimed = false;
        cheatProgress = 0;
        enginePanelEl.classList.remove('hidden');
        if (typeof onReveal === 'function') {
          onReveal();
        }
      }
    } else if (key.trim()) {
      cheatPrimed = false;
      cheatProgress = 0;
    }
  });
}

function clearEnginePanel(engineLinesEl) {
  engineLinesEl.innerHTML = '<p class="engine-placeholder">Awaiting analysis…</p>';
}

export function initUI(rootEl, handlers = {}) {
  const messageBox = createMessageBox();
  const overlay = createConfirmationOverlay();

  rootEl.innerHTML = `
    <div class="main-layout">
      <section class="layout-panel controls-panel" id="white-panel">
        <div class="panel-header">
          <h2>White Controls</h2>
        </div>
        <div class="clock-display" id="white-clock">05:00</div>
        <div class="controls-container">
          <div class="control-group">
            <div class="panel-header">
              <h3>Appearance</h3>
              <button id="reset-appearance" type="button" class="button button-outline icon-button" data-role="reset-appearance">
                <span class="button-icon">↻</span>
                <span>Reset</span>
              </button>
            </div>
            <div class="appearance-grid" id="appearance-grid-left"></div>
          </div>
          <div class="control-group">
            <h3>Time Presets</h3>
            <div class="preset-grid" id="preset-container"></div>
          </div>
          <div class="control-group">
            <h3>Custom Time</h3>
            <div class="custom-time-grid">
              <label>
                <span>Minutes</span>
                <input id="custom-minutes" type="number" min="1" max="180" value="5" class="number-input" />
              </label>
              <label>
                <span>Increment (s)</span>
                <input id="custom-increment" type="number" min="0" max="60" value="0" class="number-input" />
              </label>
            </div>
            <div class="button-row">
              <button id="apply-custom" type="button" class="button button-muted">Apply</button>
              <button id="start-new-game" type="button" class="button button-accent">Start</button>
            </div>
          </div>
        </div>
      </section>
      <section class="board-panel" id="board-panel">
        <div class="board-frame">
          <div class="board-wrapper">
            <div class="board-container">
              <div class="board-files board-files-top" data-role="files-top"></div>
              <div class="board-files board-files-bottom" data-role="files-bottom"></div>
              <div class="board-ranks board-ranks-left" data-role="ranks-left"></div>
              <div class="board-ranks board-ranks-right" data-role="ranks-right"></div>
              <div id="board"></div>
            </div>
            <div class="eval-bar hidden" id="eval-bar">
              <div class="eval-bar-track" id="eval-bar-track">
                <div class="eval-bar-fill" id="eval-bar-fill"></div>
              </div>
              <div class="eval-bar-score" id="eval-bar-score">0.0</div>
            </div>
          </div>
        </div>
        <div class="board-actions">
          <button id="reset-game" type="button" class="button button-outline icon-button button-small">
            <span class="button-icon">↻</span>
            <span>Reset Game</span>
          </button>
          <button id="toggle-eval-bar" type="button" class="button button-outline icon-button button-small">
            <span class="button-icon">📊</span>
            <span>Show Eval Bar</span>
          </button>
        </div>
        <div class="match-card" id="match-card">
          <div class="match-title" id="match-title">Purrfect Game</div>
          <div class="match-details">
            <div class="match-row">
              <span class="match-label">Event</span>
              <span class="match-value" id="match-event">Purrfect Game - 5+0</span>
            </div>
            <div class="match-row">
              <span class="match-label">Date</span>
              <span class="match-value" id="match-date">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="match-row">
              <span class="match-label">Time Control</span>
              <span class="match-value" id="match-time-control">5 + 0</span>
            </div>
            <div class="match-row">
              <span class="match-label">Site</span>
              <span class="match-value" id="match-site">Purrfect Universe (Online)</span>
            </div>
          </div>
        </div>
        <p id="cheatcode-text" class="cheatcode-text">(Reserved for future use)</p>
        <div id="engine-panel" class="engine-panel hidden">
          <div class="panel-header">
            <h3>Engine Analysis</h3>
            <button id="close-engine" type="button" class="button button-outline button-small">Close</button>
          </div>
          <label class="engine-depth-control">
            <span>Search Depth:</span>
            <span id="engine-depth-value" class="engine-depth-value">18</span>
            <input id="engine-depth" type="range" min="6" max="30" step="1" value="18" class="slider-input" />
          </label>
          <div class="button-row">
            <button id="start-analysis" type="button" class="button button-accent">Start Analysis</button>
            <button id="stop-analysis" type="button" class="button button-danger">Stop</button>
          </div>
          <div class="engine-overlay-controls" id="engine-overlay-controls">
            <span class="engine-overlay-label">Overlay:</span>
            <div class="engine-overlay-buttons" role="group" aria-label="Engine overlays">
              <button
                type="button"
                class="button button-outline button-small engine-overlay-button"
                data-engine-overlay-mode="squares"
              >
                Squares
              </button>
              <button
                type="button"
                class="button button-outline button-small engine-overlay-button"
                data-engine-overlay-mode="arrows"
              >
                Arrows
              </button>
              <button
                type="button"
                class="button button-outline button-small engine-overlay-button"
                data-engine-overlay-mode="both"
              >
                Both
              </button>
            </div>
          </div>
          <div class="engine-lines" id="engine-lines"></div>
        </div>
      </section>
      <section class="layout-panel game-panel" id="black-panel">
        <h2>Black Controls</h2>
        <div class="clock-display" id="black-clock">05:00</div>
        <div class="controls-container">
          <div class="control-group">
            <div class="panel-header">
              <h3>Appearance</h3>
              <button id="reset-appearance-right" type="button" class="button button-outline icon-button" data-role="reset-appearance">
                <span class="button-icon">↻</span>
                <span>Reset</span>
              </button>
            </div>
            <div class="appearance-grid" id="appearance-grid-right"></div>
          </div>
          <div class="control-group">
            <h3>Moves</h3>
            <div id="move-list" class="move-list"></div>
            <div class="button-row">
              <button id="copy-pgn" type="button" class="button button-muted">Copy PGN</button>
              <button id="load-pgn" type="button" class="button button-muted">Load PGN</button>
            </div>
            <div class="button-row">
              <button id="copy-fen" type="button" class="button button-muted">Copy FEN</button>
              <button id="load-fen" type="button" class="button button-muted">Load FEN</button>
            </div>
            <textarea id="pgn-output" rows="4" placeholder="PGN will appear here" class="notation-output"></textarea>
            <textarea id="fen-output" rows="2" placeholder="FEN will appear here" class="notation-output"></textarea>
          </div>
        </div>
      </section>
    </div>
  `;

  const boardEl = rootEl.querySelector('#board');
  const filesTopEl = rootEl.querySelector('[data-role="files-top"]');
  const filesBottomEl = rootEl.querySelector('[data-role="files-bottom"]');
  const ranksLeftEl = rootEl.querySelector('[data-role="ranks-left"]');
  const ranksRightEl = rootEl.querySelector('[data-role="ranks-right"]');
  const evalBarTrack = rootEl.querySelector('#eval-bar-track');
  const evalBarFill = rootEl.querySelector('#eval-bar-fill');
  const evalBarScore = rootEl.querySelector('#eval-bar-score');
  const whiteClockEl = rootEl.querySelector('#white-clock');
  const blackClockEl = rootEl.querySelector('#black-clock');
  const presetContainer = rootEl.querySelector('#preset-container');
  const messageApi = {
    show(type, text, duration = 3000) {
      if (!text) return;
      messageBox.textContent = text;
      messageBox.className = '';
      messageBox.classList.add(type);
      messageBox.style.display = 'block';
      if (messageTimeout) clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => {
        messageBox.style.display = 'none';
      }, duration);
    }
  };

  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

  function populateCoordinateLabels() {
    if (filesTopEl) {
      filesTopEl.innerHTML = fileLabels.map((label) => `<span>${label}</span>`).join('');
    }
    if (filesBottomEl) {
      filesBottomEl.innerHTML = fileLabels.map((label) => `<span>${label}</span>`).join('');
    }
    if (ranksLeftEl) {
      ranksLeftEl.innerHTML = rankLabels.map((label) => `<span>${label}</span>`).join('');
    }
    if (ranksRightEl) {
      ranksRightEl.innerHTML = rankLabels.map((label) => `<span>${label}</span>`).join('');
    }
  }

  populateCoordinateLabels();

  function showConfirmation(title, message, onConfirm) {
    overlay.querySelector('[data-role="title"]').textContent = title;
    overlay.querySelector('[data-role="message"]').textContent = message;
    overlay.classList.add('active');
    confirmationState.onConfirm = onConfirm;
  }

  let currentTimeControl = { minutes: 5, increment: 0 };
  let engineOverlayMode = 'arrows';
  let selectedPresetButton = null;
  let evalBarVisible = false;

  timePresets.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button preset-button';
    button.textContent = preset.label;
    button.addEventListener('click', () => {
      showConfirmation(
        'Change Time Control',
        `Switch to ${preset.minutes}+${preset.increment}?`,
        () => {
          currentTimeControl = { minutes: preset.minutes, increment: preset.increment };
          rootEl.querySelector('#custom-minutes').value = preset.minutes;
          rootEl.querySelector('#custom-increment').value = preset.increment;
          updateMatchInfo({
            event: `Purrfect Game - ${preset.minutes}+${preset.increment}`,
            timeControl: `${preset.minutes} + ${preset.increment}`
          });
          if (selectedPresetButton) {
            selectedPresetButton.classList.remove('preset-button-active');
          }
          button.classList.add('preset-button-active');
          selectedPresetButton = button;
          if (handlers.onTimePreset) {
            handlers.onTimePreset({ ...currentTimeControl });
          }
        }
      );
    });
    presetContainer.appendChild(button);
  });

  const customMinutes = rootEl.querySelector('#custom-minutes');
  const customIncrement = rootEl.querySelector('#custom-increment');
  const applyCustomBtn = rootEl.querySelector('#apply-custom');
  const startBtn = rootEl.querySelector('#start-new-game');
  const resetGameBtn = rootEl.querySelector('#reset-game');
  const toggleEvalBarBtn = rootEl.querySelector('#toggle-eval-bar');
  const evalBarEl = rootEl.querySelector('#eval-bar');
  const resetAppearanceButtons = rootEl.querySelectorAll('[data-role="reset-appearance"]');
  const appearanceGridLeft = rootEl.querySelector('#appearance-grid-left');
  const appearanceGridRight = rootEl.querySelector('#appearance-grid-right');
  const copyFenBtn = rootEl.querySelector('#copy-fen');
  const loadFenBtn = rootEl.querySelector('#load-fen');
  const copyPgnBtn = rootEl.querySelector('#copy-pgn');
  const loadPgnBtn = rootEl.querySelector('#load-pgn');
  const pgnOutput = rootEl.querySelector('#pgn-output');
  const fenOutput = rootEl.querySelector('#fen-output');
  const cheatText = rootEl.querySelector('#cheatcode-text');
  const enginePanel = rootEl.querySelector('#engine-panel');
  const engineDepth = rootEl.querySelector('#engine-depth');
  const engineDepthValue = rootEl.querySelector('#engine-depth-value');
  const engineOverlayButtons = Array.from(
    rootEl.querySelectorAll('[data-engine-overlay-mode]')
  );
  const startAnalysisBtn = rootEl.querySelector('#start-analysis');
  const stopAnalysisBtn = rootEl.querySelector('#stop-analysis');
  const engineLinesEl = rootEl.querySelector('#engine-lines');
  const closeEngineBtn = rootEl.querySelector('#close-engine');

  buildAppearanceControls(appearanceGridLeft, ['light', 'whitePieces']);
  buildAppearanceControls(appearanceGridRight, ['dark', 'blackPieces']);
  applyAppearance();
  clearEnginePanel(engineLinesEl);
  stopAnalysisBtn.disabled = true;

  function updateEngineOverlayButtons(mode) {
    if (!mode) return;
    engineOverlayMode = mode;
    engineOverlayButtons.forEach((button) => {
      const value = button.dataset.engineOverlayMode;
      const isActive = value === mode;
      button.classList.toggle('active', isActive);
      if (isActive) {
        button.classList.add('button-accent');
        button.classList.remove('button-outline');
      } else {
        button.classList.add('button-outline');
        button.classList.remove('button-accent');
      }
    });
  }

  updateEngineOverlayButtons(engineOverlayMode);

  engineOverlayButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.engineOverlayMode;
      if (!mode || mode === engineOverlayMode) {
        return;
      }
      updateEngineOverlayButtons(mode);
      if (typeof handlers.onEngineOverlayModeChange === 'function') {
        handlers.onEngineOverlayModeChange(mode);
      }
    });
  });

  const matchTitleEl = rootEl.querySelector('#match-title');
  const matchEventEl = rootEl.querySelector('#match-event');
  const matchDateEl = rootEl.querySelector('#match-date');
  const matchTimeControlEl = rootEl.querySelector('#match-time-control');
  const matchSiteEl = rootEl.querySelector('#match-site');

  function updateMatchInfo({ title, event, date, timeControl, site }) {
    if (title) {
      matchTitleEl.textContent = title;
    }
    if (event) {
      matchEventEl.textContent = event;
    }
    if (date) {
      matchDateEl.textContent = date;
    }
    if (timeControl) {
      matchTimeControlEl.textContent = timeControl;
    }
    if (site) {
      matchSiteEl.textContent = site;
    }
  }

  updateMatchInfo({
    title: 'Purrfect Chess Arena',
    event: `Purrfect Game - ${currentTimeControl.minutes}+${currentTimeControl.increment}`,
    date: new Date().toLocaleDateString(),
    timeControl: `${currentTimeControl.minutes} + ${currentTimeControl.increment}`,
    site: 'Purrfect Universe (Online)'
  });

  applyCustomBtn.addEventListener('click', () => {
    const minutes = Number.parseInt(customMinutes.value, 10);
    const increment = Number.parseInt(customIncrement.value, 10);
    showConfirmation('Change Time Control', `Apply ${minutes}+${increment}?`, () => {
      currentTimeControl = { minutes, increment };
      updateMatchInfo({
        event: `Purrfect Game - ${minutes}+${increment}`,
        timeControl: `${minutes} + ${increment}`
      });
      if (selectedPresetButton) {
        selectedPresetButton.classList.remove('preset-button-active');
        selectedPresetButton = null;
      }
      if (handlers.onTimePreset) {
        handlers.onTimePreset({ ...currentTimeControl });
      }
    });
  });

  startBtn.addEventListener('click', () => {
    if (handlers.onStartNewGame) {
      handlers.onStartNewGame({ ...currentTimeControl });
    }
  });

  resetGameBtn.addEventListener('click', () => {
    showConfirmation('Reset Game', 'Reset the current game and clocks?', () => {
      if (handlers.onResetGame) {
        handlers.onResetGame();
      }
    });
  });

  toggleEvalBarBtn.addEventListener('click', () => {
    evalBarVisible = !evalBarVisible;
    evalBarEl.classList.toggle('hidden', !evalBarVisible);
    const buttonText = toggleEvalBarBtn.querySelector('span:last-child');
    if (buttonText) {
      buttonText.textContent = evalBarVisible ? 'Hide Eval Bar' : 'Show Eval Bar';
    }
  });

  function resetAppearance() {
    showConfirmation('Reset Appearance', 'Restore all appearance settings?', () => {
      Object.keys(appearanceDefaults).forEach((key) => {
        appearanceState[key] = cloneDefaults(key);
        const controls = appearanceInputs.get(key) || {};
        Object.entries(appearanceState[key]).forEach(([ctrlKey, value]) => {
          if (controls[ctrlKey]) {
            controls[ctrlKey].input.value = value;
            controls[ctrlKey].value.textContent = controls[ctrlKey].format(value);
          }
        });
      });
      applyAppearance();
    });
  }

  resetAppearanceButtons.forEach((button) => {
    button.addEventListener('click', resetAppearance);
  });

  function interpretHandlerResult(result) {
    if (typeof result === 'boolean') {
      return { success: result };
    }
    if (result && typeof result === 'object') {
      if (Object.prototype.hasOwnProperty.call(result, 'success')) {
        return { success: Boolean(result.success), message: result.message };
      }
      if (Object.prototype.hasOwnProperty.call(result, 'error')) {
        return { success: false, message: result.error };
      }
    }
    return { success: Boolean(result) };
  }

  async function handleNotationLoad({ textarea, handler, emptyMessage, successMessage, invalidMessage }) {
    if (!handler || !textarea) return;
    const value = textarea.value.trim();
    textarea.value = value;
    if (!value) {
      messageApi.show('error', emptyMessage);
      return;
    }
    try {
      const result = interpretHandlerResult(await Promise.resolve(handler(value)));
      if (result.success) {
        messageApi.show('success', result.message || successMessage);
      } else {
        messageApi.show('error', result.message || invalidMessage);
      }
    } catch (error) {
      const fallbackMessage = error && typeof error.message === 'string' ? error.message : invalidMessage;
      messageApi.show('error', fallbackMessage || invalidMessage);
    }
  }

  copyFenBtn.addEventListener('click', async () => {
    if (!handlers.onCopyFen) return;
    const fen = handlers.onCopyFen();
    fenOutput.value = fen;
    try {
      await navigator.clipboard.writeText(fen);
      messageApi.show('success', 'FEN copied to clipboard!');
    } catch (error) {
      messageApi.show('error', 'Unable to copy FEN.');
    }
  });

  if (loadFenBtn) {
    loadFenBtn.addEventListener('click', () => {
      handleNotationLoad({
        textarea: fenOutput,
        handler: handlers.onSetFen,
        emptyMessage: 'Enter a FEN string to load.',
        successMessage: 'FEN loaded successfully.',
        invalidMessage: 'Invalid FEN string.'
      });
    });
  }

  copyPgnBtn.addEventListener('click', async () => {
    if (!handlers.onCopyPgn) return;
    const pgn = handlers.onCopyPgn();
    pgnOutput.value = pgn;
    try {
      await navigator.clipboard.writeText(pgn);
      messageApi.show('success', 'PGN copied to clipboard!');
    } catch (error) {
      messageApi.show('error', 'Unable to copy PGN.');
    }
  });

  if (loadPgnBtn) {
    loadPgnBtn.addEventListener('click', () => {
      handleNotationLoad({
        textarea: pgnOutput,
        handler: handlers.onSetPgn,
        emptyMessage: 'Enter a PGN string to load.',
        successMessage: 'PGN loaded successfully.',
        invalidMessage: 'Invalid PGN data.'
      });
    });
  }

  engineDepth.addEventListener('input', () => {
    engineDepthValue.textContent = engineDepth.value;
  });

  startAnalysisBtn.addEventListener('click', () => {
    if (handlers.onStartAnalysis) {
      handlers.onStartAnalysis({ depth: Number.parseInt(engineDepth.value, 10) });
    }
  });

  stopAnalysisBtn.addEventListener('click', () => {
    if (handlers.onStopAnalysis) {
      handlers.onStopAnalysis();
    }
  });

  closeEngineBtn.addEventListener('click', () => {
    enginePanel.classList.add('hidden');
    if (handlers.onStopAnalysis) {
      handlers.onStopAnalysis();
    }
  });

  setupCheatcode(cheatText, enginePanel, handlers.onRevealEnginePanel);

  function updateEvalBar(score) {
    if (!evalBarTrack || !evalBarFill || !evalBarScore) return;

    const validScore = typeof score === 'number' && Number.isFinite(score);
    if (!validScore) {
      evalBarTrack.classList.remove('white-advantage', 'black-advantage');
      evalBarScore.classList.remove('white-advantage', 'black-advantage');
      evalBarFill.style.height = '50%';
      evalBarScore.textContent = '–';
      return;
    }

    evalBarTrack.classList.remove('analyzing');
    const clamped = Math.max(-500, Math.min(500, score));
    const percent = ((clamped + 500) / 1000) * 100;
    const display = (clamped / 100).toFixed(1);
    const whiteAdvantage = clamped >= 0;

    evalBarTrack.classList.toggle('white-advantage', whiteAdvantage);
    evalBarTrack.classList.toggle('black-advantage', !whiteAdvantage);
    evalBarScore.classList.toggle('white-advantage', whiteAdvantage);
    evalBarScore.classList.toggle('black-advantage', !whiteAdvantage);
    evalBarFill.style.height = `${percent}%`;
    evalBarScore.textContent = display;
  }

  function setEvalBarAnalyzing(isAnalyzing) {
    if (!evalBarTrack) return;
    evalBarTrack.classList.toggle('analyzing', isAnalyzing);
  }

  updateEvalBar(0);

  return {
    boardEl,
    showMessage: messageApi.show,
    showConfirmation,
    updateClocks({ white, black, active }) {
      whiteClockEl.textContent = formatClock(white);
      blackClockEl.textContent = formatClock(black);
      whiteClockEl.classList.toggle('active', active === 'w');
      blackClockEl.classList.toggle('active', active === 'b');
    },
    updateMoveList(moves) {
      const list = rootEl.querySelector('#move-list');
      if (!Array.isArray(moves) || moves.length === 0) {
        list.innerHTML = '<p class="move-list-empty">No moves yet.</p>';
        return;
      }
      const rows = moves
        .map(
          (move) =>
            `<div class="move-row"><span class="move-index">${move.index}.</span><span class="move-white">${move.white || ''}</span><span class="move-black">${move.black || ''}</span></div>`
        )
        .join('');
      list.innerHTML = rows;
    },
    updateNotation({ pgn, fen }) {
      pgnOutput.value = pgn;
      fenOutput.value = fen;
    },
    getBoardElement() {
      return boardEl;
    },
    setEngineBusy(isBusy) {
      startAnalysisBtn.disabled = isBusy;
      stopAnalysisBtn.disabled = !isBusy;
    },
    setEngineDepth(depth) {
      if (!engineDepth) return;
      const fallback = Number.parseInt(engineDepth.getAttribute('min'), 10) || 18;
      const value = Number.isFinite(depth) ? depth : fallback;
      engineDepth.value = value;
      engineDepthValue.textContent = value;
    },
    updateEngineLines(lines) {
      if (!Array.isArray(lines) || lines.length === 0) {
        clearEnginePanel(engineLinesEl);
        return;
      }
      engineLinesEl.innerHTML = lines
        .map((line, index) => {
          const label = `#${index + 1}`;
          let scoreText = '';
          if (line.scoreType === 'mate') {
            const mateIn = Math.abs(line.score);
            const direction = line.score > 0 ? 'Mate in' : 'Mated in';
            scoreText = `${direction} ${mateIn}`;
          } else {
            const value = (line.score / 100).toFixed(2);
            scoreText = `${value}`;
          }
          return `<div class="engine-line engine-line-${index + 1}"><div class="engine-line-header"><span class="engine-line-label">${label}</span><span class="engine-line-score">${scoreText}</span></div><div class="engine-line-san">${line.san}</div><div class="engine-line-uci">${line.uci}</div></div>`;
        })
        .join('');
    },
    revealEnginePanel() {
      enginePanel.classList.remove('hidden');
    },
    hideEnginePanel() {
      enginePanel.classList.add('hidden');
    },
    setEngineOverlayMode(mode) {
      updateEngineOverlayButtons(mode);
    },
    getCurrentTimeControl() {
      return { ...currentTimeControl };
    },
    updateEvalBar,
    setEvalBarAnalyzing,
    updateMatchInfo,
    messageApi
  };
}
