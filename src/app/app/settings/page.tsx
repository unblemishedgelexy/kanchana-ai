'use client';

import SettingsPage from '../../../components/pages/SettingsPage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function SettingsRoutePage() {
  const runtime = useAppRuntime();

  return (
    <SettingsPage
      preferences={runtime.preferences}
      activeMode={runtime.activeMode}
      setView={runtime.setView}
      onSaveName={runtime.handleSaveName}
      onLogout={runtime.handleLogout}
      onClearHistory={runtime.handleClearCurrentHistory}
      onUploadProfileImage={runtime.handleProfileImageUpload}
    />
  );
}
