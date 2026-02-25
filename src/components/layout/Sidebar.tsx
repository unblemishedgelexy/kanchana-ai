import React from 'react';
import { AppView, KanchanaMode } from '../../shared/types';
import { ICONS } from '../../shared/constants';
import AppButton from '../ui/AppButton';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView, modeOverride?: KanchanaMode) => void;
  activeMode: KanchanaMode;
  setActiveMode: (mode: KanchanaMode) => Promise<void> | void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  activeMode,
  setActiveMode,
}) => {
  const modes = [
    { id: KanchanaMode.LOVELY, icon: <ICONS.Heart /> },
    { id: KanchanaMode.SHAYARI, icon: <ICONS.Feather /> },
    { id: KanchanaMode.CHILL, icon: <ICONS.Coffee /> },
    { id: KanchanaMode.NAUGHTY, icon: <ICONS.Flame /> },
    { id: KanchanaMode.POSSESSIVE, icon: <ICONS.Lock /> },
    { id: KanchanaMode.HORROR, icon: <ICONS.Ghost /> },
    { id: KanchanaMode.MYSTIC, icon: <ICONS.Sparkles /> },
  ];

  return (
    <aside className="relative hidden xl:flex sticky top-0 h-screen w-24 shrink-0 flex-col items-center py-6 gap-6 bg-black/55 border-r border-white/10 backdrop-blur-3xl">
      <AppButton
        data-tooltip="Home"
        aria-label="Home"
        onClick={() => setView('home')}
        variant="primary"
        className="w-12 h-12 rounded-2xl flex items-center justify-center font-cinzel text-2xl text-white shadow-2xl shadow-purple-900/50 hover:scale-105"
      >
        K
      </AppButton>

      <div className="flex-1 min-h-0 w-full px-2 overflow-y-auto overflow-x-visible custom-scrollbar">
        <div className="flex flex-col gap-3 items-center">
          {modes.map((mode) => {
            const isActive = activeMode === mode.id && (currentView === 'chat' || currentView === 'audio');
            return (
              <AppButton
                key={mode.id}
                data-tooltip={mode.id}
                aria-label={mode.id}
                onClick={() => {
                  void setActiveMode(mode.id);
                  setView('chat', mode.id);
                }}
                variant="ghost"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-300/30'
                    : 'text-slate-500 hover:text-purple-300 hover:bg-white/5'
                }`}
              >
                {mode.icon}
              </AppButton>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AppButton
          data-tooltip="Gallery"
          aria-label="Gallery"
          onClick={() => setView('gallery')}
          variant="ghost"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group ${
            currentView === 'gallery' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </AppButton>
        <AppButton
          data-tooltip="Cards"
          aria-label="Cards"
          onClick={() => setView('cards')}
          variant="ghost"
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group ${
            currentView === 'cards' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </AppButton>
      </div>
    </aside>
  );
};

export default Sidebar;
