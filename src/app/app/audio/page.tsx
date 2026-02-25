'use client';

import AudioPage from '../../../components/pages/AudioPage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function AudioRouteIndexPage() {
  const runtime = useAppRuntime();
  const currentMessages = runtime.threads[runtime.activeMode] || [];

  return (
    <AudioPage
      preferences={runtime.preferences}
      activeMode={runtime.activeMode}
      onClose={() => runtime.setView('chat')}
      onSendMessage={(text, voiceDurationSeconds) =>
        runtime.handleSendMessage(text, true, voiceDurationSeconds)
      }
      latestMessages={currentMessages}
      voiceBlocked={runtime.voiceBlockedForDay}
      voiceBlockedMessage={runtime.voiceBlockedMessage}
      onVoiceBlockedAction={() => runtime.setView(runtime.isAuthenticated ? 'upgrade' : 'login')}
      voiceBlockedActionLabel={runtime.isAuthenticated ? 'Upgrade' : 'Login'}
    />
  );
}
