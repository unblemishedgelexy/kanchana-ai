const parseBooleanEnv = (value: unknown, fallback: boolean): boolean => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) return fallback;
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const PAYMENTS_ENABLED = parseBooleanEnv(process.env.NEXT_PUBLIC_PAYMENTS_ENABLED, false);
export const FRONTEND_GEMINI_ENABLED = parseBooleanEnv(
  process.env.NEXT_PUBLIC_FRONTEND_GEMINI_ENABLED,
  false
);
export const FRONTEND_GEMINI_LIVE_ENABLED = parseBooleanEnv(
  process.env.NEXT_PUBLIC_GEMINI_LIVE_ENABLED,
  false
);
