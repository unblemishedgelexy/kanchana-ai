'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '../components/pages/LandingPage';
import StatusNotice from '../components/ui/StatusNotice';
import { useAppRuntime } from './providers/AppRuntimeProvider';

const LOGIN_REMINDER_DELAY_MS = 40_000;

export default function LandingRoutePage() {
  const runtime = useAppRuntime();
  const router = useRouter();
  const [showLoginReminder, setShowLoginReminder] = useState(false);

  useEffect(() => {
    if (!runtime.authResolved) return;
    if (runtime.isAuthenticated) {
      router.replace('/app/home');
      return;
    }

    setShowLoginReminder(false);
    const timer = window.setTimeout(() => {
      setShowLoginReminder(true);
    }, LOGIN_REMINDER_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [runtime.authResolved, runtime.isAuthenticated, router]);

  if (!runtime.authResolved || runtime.isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050107] text-slate-400 text-sm tracking-widest uppercase">
        Restoring Session...
      </div>
    );
  }

  return (
    <div className="relative">
      <LandingPage onEnter={() => runtime.setView('chat')} />
      {showLoginReminder && (
        <StatusNotice
          message="Login ya register karke apna session secure rakho."
          variant="info"
          className="bottom-6 top-auto z-[120]"
          onClose={() => setShowLoginReminder(false)}
        />
      )}
    </div>
  );
}
