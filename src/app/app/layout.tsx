'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import StatusNotice from '../../components/ui/StatusNotice';
import { useAppRuntime } from '../providers/AppRuntimeProvider';

interface AppSectionLayoutProps {
  children: React.ReactNode;
}

export default function AppSectionLayout({ children }: AppSectionLayoutProps) {
  const runtime = useAppRuntime();
  const isGuestChatSession = runtime.view === 'chat' && !runtime.isAuthenticated;
  const isHomeView = runtime.view === 'home';
  const isChatLikeView = runtime.view === 'chat' || runtime.view === 'audio';
  const shouldShowBottomNav = runtime.isAuthenticated && runtime.view !== 'home';
  const profileSeed =
    runtime.preferences.email ||
    runtime.preferences.name ||
    runtime.preferences.id ||
    'kanchana-user';

  const [isTouchViewport, setIsTouchViewport] = useState(false);
  const shouldLockViewportScroll = isTouchViewport;
  const lockedViewportSize = 'var(--app-viewport-height, 100vh)';
  const lockedViewportWidth = 'var(--app-viewport-width, 100vw)';

  useEffect(() => {
    const touchMedia = window.matchMedia('(hover: none), (pointer: coarse)');

    const syncViewportMode = () => {
      setIsTouchViewport(touchMedia.matches);
    };

    syncViewportMode();
    if (typeof touchMedia.addEventListener === 'function') {
      touchMedia.addEventListener('change', syncViewportMode);
    } else if (typeof touchMedia.addListener === 'function') {
      touchMedia.addListener(syncViewportMode);
    }

    return () => {
      if (typeof touchMedia.removeEventListener === 'function') {
        touchMedia.removeEventListener('change', syncViewportMode);
      } else if (typeof touchMedia.removeListener === 'function') {
        touchMedia.removeListener(syncViewportMode);
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const syncViewportHeight = () => {
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportOffsetTop = viewport?.offsetTop || 0;
      const viewportOffsetLeft = viewport?.offsetLeft || 0;

      root.style.setProperty('--app-viewport-width', `${Math.round(viewportWidth)}px`);
      root.style.setProperty('--app-viewport-height', `${Math.round(viewportHeight)}px`);
      root.style.setProperty('--app-viewport-offset-top', `${Math.max(0, Math.round(viewportOffsetTop))}px`);
      root.style.setProperty('--app-viewport-offset-left', `${Math.max(0, Math.round(viewportOffsetLeft))}px`);
    };

    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('scroll', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflowY = shouldLockViewportScroll ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflowY = 'auto';
    };
  }, [shouldLockViewportScroll]);

  if (!runtime.authResolved) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050107] text-slate-400 text-sm tracking-widest uppercase">
        Restoring Session...
      </div>
    );
  }

  if (!runtime.isAuthenticated && !isGuestChatSession) return null;

  return (
    <div
      className={`${shouldLockViewportScroll ? 'overflow-hidden' : 'h-screen'} w-full selection:bg-purple-500/30`}
      style={
        shouldLockViewportScroll
          ? {
              position: 'fixed',
              top: 'var(--app-viewport-offset-top, 0px)',
              left: 'var(--app-viewport-offset-left, 0px)',
              width: lockedViewportWidth,
              minWidth: lockedViewportWidth,
              maxWidth: lockedViewportWidth,
              height: lockedViewportSize,
              minHeight: lockedViewportSize,
              maxHeight: lockedViewportSize,
              overflow: 'hidden',
            }
          : undefined
      }
    >
      <div className="flex h-full min-h-0 w-full bg-[#050107] overflow-hidden">
        {!isHomeView && runtime.isAuthenticated && (
          <Sidebar
            currentView={runtime.view}
            setView={runtime.setView}
            activeMode={runtime.activeMode}
            setActiveMode={runtime.handleModeChange}
          />
        )}

        <main
          className={`flex-1 min-h-0 flex flex-col relative ${
            isHomeView
              ? 'overflow-y-auto overflow-x-hidden pb-0'
              : isChatLikeView
                ? 'overflow-hidden pb-0'
                : 'overflow-hidden pb-24 xl:pb-0'
          }`}
        >
          {runtime.errorMsg && (
            <StatusNotice
              message={runtime.errorMsg}
              variant="error"
              className="top-4"
              onClose={runtime.clearError}
            />
          )}

          {runtime.infoMsg && (
            <StatusNotice message={runtime.infoMsg} variant="info" className="top-16 z-[55]" />
          )}

          {children}
          {shouldShowBottomNav && (
            <BottomNav
              currentView={runtime.view}
              setView={runtime.setView}
              userAvatarUrl={runtime.preferences.profileImageUrl}
              profileSeed={profileSeed}
            />
          )}
        </main>
      </div>
    </div>
  );
}
