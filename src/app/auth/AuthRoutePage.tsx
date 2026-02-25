'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthPage from '../../components/pages/AuthPage';
import { useAppRuntime } from '../providers/AppRuntimeProvider';

interface AuthRoutePageProps {
  view: 'login' | 'register' | 'forgot-password';
}

const AuthRoutePage: React.FC<AuthRoutePageProps> = ({ view }) => {
  const runtime = useAppRuntime();
  const router = useRouter();

  useEffect(() => {
    if (!runtime.authResolved) return;
    if (!runtime.isAuthenticated) return;
    router.replace('/app/home');
  }, [runtime.authResolved, runtime.isAuthenticated, router]);

  if (!runtime.authResolved || runtime.isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050107] text-slate-400 text-sm tracking-widest uppercase">
        Restoring Session...
      </div>
    );
  }

  return (
    <AuthPage
      view={view}
      setView={runtime.setView}
      onLogin={runtime.handleLogin}
      onRegister={runtime.handleRegister}
      onGoogleOAuthStart={runtime.handleGoogleOAuthStart}
      onForgotPassword={runtime.handleForgotPassword}
      onResetPassword={runtime.handleResetPassword}
      loading={runtime.authLoading}
    />
  );
};

export default AuthRoutePage;
