import {
  AuthPayload,
  BackendErrorCode,
  ChatUsage,
  KanchanaMode,
  Message,
  PremiumOverview,
  UserPreferences,
} from '../shared/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://kanchana-ai-backend.onrender.com/api';

export type ApiActivityStatus = 'pending' | 'success' | 'error';

export interface ApiActivityEvent {
  id: string;
  requestId: string;
  timestamp: number;
  method: string;
  path: string;
  url: string;
  status: ApiActivityStatus;
  statusCode?: number;
  durationMs?: number;
  message: string;
}

type ApiActivityListener = (event: ApiActivityEvent) => void;

const activityListeners = new Set<ApiActivityListener>();

const nextEventId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const emitActivity = (event: ApiActivityEvent) => {
  activityListeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Ignore listener errors to avoid breaking API calls.
    }
  });
};

export const subscribeApiActivity = (listener: ApiActivityListener) => {
  activityListeners.add(listener);
  return () => {
    activityListeners.delete(listener);
  };
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ApiRequestError extends Error {
  statusCode?: number;
  code?: BackendErrorCode | string;
  payload?: unknown;
}

class BaseApiClient {
  protected readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = String(baseUrl || '').replace(/\/+$/, '');
  }

  public url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  protected async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method || 'GET';
    const url = this.url(path);
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 45_000;
    const requestId =
      options.headers?.['x-request-id'] ||
      options.headers?.['X-Request-Id'] ||
      options.headers?.['X-REQUEST-ID'] ||
      nextEventId();
    const startedAt = Date.now();

    emitActivity({
      id: nextEventId(),
      requestId,
      timestamp: startedAt,
      method,
      path,
      url,
      status: 'pending',
      message: 'Request started',
    });

    let response: Response;
    const headers: Record<string, string> = {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutHandle = timeoutMs > 0
      ? setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs)
      : undefined;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (requestError) {
      const durationMs = Date.now() - startedAt;
      const message = didTimeout
        ? `Request timed out after ${Math.ceil(timeoutMs / 1000)}s`
        : requestError instanceof Error
          ? requestError.message
          : 'Network request failed.';

      emitActivity({
        id: nextEventId(),
        requestId,
        timestamp: Date.now(),
        method,
        path,
        url,
        status: 'error',
        durationMs,
        message: `Network error: ${message}`,
      });

      const networkError = new Error(`Network error: ${message}`) as ApiRequestError;
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }

    const responseText = await response.text();
    let payload: any = {};
    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { message: responseText };
      }
    }

    if (!response.ok) {
      const errorMessage = payload?.message || `Request failed (${response.status})`;
      const durationMs = Date.now() - startedAt;

      emitActivity({
        id: nextEventId(),
        requestId,
        timestamp: Date.now(),
        method,
        path,
        url,
        status: 'error',
        statusCode: response.status,
        durationMs,
        message: errorMessage,
      });

      const backendCode =
        payload?.code ||
        payload?.error?.code ||
        payload?.errorCode ||
        undefined;

      const error = new Error(errorMessage) as ApiRequestError;
      error.statusCode = response.status;
      error.code = backendCode;
      error.payload = payload;
      throw error;
    }

    const durationMs = Date.now() - startedAt;
    emitActivity({
      id: nextEventId(),
      requestId,
      timestamp: Date.now(),
      method,
      path,
      url,
      status: 'success',
      statusCode: response.status,
      durationMs,
      message: payload?.message || response.statusText || 'Request completed',
    });

    return payload as T;
  }
}

class KanchanaApiClient extends BaseApiClient {
  ping = () => this.request<{ pong: boolean; timestamp: string }>('/ping');
  health = () => this.request<{ status: string; uptime: number; timestamp: string }>('/health');

  register = (input: { name: string; email: string; password: string }) =>
    this.request<AuthPayload>('/auth/register', { method: 'POST', body: input });

  login = (input: { email: string; password: string }) =>
    this.request<AuthPayload>('/auth/login', { method: 'POST', body: input });

  googleLogin = (idToken: string) =>
    this.request<AuthPayload>('/auth/google', { method: 'POST', body: { idToken } });

  getGoogleOAuthStartUrl = (redirect = '/chat') =>
    this.url(`/auth/google/start?redirect=${encodeURIComponent(redirect.startsWith('/') ? redirect : '/chat')}`);

  me = (token: string) => this.request<{ user: UserPreferences }>('/auth/me', { token });

  logout = (token: string) => this.request<{ message: string }>('/auth/logout', { method: 'POST', token });

  updatePreferences = (token: string, input: { name?: string; mode?: KanchanaMode }) =>
    this.request<{ user: UserPreferences; message: string }>('/auth/preferences', {
      method: 'PATCH',
      token,
      body: input,
    });

  upgrade = (token: string) =>
    this.request<{ user: UserPreferences; message: string }>('/auth/upgrade', {
      method: 'POST',
      token,
    });

  forgotPassword = (email: string) =>
    this.request<{ message: string; debugResetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });

  resetPassword = (token: string, newPassword: string) =>
    this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    });

  sendMessage = (
    token: string | undefined,
    input: {
      text: string;
      mode: KanchanaMode;
      voiceMode?: boolean;
      voiceDurationSeconds?: number;
    }
  ) =>
    this.request<{
      userMessage: Message;
      assistantMessage: Message;
      usage: ChatUsage;
      user: UserPreferences;
      mode: KanchanaMode;
    }>('/chat/message', {
      method: 'POST',
      token,
      body: input,
      timeoutMs: 90_000,
    });

  getHistory = (token: string, mode: KanchanaMode, limit = 40) =>
    this.request<{ mode: KanchanaMode; messages: Message[] }>(
      `/chat/history?mode=${encodeURIComponent(mode)}&limit=${encodeURIComponent(String(limit))}`,
      { token }
    );

  clearHistory = (token: string, mode: KanchanaMode) =>
    this.request<{ message: string; mode: KanchanaMode; deletedCount: number }>(
      `/chat/history?mode=${encodeURIComponent(mode)}`,
      { method: 'DELETE', token }
    );

  getSimpleContent = () => this.request<{ title: string; content: string; type: string }>('/content/simple');

  getPremiumContent = (token: string) =>
    this.request<{ title: string; content: string; type: string }>('/content/premium', { token });

  getPremiumOverview = (token: string) =>
    this.request<PremiumOverview>('/payments/premium/overview', {
      token,
    });

  createPaypalOrder = (token: string) =>
    this.request<{ providerRef: string; approvalUrl: string; rawStatus: string }>('/payments/paypal/order', {
      method: 'POST',
      token,
    });

  capturePaypalOrder = (token: string, orderId: string) =>
    this.request<{ status: string; providerRef: string; user: UserPreferences }>('/payments/paypal/capture', {
      method: 'POST',
      token,
      body: { orderId },
    });

  createPaypalSubscription = (token: string) =>
    this.request<{ providerRef: string; approvalUrl: string; rawStatus: string }>(
      '/payments/paypal/subscription',
      {
        method: 'POST',
        token,
      }
    );

  devUpgrade = (token: string) =>
    this.request<{ message: string; user: UserPreferences }>('/payments/dev/upgrade', {
      method: 'POST',
      token,
    });

  getImageKitUploadAuth = (token: string) =>
    this.request<{
      token: unknown;
      expire: number;
      signature: string;
      publicKey: string;
      urlEndpoint: string;
    }>('/media/imagekit/auth', { token });

  uploadProfileImage = (token: string, input: { dataUri?: string; imageUrl?: string }) =>
    this.request<{ message: string; image: { url: string; thumbnailUrl?: string }; user: UserPreferences }>(
      '/media/profile-image',
      {
        method: 'POST',
        token,
        body: input,
      }
    );

  uploadUpgradeAsset = (token: string, input: { dataUri?: string; imageUrl?: string }) =>
    this.request<{ message: string; asset: { url: string; thumbnailUrl?: string }; user: UserPreferences }>(
      '/media/upgrade-asset',
      {
        method: 'POST',
        token,
        body: input,
      }
    );
}

export const api = new KanchanaApiClient(API_BASE_URL);
export const buildApiUrl = (path: string) => api.url(path);
