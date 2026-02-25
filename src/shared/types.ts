
export enum KanchanaMode {
  LOVELY = 'Lovely',
  HORROR = 'Horror',
  SHAYARI = 'Shayari',
  CHILL = 'Chill',
  POSSESSIVE = 'Possessive',
  NAUGHTY = 'Naughty',
  MYSTIC = 'Mystic'
}

export enum UserTier {
  FREE = 'Free',
  PREMIUM = 'Premium'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'kanchana';
  text: string;
  imageUrl?: string;
  groundingSources?: GroundingSource[];
  timestamp: number;
}

export interface UserPreferences {
  id?: string;
  name: string;
  email: string;
  tier: UserTier;
  role?: string;
  isHost?: boolean;
  mode?: KanchanaMode;
  messageCount: number;
  profileImageUrl?: string;
  upgradeAssetUrl?: string;
  isAuthenticated: boolean;
}

export type AppView = 'landing' | 'login' | 'register' | 'forgot-password' | 'home' | 'chat' | 'audio' | 'settings' | 'privacy' | 'security' | 'upgrade' | 'gallery' | 'cards';

export interface AuthPayload {
  token: string;
  user: UserPreferences;
}

export type ChatLimitType = 'guest' | 'free' | 'premium' | 'host';

export interface ChatUsage {
  messageCount: number;
  maxFreeMessages: number;
  modeLimit?: number;
  isPremium: boolean;
  isHost?: boolean;
  limitType?: ChatLimitType;
  remainingMessages?: number;
}

export type BackendErrorCode =
  | 'VOICE_LOGIN_REQUIRED'
  | 'MODE_LIMIT_REACHED'
  | 'DAILY_VOICE_LIMIT_REACHED';

export interface ChatUxHint {
  kind: 'login' | 'upgrade' | 'voice';
  code: BackendErrorCode;
  message: string;
  ctaLabel?: string;
}

export interface PremiumPaymentSummary {
  id: string;
  provider: string;
  flow: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PremiumOverview {
  isPremium: boolean;
  tier: UserTier | 'Free' | 'Premium';
  pricing: {
    price: number;
    currency: string;
  };
  paypal: {
    configured: boolean;
    subscriptionPlanConfigured: boolean;
    mode: 'ready' | 'disabled';
  };
  latestPayment: PremiumPaymentSummary | null;
  nextAction:
    | 'premium_active'
    | 'paypal_not_configured'
    | 'subscription_plan_missing'
    | 'create_order_or_subscription';
}
