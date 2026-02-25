import { KanchanaMode, Message } from '../shared/types';
import {
  buildCompactSystemInstruction,
  buildRecentHistoryText,
  MAX_PROMPT_HISTORY_MESSAGES,
} from '../shared/prompting';

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role?: string;
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

interface FrontendGeminiRequest {
  mode: KanchanaMode;
  userName: string;
  isPremium: boolean;
  history: Message[];
}

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

const normalizeModelName = (value: string, fallback = DEFAULT_GEMINI_TEXT_MODEL): string => {
  const normalized = String(value || '')
    .trim()
    .replace(/^models\//i, '');
  return normalized || fallback;
};

const FRONTEND_GEMINI_API_KEY = String(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();
const FRONTEND_GEMINI_MODEL = normalizeModelName(
  String(process.env.NEXT_PUBLIC_GEMINI_MODEL || DEFAULT_GEMINI_TEXT_MODEL)
);
const FRONTEND_GEMINI_FALLBACK_MODEL = normalizeModelName(
  String(process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_TEXT_MODEL)
);

let didWarnNativeAudioFallback = false;

const supportsGenerateContent = (model: string) => !/native-audio-preview/i.test(model);

const getEffectivePrimaryModel = (): string => {
  if (supportsGenerateContent(FRONTEND_GEMINI_MODEL)) return FRONTEND_GEMINI_MODEL;

  if (!didWarnNativeAudioFallback) {
    didWarnNativeAudioFallback = true;
    console.warn(
      `[Gemini] "${FRONTEND_GEMINI_MODEL}" is optimized for Live API/audio. Falling back to "${FRONTEND_GEMINI_FALLBACK_MODEL}" for generateContent.`
    );
  }

  return FRONTEND_GEMINI_FALLBACK_MODEL;
};

export const isFrontendGeminiConfigured = () => Boolean(FRONTEND_GEMINI_API_KEY);

const extractTextResponse = (payload: GeminiGenerateContentResponse): string => {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => String(part?.text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
  return text || '';
};

const toErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error || ''));

const isModelCompatibilityError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('not supported for generatecontent') ||
    normalized.includes('is not found for api version') ||
    normalized.includes('not found') ||
    normalized.includes('404')
  );
};

const requestGenerateContent = async (
  model: string,
  body: {
    systemInstruction: { parts: Array<{ text: string }> };
    contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    generationConfig: { temperature: number; topP: number; maxOutputTokens: number };
  }
): Promise<GeminiGenerateContentResponse> => {
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(FRONTEND_GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed (${response.status})`);
  }

  return payload;
};

export const generateFrontendGeminiReply = async ({
  mode,
  userName,
  isPremium,
  history,
}: FrontendGeminiRequest): Promise<string> => {
  if (!isFrontendGeminiConfigured()) {
    throw new Error('Frontend Gemini key missing. Set NEXT_PUBLIC_GEMINI_API_KEY.');
  }

  const body = {
    systemInstruction: {
      parts: [
        {
          text: buildCompactSystemInstruction({
            mode,
            userName,
            isPremium,
            extraPrompt: 'Keep the mode tone strongest and emotionally consistent.',
          }),
        },
      ],
    },
    contents: [
      {
        role: 'user' as const,
        parts: [
          {
            text:
              buildRecentHistoryText(history, MAX_PROMPT_HISTORY_MESSAGES) ||
              'No prior conversation context. Respond naturally.',
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 220,
    },
  };

  const primaryModel = getEffectivePrimaryModel();
  const modelsToTry = [primaryModel];
  if (FRONTEND_GEMINI_FALLBACK_MODEL !== primaryModel) {
    modelsToTry.push(FRONTEND_GEMINI_FALLBACK_MODEL);
  }

  let lastError: Error | null = null;

  for (let index = 0; index < modelsToTry.length; index += 1) {
    const model = modelsToTry[index];
    try {
      const payload = await requestGenerateContent(model, body);
      const text = extractTextResponse(payload);
      if (!text) {
        throw new Error(`Gemini returned empty response from model "${model}".`);
      }
      return text;
    } catch (error) {
      const message = toErrorMessage(error);
      lastError = error instanceof Error ? error : new Error(message || 'Gemini request failed.');
      const hasNextModel = index < modelsToTry.length - 1;
      if (!hasNextModel || !isModelCompatibilityError(message)) {
        throw lastError;
      }
      // Try next configured fallback model on compatibility failure.
    }
  }

  throw lastError || new Error('Gemini request failed.');
};
