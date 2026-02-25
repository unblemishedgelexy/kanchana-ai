import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatUsage, ChatUxHint, KanchanaMode, Message } from '../../shared/types';
import ChatHeader from '../chat/ChatHeader';
import ChatMessageFeed from '../chat/ChatMessageFeed';
import ChatComposer from '../chat/ChatComposer';
import AppButton from '../ui/AppButton';
import { getModeBackground } from '../chat/modeBackgrounds';

interface ChatPageProps {
  threads: Record<string, Message[]>;
  activeMode: KanchanaMode;
  onSend: (text: string) => void;
  isTyping: boolean;
  usage?: ChatUsage | null;
  hint?: ChatUxHint | null;
  isAuthenticated?: boolean;
  voiceDisabled?: boolean;
  voiceDisabledMessage?: string;
  onHintPrimaryAction?: (hint: ChatUxHint) => void;
  onHintDismiss?: () => void;
  userAvatarUrl?: string;
  profileSeed?: string;
  onOpenAudio?: () => void;
  onOpenProfileSettings?: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  threads,
  activeMode,
  onSend,
  isTyping,
  usage = null,
  hint = null,
  isAuthenticated = false,
  voiceDisabled = false,
  voiceDisabledMessage = '',
  onHintPrimaryAction,
  onHintDismiss,
  userAvatarUrl,
  profileSeed,
  onOpenAudio,
  onOpenProfileSettings,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialScrollDoneRef = useRef(false);
  const [showNewMessageArrow, setShowNewMessageArrow] = useState(false);
  const messages = threads[activeMode] || [];
  const backgroundUrl = useMemo(() => getModeBackground(activeMode), [activeMode]);
  const usageLabel = useMemo(() => {
    if (!usage) return '';
    const limitType = usage.limitType || (usage.isHost ? 'host' : usage.isPremium ? 'premium' : 'free');

    if (limitType === 'host') return 'Host access active';
    if (limitType === 'premium') return 'Premium access active';

    const total =
      Number.isFinite(usage.modeLimit) && usage.modeLimit
        ? usage.modeLimit
        : Number.isFinite(usage.maxFreeMessages)
          ? usage.maxFreeMessages
          : undefined;

    if (Number.isFinite(usage.remainingMessages) && Number.isFinite(total)) {
      return `${String(limitType).toUpperCase()} ${usage.messageCount}/${total} (${usage.remainingMessages} left)`;
    }
    if (Number.isFinite(total)) {
      return `${String(limitType).toUpperCase()} ${usage.messageCount}/${total}`;
    }

    return '';
  }, [usage]);

  const isNearBottom = useCallback(() => {
    const container = feedContainerRef.current;
    if (!container) return true;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    return remaining < 120;
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = feedContainerRef.current;
    if (!container) {
      scrollRef.current?.scrollIntoView({ behavior, block: 'end' });
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });

    if (behavior === 'smooth') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const nextContainer = feedContainerRef.current;
          if (!nextContainer) return;
          nextContainer.scrollTop = nextContainer.scrollHeight;
        });
      });
    }
  }, []);

  useEffect(() => {
    hasInitialScrollDoneRef.current = false;
    setShowNewMessageArrow(false);
  }, [activeMode]);

  useEffect(() => {
    if (hasInitialScrollDoneRef.current) return;
    if (messages.length === 0) return;

    let nestedFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        scrollToLatest('auto');
        hasInitialScrollDoneRef.current = true;
        setShowNewMessageArrow(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (nestedFrame) {
        window.cancelAnimationFrame(nestedFrame);
      }
    };
  }, [messages.length, scrollToLatest]);

  useEffect(() => {
    if (!hasInitialScrollDoneRef.current) return;

    if (isNearBottom()) {
      scrollToLatest(messages.length > 0 ? 'smooth' : 'auto');
      setShowNewMessageArrow(false);
      return;
    }
    setShowNewMessageArrow(true);
  }, [messages, isTyping, isNearBottom, scrollToLatest]);

  const handleFeedScroll = useCallback(() => {
    setShowNewMessageArrow(!isNearBottom());
  }, [isNearBottom]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 w-full bg-[#050107]">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${backgroundUrl}')` }}
        ></div>
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5"></div>
      </div>

      <ChatHeader
        activeMode={activeMode}
        userAvatarUrl={userAvatarUrl}
        profileSeed={profileSeed}
        onProfileClick={onOpenProfileSettings}
      />
      <ChatMessageFeed
        messages={messages}
        isTyping={isTyping}
        modeKey={activeMode}
        bottomRef={scrollRef}
        userAvatarUrl={userAvatarUrl}
        containerRef={feedContainerRef}
        onScroll={handleFeedScroll}
      />

      {(usageLabel || hint) && (
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+9.4rem)] xl:bottom-[7rem] z-[65] px-3 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-black/75 px-3 py-2.5 sm:px-4 backdrop-blur-xl">
            {usageLabel && (
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-200">{usageLabel}</p>
            )}
            {hint && (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-[11px] text-amber-200/95 leading-relaxed">{hint.message}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {onHintPrimaryAction && (
                    <AppButton
                      onClick={() => onHintPrimaryAction(hint)}
                      variant="outline"
                      className="rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.16em]"
                    >
                      {hint.ctaLabel || (hint.kind === 'upgrade' ? 'Upgrade' : hint.kind === 'login' ? 'Login' : 'Open')}
                    </AppButton>
                  )}
                  {onHintDismiss && (
                    <AppButton
                      onClick={onHintDismiss}
                      variant="ghost"
                      className="rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-slate-300"
                    >
                      Close
                    </AppButton>
                  )}
                </div>
              </div>
            )}
            {!isAuthenticated && !hint && usageLabel && (
              <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                Login to unlock voice mode.
              </p>
            )}
          </div>
        </div>
      )}

      {showNewMessageArrow && (
        <AppButton
          data-tooltip="Jump To Latest"
          aria-label="Jump To Latest"
          onClick={() => {
            scrollToLatest('smooth');
            setShowNewMessageArrow(false);
          }}
          variant="secondary"
          className="absolute right-3 sm:right-8 bottom-[calc(env(safe-area-inset-bottom)+9.75rem)] sm:bottom-[8rem] xl:bottom-24 z-[70] inline-flex w-12 h-12 items-center justify-center rounded-full border border-white/20 bg-black/80 backdrop-blur-xl text-white shadow-[0_12px_26px_rgba(6,3,16,0.7)] hover:border-white/40 hover:bg-black/90 active:scale-95"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block"
          >
            <line x1="12" y1="6.5" x2="12" y2="16.5" />
            <polyline points="8.5 13.5 12 17.5 15.5 13.5" />
          </svg>
        </AppButton>
      )}

      <ChatComposer
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
        onAudioClick={onOpenAudio}
        voiceDisabled={voiceDisabled}
        voiceDisabledMessage={voiceDisabledMessage}
      />
    </div>
  );
};

export default ChatPage;
