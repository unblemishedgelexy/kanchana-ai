import {
  EndSensitivity,
  GoogleGenAI,
  type LiveServerMessage,
  Modality,
  StartSensitivity,
} from '@google/genai';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FRONTEND_GEMINI_ENABLED, FRONTEND_GEMINI_LIVE_ENABLED } from '../../shared/featureFlags';
import {
  buildCompactSystemInstruction,
  buildRecentHistoryText,
} from '../../shared/prompting';
import { hasUnlimitedAccess } from '../../shared/access';
import { KanchanaMode, Message, UserPreferences } from '../../shared/types';
import AppButton from '../ui/AppButton';
import AppImage from '../ui/AppImage';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface AudioPageProps {
  preferences: UserPreferences;
  activeMode: KanchanaMode;
  onClose: () => void;
  onSendMessage: (text: string, voiceDurationSeconds?: number) => Promise<void>;
  latestMessages: Message[];
  voiceBlocked?: boolean;
  voiceBlockedMessage?: string;
  onVoiceBlockedAction?: () => void;
  voiceBlockedActionLabel?: string;
}

const LIVE_INPUT_SAMPLE_RATE = 16000;
const LIVE_OUTPUT_SAMPLE_RATE = 24000;
const LIVE_CAPTURE_BUFFER_SIZE = 1024;
const DEFAULT_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_API_KEY = String(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();
const GEMINI_MODEL = String(process.env.NEXT_PUBLIC_GEMINI_MODEL || DEFAULT_LIVE_MODEL)
  .trim()
  .replace(/^models\//i, '');
const GEMINI_PREBUILT_VOICE_NAME = String(process.env.NEXT_PUBLIC_GEMINI_VOICE_NAME || '').trim();

const parseBoundedNumberEnv = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const LIVE_INPUT_NOISE_GATE_RMS = parseBoundedNumberEnv(
  process.env.NEXT_PUBLIC_GEMINI_LIVE_NOISE_GATE_RMS,
  0.01,
  0,
  0.2
);
const LIVE_PREFIX_PADDING_MS = Math.round(
  parseBoundedNumberEnv(process.env.NEXT_PUBLIC_GEMINI_LIVE_PREFIX_PADDING_MS, 80, 0, 1000)
);
const LIVE_SILENCE_MS = Math.round(
  parseBoundedNumberEnv(process.env.NEXT_PUBLIC_GEMINI_LIVE_SILENCE_MS, 120, 80, 2000)
);
const LIVE_HISTORY_MESSAGE_LIMIT = Math.round(
  parseBoundedNumberEnv(process.env.NEXT_PUBLIC_GEMINI_LIVE_HISTORY_MESSAGES, 2, 1, 4)
);
const LIVE_MAX_OUTPUT_TOKENS = Math.round(
  parseBoundedNumberEnv(process.env.NEXT_PUBLIC_GEMINI_LIVE_MAX_OUTPUT_TOKENS, 90, 32, 220)
);

interface QueuedAudioChunk {
  pcm16: Int16Array;
  sampleRate: number;
}

const parseSampleRateFromMimeType = (mimeType?: string): number => {
  const matched = String(mimeType || '').match(/rate=(\d+)/i);
  if (!matched) return LIVE_OUTPUT_SAMPLE_RATE;
  const parsed = Number(matched[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : LIVE_OUTPUT_SAMPLE_RATE;
};

const calculateRms = (samples: ArrayLike<number>): number => {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
};

const downsampleFloatToPcm16 = (
  input: ArrayLike<number>,
  inputRate: number,
  outputRate: number
): Int16Array => {
  if (!input.length) return new Int16Array(0);

  const normalizedInputRate = Math.max(1, Math.floor(inputRate || outputRate));
  if (normalizedInputRate === outputRate) {
    const direct = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      direct[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return direct;
  }

  const ratio = normalizedInputRate / outputRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Int16Array(outputLength);
  let sourceOffset = 0;

  for (let targetIndex = 0; targetIndex < outputLength; targetIndex += 1) {
    const nextSourceOffset = Math.round((targetIndex + 1) * ratio);
    let accum = 0;
    let count = 0;
    const limit = Math.min(nextSourceOffset, input.length);
    for (let sourceIndex = sourceOffset; sourceIndex < limit; sourceIndex += 1) {
      accum += input[sourceIndex];
      count += 1;
    }
    const sample = count > 0 ? accum / count : input[Math.min(sourceOffset, input.length - 1)];
    const clamped = Math.max(-1, Math.min(1, sample));
    output[targetIndex] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    sourceOffset = nextSourceOffset;
  }

  return output;
};

const pcm16ToBase64 = (pcm16: Int16Array): string => {
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const base64ToPcm16 = (data: string): Int16Array => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const byteLength = bytes.byteLength - (bytes.byteLength % 2);
  return new Int16Array(bytes.buffer, bytes.byteOffset, byteLength / 2);
};

const pcm16ToFloat32 = (pcm16: Int16Array): Float32Array => {
  const output = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i += 1) {
    output[i] = Math.max(-1, Math.min(1, pcm16[i] / 0x8000));
  }
  return output;
};

const AudioPage: React.FC<AudioPageProps> = ({
  preferences,
  activeMode,
  onClose,
  onSendMessage,
  latestMessages,
  voiceBlocked = false,
  voiceBlockedMessage = '',
  onVoiceBlockedAction,
  voiceBlockedActionLabel = 'Upgrade',
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [lastUserText, setLastUserText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPremiumLimitAlert, setShowPremiumLimitAlert] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenMessageIdRef = useRef<string>('');
  const speakingRef = useRef(false);
  const autoStarterSentRef = useRef(false);
  const recognitionStartedAtRef = useRef<number>(0);
  const liveSessionRef = useRef<{
    close: () => void;
    sendRealtimeInput: (params: unknown) => void;
    sendClientContent: (params: unknown) => void;
  } | null>(null);
  const liveConnectingRef = useRef(false);
  const liveIntentionalCloseRef = useRef(false);
  const hasReachedFreeLimitRef = useRef(false);
  const unmountedRef = useRef(false);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const captureAudioContextRef = useRef<AudioContext | null>(null);
  const captureSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const captureSilentGainRef = useRef<GainNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<QueuedAudioChunk[]>([]);
  const playbackDrainingRef = useRef(false);

  const isPremium = hasUnlimitedAccess(preferences);
  const useGeminiLiveAudio =
    FRONTEND_GEMINI_ENABLED && FRONTEND_GEMINI_LIVE_ENABLED && Boolean(GEMINI_API_KEY);
  const isVoiceActive = status === 'listening' || status === 'processing' || status === 'speaking';
  const hasReachedFreeLimit = !isPremium && voiceBlocked;

  const clearPlaybackQueue = useCallback(() => {
    playbackQueueRef.current = [];
    playbackDrainingRef.current = false;
    if (playbackContextRef.current) {
      void playbackContextRef.current.close().catch(() => undefined);
      playbackContextRef.current = null;
    }
  }, []);

  const stopLiveSession = useCallback(() => {
    liveIntentionalCloseRef.current = true;
    const activeSession = liveSessionRef.current;
    liveSessionRef.current = null;
    if (activeSession) {
      try {
        activeSession.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        // ignore
      }
      try {
        activeSession.close();
      } catch {
        // ignore
      }
    }

    if (captureProcessorNodeRef.current) {
      captureProcessorNodeRef.current.onaudioprocess = null;
      captureProcessorNodeRef.current.disconnect();
      captureProcessorNodeRef.current = null;
    }
    if (captureSourceNodeRef.current) {
      captureSourceNodeRef.current.disconnect();
      captureSourceNodeRef.current = null;
    }
    if (captureSilentGainRef.current) {
      captureSilentGainRef.current.disconnect();
      captureSilentGainRef.current = null;
    }
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((track) => track.stop());
      captureStreamRef.current = null;
    }
    if (captureAudioContextRef.current) {
      void captureAudioContextRef.current.close().catch(() => undefined);
      captureAudioContextRef.current = null;
    }

    clearPlaybackQueue();
    setMicLevel(0);
    if (!unmountedRef.current) {
      setStatus((previous) => (previous === 'error' ? previous : 'idle'));
    }
    window.setTimeout(() => {
      liveIntentionalCloseRef.current = false;
    }, 0);
  }, [clearPlaybackQueue]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    recognitionRef.current = null;
    stopLiveSession();
  }, [stopLiveSession]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    clearPlaybackQueue();
  }, [clearPlaybackQueue]);

  const speakText = useCallback((text: string) => {
    if (!text.trim()) return;
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'hi-IN';

    utterance.onstart = () => {
      speakingRef.current = true;
      setStatus('speaking');
    };

    utterance.onend = () => {
      speakingRef.current = false;
      setStatus('idle');
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      setStatus('error');
      setErrorMessage('Speech synthesis unavailable.');
    };

    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking]);

  const drainPlaybackQueue = useCallback(async () => {
    if (playbackDrainingRef.current || hasReachedFreeLimitRef.current) return;
    playbackDrainingRef.current = true;
    try {
      while (playbackQueueRef.current.length > 0 && !hasReachedFreeLimitRef.current) {
        const nextChunk = playbackQueueRef.current.shift();
        if (!nextChunk || !nextChunk.pcm16.length) continue;

        let context = playbackContextRef.current;
        if (!context) {
          context = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: Math.max(8000, nextChunk.sampleRate || LIVE_OUTPUT_SAMPLE_RATE),
          });
          playbackContextRef.current = context;
        }
        if (context.state === 'suspended') {
          await context.resume();
        }

        const float32Data = pcm16ToFloat32(nextChunk.pcm16);
        const audioBuffer = context.createBuffer(
          1,
          float32Data.length,
          Math.max(8000, nextChunk.sampleRate || LIVE_OUTPUT_SAMPLE_RATE)
        );
        audioBuffer.copyToChannel(float32Data, 0);

        if (!unmountedRef.current) {
          setStatus('speaking');
        }

        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      }
    } catch {
      if (!unmountedRef.current) {
        setStatus('error');
        setErrorMessage('Live audio playback failed.');
      }
    } finally {
      playbackDrainingRef.current = false;
      if (!unmountedRef.current && liveSessionRef.current && !hasReachedFreeLimitRef.current) {
        setStatus('listening');
      }
    }
  }, []);

  const handleLiveServerMessage = useCallback((message: LiveServerMessage) => {
    const serverContent = message?.serverContent;
    if (!serverContent) return;

    if (serverContent.inputTranscription?.text) {
      setLastUserText(serverContent.inputTranscription.text.trim());
    }

    if (serverContent.interrupted) {
      clearPlaybackQueue();
      if (!unmountedRef.current && liveSessionRef.current) {
        setStatus('listening');
      }
      return;
    }

    const parts = serverContent.modelTurn?.parts || [];
    for (const part of parts) {
      const inlineData = part.inlineData;
      if (!inlineData?.data) continue;
      try {
        const pcm16 = base64ToPcm16(inlineData.data);
        if (!pcm16.length) continue;
        playbackQueueRef.current.push({
          pcm16,
          sampleRate: parseSampleRateFromMimeType(inlineData.mimeType),
        });
      } catch {
        // ignore malformed chunk
      }
    }

    if (playbackQueueRef.current.length > 0) {
      void drainPlaybackQueue();
      return;
    }

    if (serverContent.turnComplete && !unmountedRef.current && liveSessionRef.current) {
      setStatus('listening');
    }
  }, [clearPlaybackQueue, drainPlaybackQueue]);

  const startGeminiLiveSession = useCallback(async () => {
    if (liveSessionRef.current || liveConnectingRef.current) return;
    if (!GEMINI_API_KEY) {
      setStatus('error');
      setErrorMessage('Gemini API key missing for live voice mode.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Microphone API is not supported in this browser.');
      return;
    }

    liveConnectingRef.current = true;
    liveIntentionalCloseRef.current = false;
    setErrorMessage('');
    setStatus('processing');

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const speechConfig = GEMINI_PREBUILT_VOICE_NAME
        ? {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: GEMINI_PREBUILT_VOICE_NAME,
              },
            },
          }
        : undefined;

      const session = await ai.live.connect({
        model: GEMINI_MODEL || DEFAULT_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          maxOutputTokens: LIVE_MAX_OUTPUT_TOKENS,
          speechConfig,
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              prefixPaddingMs: LIVE_PREFIX_PADDING_MS,
              silenceDurationMs: LIVE_SILENCE_MS,
            },
          },
          systemInstruction: buildCompactSystemInstruction({
            mode: activeMode,
            userName: preferences.name || 'Mystery Soul',
            isPremium,
            extraPrompt:
              'Keep mode tone strongest. Reply naturally and briefly. Always prioritize the latest user utterance over older context unless explicitly asked. Audio must be clean dry voice only, no music, ambience, or sound effects.',
          }),
        },
        callbacks: {
          onopen: () => {
            if (!unmountedRef.current) {
              setStatus('processing');
            }
          },
          onmessage: (message) => {
            handleLiveServerMessage(message);
          },
          onerror: (event) => {
            if (unmountedRef.current) return;
            setStatus('error');
            setErrorMessage(event?.message || 'Gemini live connection error.');
          },
          onclose: (event) => {
            liveSessionRef.current = null;
            if (unmountedRef.current || liveIntentionalCloseRef.current) return;
            setStatus('idle');
            if (event?.reason) {
              setErrorMessage(`Gemini live closed: ${event.reason}`);
            }
          },
        },
      });
      liveSessionRef.current = session;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: LIVE_INPUT_SAMPLE_RATE,
        },
      });
      captureStreamRef.current = mediaStream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error('Web Audio API unavailable in this browser.');
      }
      const captureContext = new AudioContextCtor();
      captureAudioContextRef.current = captureContext;

      const sourceNode = captureContext.createMediaStreamSource(mediaStream);
      const processorNode = captureContext.createScriptProcessor(LIVE_CAPTURE_BUFFER_SIZE, 1, 1);
      const silentGain = captureContext.createGain();
      silentGain.gain.value = 0;

      processorNode.onaudioprocess = (event) => {
        if (!liveSessionRef.current || hasReachedFreeLimitRef.current) return;

        const channelData = event.inputBuffer.getChannelData(0);
        const rms = calculateRms(channelData);
        if (!unmountedRef.current) {
          setMicLevel(Math.min(100, Math.round(rms * 300)));
        }
        if (rms < LIVE_INPUT_NOISE_GATE_RMS) return;

        const pcm16 = downsampleFloatToPcm16(
          channelData,
          captureContext.sampleRate || LIVE_INPUT_SAMPLE_RATE,
          LIVE_INPUT_SAMPLE_RATE
        );
        if (!pcm16.length) return;

        try {
          liveSessionRef.current.sendRealtimeInput({
            audio: {
              data: pcm16ToBase64(pcm16),
              mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
            },
          });
        } catch {
          if (!unmountedRef.current) {
            setStatus('error');
            setErrorMessage('Failed to stream mic audio.');
          }
        }
      };

      sourceNode.connect(processorNode);
      processorNode.connect(silentGain);
      silentGain.connect(captureContext.destination);

      captureSourceNodeRef.current = sourceNode;
      captureProcessorNodeRef.current = processorNode;
      captureSilentGainRef.current = silentGain;

      if (!unmountedRef.current) {
        setStatus('listening');
      }

      const historyText = buildRecentHistoryText(latestMessages, LIVE_HISTORY_MESSAGE_LIMIT);
      if (historyText) {
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: historyText }],
            },
          ],
          turnComplete: false,
        });
      }

      if (!autoStarterSentRef.current && latestMessages.length === 0) {
        autoStarterSentRef.current = true;
        const displayName = preferences.name || 'jaan';
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: `Tum khud se baat start karo, ${displayName} ko pyar se greet karo aur ek romantic sawal pucho.`,
                },
              ],
            },
          ],
          turnComplete: true,
        });
      }
    } catch (error) {
      stopLiveSession();
      if (!unmountedRef.current) {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Gemini live voice initialization failed.'
        );
      }
    } finally {
      liveConnectingRef.current = false;
    }
  }, [activeMode, handleLiveServerMessage, isPremium, latestMessages, preferences.name, stopLiveSession]);

  const startListening = useCallback(() => {
    if (hasReachedFreeLimitRef.current) {
      setStatus('idle');
      setErrorMessage(voiceBlockedMessage || 'Daily voice limit reached.');
      setShowPremiumLimitAlert(true);
      return;
    }

    if (useGeminiLiveAudio) {
      void startGeminiLiveSession();
      return;
    }

    setErrorMessage('');

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('error');
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    stopRecognition();

    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      recognitionStartedAtRef.current = Date.now();
      setStatus('listening');
      setMicLevel(20);
    };

    recognition.onresult = async (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      setLastUserText(transcript.trim());
      setMicLevel(Math.min(100, Math.max(15, transcript.length * 3)));

      const isFinal = event.results[event.results.length - 1]?.isFinal;
      if (!isFinal || !transcript.trim()) return;

      setStatus('processing');
      try {
        const voiceDurationSeconds = Math.max(
          1,
          Math.round((Date.now() - (recognitionStartedAtRef.current || Date.now())) / 1000)
        );
        await onSendMessage(transcript.trim(), voiceDurationSeconds);
      } catch {
        setStatus('error');
        setErrorMessage('Voice message failed. Try again.');
      }
    };

    recognition.onerror = () => {
      setStatus('error');
      setErrorMessage('Microphone access failed or recognition interrupted.');
    };

    recognition.onend = () => {
      setMicLevel(0);
      if (!speakingRef.current) {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onSendMessage, startGeminiLiveSession, stopRecognition, useGeminiLiveAudio, voiceBlockedMessage]);

  useEffect(() => {
    hasReachedFreeLimitRef.current = hasReachedFreeLimit;
  }, [hasReachedFreeLimit]);

  useEffect(() => {
    if (isPremium) {
      setShowPremiumLimitAlert(false);
      return;
    }
    if (!hasReachedFreeLimit) {
      setShowPremiumLimitAlert(false);
      return;
    }
    setShowPremiumLimitAlert(true);
  }, [isPremium, hasReachedFreeLimit]);

  useEffect(() => {
    if (isPremium || !hasReachedFreeLimit) return;
    stopRecognition();
    stopSpeaking();
    setStatus('idle');
    setMicLevel(0);
    setErrorMessage(voiceBlockedMessage || 'Daily voice limit reached.');
    setShowPremiumLimitAlert(true);
  }, [isPremium, hasReachedFreeLimit, stopRecognition, stopSpeaking, voiceBlockedMessage]);

  useEffect(() => {
    if (useGeminiLiveAudio) return;
    if (autoStarterSentRef.current) return;
    if (latestMessages.length > 0) return;
    if (hasReachedFreeLimit) return;

    autoStarterSentRef.current = true;
    setStatus('processing');

    const displayName = preferences.name || 'jaan';
    const starterPrompt = `Tum khud se baat start karo, ${displayName} ko pyar se greet karo aur ek romantic sawal pucho.`;

    void onSendMessage(starterPrompt)
      .catch(() => {
        setStatus('error');
        setErrorMessage('Auto-start failed. Tap Speak Now.');
      })
      .finally(() => {
        if (!speakingRef.current) {
          setStatus('idle');
        }
      });
  }, [hasReachedFreeLimit, latestMessages.length, onSendMessage, preferences.name, useGeminiLiveAudio]);

  useEffect(() => {
    if (useGeminiLiveAudio) return;
    const lastAssistant = [...latestMessages].reverse().find((item) => item.role === 'kanchana');
    if (!lastAssistant || !lastAssistant.text) return;
    if (lastAssistant.id === lastSpokenMessageIdRef.current) return;
    if (hasReachedFreeLimit) return;

    lastSpokenMessageIdRef.current = lastAssistant.id;
    speakText(lastAssistant.text);
  }, [hasReachedFreeLimit, latestMessages, speakText, useGeminiLiveAudio]);

  useEffect(() => {
    if (status !== 'speaking') return;
    if (useGeminiLiveAudio) return;
    if (!recognitionRef.current) return;
    setStatus('listening');
  }, [status, useGeminiLiveAudio]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      stopRecognition();
      stopSpeaking();
    };
  }, [stopRecognition, stopSpeaking]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#050107] p-4 sm:p-8 relative overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2e1065_0%,_transparent_70%)] opacity-30"></div>

      <AppButton
        data-tooltip="Close Voice Mode"
        aria-label="Close Voice Mode"
        onClick={onClose}
        variant="ghost"
        className="absolute top-8 right-8 text-slate-500 hover:text-white z-50 p-2"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </AppButton>

      {!isPremium && hasReachedFreeLimit && showPremiumLimitAlert && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#140a1d] p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <AppButton
              data-tooltip="Close Alert"
              aria-label="Close Alert"
              onClick={() => setShowPremiumLimitAlert(false)}
              variant="ghost"
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              x
            </AppButton>
            <h3 className="font-cinzel text-lg uppercase tracking-[0.18em] text-amber-300 mb-3">
              Voice Limit Reached
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {voiceBlockedMessage ||
                'Daily free voice limit reached. Upgrade to continue unlimited voice.'}
            </p>
            {onVoiceBlockedAction && (
              <div className="mt-5">
                <AppButton
                  onClick={onVoiceBlockedAction}
                  variant="primary"
                  className="w-full rounded-full py-3 text-[10px] uppercase tracking-[0.2em]"
                >
                  {voiceBlockedActionLabel}
                </AppButton>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center space-y-10 sm:space-y-16 max-w-lg text-center">
        <div className="relative">
          <div
            className="absolute -inset-8 rounded-full border border-purple-500/30 transition-all duration-75"
            style={{
              transform: `scale(${1 + micLevel / 100})`,
              opacity: status === 'listening' ? 0.6 : 0.1,
              boxShadow: `0 0 ${micLevel}px rgba(168, 85, 247, 0.4)`,
            }}
          ></div>

          <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-2 transition-all duration-700 overflow-hidden ${status === 'speaking' ? 'border-purple-500 scale-105 shadow-[0_0_80px_rgba(168,85,247,0.4)]' : 'border-purple-500/20 grayscale brightness-50'}`}>
            <AppImage
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600"
              alt="Kanchana"
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 bg-slate-900/80 text-purple-400 border border-purple-500/30">
            {status}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-cinzel text-xl sm:text-2xl text-white tracking-[0.2em] sm:tracking-[0.3em] uppercase">{activeMode} Voice Mode</h2>
          <p className="font-playfair italic text-base sm:text-lg text-purple-400/80 min-h-[2rem] px-2">
            {lastUserText ? `"${lastUserText}"` : `Bolo ${preferences.name}, woh sun rahi hai...`}
          </p>
          {errorMessage && <p className="text-red-300 text-xs">{errorMessage}</p>}
        </div>

        <div className="flex flex-col items-center gap-6">
          <AppButton
            onClick={isVoiceActive ? stopRecognition : startListening}
            variant={isVoiceActive ? 'danger' : 'primary'}
            disabled={!isVoiceActive && hasReachedFreeLimit}
            className="px-8 sm:px-16 md:px-20 py-4 sm:py-5 rounded-full font-cinzel text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.4em] shadow-2xl uppercase border"
          >
            {isVoiceActive ? 'Stop Listening' : 'Speak Now'}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default AudioPage;
