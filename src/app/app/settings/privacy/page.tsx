'use client';

import PrivacySecurityPage from '../../../../components/pages/PrivacySecurityPage';
import { useAppRuntime } from '../../../providers/AppRuntimeProvider';

export default function PrivacyRoutePage() {
  const runtime = useAppRuntime();
  return <PrivacySecurityPage type="privacy" onBack={() => runtime.setView('settings')} />;
}
