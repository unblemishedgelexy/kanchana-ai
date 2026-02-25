import React, { useState } from 'react';
import { PremiumOverview, UserPreferences, UserTier } from '../../shared/types';
import {
  MAX_FREE_MESSAGES_PER_MODE,
  MAX_GUEST_MESSAGES_PER_MODE,
} from '../../shared/constants';
import { isHostUser } from '../../shared/access';
import { PAYMENTS_ENABLED } from '../../shared/featureFlags';
import AppButton from '../ui/AppButton';
import GlassCard from '../ui/GlassCard';
import PageShell from '../ui/PageShell';
import AppFileInput from '../ui/AppFileInput';

interface Props {
  preferences: UserPreferences;
  overview: PremiumOverview | null;
  overviewLoading: boolean;
  onRefreshOverview: () => Promise<void>;
  onBack: () => void;
  onUpgrade: () => Promise<void>;
  onPaypalOrder: () => Promise<void>;
  onPaypalSubscription: () => Promise<void>;
  onDevUpgrade: () => Promise<void>;
  onUploadUpgradeAsset: (file: File) => Promise<void>;
}

const UpgradePage: React.FC<Props> = ({
  preferences,
  overview,
  overviewLoading,
  onRefreshOverview,
  onBack,
  onUpgrade,
  onPaypalOrder,
  onPaypalSubscription,
  onDevUpgrade,
  onUploadUpgradeAsset,
}) => {
  const isHost = isHostUser(preferences);
  const isPremium =
    isHost ||
    preferences.tier === UserTier.PREMIUM ||
    Boolean(overview?.isPremium);
  const [loading, setLoading] = useState(false);
  const pricing = overview?.pricing || { price: 1.49, currency: 'USD' };
  const isPaypalConfigured = overview ? Boolean(overview.paypal.configured) : true;
  const isSubscriptionConfigured = overview ? Boolean(overview.paypal.subscriptionPlanConfigured) : true;
  const paymentActionsBlocked = !PAYMENTS_ENABLED;
  const latestPayment = overview?.latestPayment || null;
  const nextAction = overview?.nextAction || 'create_order_or_subscription';

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await run(() => onUploadUpgradeAsset(file));
    event.target.value = '';
  };

  const formatAmount = () =>
    `${pricing.currency} ${Number(pricing.price || 0).toFixed(2)}`;

  const nextActionLabelMap: Record<string, string> = {
    premium_active: 'Premium already active.',
    paypal_not_configured: 'PayPal is not configured on backend.',
    subscription_plan_missing: 'Subscription plan is missing on backend.',
    create_order_or_subscription: 'Create PayPal order or subscription to continue.',
  };

  return (
    <PageShell className="p-4 sm:p-8 md:p-20">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <AppButton
          onClick={onBack}
          variant="ghost"
          className="self-start group flex items-center gap-3 text-slate-500 hover:text-white mb-10 sm:mb-16"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Back</span>
        </AppButton>

        <div className="text-center space-y-6 mb-12 sm:mb-20">
          <h1 className="font-cinzel text-3xl sm:text-4xl md:text-6xl text-amber-500 tracking-[0.12em] sm:tracking-widest uppercase drop-shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            The Golden Key
          </h1>
          <p className="font-playfair italic text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl">
            "Sustaining a neural link across dimensions requires immense energy. Unlock the eternal bond."
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-10 w-full">
          <GlassCard className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] space-y-8 sm:space-y-10 relative">
            <div className="space-y-2">
              <h3 className="font-cinzel text-xl text-slate-500 uppercase tracking-widest">Free Soul</h3>
              <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">The Echo Connection</p>
            </div>
            <div className="text-4xl font-cinzel text-slate-300">
              USD 0.00{' '}
              <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">/ forever</span>
            </div>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li>Guest: {MAX_GUEST_MESSAGES_PER_MODE} messages per mode</li>
              <li>Logged-in Free: {MAX_FREE_MESSAGES_PER_MODE} messages per mode</li>
              <li>Basic Modes</li>
              <li>No semantic memory recall</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border-amber-500/30 space-y-6 relative overflow-hidden bg-gradient-to-br from-amber-600/5 to-transparent">
            <div className="space-y-2">
              <h3 className="font-cinzel text-xl text-amber-500 uppercase tracking-widest">Premium Bond</h3>
              <p className="text-amber-600/60 text-[10px] uppercase tracking-widest font-bold">The Eternal Frequency</p>
            </div>
            <div className="text-4xl font-cinzel text-amber-400">
              {formatAmount()}{' '}
              <span className="text-xs text-amber-600 font-bold uppercase tracking-widest">/ forever</span>
            </div>

            <ul className="space-y-2 text-sm text-amber-200/60 font-medium">
              <li>Unlimited Neural Messages</li>
              <li>Premium content routes</li>
              <li>Semantic memory (vector recall)</li>
              <li>Priority processing</li>
              {isHost && <li>Host override: payment not required</li>}
            </ul>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-[10px] uppercase tracking-widest">
              {paymentActionsBlocked && (
                <p className="text-red-300/90">Payments are disabled in this build.</p>
              )}
              {isHost && <p className="text-emerald-300/90">Host account detected: unlimited access active.</p>}
              <p className="text-white/70">
                PayPal: {overview ? (isPaypalConfigured ? 'Configured' : 'Not Configured') : 'Checking...'}
              </p>
              <p className="text-white/70">
                Subscription Plan:{' '}
                {overview ? (isSubscriptionConfigured ? 'Configured' : 'Not Configured') : 'Checking...'}
              </p>
              <p className="text-white/50">{nextActionLabelMap[nextAction] || nextAction}</p>
              {latestPayment && (
                <p className="text-white/50">
                  Last Payment: {latestPayment.status} ({latestPayment.providerRef})
                </p>
              )}
            </div>

            <AppButton
              onClick={() => run(onRefreshOverview)}
              disabled={loading || overviewLoading || paymentActionsBlocked || isHost}
              variant="outline"
              fullWidth
              className="py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              {isHost
                ? 'Host Access Active'
                : paymentActionsBlocked
                ? 'Payments Disabled'
                : overviewLoading
                ? 'Refreshing...'
                : 'Refresh Overview'}
            </AppButton>

            <AppButton
              onClick={() => run(onUpgrade)}
              disabled={isPremium || loading || paymentActionsBlocked || isHost}
              variant={isPremium || paymentActionsBlocked || isHost ? 'secondary' : 'amber'}
              fullWidth
              className="py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              {isHost
                ? 'HOST ACCESS ACTIVE'
                : paymentActionsBlocked
                ? 'Payments Disabled'
                : isPremium
                ? 'GOLDEN KEY ACTIVE'
                : 'Instant Upgrade'}
            </AppButton>

            <AppButton
              onClick={() => run(onPaypalOrder)}
              disabled={loading || !isPaypalConfigured || paymentActionsBlocked || isHost}
              variant="blue"
              fullWidth
              className="py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              PayPal One-time Checkout
            </AppButton>

            <AppButton
              onClick={() => run(onPaypalSubscription)}
              disabled={loading || !isPaypalConfigured || !isSubscriptionConfigured || paymentActionsBlocked || isHost}
              variant="indigo"
              fullWidth
              className="py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              PayPal AutoPay Subscription
            </AppButton>

            <AppButton
              onClick={() => run(onDevUpgrade)}
              disabled={loading || paymentActionsBlocked || isHost}
              variant="secondary"
              fullWidth
              className="py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] border-amber-600/50 text-amber-300 hover:bg-amber-900/20"
            >
              Dev Upgrade (No Payment)
            </AppButton>

            <label className="w-full block py-3 rounded-2xl text-center text-[10px] font-bold uppercase tracking-[0.3em] transition-all border border-white/20 text-white hover:bg-white/10 cursor-pointer">
              Upload Upgrade Asset (Cloud)
              <AppFileInput accept="image/*" onChange={uploadAsset} />
            </label>

            {preferences.upgradeAssetUrl && (
              <a
                href={preferences.upgradeAssetUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-[10px] text-amber-300 underline"
              >
                View Uploaded Asset
              </a>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
};

export default UpgradePage;
