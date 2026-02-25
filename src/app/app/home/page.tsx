'use client';

import LandingPage from '../../../components/pages/LandingPage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function HomePage() {
  const runtime = useAppRuntime();
  const profileSeed =
    runtime.preferences.email ||
    runtime.preferences.name ||
    runtime.preferences.id ||
    'kanchana-user';

  return (
    <LandingPage
      onEnter={() => runtime.setView('chat')}
      onOpenSettings={() => runtime.setView('settings')}
      isInside={true}
      profileImageUrl={runtime.preferences.profileImageUrl}
      profileSeed={profileSeed}
    />
  );
}
