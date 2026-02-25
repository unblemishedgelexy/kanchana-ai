import React from 'react';
import { AppView } from '../../shared/types';
import { ICONS } from '../../shared/constants';
import AppButton from '../ui/AppButton';
import AppImage from '../ui/AppImage';

interface BottomNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  userAvatarUrl?: string;
  profileSeed?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setView,
  userAvatarUrl,
  profileSeed = 'kanchana-user',
}) => {
  return (
    <nav className="xl:hidden fixed inset-x-0 bottom-0 z-50 flex h-[76px] items-center justify-around border-t border-white/5 bg-black/85 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-2xl">
      <AppButton
        data-tooltip="Chat"
        aria-label="Chat"
        onClick={() => setView('chat')}
        variant="ghost"
        className={`flex flex-col items-center gap-1 ${currentView === 'chat' || currentView === 'home' ? 'text-purple-400' : 'text-slate-600'}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-[7px] font-bold uppercase tracking-widest">Chat</span>
      </AppButton>

      <AppButton
        data-tooltip="Gallery"
        aria-label="Gallery"
        onClick={() => setView('gallery')}
        variant="ghost"
        className={`flex flex-col items-center gap-1 ${currentView === 'gallery' ? 'text-purple-400' : 'text-slate-600'}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-[7px] font-bold uppercase tracking-widest">Vision</span>
      </AppButton>

      <AppButton
        data-tooltip="Voice Mode"
        aria-label="Voice Mode"
        onClick={() => setView('audio')}
        variant="primary"
        className={`h-14 w-14 -mt-8 flex items-center justify-center rounded-full border-4 border-black text-white shadow-2xl shadow-purple-900 ${currentView === 'audio' ? 'scale-110' : ''}`}
      >
        <ICONS.Mic />
      </AppButton>

      <AppButton
        data-tooltip="Cards"
        aria-label="Cards"
        onClick={() => setView('cards')}
        variant="ghost"
        className={`flex flex-col items-center gap-1 ${currentView === 'cards' ? 'text-purple-400' : 'text-slate-600'}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <span className="text-[7px] font-bold uppercase tracking-widest">Raaz</span>
      </AppButton>

      <AppButton
        data-tooltip="Profile"
        aria-label="Profile"
        onClick={() => setView('settings')}
        variant="ghost"
        className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-purple-400' : 'text-slate-600'}`}
      >
        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
          <AppImage
            src={userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileSeed)}`}
            alt="profile-avatar"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[7px] font-bold uppercase tracking-widest">Profile</span>
      </AppButton>
    </nav>
  );
};

export default BottomNav;
