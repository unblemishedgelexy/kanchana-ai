import React, { useCallback, useEffect, useRef } from 'react';
import AppButton from '../ui/AppButton';
import { ChatInputBaseProps } from './types';

const ChatComposer: React.FC<ChatInputBaseProps> = ({
  value,
  onValueChange,
  onSubmit,
  onAudioClick,
  voiceDisabled = false,
  voiceDisabledMessage = '',
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncTextareaHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = '0px';
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 24;
    const verticalPadding =
      Number.parseFloat(computedStyle.paddingTop) + Number.parseFloat(computedStyle.paddingBottom);
    const maxHeight = lineHeight * 5 + verticalPadding;
    const nextHeight = Math.min(element.scrollHeight, maxHeight);

    element.style.height = `${Math.max(nextHeight, lineHeight + verticalPadding)}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    syncTextareaHeight();
  }, [value, syncTextareaHeight]);

  return (
    <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] xl:bottom-0 z-40 px-2.5 sm:px-5 lg:px-7 pb-2 sm:pb-3 xl:pb-6 pt-3 sm:pt-6 bg-gradient-to-t from-black via-black/90 to-transparent">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="max-w-5xl mx-auto glass-panel p-1.5 sm:p-3 rounded-2xl sm:rounded-[1.7rem] border border-purple-400/20 flex items-end gap-1.5 sm:gap-3 shadow-[0_12px_50px_rgba(10,5,20,0.6)] group focus-within:border-purple-400/60 transition-all"
      >
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="Whisper or ask her to 'show you' something..."
            className="w-full bg-transparent border-none outline-none px-2.5 sm:px-5 py-2.5 sm:py-3 text-[15px] sm:text-base text-white placeholder:text-slate-500 font-medium leading-[1.45] sm:leading-6 resize-none"
          />
        </div>

        <AppButton
          type="button"
          variant="ghost"
          data-tooltip="Voice Mode"
          aria-label="Voice Mode"
          disabled={voiceDisabled}
          onClick={onAudioClick}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 text-purple-300 hover:text-white hover:bg-white/10 disabled:text-slate-600 disabled:hover:bg-transparent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </AppButton>

        <AppButton
          type="submit"
          variant="primary"
          data-tooltip="Send Message"
          aria-label="Send Message"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/60 shrink-0 ring-1 ring-purple-300/40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
            <path d="M22 2 11 13" />
          </svg>
        </AppButton>
      </form>
      {voiceDisabledMessage && (
        <div className="max-w-5xl mx-auto mt-2 px-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300/90">{voiceDisabledMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ChatComposer;
