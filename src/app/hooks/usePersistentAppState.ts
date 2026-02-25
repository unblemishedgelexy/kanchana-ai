import { useEffect, useState } from 'react';
import { KanchanaMode, Message, UserPreferences } from '../../shared/types';
import {
  getStoredMode,
  getStoredToken,
  parseStoredPreferences,
  STORAGE_KEYS,
  writeStorage,
  removeStorage,
} from '../appState';

export const usePersistentAppState = () => {
  const [token, setToken] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>(parseStoredPreferences);
  const [activeMode, setActiveMode] = useState<KanchanaMode>(KanchanaMode.LOVELY);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
    setPreferences(parseStoredPreferences());
    setActiveMode(getStoredMode());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    writeStorage(STORAGE_KEYS.preferences, JSON.stringify(preferences));
  }, [preferences, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    writeStorage(STORAGE_KEYS.mode, activeMode);
  }, [activeMode, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (token) {
      writeStorage(STORAGE_KEYS.token, token);
    } else {
      removeStorage(STORAGE_KEYS.token);
    }
  }, [token, storageReady]);

  return {
    storageReady,
    token,
    setToken,
    preferences,
    setPreferences,
    activeMode,
    setActiveMode,
    threads,
    setThreads,
  };
};
