import { KanchanaMode, UserPreferences, UserTier } from '../shared/types';

export const STORAGE_KEYS = {
  token: 'kanchana_token',
  preferences: 'kanchana_prefs',
  mode: 'kanchana_mode',
} as const;

export const BACKEND_POLL_MS = 30_000;

export const defaultPreferences: UserPreferences = {
  id: '',
  name: '',
  email: '',
  tier: UserTier.FREE,
  mode: KanchanaMode.LOVELY,
  messageCount: 0,
  isAuthenticated: false,
};

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const readStorage = (key: string): string | null => {
  try {
    return getBrowserStorage()?.getItem(key) || null;
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string): void => {
  try {
    getBrowserStorage()?.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode, quota, etc.)
  }
};

export const removeStorage = (key: string): void => {
  try {
    getBrowserStorage()?.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
};

export const getStoredToken = (): string => readStorage(STORAGE_KEYS.token) || '';

export const getStoredMode = (): KanchanaMode => {
  const saved = readStorage(STORAGE_KEYS.mode);
  return (saved as KanchanaMode) || KanchanaMode.LOVELY;
};

export const parseStoredPreferences = (): UserPreferences => {
  try {
    const raw = readStorage(STORAGE_KEYS.preferences);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...(JSON.parse(raw) as UserPreferences) };
  } catch {
    return defaultPreferences;
  }
};

export const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
