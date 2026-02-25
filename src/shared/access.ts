import { UserPreferences, UserTier } from './types';

const HOST_ROLE_SET = new Set(['host', 'admin', 'owner', 'superadmin']);

export const isHostUser = (preferences: UserPreferences | null | undefined): boolean => {
  if (!preferences) return false;
  if (Boolean(preferences.isHost)) return true;

  const normalizedRole = String(preferences.role || '')
    .trim()
    .toLowerCase();

  return HOST_ROLE_SET.has(normalizedRole);
};

export const hasUnlimitedAccess = (
  preferences: UserPreferences | null | undefined,
  backendPremiumFlag = false
): boolean => {
  if (!preferences) return Boolean(backendPremiumFlag);
  return (
    isHostUser(preferences) ||
    preferences.tier === UserTier.PREMIUM ||
    Boolean(backendPremiumFlag)
  );
};
