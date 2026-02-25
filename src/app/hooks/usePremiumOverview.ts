import { useCallback, useEffect, useState } from 'react';
import { AppView, PremiumOverview, UserTier } from '../../shared/types';
import { api } from '../../services/api';
import { PAYMENTS_ENABLED } from '../../shared/featureFlags';

interface UsePremiumOverviewArgs {
  token: string;
  isAuthenticated: boolean;
  tier: UserTier;
  isHost: boolean;
  view: AppView;
  onError: (message: string) => void;
}

export const usePremiumOverview = ({
  token,
  isAuthenticated,
  tier,
  isHost,
  view,
  onError,
}: UsePremiumOverviewArgs) => {
  const [premiumOverview, setPremiumOverview] = useState<PremiumOverview | null>(null);
  const [premiumOverviewLoading, setPremiumOverviewLoading] = useState(false);

  const refreshPremiumOverview = useCallback(
    async (silent = false) => {
      if (!PAYMENTS_ENABLED) {
        setPremiumOverview(null);
        setPremiumOverviewLoading(false);
        return;
      }

      if (!token || !isAuthenticated) {
        setPremiumOverview(null);
        return;
      }
      if (isHost) {
        setPremiumOverview(null);
        setPremiumOverviewLoading(false);
        return;
      }

      setPremiumOverviewLoading(true);
      try {
        const overview = await api.getPremiumOverview(token);
        setPremiumOverview(overview);
      } catch (error) {
        setPremiumOverview(null);
        if (!silent) {
          onError(error instanceof Error ? error.message : 'Failed to fetch premium overview.');
        }
      } finally {
        setPremiumOverviewLoading(false);
      }
    },
    [token, isAuthenticated, isHost, onError]
  );

  useEffect(() => {
    if (!PAYMENTS_ENABLED) {
      setPremiumOverview(null);
      return;
    }

    if (!token || !isAuthenticated) {
      setPremiumOverview(null);
      return;
    }
    if (isHost) {
      setPremiumOverview(null);
      return;
    }

    refreshPremiumOverview(true);
  }, [token, isAuthenticated, tier, isHost, refreshPremiumOverview]);

  useEffect(() => {
    if (!PAYMENTS_ENABLED) return;
    if (isHost) return;
    if (view !== 'upgrade') return;
    refreshPremiumOverview(true);
  }, [view, isHost, refreshPremiumOverview]);

  const clearPremiumState = () => {
    setPremiumOverview(null);
    setPremiumOverviewLoading(false);
  };

  return {
    premiumOverview,
    premiumOverviewLoading,
    refreshPremiumOverview,
    clearPremiumState,
  };
};
