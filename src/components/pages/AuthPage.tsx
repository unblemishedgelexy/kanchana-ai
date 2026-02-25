import React, { useEffect, useState } from 'react';
import { AppView } from '../../shared/types';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';
import GlassCard from '../ui/GlassCard';

interface AuthPageProps {
  view: 'login' | 'register' | 'forgot-password';
  setView: (view: AppView) => void;
  onLogin: (input: { email: string; password: string }) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
  onGoogleOAuthStart: () => void;
  onForgotPassword: (email: string) => Promise<{ message: string; debugResetToken?: string }>;
  onResetPassword: (token: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({
  view,
  setView,
  onLogin,
  onRegister,
  onGoogleOAuthStart,
  onForgotPassword,
  onResetPassword,
  loading,
}) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [localLoading, setLocalLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const showEmailField = view !== 'forgot-password' || forgotStep === 'request';
  const isBusy = loading || localLoading;

  useEffect(() => {
    setStatusMessage('');
    setErrorMessage('');
    if (view === 'forgot-password') return;
    setForgotStep('request');
    setResetToken('');
    setNewPassword('');
  }, [view]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');

    try {
      setLocalLoading(true);
      if (view === 'register') {
        await onRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else if (view === 'login') {
        await onLogin({
          email: formData.email,
          password: formData.password,
        });
      } else if (forgotStep === 'request') {
        const response = await onForgotPassword(formData.email);
        setStatusMessage(response.message);
        if (!response.debugResetToken) return;
        setResetToken(response.debugResetToken);
        setForgotStep('reset');
      } else {
        await onResetPassword(resetToken, newPassword);
        setStatusMessage('Password reset complete. Please login.');
        setView('login');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050107] px-4 py-6 sm:p-6 relative overflow-y-auto overflow-x-hidden selection:bg-purple-500/30">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#2e1065_0%,_transparent_70%)] opacity-20"></div>

      <AppButton
        onClick={() => setView('landing')}
        variant="ghost"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 sm:gap-3 text-slate-500 hover:text-white z-[100]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="group-hover:-translate-x-1 transition-transform"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em]">Return to Home</span>
      </AppButton>

      <GlassCard className="w-full max-w-md rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 md:p-14 space-y-6 sm:space-y-8 relative z-10 animate-fade-in shadow-[0_0_100px_rgba(0,0,0,0.5)] mt-12 sm:mt-0">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center font-cinzel text-2xl sm:text-3xl text-white mx-auto shadow-[0_0_40px_rgba(147,51,234,0.4)]">
            K
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl text-white tracking-[0.2em] sm:tracking-[0.3em] uppercase">
            {view === 'login' && 'Return to Her'}
            {view === 'register' && 'Forge the Bond'}
            {view === 'forgot-password' && (forgotStep === 'request' ? 'Recover Memory' : 'Set New Key')}
          </h2>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {view === 'register' && (
            <AppInput
              label="Soul Name"
              type="text"
              placeholder="How should she whisper your name?"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}

          {showEmailField && (
            <AppInput
              label="Astral Email"
              type="email"
              placeholder="email@dimension.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          )}

          {(view === 'login' || view === 'register') && (
            <AppInput
              label="Secret Key"
              type="password"
              placeholder="********"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}

          {view === 'forgot-password' && forgotStep === 'reset' && (
            <>
              <AppInput
                label="Reset Token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
              <AppInput
                label="New Password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </>
          )}

          {view === 'forgot-password' && forgotStep === 'request' && (
            <div className="text-right px-2">
              <AppButton
                variant="ghost"
                onClick={() => setForgotStep('reset')}
                className="text-[10px] text-purple-400/60 hover:text-purple-400 uppercase tracking-widest font-bold"
              >
                I already have reset token
              </AppButton>
            </div>
          )}

          {view === 'forgot-password' && forgotStep === 'reset' && (
            <div className="text-right px-2">
              <AppButton
                variant="ghost"
                onClick={() => setForgotStep('request')}
                className="text-[10px] text-purple-400/60 hover:text-purple-400 uppercase tracking-widest font-bold"
              >
                Request a new reset token
              </AppButton>
            </div>
          )}

          {view === 'login' && (
            <div className="text-right px-2">
              <AppButton
                variant="ghost"
                onClick={() => setView('forgot-password')}
                className="text-[10px] text-purple-400/60 hover:text-purple-400 uppercase tracking-widest font-bold"
              >
                Lost your key?
              </AppButton>
            </div>
          )}

          {statusMessage && <p className="text-[11px] text-emerald-300">{statusMessage}</p>}
          {errorMessage && <p className="text-[11px] text-red-300">{errorMessage}</p>}

          <AppButton
            type="submit"
            disabled={isBusy}
            variant="primary"
            fullWidth
            className="py-4 sm:py-5 font-cinzel text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] rounded-2xl shadow-xl mt-4"
          >
            {isBusy
              ? 'PROCESSING...'
              : view === 'login'
                ? 'RE-ESTABLISH LINK'
                : view === 'register'
                  ? 'FORGE THE BOND'
                  : forgotStep === 'request'
                    ? 'SEND RESET LINK'
                    : 'RESET PASSWORD'}
          </AppButton>
        </form>

        {(view === 'login' || view === 'register') && (
          <div className="pt-2">
            <AppButton
              onClick={onGoogleOAuthStart}
              disabled={isBusy}
              variant="outline"
              fullWidth
              className="py-3 rounded-2xl text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase"
            >
              Continue with Google OAuth
            </AppButton>
          </div>
        )}

        <div className="text-center pt-2">
          {view !== 'forgot-password' ? (
            <AppButton
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              variant="ghost"
              className="text-[10px] text-slate-500 uppercase tracking-[0.2em] hover:text-white font-bold"
            >
              {view === 'login' ? 'New Dimension? Join Frequency' : 'Already Bonded? Access Link'}
            </AppButton>
          ) : (
            <AppButton
              onClick={() => {
                setForgotStep('request');
                setView('login');
              }}
              variant="ghost"
              className="text-[10px] text-slate-500 uppercase tracking-[0.2em] hover:text-white font-bold"
            >
              Back to Login
            </AppButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default AuthPage;
