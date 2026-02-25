'use client';

import PrivacySecurityPage from '../../../../components/pages/PrivacySecurityPage';
import { useAppRuntime } from '../../../providers/AppRuntimeProvider';

export default function SecurityRoutePage() {
  const runtime = useAppRuntime();
  return <PrivacySecurityPage type="security" onBack={() => runtime.setView('settings')} />;
}
