import { Dispatch, SetStateAction } from 'react';
import {
  AppView,
  AuthPayload,
  BackendErrorCode,
  ChatUsage,
  ChatUxHint,
  KanchanaMode,
  Message,
  PremiumOverview,
  UserPreferences,
} from '../../shared/types';
import { isHostUser } from '../../shared/access';
import { api, ApiRequestError } from '../../services/api';
import { PAYMENTS_ENABLED } from '../../shared/featureFlags';
import { defaultPreferences, fileToDataUri } from '../appState';

interface UseAppHandlersArgs {
  token: string;
  isAuthenticated: boolean;
  activeMode: KanchanaMode;
  preferences: UserPreferences;
  premiumOverview: PremiumOverview | null;
  setUsageByMode: Dispatch<SetStateAction<Partial<Record<KanchanaMode, ChatUsage>>>>;
  setChatHint: Dispatch<SetStateAction<ChatUxHint | null>>;
  setVoiceBlockedForDay: Dispatch<
    SetStateAction<{ blocked: boolean; message: string; day: string }>
  >;
  setToken: Dispatch<SetStateAction<string>>;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  setActiveMode: Dispatch<SetStateAction<KanchanaMode>>;
  setThreads: Dispatch<SetStateAction<Record<string, Message[]>>>;
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
  setInfoMsg: Dispatch<SetStateAction<string | null>>;
  setAuthLoading: Dispatch<SetStateAction<boolean>>;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setView: (view: AppView) => void;
  clearPremiumState: () => void;
  refreshPremiumOverview: (silent?: boolean) => Promise<void>;
}

export const useAppHandlers = ({
  token,
  isAuthenticated,
  activeMode,
  preferences,
  premiumOverview,
  setUsageByMode,
  setChatHint,
  setVoiceBlockedForDay,
  setToken,
  setPreferences,
  setActiveMode,
  setThreads,
  setErrorMsg,
  setInfoMsg,
  setAuthLoading,
  setIsTyping,
  setView,
  clearPremiumState,
  refreshPremiumOverview,
}: UseAppHandlersArgs) => {
  const paymentDisabledMessage = 'Payments are currently disabled by frontend configuration.';
  const sleep = (ms: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

  const getDayStamp = (date = new Date()): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeError = (error: unknown): ApiRequestError => {
    if (error instanceof Error) {
      return error as ApiRequestError;
    }

    const fallback = new Error('Request failed.') as ApiRequestError;
    return fallback;
  };

  const extractUsageFromError = (error: ApiRequestError): ChatUsage | null => {
    const payload = error.payload as
      | {
          usage?: ChatUsage;
          error?: { usage?: ChatUsage };
        }
      | undefined;
    return payload?.usage || payload?.error?.usage || null;
  };

  const formatUsageNotice = (usage: ChatUsage | undefined): string => {
    if (!usage) return 'Message sent.';
    const limitType = usage.limitType || (usage.isHost ? 'host' : usage.isPremium ? 'premium' : 'free');

    if (limitType === 'host') return 'Host access active.';
    if (limitType === 'premium') return 'Premium access active.';

    const total =
      Number.isFinite(usage.modeLimit) && usage.modeLimit
        ? usage.modeLimit
        : Number.isFinite(usage.maxFreeMessages)
          ? usage.maxFreeMessages
          : undefined;

    if (Number.isFinite(usage.remainingMessages)) {
      if (Number.isFinite(total)) {
        return `${String(limitType).toUpperCase()} mode usage: ${usage.messageCount}/${total} (${usage.remainingMessages} left)`;
      }
      return `${String(limitType).toUpperCase()} remaining: ${usage.remainingMessages}`;
    }

    if (Number.isFinite(total)) {
      return `${String(limitType).toUpperCase()} mode usage: ${usage.messageCount}/${total}`;
    }

    return 'Message sent.';
  };

  const buildHintFromError = (input: {
    code?: BackendErrorCode | string;
    message: string;
    isGuest: boolean;
    usage?: ChatUsage | null;
  }): ChatUxHint | null => {
    const normalizedCode = String(input.code || '').toUpperCase() as BackendErrorCode | '';
    if (!normalizedCode) return null;

    if (normalizedCode === 'VOICE_LOGIN_REQUIRED') {
      return {
        kind: 'login',
        code: normalizedCode,
        message: input.message,
        ctaLabel: 'Login',
      };
    }

    if (normalizedCode === 'MODE_LIMIT_REACHED') {
      const limitType = input.usage?.limitType || (input.isGuest ? 'guest' : 'free');
      return {
        kind: limitType === 'guest' ? 'login' : 'upgrade',
        code: normalizedCode,
        message: input.message,
        ctaLabel: limitType === 'guest' ? 'Login' : 'Upgrade',
      };
    }

    if (normalizedCode === 'DAILY_VOICE_LIMIT_REACHED') {
      return {
        kind: 'voice',
        code: normalizedCode,
        message: input.message,
        ctaLabel: input.isGuest ? 'Login' : 'Upgrade',
      };
    }

    return null;
  };

  const applyAuthSession = (payload: AuthPayload) => {
    setToken(payload.token);
    const nextUser = { ...payload.user, isAuthenticated: true };
    setPreferences(nextUser);
    setActiveMode((payload.user.mode as KanchanaMode) || KanchanaMode.LOVELY);
    setThreads({});
    setUsageByMode({});
    setChatHint(null);
    setVoiceBlockedForDay({ blocked: false, message: '', day: getDayStamp() });
    clearPremiumState();
    setErrorMsg(null);
    setInfoMsg(null);
    setView('home');
  };

  const handleLogin = async (input: { email: string; password: string }) => {
    setAuthLoading(true);
    try {
      const payload = await api.login(input);
      applyAuthSession(payload);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (input: { name: string; email: string; password: string }) => {
    setAuthLoading(true);
    try {
      const payload = await api.register(input);
      applyAuthSession(payload);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleOAuthStart = () => {
    const oauthUrl = api.getGoogleOAuthStartUrl('/auth/google/success');
    window.location.assign(oauthUrl);
  };

  const handleForgotPassword = async (email: string) => api.forgotPassword(email);

  const handleResetPassword = async (resetToken: string, newPassword: string) => {
    await api.resetPassword(resetToken, newPassword);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await api.logout(token);
      }
    } catch {
      // Ignore server logout errors while clearing local session.
    }

    setToken('');
    setPreferences(defaultPreferences);
    setThreads({});
    setUsageByMode({});
    setChatHint(null);
    setVoiceBlockedForDay({ blocked: false, message: '', day: getDayStamp() });
    clearPremiumState();
    setErrorMsg(null);
    setInfoMsg(null);
    setView('landing');
  };

  const handleModeChange = async (mode: KanchanaMode) => {
    setActiveMode(mode);

    if (!token || !isAuthenticated) return;
    try {
      const response = await api.updatePreferences(token, { mode });
      setPreferences({ ...response.user, isAuthenticated: true });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to sync mode.');
    }
  };

  const handleSaveName = async (name: string) => {
    if (!token) return;

    const response = await api.updatePreferences(token, { name });
    setPreferences({ ...response.user, isAuthenticated: true });
    setInfoMsg('Profile updated.');
  };

  const handleSendMessage = async (
    text: string,
    voiceMode = false,
    voiceDurationSeconds?: number
  ) => {
    const cleanedText = text.trim();
    if (!cleanedText) return;

    const isGuest = !token || !isAuthenticated;

    setErrorMsg(null);
    setChatHint(null);

    const optimisticUserMessage: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      text: cleanedText,
      timestamp: Date.now(),
    };

    setThreads((prev) => ({
      ...prev,
      [activeMode]: [...(prev[activeMode] || []), optimisticUserMessage],
    }));
    setIsTyping(true);

    try {
      let response;
      const retryDelays = [1500, 3000];
      for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
        try {
          response = await api.sendMessage(token || undefined, {
            text: cleanedText,
            mode: activeMode,
            voiceMode,
            voiceDurationSeconds,
          });
          break;
        } catch (retryError) {
          const normalizedRetryError = normalizeError(retryError);
          const isLastAttempt = attempt === retryDelays.length;
          if (normalizedRetryError.statusCode !== 503 || isLastAttempt) {
            throw normalizedRetryError;
          }

          const nextAttempt = attempt + 2;
          const totalAttempts = retryDelays.length + 1;
          setInfoMsg(`Chat service busy (503). Retrying ${nextAttempt}/${totalAttempts}...`);
          await sleep(retryDelays[attempt]);
        }
      }

      if (!response) {
        throw new Error('Empty response from chat service.');
      }

      if (response.user) {
        const backendAuth =
          typeof response.user.isAuthenticated === 'boolean'
            ? response.user.isAuthenticated
            : false;
        setPreferences({
          ...response.user,
          isAuthenticated: Boolean((token && isAuthenticated) || backendAuth),
        });
      }
      if (response.usage) {
        setUsageByMode((prev) => ({ ...prev, [activeMode]: response.usage }));
      }

      if (voiceMode) {
        setVoiceBlockedForDay({ blocked: false, message: '', day: getDayStamp() });
      }

      setThreads((prev) => {
        const existing = (prev[activeMode] || []).filter((item) => item.id !== optimisticUserMessage.id);
        return {
          ...prev,
          [activeMode]: [...existing, response.userMessage, response.assistantMessage],
        };
      });
      setInfoMsg(formatUsageNotice(response.usage));
    } catch (error) {
      setThreads((prev) => ({
        ...prev,
        [activeMode]: (prev[activeMode] || []).filter((item) => item.id !== optimisticUserMessage.id),
      }));

      const apiError = normalizeError(error);
      const usageFromError = extractUsageFromError(apiError);
      if (usageFromError) {
        setUsageByMode((prev) => ({ ...prev, [activeMode]: usageFromError }));
      }

      const hint = buildHintFromError({
        code: apiError.code,
        message: apiError.message || 'Message failed.',
        isGuest,
        usage: usageFromError,
      });
      if (hint) {
        setChatHint(hint);
      }

      if (String(apiError.code || '').toUpperCase() === 'DAILY_VOICE_LIMIT_REACHED') {
        setVoiceBlockedForDay({
          blocked: true,
          message: apiError.message || 'Daily voice limit reached.',
          day: getDayStamp(),
        });
      }

      const message =
        apiError.statusCode === 503
          ? 'Chat service temporarily unavailable (503). Please try again in a few seconds.'
          : apiError.message || 'Message failed.';
      setErrorMsg(message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearCurrentHistory = async () => {
    if (!token || !isAuthenticated) return;
    await api.clearHistory(token, activeMode);
    setThreads((prev) => ({ ...prev, [activeMode]: [] }));
    setInfoMsg('Current mode history cleared.');
  };

  const handlePremiumUpgrade = async () => {
    if (!token) return;
    if (isHostUser(preferences)) {
      setInfoMsg('Host account me Premium apply nahi hota. Full access already active hai.');
      return;
    }
    const response = await api.upgrade(token);
    setPreferences({ ...response.user, isAuthenticated: true });
    await refreshPremiumOverview(true);
    setInfoMsg(response.message);
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!token) return;
    const dataUri = await fileToDataUri(file);
    const response = await api.uploadProfileImage(token, { dataUri });
    setPreferences({ ...response.user, isAuthenticated: true });
    setInfoMsg(response.message);
  };

  const handleUpgradeAssetUpload = async (file: File) => {
    if (!token) return;
    const dataUri = await fileToDataUri(file);
    const response = await api.uploadUpgradeAsset(token, { dataUri });
    setPreferences({ ...response.user, isAuthenticated: true });
    setInfoMsg(response.message);
  };

  const handlePaypalOrder = async () => {
    if (!PAYMENTS_ENABLED) {
      setInfoMsg(paymentDisabledMessage);
      return;
    }

    if (!token) return;
    if (isHostUser(preferences)) {
      setInfoMsg('Host account ko PayPal checkout ki zarurat nahi hai.');
      return;
    }
    if (premiumOverview && !premiumOverview.paypal.configured) {
      setErrorMsg('PayPal is not configured on backend.');
      return;
    }

    const response = await api.createPaypalOrder(token);
    await refreshPremiumOverview(true);
    if (response.approvalUrl) {
      window.open(response.approvalUrl, '_blank', 'noopener,noreferrer');
      setInfoMsg('PayPal checkout opened. Approve payment and return to this app.');
      return;
    }
    setInfoMsg('PayPal order created.');
  };

  const handlePaypalSubscription = async () => {
    if (!PAYMENTS_ENABLED) {
      setInfoMsg(paymentDisabledMessage);
      return;
    }

    if (!token) return;
    if (isHostUser(preferences)) {
      setInfoMsg('Host account ko subscription flow ki zarurat nahi hai.');
      return;
    }
    if (premiumOverview && !premiumOverview.paypal.configured) {
      setErrorMsg('PayPal is not configured on backend.');
      return;
    }
    if (premiumOverview && !premiumOverview.paypal.subscriptionPlanConfigured) {
      setErrorMsg('PayPal subscription plan is not configured on backend.');
      return;
    }

    const response = await api.createPaypalSubscription(token);
    await refreshPremiumOverview(true);
    if (response.approvalUrl) {
      window.open(response.approvalUrl, '_blank', 'noopener,noreferrer');
      setInfoMsg('PayPal subscription page opened.');
      return;
    }
    setInfoMsg('Subscription initiated.');
  };

  const handleDevUpgrade = async () => {
    if (!PAYMENTS_ENABLED) {
      setInfoMsg(paymentDisabledMessage);
      return;
    }

    if (!token) return;
    if (isHostUser(preferences)) {
      setInfoMsg('Host account me dev-upgrade ki zarurat nahi hai.');
      return;
    }
    const response = await api.devUpgrade(token);
    setPreferences({ ...response.user, isAuthenticated: true });
    await refreshPremiumOverview(true);
    setInfoMsg(response.message);
  };

  return {
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
  };
};
