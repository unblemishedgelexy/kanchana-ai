import { AppView, KanchanaMode } from '../shared/types';

const validModes = new Set(Object.values(KanchanaMode));

const toMode = (value?: string | null): KanchanaMode | null => {
  const safeValue = decodeURIComponent(String(value || '')).trim();
  if (!safeValue) return null;
  return validModes.has(safeValue as KanchanaMode) ? (safeValue as KanchanaMode) : null;
};

export interface RouteState {
  view: AppView;
  modeFromPath: KanchanaMode | null;
}

export const parseRouteState = (pathname: string): RouteState => {
  const safePath = pathname.replace(/\/+$/, '') || '/';

  if (safePath === '/') return { view: 'landing', modeFromPath: null };
  if (safePath === '/auth/login') return { view: 'login', modeFromPath: null };
  if (safePath === '/auth/register') return { view: 'register', modeFromPath: null };
  if (safePath === '/auth/forgot-password') return { view: 'forgot-password', modeFromPath: null };
  if (safePath === '/auth/google/success') return { view: 'login', modeFromPath: null };
  if (safePath === '/auth/google/error') return { view: 'login', modeFromPath: null };
  if (safePath === '/app/home') return { view: 'home', modeFromPath: null };

  const chatMatch = safePath.match(/^\/app\/chat(?:\/(.+))?$/);
  if (chatMatch) {
    return { view: 'chat', modeFromPath: toMode(chatMatch[1]) };
  }

  const audioMatch = safePath.match(/^\/app\/audio(?:\/(.+))?$/);
  if (audioMatch) {
    return { view: 'audio', modeFromPath: toMode(audioMatch[1]) };
  }

  if (safePath === '/app/settings') return { view: 'settings', modeFromPath: null };
  if (safePath === '/app/settings/privacy') return { view: 'privacy', modeFromPath: null };
  if (safePath === '/app/settings/security') return { view: 'security', modeFromPath: null };
  if (safePath === '/app/upgrade') return { view: 'upgrade', modeFromPath: null };
  if (safePath === '/app/gallery') return { view: 'gallery', modeFromPath: null };
  if (safePath === '/app/cards') return { view: 'cards', modeFromPath: null };

  return { view: 'landing', modeFromPath: null };
};

export const getPathForView = (view: AppView, mode: KanchanaMode): string => {
  if (view === 'landing') return '/';
  if (view === 'login') return '/auth/login';
  if (view === 'register') return '/auth/register';
  if (view === 'forgot-password') return '/auth/forgot-password';
  if (view === 'home') return '/app/home';
  if (view === 'chat') return `/app/chat/${encodeURIComponent(mode)}`;
  if (view === 'audio') return `/app/audio/${encodeURIComponent(mode)}`;
  if (view === 'settings') return '/app/settings';
  if (view === 'privacy') return '/app/settings/privacy';
  if (view === 'security') return '/app/settings/security';
  if (view === 'upgrade') return '/app/upgrade';
  if (view === 'gallery') return '/app/gallery';
  if (view === 'cards') return '/app/cards';
  return '/';
};

