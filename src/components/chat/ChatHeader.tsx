import React from 'react';
import { ChatHeaderProps } from './types';
import AppButton from '../ui/AppButton';
import AppImage from '../ui/AppImage';

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeMode,
  userAvatarUrl,
  profileSeed = 'kanchana-user',
  onProfileClick,
}) => (
  <header className="sticky top-0 shrink-0 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/5 bg-transparent z-50">
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-purple-500/20 shadow-lg shadow-purple-900/40 animate-glow shrink-0">
        <AppImage
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100"
          width={100}
          height={100}
          className="w-full h-full object-cover"
          alt="kanchana-avatar"
        />
      </div>
      <div className="min-w-0">
        <h2 className="font-cinzel text-xs sm:text-sm text-white tracking-[0.2em] sm:tracking-widest uppercase truncate">
          {activeMode} Mode
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[9px] sm:text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] sm:tracking-widest truncate">
            Kanchana Frequency
          </span>
        </div>
      </div>
    </div>

    <AppButton
      data-tooltip="Profile Settings"
      aria-label="Profile Settings"
      onClick={onProfileClick}
      variant="ghost"
      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0 overflow-hidden border border-white/15 bg-white/5 hover:bg-white/10 shrink-0"
    >
      <AppImage
        src={userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileSeed)}`}
        width={88}
        height={88}
        className="w-full h-full object-cover"
        alt="user-profile-avatar"
      />
    </AppButton>
  </header>
);

export default ChatHeader;
