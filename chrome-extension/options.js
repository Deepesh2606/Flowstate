const elAppUrl = document.getElementById('opt-app-url');
const elFocus = document.getElementById('opt-focus');
const elShort = document.getElementById('opt-short');
const elLong = document.getElementById('opt-long');
const elGoal = document.getElementById('opt-goal');
const elDomains = document.getElementById('opt-domains');
const elStatus = document.getElementById('opt-status');
const btnSave = document.getElementById('opt-save');

chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
  const s = res?.state;
  if (!s) return;
  elAppUrl.value = s.appUrl || '';
  elFocus.value = Math.round((s.durations?.pomodoro || 2700) / 60);
  elShort.value = Math.round((s.durations?.shortBreak || 300) / 60);
  elLong.value = Math.round((s.durations?.longBreak || 900) / 60);
  elGoal.value = s.dailyGoalMinutes || 120;
  elDomains.value = (s.blockedDomains || []).join('\n');
});

btnSave.addEventListener('click', () => {
  const blockedDomains = elDomains.value
    .split(/[\n,]+/)
    .map((d) => d.trim())
    .filter(Boolean);

  chrome.runtime.sendMessage(
    {
      type: 'SAVE_OPTIONS',
      appUrl: elAppUrl.value.trim(),
      focusMinutes: Number(elFocus.value),
      shortBreakMinutes: Number(elShort.value),
      longBreakMinutes: Number(elLong.value),
      dailyGoalMinutes: Number(elGoal.value),
      blockedDomains,
    },
    (res) => {
      if (res?.ok) {
        elStatus.textContent = 'Saved! Rules updated.';
        setTimeout(() => {
          elStatus.textContent = '';
        }, 2500);
      }
    }
  );
});
