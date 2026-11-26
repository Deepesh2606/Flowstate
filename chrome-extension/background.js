/* FLOWSTATE Chrome Extension — Manifest V3 Background Service Worker */

const STORAGE_KEY = 'flowstate_ext_state';
const ALARM_TICK = 'flowstate_tick';
const ALARM_END = 'flowstate_end';
const BLOCK_RULE_ID_OFFSET = 1000;

const DEFAULT_BLOCKLIST = [
  'youtube.com',
  'reddit.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'netflix.com',
];

const getTodayKey = () => new Date().toISOString().split('T')[0];

const DEFAULT_STATE = {
  mode: 'pomodoro', // 'pomodoro' | 'shortBreak' | 'longBreak'
  durations: {
    pomodoro: 45 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  remainingSec: 45 * 60,
  isRunning: false,
  endsAt: null,
  subject: '',
  dailyGoalMinutes: 120,
  todayDate: getTodayKey(),
  todayFocusSec: 0,
  sessionsToday: 0,
  totalSessions: 0,
  blockerEnabled: true,
  blockedDomains: DEFAULT_BLOCKLIST,
  appUrl: '',
};

async function loadBundledAppUrl() {
  try {
    const res = await fetch(chrome.runtime.getURL('config.json'));
    if (!res.ok) return 'http://localhost:3000';
    const data = await res.json();
    return typeof data?.appUrl === 'string' && data.appUrl.trim()
      ? data.appUrl.trim()
      : 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}

async function getState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] || {};
  const fallbackUrl = stored.appUrl || (await loadBundledAppUrl());
  const today = getTodayKey();

  const merged = {
    ...DEFAULT_STATE,
    ...stored,
    durations: {
      ...DEFAULT_STATE.durations,
      ...(stored.durations || {}),
    },
    blockedDomains: Array.isArray(stored.blockedDomains)
      ? stored.blockedDomains
      : DEFAULT_BLOCKLIST,
    appUrl: fallbackUrl,
  };

  if (merged.todayDate !== today) {
    merged.todayDate = today;
    merged.todayFocusSec = 0;
    merged.sessionsToday = 0;
  }

  return merged;
}

async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

function normalizeDomain(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

async function syncBlockerRules(state) {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) return;

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing
    .map((r) => r.id)
    .filter((id) => id >= BLOCK_RULE_ID_OFFSET && id < BLOCK_RULE_ID_OFFSET + 200);

  const shouldBlock =
    state.isRunning &&
    state.mode === 'pomodoro' &&
    state.blockerEnabled &&
    Array.isArray(state.blockedDomains) &&
    state.blockedDomains.length > 0;

  const addRules = [];
  if (shouldBlock) {
    const redirectUrl = chrome.runtime.getURL('blocked.html');
    const uniqueDomains = [...new Set(state.blockedDomains.map(normalizeDomain).filter(Boolean))].slice(0, 100);
    uniqueDomains.forEach((domain, idx) => {
      addRules.push({
        id: BLOCK_RULE_ID_OFFSET + idx,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { url: redirectUrl },
        },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: ['main_frame'],
        },
      });
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (err) {
    console.warn('FLOWSTATE blocker rule update error:', err);
  }
}

async function updateBadge(state) {
  if (!state.isRunning || !state.endsAt) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }

  const remaining = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
  const text =
    remaining >= 60 ? `${Math.ceil(remaining / 60)}m` : `${remaining}s`;

  const color = state.mode === 'pomodoro' ? '#06b6d4' : '#10b981';
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
}

async function scheduleAlarms(state) {
  await chrome.alarms.clear(ALARM_TICK);
  await chrome.alarms.clear(ALARM_END);

  if (state.isRunning && state.endsAt) {
    const delayMs = Math.max(1000, state.endsAt - Date.now());
    chrome.alarms.create(ALARM_END, { when: Date.now() + delayMs });
    chrome.alarms.create(ALARM_TICK, { periodInMinutes: 0.5 });
  }
}

async function completeCurrentPhase(state, skipped = false) {
  const prevMode = state.mode;
  const fullDur = state.durations[prevMode] || 45 * 60;
  let elapsed = fullDur;

  if (skipped) {
    const rem = state.isRunning && state.endsAt
      ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000))
      : state.remainingSec;
    elapsed = Math.max(0, fullDur - rem);
  }

  if (prevMode === 'pomodoro' && elapsed > 0) {
    state.todayFocusSec = (state.todayFocusSec || 0) + elapsed;
    state.sessionsToday = (state.sessionsToday || 0) + 1;
    state.totalSessions = (state.totalSessions || 0) + 1;
  }

  const nextMode =
    prevMode === 'pomodoro'
      ? state.sessionsToday % 4 === 0
        ? 'longBreak'
        : 'shortBreak'
      : 'pomodoro';

  state.mode = nextMode;
  state.remainingSec = state.durations[nextMode] || 5 * 60;
  state.isRunning = false;
  state.endsAt = null;

  await saveState(state);
  await scheduleAlarms(state);
  await syncBlockerRules(state);
  await updateBadge(state);

  if (!skipped) {
    const title =
      prevMode === 'pomodoro'
        ? 'FLOWSTATE — Focus Complete!'
        : 'FLOWSTATE — Break Over';
    const message =
      prevMode === 'pomodoro'
        ? `Logged ${Math.round(elapsed / 60)}m of deep work. Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break.`
        : 'Break finished — ready to start your next focus block?';

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
      priority: 2,
    });
  }

  return state;
}

async function refreshAndNormalizeState() {
  const state = await getState();
  if (state.isRunning && state.endsAt) {
    const remaining = Math.ceil((state.endsAt - Date.now()) / 1000);
    if (remaining <= 0) {
      return await completeCurrentPhase(state, false);
    }
    state.remainingSec = remaining;
  }
  await updateBadge(state);
  return state;
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await saveState(state);
  await syncBlockerRules(state);
  await updateBadge(state);
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await refreshAndNormalizeState();
  await scheduleAlarms(state);
  await syncBlockerRules(state);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_END || alarm.name === ALARM_TICK) {
    await refreshAndNormalizeState();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    let state = await refreshAndNormalizeState();

    switch (msg?.type) {
      case 'GET_STATE': {
        sendResponse({ ok: true, state });
        return;
      }

      case 'START': {
        if (!state.isRunning) {
          const secs = state.remainingSec > 0 ? state.remainingSec : state.durations[state.mode];
          state.remainingSec = secs;
          state.isRunning = true;
          state.endsAt = Date.now() + secs * 1000;
          await saveState(state);
          await scheduleAlarms(state);
          await syncBlockerRules(state);
          await updateBadge(state);
        }
        sendResponse({ ok: true, state });
        return;
      }

      case 'PAUSE': {
        if (state.isRunning && state.endsAt) {
          state.remainingSec = Math.max(1, Math.ceil((state.endsAt - Date.now()) / 1000));
        }
        state.isRunning = false;
        state.endsAt = null;
        await saveState(state);
        await scheduleAlarms(state);
        await syncBlockerRules(state);
        await updateBadge(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'RESET': {
        state.isRunning = false;
        state.endsAt = null;
        state.remainingSec = state.durations[state.mode] || 45 * 60;
        await saveState(state);
        await scheduleAlarms(state);
        await syncBlockerRules(state);
        await updateBadge(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SKIP': {
        state = await completeCurrentPhase(state, true);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SET_MODE': {
        const nextMode = ['pomodoro', 'shortBreak', 'longBreak'].includes(msg.mode)
          ? msg.mode
          : 'pomodoro';
        state.mode = nextMode;
        state.isRunning = false;
        state.endsAt = null;
        state.remainingSec = state.durations[nextMode] || 45 * 60;
        await saveState(state);
        await scheduleAlarms(state);
        await syncBlockerRules(state);
        await updateBadge(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SET_PRESET_MINUTES': {
        const mins = Math.max(5, Math.min(180, Math.round(Number(msg.minutes) || 45)));
        state.durations.pomodoro = mins * 60;
        if (state.mode === 'pomodoro' && !state.isRunning) {
          state.remainingSec = mins * 60;
        }
        await saveState(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SET_GOAL_MINUTES': {
        const mins = Math.max(5, Math.min(1440, Math.round(Number(msg.minutes) || 120)));
        state.dailyGoalMinutes = mins;
        await saveState(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SET_SUBJECT': {
        state.subject = String(msg.subject || '').trim().slice(0, 60);
        await saveState(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'TOGGLE_BLOCKER': {
        state.blockerEnabled = Boolean(msg.enabled);
        await saveState(state);
        await syncBlockerRules(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'SAVE_OPTIONS': {
        const focusMin = Math.max(5, Math.min(180, Math.round(Number(msg.focusMinutes) || 45)));
        const shortMin = Math.max(1, Math.min(60, Math.round(Number(msg.shortBreakMinutes) || 5)));
        const longMin = Math.max(5, Math.min(90, Math.round(Number(msg.longBreakMinutes) || 15)));
        const goalMin = Math.max(5, Math.min(1440, Math.round(Number(msg.dailyGoalMinutes) || 120)));

        state.durations = {
          pomodoro: focusMin * 60,
          shortBreak: shortMin * 60,
          longBreak: longMin * 60,
        };
        state.dailyGoalMinutes = goalMin;
        if (!state.isRunning) {
          state.remainingSec = state.durations[state.mode];
        }
        if (Array.isArray(msg.blockedDomains)) {
          state.blockedDomains = [...new Set(msg.blockedDomains.map(normalizeDomain).filter(Boolean))];
        }
        if (typeof msg.appUrl === 'string' && /^https?:\/\//i.test(msg.appUrl.trim())) {
          state.appUrl = msg.appUrl.trim().replace(/\/+$/, '');
        }
        await saveState(state);
        await syncBlockerRules(state);
        sendResponse({ ok: true, state });
        return;
      }

      case 'OPEN_APP': {
        const targetUrl = state.appUrl || (await loadBundledAppUrl());
        const existingTabs = await chrome.tabs.query({});
        const match = existingTabs.find(
          (t) => typeof t.url === 'string' && t.url.startsWith(targetUrl)
        );
        if (match?.id) {
          await chrome.tabs.update(match.id, { active: true });
          if (match.windowId) {
            await chrome.windows.update(match.windowId, { focused: true });
          }
        } else {
          await chrome.tabs.create({ url: targetUrl });
        }
        sendResponse({ ok: true });
        return;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown action' });
    }
  })();

  return true; // keep message channel open for async response
});
