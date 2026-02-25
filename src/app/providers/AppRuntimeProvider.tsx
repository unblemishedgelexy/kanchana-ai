'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppView,
  ChatUsage,
  ChatUxHint,
  KanchanaMode,
  Message,
  PremiumOverview,
  UserPreferences,
} from '../../shared/types';
import { isHostUser } from '../../shared/access';
import { api } from '../../services/api';
import { BACKEND_POLL_MS, defaultPreferences, STORAGE_KEYS, writeStorage } from '../appState';
import { usePersistentAppState } from '../hooks/usePersistentAppState';
import { usePremiumOverview } from '../hooks/usePremiumOverview';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { getPathForView, parseRouteState } from '../routing';
import { PAYMENTS_ENABLED } from '../../shared/featureFlags';

interface AppRuntimeContextValue {
  storageReady: boolean;
  authResolved: boolean;
  view: AppView;
  isAuthenticated: boolean;
  token: string;
  preferences: UserPreferences;
  activeMode: KanchanaMode;
  usageByMode: Partial<Record<KanchanaMode, ChatUsage>>;
  activeUsage: ChatUsage | null;
  threads: Record<string, Message[]>;
  isTyping: boolean;
  errorMsg: string | null;
  infoMsg: string | null;
  chatHint: ChatUxHint | null;
  voiceBlockedForDay: boolean;
  voiceBlockedMessage: string;
  authLoading: boolean;
  premiumOverview: PremiumOverview | null;
  premiumOverviewLoading: boolean;
  setView: (view: AppView, modeOverride?: KanchanaMode) => void;
  clearError: () => void;
  clearChatHint: () => void;
  handleLogin: (input: { email: string; password: string }) => Promise<void>;
  handleRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
  handleGoogleOAuthStart: () => void;
  handleForgotPassword: (email: string) => Promise<{ message: string; debugResetToken?: string }>;
  handleResetPassword: (token: string, newPassword: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleModeChange: (mode: KanchanaMode) => Promise<void>;
  handleSaveName: (name: string) => Promise<void>;
  handleSendMessage: (text: string, voiceMode?: boolean, voiceDurationSeconds?: number) => Promise<void>;
  handleClearCurrentHistory: () => Promise<void>;
  handlePremiumUpgrade: () => Promise<void>;
  handleProfileImageUpload: (file: File) => Promise<void>;
  handleUpgradeAssetUpload: (file: File) => Promise<void>;
  handlePaypalOrder: () => Promise<void>;
  handlePaypalSubscription: () => Promise<void>;
  handleDevUpgrade: () => Promise<void>;
  refreshPremiumOverview: (silent?: boolean) => Promise<void>;
}

const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);

const VOICE_BLOCK_STORAGE_KEY = 'kanchana_voice_block_state_v1';

interface VoiceBlockState {
  blocked: boolean;
  message: string;
  day: string;
}

const getDayStamp = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readVoiceBlockState = (): VoiceBlockState => {
  if (typeof window === 'undefined') {
    return { blocked: false, message: '', day: getDayStamp() };
  }

  try {
    const raw = window.localStorage.getItem(VOICE_BLOCK_STORAGE_KEY);
    if (!raw) {
      return { blocked: false, message: '', day: getDayStamp() };
    }

    const parsed = JSON.parse(raw) as Partial<VoiceBlockState>;
    const today = getDayStamp();
    if (parsed.day !== today) {
      return { blocked: false, message: '', day: today };
    }

    return {
      blocked: Boolean(parsed.blocked),
      message: String(parsed.message || ''),
      day: today,
    };
  } catch {
    return { blocked: false, message: '', day: getDayStamp() };
  }
};

export const AppRuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const {
    storageReady,
    token,
    setToken,
    preferences,
    setPreferences,
    activeMode,
    setActiveMode,
    threads,
    setThreads,
  } = usePersistentAppState();

  const { view, modeFromPath } = useMemo(() => parseRouteState(pathname), [pathname]);

  const setView = useCallback(
    (targetView: AppView, modeOverride?: KanchanaMode) => {
      const nextPath = getPathForView(targetView, modeOverride || activeMode);
      if (nextPath === pathname) return;
      router.push(nextPath);
    },
    [router, activeMode, pathname]
  );

  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [usageByMode, setUsageByMode] = useState<Partial<Record<KanchanaMode, ChatUsage>>>({});
  const [chatHint, setChatHint] = useState<ChatUxHint | null>(null);
  const [voiceBlockedState, setVoiceBlockedState] = useState<VoiceBlockState>(() => readVoiceBlockState());
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const isAuthenticated = Boolean(token && preferences.isAuthenticated);
  const isHostAccount = isHostUser(preferences);
  const activeUsage = usageByMode[activeMode] || null;
  const authResolved = storageReady && (!token || isAuthenticated || sessionChecked);
  const isAuthView = view === 'login' || view === 'register' || view === 'forgot-password';

  const {
    premiumOverview,
    premiumOverviewLoading,
    refreshPremiumOverview,
    clearPremiumState,
  } = usePremiumOverview({
    token,
    isAuthenticated,
    tier: preferences.tier,
    isHost: isHostAccount,
    view,
    onError: (message) => setErrorMsg(message),
  });

  const {
    handleLogin,
    handleRegister,
    handleGoogleOAuthStart,
    handleForgotPassword,
    handleResetPassword,
    handleLogout,
    handleModeChange,
    handleSaveName,
    handleSendMessage,
    handleClearCurrentHistory,
    handlePremiumUpgrade,
    handleProfileImageUpload,
    handleUpgradeAssetUpload,
    handlePaypalOrder,
    handlePaypalSubscription,
    handleDevUpgrade,
  } = useAppHandlers({
    token,
    isAuthenticated,
    activeMode,
    preferences,
    premiumOverview,
    setUsageByMode,
    setChatHint,
    setVoiceBlockedForDay: setVoiceBlockedState,
    setToken,
    setPreferences,
    setActiveMode,
    setThreads,
    setErrorMsg,
    setInfoMsg,
    setAuthLoading,
    setIsTyping,
    setView: (targetView) => setView(targetView),
    clearPremiumState,
    refreshPremiumOverview,
  });

  useEffect(() => {
    if (!storageReady) return;
    if (view !== 'chat' && view !== 'audio') return;
    if (!modeFromPath) return;
    if (modeFromPath !== activeMode) {
      setActiveMode(modeFromPath);
    }
  }, [storageReady, view, modeFromPath, activeMode, setActiveMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        VOICE_BLOCK_STORAGE_KEY,
        JSON.stringify({
          blocked: voiceBlockedState.blocked,
          message: voiceBlockedState.message,
          day: voiceBlockedState.day || getDayStamp(),
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [voiceBlockedState]);

  useEffect(() => {
    if (!storageReady) return;
    let inFlight = false;

    const pingBackendKeepAlive = () => {
      if (inFlight) return;
      inFlight = true;
      api
        .health()
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
        });
    };

    pingBackendKeepAlive();
    const intervalId = window.setInterval(pingBackendKeepAlive, BACKEND_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [storageReady]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const today = getDayStamp();
      setVoiceBlockedState((previous) =>
        previous.day === today ? previous : { blocked: false, message: '', day: today }
      );
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (token) return;
    setChatHint(null);
    setUsageByMode({});
    setVoiceBlockedState({ blocked: false, message: '', day: getDayStamp() });
  }, [token]);

  useEffect(() => {
    if (!storageReady) return;
    let cancelled = false;
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const searchString = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : '';
    const currentSearchParams = new URLSearchParams(searchString);
    if (!hash && !currentSearchParams.get('token') && !currentSearchParams.get('error')) return;

    const hashParams = new URLSearchParams(hash);
    const provider = hashParams.get('provider') || currentSearchParams.get('provider');
    const isGooglePath =
      pathname === '/auth/google/success' ||
      pathname === '/auth/google/error' ||
      pathname === '/api/auth/google/callback';
    if (provider !== 'google' && !isGooglePath) return;

    const googleToken = hashParams.get('token') || currentSearchParams.get('token');
    const googleError = hashParams.get('error') || currentSearchParams.get('error');

    if (googleToken) {
      setToken(googleToken);
      writeStorage(STORAGE_KEYS.token, googleToken);
      setInfoMsg('Google login completed.');
      setErrorMsg(null);
      api
        .me(googleToken)
        .then(({ user }) => {
          if (cancelled) return;
          setPreferences({ ...user, isAuthenticated: true });
          if (user.mode) {
            setActiveMode(user.mode);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setPreferences((prev) => ({ ...prev, isAuthenticated: true }));
        })
        .finally(() => {
          if (cancelled) return;
          setView('home');
        });
    } else if (googleError) {
      setErrorMsg(`Google login failed: ${googleError}`);
      setView('login');
    }

    if (window.location.hash) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`
      );
    }
    return () => {
      cancelled = true;
    };
  }, [storageReady, pathname, setToken, setPreferences, setActiveMode, setView]);

  useEffect(() => {
    if (!storageReady) return;
    if (!token) {
      setSessionChecked(true);
      return;
    }

    let cancelled = false;
    setSessionChecked(false);
    api.me(token)
      .then(({ user }) => {
        if (cancelled) return;
        const nextUser: UserPreferences = { ...user, isAuthenticated: true };
        setPreferences(nextUser);
        if (nextUser.mode) {
          setActiveMode(nextUser.mode);
        }
        setSessionChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (preferences.isAuthenticated) {
          setSessionChecked(true);
          return;
        }
        setToken('');
        setPreferences(defaultPreferences);
        setThreads({});
        setView('login');
        setSessionChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [storageReady, token, preferences.isAuthenticated, setToken, setPreferences, setActiveMode, setThreads, setView]);

  useEffect(() => {
    if (!storageReady) return;
    if (!token || !isAuthenticated) return;
    if (isHostAccount) return;
    const searchString = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : '';

    if (!PAYMENTS_ENABLED) {
      const params = new URLSearchParams(searchString);
      if (params.get('paypalStatus') || params.get('subscriptionStatus')) {
        router.replace(pathname);
      }
      return;
    }

    const params = new URLSearchParams(searchString);
    const paypalStatus = params.get('paypalStatus');
    const paypalOrderToken = params.get('token');
    const subscriptionStatus = params.get('subscriptionStatus');

    if (subscriptionStatus === 'success') {
      setInfoMsg('PayPal subscription approved. Refreshing overview...');
      void refreshPremiumOverview(true);
      router.replace(pathname);
      return;
    }

    if (subscriptionStatus === 'cancelled') {
      setInfoMsg('PayPal subscription flow cancelled.');
      router.replace(pathname);
      return;
    }

    if (paypalStatus === 'cancelled') {
      setInfoMsg('PayPal checkout cancelled.');
      router.replace(pathname);
      return;
    }

    if (paypalStatus !== 'success' || !paypalOrderToken) return;

    api
      .capturePaypalOrder(token, paypalOrderToken)
      .then((response) => {
        setPreferences({ ...response.user, isAuthenticated: true });
        setInfoMsg('PayPal payment captured and premium activated.');
        void refreshPremiumOverview(true);
      })
      .catch((error: Error) => {
        setErrorMsg(error.message || 'PayPal capture failed.');
      })
      .finally(() => {
        router.replace(pathname);
      });
  }, [storageReady, token, isAuthenticated, isHostAccount, setPreferences, refreshPremiumOverview, pathname, router]);

  useEffect(() => {
    if (!storageReady) return;
    if (!token || !isAuthenticated) return;

    let cancelled = false;
    api.getHistory(token, activeMode, 50)
      .then((result) => {
        if (cancelled) return;
        setThreads((prev) => ({ ...prev, [activeMode]: result.messages || [] }));
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorMsg(error.message || 'Failed to load history.');
      });

    return () => {
      cancelled = true;
    };
  }, [storageReady, token, activeMode, isAuthenticated, setThreads]);

  useEffect(() => {
    if (!storageReady) return;
    if (view === 'landing' || isAuthView) return;
    const isGuestChatView = view === 'chat';

    if (!token) {
      if (isGuestChatView) return;
      router.replace('/auth/login');
      return;
    }
    if (!isAuthenticated && sessionChecked && !isGuestChatView) {
      router.replace('/auth/login');
    }
  }, [storageReady, view, isAuthView, token, isAuthenticated, sessionChecked, router]);

  useEffect(() => {
    if (!storageReady) return;
    if (!isAuthView) return;
    if (!token) return;
    if (!isAuthenticated && !sessionChecked) return;
    if (isAuthenticated) {
      router.replace('/app/home');
    }
  }, [storageReady, isAuthView, token, isAuthenticated, sessionChecked, router]);

  const value = useMemo<AppRuntimeContextValue>(
    () => ({
      storageReady,
      authResolved,
      view,
      isAuthenticated,
      token,
      preferences,
      activeMode,
      usageByMode,
      activeUsage,
      threads,
      isTyping,
      errorMsg,
      infoMsg,
      chatHint,
      voiceBlockedForDay: voiceBlockedState.blocked,
      voiceBlockedMessage: voiceBlockedState.message,
      authLoading,
      premiumOverview,
      premiumOverviewLoading,
      setView,
      clearError: () => setErrorMsg(null),
      clearChatHint: () => setChatHint(null),
      handleLogin,
      handleRegister,
      handleGoogleOAuthStart,
      handleForgotPassword,
      handleResetPassword,
      handleLogout,
      handleModeChange,
      handleSaveName,
      handleSendMessage,
      handleClearCurrentHistory,
      handlePremiumUpgrade,
      handleProfileImageUpload,
      handleUpgradeAssetUpload,
      handlePaypalOrder,
      handlePaypalSubscription,
      handleDevUpgrade,
      refreshPremiumOverview,
    }),
    [
      storageReady,
      authResolved,
      view,
      isAuthenticated,
      token,
      preferences,
      activeMode,
      usageByMode,
      activeUsage,
      threads,
      isTyping,
      errorMsg,
      infoMsg,
      chatHint,
      voiceBlockedState.blocked,
      voiceBlockedState.message,
      authLoading,
      premiumOverview,
      premiumOverviewLoading,
      setView,
      handleLogin,
      handleRegister,
      handleGoogleOAuthStart,
      handleForgotPassword,
      handleResetPassword,
      handleLogout,
      handleModeChange,
      handleSaveName,
      handleSendMessage,
      handleClearCurrentHistory,
      handlePremiumUpgrade,
      handleProfileImageUpload,
      handleUpgradeAssetUpload,
      handlePaypalOrder,
      handlePaypalSubscription,
      handleDevUpgrade,
      refreshPremiumOverview,
    ]
  );

  return <AppRuntimeContext.Provider value={value}>{children}</AppRuntimeContext.Provider>;
};

export const useAppRuntime = (): AppRuntimeContextValue => {
  const ctx = useContext(AppRuntimeContext);
  if (!ctx) {
    throw new Error('useAppRuntime must be used inside AppRuntimeProvider');
  }
  return ctx;
};
