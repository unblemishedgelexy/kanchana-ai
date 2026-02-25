'use client';

import dynamic from 'next/dynamic';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

const ChatPage = dynamic(() => import('../../../components/pages/ChatPage'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center text-xs uppercase tracking-[0.22em] text-slate-400">
      Loading Chat...
    </div>
  ),
});

export default function ChatRouteIndexPage() {
  const runtime = useAppRuntime();
  const profileSeed =
    runtime.preferences.email ||
    runtime.preferences.name ||
    runtime.preferences.id ||
    'kanchana-user';
  const voiceDisabled = !runtime.isAuthenticated || runtime.voiceBlockedForDay;
  const voiceDisabledMessage = !runtime.isAuthenticated
    ? 'Login required for voice'
    : runtime.voiceBlockedForDay
      ? runtime.voiceBlockedMessage || 'Daily voice limit reached'
      : '';

  return (
    <ChatPage
      threads={runtime.threads}
      activeMode={runtime.activeMode}
      onSend={(text) => {
        void runtime.handleSendMessage(text, false);
      }}
      isTyping={runtime.isTyping}
      usage={runtime.activeUsage}
      hint={runtime.chatHint}
      isAuthenticated={runtime.isAuthenticated}
      voiceDisabled={voiceDisabled}
      voiceDisabledMessage={voiceDisabledMessage}
      onHintPrimaryAction={(hint) => {
        if (hint.kind === 'login') {
          runtime.setView('login');
          return;
        }
        if (hint.kind === 'upgrade') {
          runtime.setView(runtime.isAuthenticated ? 'upgrade' : 'login');
          return;
        }
        runtime.setView(runtime.isAuthenticated ? 'upgrade' : 'login');
      }}
      onHintDismiss={runtime.clearChatHint}
      userAvatarUrl={runtime.preferences.profileImageUrl}
      profileSeed={profileSeed}
      onOpenAudio={() => runtime.setView(runtime.isAuthenticated ? 'audio' : 'login')}
      onOpenProfileSettings={() => runtime.setView(runtime.isAuthenticated ? 'settings' : 'login')}
    />
  );
}
