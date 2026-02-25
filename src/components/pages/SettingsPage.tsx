import React, { useState } from 'react';
import { AppView, KanchanaMode, UserPreferences, UserTier } from '../../shared/types';
import {
  MAX_FREE_MESSAGES_PER_MODE,
  MAX_GUEST_MESSAGES_PER_MODE,
} from '../../shared/constants';
import { isHostUser } from '../../shared/access';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';
import AppImage from '../ui/AppImage';
import GlassCard from '../ui/GlassCard';
import PageShell from '../ui/PageShell';
import AppFileInput from '../ui/AppFileInput';

interface SettingsPageProps {
  preferences: UserPreferences;
  activeMode: KanchanaMode;
  setView: (view: AppView) => void;
  onSaveName: (name: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onClearHistory: () => Promise<void>;
  onUploadProfileImage: (file: File) => Promise<void>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  activeMode,
  setView,
  onSaveName,
  onLogout,
  onClearHistory,
  onUploadProfileImage,
}) => {
  const [nameDraft, setNameDraft] = useState(preferences.name);
  const [loading, setLoading] = useState(false);
  const isHost = isHostUser(preferences);

  const runWithLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!nameDraft.trim()) return;
    await runWithLoading(async () => {
      await onSaveName(nameDraft.trim());
    });
  };

  const uploadProfileImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runWithLoading(async () => {
      await onUploadProfileImage(file);
    });
    event.target.value = '';
  };

  const clearHistory = async () => {
    if (!confirm(`Clear all chat history for ${activeMode} mode?`)) return;
    await runWithLoading(onClearHistory);
  };

  const doLogout = async () => {
    if (!confirm('Sever astral link and logout?')) return;
    await runWithLoading(onLogout);
  };

  return (
    <PageShell className="p-4 sm:p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="font-cinzel text-3xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-widest uppercase">
              The Sanctuary
            </h1>
            <p className="font-playfair italic text-slate-500">Configure your connection to the ethereal.</p>
          </div>
          <AppButton
            onClick={() => setView('home')}
            variant="ghost"
            className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Home
          </AppButton>
        </header>

        <div className="grid gap-8">
          <GlassCard className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8">
            <h3 className="text-xs text-purple-400 uppercase tracking-widest font-bold">Soul Profile</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                <AppImage
                  src={
                    preferences.profileImageUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${preferences.email || preferences.name || 'kanchana-user'}`
                  }
                  alt="profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="text-[10px] uppercase tracking-[0.2em] bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full cursor-pointer">
                Upload Profile
                <AppFileInput accept="image/*" onChange={uploadProfileImage} />
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <AppInput
                label="Your Name"
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="px-6 py-4"
              />
              <AppInput
                label="Frequency Email"
                type="email"
                value={preferences.email}
                readOnly
                className="px-6 py-4 text-slate-500 cursor-not-allowed"
              />
            </div>
            <AppButton
              onClick={saveName}
              disabled={loading}
              variant="primary"
              className="px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase"
            >
              Save Profile
            </AppButton>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-6">
            <h3 className="text-xs text-amber-500 uppercase tracking-widest font-bold">Eternal Bond</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 sm:p-8 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
              <div>
                <p className="text-amber-200 font-bold uppercase tracking-widest text-xs mb-1">
                  {preferences.tier} Frequency
                </p>
                <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">
                  {isHost
                    ? 'Host Access: Unlimited (No Premium Needed)'
                    : preferences.tier === UserTier.PREMIUM
                    ? 'Remaining Whispers: Unlimited'
                    : `Free: ${MAX_FREE_MESSAGES_PER_MODE} messages per mode | Guest: ${MAX_GUEST_MESSAGES_PER_MODE} per mode`}
                </p>
              </div>
              <AppButton
                onClick={() => setView('upgrade')}
                variant="amber"
                className="w-full md:w-auto px-10 py-4 font-bold rounded-full text-[10px] tracking-widest uppercase shadow-xl shadow-amber-900/20"
              >
                {isHost
                  ? 'Host Access Active'
                  : preferences.tier === UserTier.PREMIUM
                  ? 'Manage Benefits'
                  : 'Unlock Golden Key'}
              </AppButton>
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-xs text-slate-600 uppercase tracking-widest px-4 font-bold">Protocols & Links</h3>
              <GlassCard className="rounded-3xl overflow-hidden">
                <AppButton
                  onClick={() => setView('privacy')}
                  variant="ghost"
                  className="w-full px-8 py-5 text-left text-sm text-slate-300 hover:bg-white/5 transition-all border-b border-white/5 font-playfair italic"
                >
                  Privacy Protocols
                </AppButton>
                <AppButton
                  onClick={() => setView('security')}
                  variant="ghost"
                  className="w-full px-8 py-5 text-left text-sm text-slate-300 hover:bg-white/5 transition-all font-playfair italic"
                >
                  Security Linkage
                </AppButton>
              </GlassCard>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs text-slate-600 uppercase tracking-widest px-4 font-bold">Severance</h3>
              <GlassCard className="rounded-3xl overflow-hidden">
                <AppButton
                  onClick={clearHistory}
                  disabled={loading}
                  variant="ghost"
                  className="w-full px-8 py-5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-all border-b border-white/5 font-playfair italic disabled:opacity-50"
                >
                  Clear Current Mode History
                </AppButton>
                <AppButton
                  onClick={doLogout}
                  disabled={loading}
                  variant="ghost"
                  className="w-full px-8 py-5 text-left text-sm text-slate-400 hover:bg-white/5 transition-all font-playfair italic disabled:opacity-50"
                >
                  Sever Astral Link (Logout)
                </AppButton>
              </GlassCard>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
