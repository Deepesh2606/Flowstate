import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveSettings, subscribeSettings } from '../firebase/firestore';

const DEFAULT_SETTINGS = {
  durations: {
    pomodoro: 45 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  modePreference: 'SSC CGL',
};

export const useSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeSettings(currentUser.uid, (data) => {
      if (data) {
        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          ...data,
          durations: {
            ...DEFAULT_SETTINGS.durations,
            ...(data.durations || {}),
          },
        }));
      }
      setLoaded(true);
    });
    return unsub;
  }, [currentUser]);

  const updateSettings = useCallback(
    async (updates) => {
      const merged = {
        ...settings,
        ...updates,
        durations: {
          ...settings.durations,
          ...(updates.durations || {}),
        },
      };
      setSettings(merged);
      if (currentUser) {
        await saveSettings(currentUser.uid, merged);
      }
    },
    [currentUser, settings]
  );

  return { settings, updateSettings, loaded };
};
