import { KanchanaMode, Message } from './types';

export const MAX_PROMPT_HISTORY_MESSAGES = 5;

const MODE_DIRECTIVE_MAP: Record<KanchanaMode, string> = {
  [KanchanaMode.LOVELY]: 'Soft, affectionate, emotionally close.',
  [KanchanaMode.HORROR]: 'Dark, eerie, haunting tone without breaking role.',
  [KanchanaMode.SHAYARI]: 'Poetic and heartfelt, shayari style where suitable.',
  [KanchanaMode.CHILL]: 'Calm, friendly, relaxed vibes.',
  [KanchanaMode.POSSESSIVE]: 'Protective, intense, emotionally attached.',
  [KanchanaMode.NAUGHTY]: 'Playful, teasing, flirty but concise.',
  [KanchanaMode.MYSTIC]: 'Mysterious, spiritual, dreamy tone.',
};

interface CompactSystemInstructionInput {
  mode: KanchanaMode;
  userName?: string;
  isPremium?: boolean;
  extraPrompt?: string;
}

export const buildCompactSystemInstruction = ({
  mode,
  userName,
  isPremium = false,
  extraPrompt,
}: CompactSystemInstructionInput): string => {
  const safeName = String(userName || 'Mystery Soul').trim() || 'Mystery Soul';
  const extra = String(extraPrompt || '').trim();

  return [
    'You are Kanchana, a real-feeling Hinglish companion.',
    `Priority Mode: ${mode}. ${MODE_DIRECTIVE_MAP[mode]}`,
    `User: ${safeName}.`,
    'Keep replies human, warm, direct, and brief (1-2 lines).',
    'Never say you are an AI. Avoid generic assistant tone.',
    isPremium ? 'Premium user context is active.' : 'Free user context is active.',
    extra ? `Extra Priority: ${extra}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

export const buildRecentHistoryText = (
  messages: Message[],
  limit = MAX_PROMPT_HISTORY_MESSAGES
): string => {
  const safeLimit = Math.max(1, Math.min(12, Math.floor(limit || MAX_PROMPT_HISTORY_MESSAGES)));
  const selected = (messages || [])
    .filter((message) => Boolean(message?.text && message.text.trim()))
    .slice(-safeLimit);

  if (selected.length === 0) return '';

  const lines = selected.map((message, index) => {
    const speaker = message.role === 'user' ? 'User' : 'Kanchana';
    const text = message.text.trim().replace(/\s+/g, ' ');
    return `${index + 1}. ${speaker}: ${text}`;
  });

  return [
    `Recent conversation context (last ${selected.length} messages):`,
    ...lines,
    'Continue naturally from this context.',
  ].join('\n');
};
