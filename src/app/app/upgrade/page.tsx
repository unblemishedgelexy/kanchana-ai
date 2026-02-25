'use client';

import UpgradePage from '../../../components/pages/UpgradePage';
import { useAppRuntime } from '../../providers/AppRuntimeProvider';

export default function UpgradeRoutePage() {
  const runtime = useAppRuntime();

  return (
    <UpgradePage
      preferences={runtime.preferences}
      overview={runtime.premiumOverview}
      overviewLoading={runtime.premiumOverviewLoading}
      onRefreshOverview={() => runtime.refreshPremiumOverview(false)}
      onBack={() => runtime.setView('settings')}
      onUpgrade={runtime.handlePremiumUpgrade}
      onPaypalOrder={runtime.handlePaypalOrder}
      onPaypalSubscription={runtime.handlePaypalSubscription}
      onDevUpgrade={runtime.handleDevUpgrade}
      onUploadUpgradeAsset={runtime.handleUpgradeAssetUpload}
    />
  );
}
