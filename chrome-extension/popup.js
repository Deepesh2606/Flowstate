/* FLOWSTATE Chrome Extension — Popup Controller */

const RING_CIRC = 2 * Math.PI * 26;

const elDigits = document.getElementById('timer-digits');
const elSubject = document.getElementById('subject-input');
const elStartPause = document.getElementById('btn-start-pause');
const elReset = document.getElementById('btn-reset');
const elSkip = document.getElementById('btn-skip');
const elOpenApp = document.getElementById('btn-open-app');
const elOptions = document.getElementById('btn-options');
const elPresetsRow = document.getElementById('presets-row');
const elGoalArc = document.getElementById('goal-ring-arc');
const elGoalPct = document.getElementById('goal-ring-pct');
const elGoalSummary = document.getElementById('goal-summary');
const elGoalInput = document.getElementById('goal-minutes-input');
const elBlockerToggle = document.getElementById('blocker-toggle');
const elBlockerSub = document.getElementById('blocker-sub');
const modeButtons = Array.from(document.querySelectorAll('.ext-mode-tab'));
const presetButtons = Array.from(document.querySelectorAll('.ext-preset-btn'));

let currentState = null;

function sendBg(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => resolve(res || {}));
  });
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = String(Math.floor(safe / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatMinutesLabel(seconds) {
  const mins = Math.floor((Number(seconds) || 0) / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${mins}m`;
}

function render(state) {
  if (!state) return;
  currentState = state;

  const remaining =
    state.isRunning && state.endsAt
      ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000))
      : state.remainingSec;

  elDigits.textContent = formatTimer(remaining);

  elStartPause.textContent = state.isRunning
    ? 'Pause'
    : state.mode === 'pomodoro'
      ? 'Start Focus'
      : 'Start Break';
  elStartPause.classList.toggle('is-running', Boolean(state.isRunning));

  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
  });

  elPresetsRow.style.display = state.mode === 'pomodoro' ? 'grid' : 'none';
  const focusMins = Math.round((state.durations?.pomodoro || 2700) / 60);
  presetButtons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.mins) === focusMins);
  });

  if (document.activeElement !== elSubject) {
    elSubject.value = state.subject || '';
  }

  // Daily Deep Work Goal Ring
  const goalMinutes = Math.max(5, Number(state.dailyGoalMinutes) || 120);
  const goalSec = goalMinutes * 60;
  const todaySec = Math.max(0, Number(state.todayFocusSec) || 0);
  const progress = Math.min(1, todaySec / goalSec);
  const pct = Math.round(progress * 100);

  elGoalArc.setAttribute('stroke-dasharray', `${RING_CIRC * progress} ${RING_CIRC}`);
  elGoalArc.setAttribute('stroke', progress >= 1 ? '#16a34a' : '#f4f4f6');
  elGoalPct.textContent = `${pct}%`;
  elGoalSummary.textContent = `${formatMinutesLabel(todaySec)} / ${goalMinutes}m`;

  if (document.activeElement !== elGoalInput) {
    elGoalInput.value = String(goalMinutes);
  }

  // Distraction Blocker
  elBlockerToggle.checked = Boolean(state.blockerEnabled);
  const domainCount = Array.isArray(state.blockedDomains) ? state.blockedDomains.length : 0;
  elBlockerSub.textContent = state.blockerEnabled
    ? `Shields ${domainCount} distraction ${domainCount === 1 ? 'site' : 'sites'} during Focus`
    : 'Site blocker paused';
}

async function refresh() {
  const res = await sendBg({ type: 'GET_STATE' });
  if (res.state) render(res.state);
}

elStartPause.addEventListener('click', async () => {
  if (!currentState) return;
  const res = await sendBg({ type: currentState.isRunning ? 'PAUSE' : 'START' });
  if (res.state) render(res.state);
});

elReset.addEventListener('click', async () => {
  const res = await sendBg({ type: 'RESET' });
  if (res.state) render(res.state);
});

elSkip.addEventListener('click', async () => {
  const res = await sendBg({ type: 'SKIP' });
  if (res.state) render(res.state);
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const res = await sendBg({ type: 'SET_MODE', mode: btn.dataset.mode });
    if (res.state) render(res.state);
  });
});

presetButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const res = await sendBg({ type: 'SET_PRESET_MINUTES', minutes: Number(btn.dataset.mins) });
    if (res.state) render(res.state);
  });
});

elSubject.addEventListener('change', async () => {
  const res = await sendBg({ type: 'SET_SUBJECT', subject: elSubject.value });
  if (res.state) render(res.state);
});

elGoalInput.addEventListener('change', async () => {
  const mins = Number(elGoalInput.value);
  if (Number.isFinite(mins) && mins >= 5 && mins <= 1440) {
    const res = await sendBg({ type: 'SET_GOAL_MINUTES', minutes: mins });
    if (res.state) render(res.state);
  }
});

elBlockerToggle.addEventListener('change', async () => {
  const res = await sendBg({ type: 'TOGGLE_BLOCKER', enabled: elBlockerToggle.checked });
  if (res.state) render(res.state);
});

elOpenApp.addEventListener('click', async () => {
  await sendBg({ type: 'OPEN_APP' });
  window.close();
});

elOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

refresh();
setInterval(() => {
  if (currentState?.isRunning) {
    render(currentState);
  }
}, 500);
