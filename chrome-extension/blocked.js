const elCountdown = document.getElementById('shield-countdown');
const elTopic = document.getElementById('shield-topic');
const btnBack = document.getElementById('btn-back-app');
const btnPause = document.getElementById('btn-pause-focus');

function formatSec(sec) {
  const safe = Math.max(0, Math.floor(Number(sec) || 0));
  const m = String(Math.floor(safe / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function update() {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
    const state = res?.state;
    if (!state) return;
    const rem =
      state.isRunning && state.endsAt
        ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000))
        : state.remainingSec;
    elCountdown.textContent = formatSec(rem);
    elTopic.textContent = state.subject ? `Focusing on: ${state.subject}` : 'Deep Work Session';
  });
}

btnBack.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_APP' });
});

btnPause.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'PAUSE' }, () => {
    elTopic.textContent = 'Focus paused — site blocker lifted.';
  });
});

update();
setInterval(update, 1000);
