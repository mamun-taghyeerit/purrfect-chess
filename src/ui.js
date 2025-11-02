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
        <h3 class="text-xl font-semibold" data-role="title"></h3>
        <p class="text-sm text-slate-200/80" data-role="message"></p>
        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600" data-role="cancel">Cancel</button>
          <button type="button" class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold" data-role="confirm">Confirm</button>
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

function buildAppearanceControls(container) {
  const groups = [
    {
      key: 'light',
      label: 'Light Squares',
      sliders: [
        { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
        { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` }
      ]
    },
    {
      key: 'dark',
      label: 'Dark Squares',
      sliders: [
        { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
        { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` }
      ]
    },
    {
      key: 'whitePieces',
      label: 'White Pieces',
      sliders: [
        { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
        { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` }
      ]
    },
    {
      key: 'blackPieces',
      label: 'Black Pieces',
      sliders: [
        { key: 'hue', label: 'Hue', min: -180, max: 180, step: 1, format: (v) => `${v}°` },
        { key: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'brightness', label: 'Brightness', min: 25, max: 200, step: 1, format: (v) => `${v}%` },
        { key: 'scale', label: 'Size', min: 80, max: 120, step: 1, format: (v) => `${v}%` }
      ]
    }
  ];

  groups.forEach((group) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'appearance-group';
    const header = document.createElement('h4');
    header.textContent = group.label;

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-sm';
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
    headerWrapper.className = 'flex items-center justify-between gap-2';
    headerWrapper.appendChild(header);
    headerWrapper.appendChild(reset);

    const slidersWrapper = document.createElement('div');
    slidersWrapper.className = 'appearance-sliders';

    const groupInputs = {};

    group.sliders.forEach((slider) => {
      const label = document.createElement('label');
      label.className = 'text-sm flex flex-col gap-1';
      label.textContent = slider.label;

      const range = document.createElement('input');
      range.type = 'range';
      range.min = slider.min;
      range.max = slider.max;
      range.step = slider.step;
      range.value = appearanceState[group.key][slider.key];

      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'text-xs text-slate-300';
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

  applyAppearance();
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
  engineLinesEl.innerHTML = '<p class="text-xs text-slate-300">Awaiting analysis…</p>';
}

export function initUI(rootEl, handlers = {}) {
  const messageBox = createMessageBox();
  const overlay = createConfirmationOverlay();

  rootEl.innerHTML = `
    <div class="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
      <section class="panel" id="white-panel">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">White Controls</h2>
          <button id="reset-game" type="button" class="px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-900 font-semibold">Reset Game</button>
        </div>
        <div class="clock-display" id="white-clock">05:00</div>
        <div class="space-y-3">
          <h3 class="text-lg font-semibold">Time Presets</h3>
          <div class="grid grid-cols-2 gap-2" id="preset-container"></div>
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Custom Time</h3>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col text-sm gap-1">
              Minutes
              <input id="custom-minutes" type="number" min="1" max="180" value="5" class="bg-slate-900/60 rounded-lg px-3 py-2" />
            </label>
            <label class="flex flex-col text-sm gap-1">
              Increment (s)
              <input id="custom-increment" type="number" min="0" max="60" value="0" class="bg-slate-900/60 rounded-lg px-3 py-2" />
            </label>
          </div>
          <div class="flex gap-2">
            <button id="apply-custom" type="button" class="flex-1 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold">Apply</button>
            <button id="start-new-game" type="button" class="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold">Start</button>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Appearance</h3>
            <button id="reset-appearance" type="button" class="px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-900 font-semibold">Reset Appearance</button>
          </div>
          <div class="appearance-grid" id="appearance-grid"></div>
        </div>
      </section>
      <section class="panel items-center" id="board-panel">
        <div class="board-wrapper">
          <div id="board"></div>
        </div>
        <p id="cheatcode-text" class="text-xs text-slate-400 italic select-text cursor-pointer">(Reserved for future use)</p>
        <div id="engine-panel" class="engine-panel hidden">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Engine Analysis</h3>
            <button id="close-engine" type="button" class="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-sm">Close</button>
          </div>
          <label class="text-sm flex flex-col gap-1">
            Search Depth: <span id="engine-depth-value" class="text-xs text-slate-300">18</span>
            <input id="engine-depth" type="range" min="6" max="30" step="1" value="18" class="accent-sky-400" />
          </label>
          <div class="flex gap-2">
            <button id="start-analysis" type="button" class="flex-1 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold">Start Analysis</button>
            <button id="stop-analysis" type="button" class="flex-1 px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-900 font-semibold">Stop</button>
          </div>
          <div class="engine-lines" id="engine-lines"></div>
        </div>
      </section>
      <section class="panel" id="black-panel">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Black Controls</h2>
        </div>
        <div class="clock-display" id="black-clock">05:00</div>
        <div class="space-y-3">
          <h3 class="text-lg font-semibold">Moves</h3>
          <div id="move-list" class="space-y-2"></div>
        </div>
        <div class="flex gap-2">
          <button id="copy-pgn" type="button" class="flex-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600">Copy PGN</button>
          <button id="copy-fen" type="button" class="flex-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600">Copy FEN</button>
        </div>
        <textarea id="pgn-output" rows="4" readonly placeholder="PGN will appear here"></textarea>
        <textarea id="fen-output" rows="2" readonly placeholder="FEN will appear here"></textarea>
      </section>
    </div>
  `;

  const boardEl = rootEl.querySelector('#board');
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

  function showConfirmation(title, message, onConfirm) {
    overlay.querySelector('[data-role="title"]').textContent = title;
    overlay.querySelector('[data-role="message"]').textContent = message;
    overlay.classList.add('active');
    confirmationState.onConfirm = onConfirm;
  }

  let currentTimeControl = { minutes: 5, increment: 0 };
  let selectedPresetButton = null;

  timePresets.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600';
    button.textContent = preset.label;
    button.addEventListener('click', () => {
      showConfirmation(
        'Change Time Control',
        `Switch to ${preset.minutes}+${preset.increment}?`,
        () => {
          currentTimeControl = { minutes: preset.minutes, increment: preset.increment };
          rootEl.querySelector('#custom-minutes').value = preset.minutes;
          rootEl.querySelector('#custom-increment').value = preset.increment;
          if (selectedPresetButton) {
            selectedPresetButton.classList.remove('bg-sky-600', 'text-slate-900');
            selectedPresetButton.classList.add('bg-slate-700');
          }
          button.classList.remove('bg-slate-700');
          button.classList.add('bg-sky-600', 'text-slate-900');
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
  const resetAppearanceBtn = rootEl.querySelector('#reset-appearance');
  const appearanceGrid = rootEl.querySelector('#appearance-grid');
  const copyFenBtn = rootEl.querySelector('#copy-fen');
  const copyPgnBtn = rootEl.querySelector('#copy-pgn');
  const pgnOutput = rootEl.querySelector('#pgn-output');
  const fenOutput = rootEl.querySelector('#fen-output');
  const cheatText = rootEl.querySelector('#cheatcode-text');
  const enginePanel = rootEl.querySelector('#engine-panel');
  const engineDepth = rootEl.querySelector('#engine-depth');
  const engineDepthValue = rootEl.querySelector('#engine-depth-value');
  const startAnalysisBtn = rootEl.querySelector('#start-analysis');
  const stopAnalysisBtn = rootEl.querySelector('#stop-analysis');
  const engineLinesEl = rootEl.querySelector('#engine-lines');
  const closeEngineBtn = rootEl.querySelector('#close-engine');

  buildAppearanceControls(appearanceGrid);
  clearEnginePanel(engineLinesEl);
  stopAnalysisBtn.disabled = true;

  applyCustomBtn.addEventListener('click', () => {
    const minutes = Number.parseInt(customMinutes.value, 10);
    const increment = Number.parseInt(customIncrement.value, 10);
    showConfirmation('Change Time Control', `Apply ${minutes}+${increment}?`, () => {
      currentTimeControl = { minutes, increment };
      if (selectedPresetButton) {
        selectedPresetButton.classList.remove('bg-sky-600', 'text-slate-900');
        selectedPresetButton.classList.add('bg-slate-700');
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

  resetAppearanceBtn.addEventListener('click', () => {
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
  });

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
        list.innerHTML = '<p class="text-xs text-slate-300">No moves yet.</p>';
        return;
      }
      const rows = moves
        .map((move) => `<div class="flex justify-between"><span>${move.index}.</span><span>${move.white || ''}</span><span>${move.black || ''}</span></div>`)
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
          return `<div class="flex flex-col bg-slate-900/60 rounded-lg p-2"><div class="flex justify-between text-xs text-slate-300"><span>${label}</span><span>${scoreText}</span></div><div class="text-sm font-semibold">${line.san}</div><div class="text-xs text-slate-400 uppercase tracking-wide">${line.uci}</div></div>`;
        })
        .join('');
    },
    revealEnginePanel() {
      enginePanel.classList.remove('hidden');
    },
    hideEnginePanel() {
      enginePanel.classList.add('hidden');
    },
    getCurrentTimeControl() {
      return { ...currentTimeControl };
    },
    messageApi
  };
}
