import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ChatEmptyState from './ChatEmptyState';
import ChatMessageBubble from './ChatMessageBubble';
import ChatTypingIndicator from './ChatTypingIndicator';
import { ChatMessageFeedProps } from './types';
import AppButton from '../ui/AppButton';

const INITIAL_BATCH_SIZE = 24;
const LOAD_MORE_BATCH_SIZE = 20;

const ChatMessageFeed: React.FC<ChatMessageFeedProps> = ({
  messages,
  isTyping,
  modeKey,
  bottomRef,
  userAvatarUrl,
  containerRef,
  onScroll,
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const loadAnchorRef = useRef<HTMLDivElement>(null);
  const pendingPrependRef = useRef(false);
  const previousScrollHeightRef = useRef(0);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [modeKey]);

  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) return messages;
    return messages.slice(messages.length - visibleCount);
  }, [messages, visibleCount]);

  const hasOlderMessages = visibleMessages.length < messages.length;

  const loadOlderMessages = useCallback(() => {
    if (!hasOlderMessages) return;

    const scrollContainer = containerRef?.current;
    if (scrollContainer) {
      previousScrollHeightRef.current = scrollContainer.scrollHeight;
      pendingPrependRef.current = true;
    }

    setVisibleCount((previous) =>
      Math.min(messages.length, previous + LOAD_MORE_BATCH_SIZE)
    );
  }, [containerRef, hasOlderMessages, messages.length]);

  useLayoutEffect(() => {
    if (!pendingPrependRef.current) return;

    const scrollContainer = containerRef?.current;
    if (!scrollContainer) {
      pendingPrependRef.current = false;
      return;
    }

    const heightDelta = scrollContainer.scrollHeight - previousScrollHeightRef.current;
    scrollContainer.scrollTop += heightDelta;
    pendingPrependRef.current = false;
  }, [visibleMessages.length, containerRef]);

  useEffect(() => {
    const scrollContainer = containerRef?.current;
    const sentinel = loadAnchorRef.current;

    if (!scrollContainer || !sentinel || !hasOlderMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadOlderMessages();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '160px 0px 0px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [containerRef, hasOlderMessages, loadOlderMessages]);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(env(safe-area-inset-bottom)+9.75rem)] xl:pb-40 space-y-6 sm:space-y-10 custom-scrollbar"
    >
      {hasOlderMessages && (
        <div ref={loadAnchorRef} className="pt-1 pb-2 flex justify-center">
          <AppButton
            onClick={loadOlderMessages}
            variant="secondary"
            className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] border border-white/10 backdrop-blur-md"
          >
            Load Older Messages
          </AppButton>
        </div>
      )}

      {messages.length === 0 && <ChatEmptyState />}

      {visibleMessages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} userAvatarUrl={userAvatarUrl} />
      ))}

      {isTyping && <ChatTypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessageFeed;
