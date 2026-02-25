import type { FormEvent, RefObject, UIEvent } from 'react';
import { ChatUsage, ChatUxHint, KanchanaMode, Message } from '../../shared/types';

export interface ChatModeScopedProps {
  activeMode: KanchanaMode;
}

export interface ChatUserAvatarProps {
  userAvatarUrl?: string;
}

export interface ChatHeaderProps extends ChatModeScopedProps, ChatUserAvatarProps {
  profileSeed?: string;
  onProfileClick?: () => void;
}

export interface ChatInputBaseProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onAudioClick?: () => void;
  voiceDisabled?: boolean;
  voiceDisabledMessage?: string;
}

export interface ChatMessageItemProps extends ChatUserAvatarProps {
  message: Message;
}

export interface ChatMessageFeedProps extends ChatUserAvatarProps {
  messages: Message[];
  isTyping: boolean;
  modeKey?: KanchanaMode;
  bottomRef: RefObject<HTMLDivElement | null>;
  containerRef?: RefObject<HTMLDivElement | null>;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
}

export interface ChatUsagePanelProps {
  usage?: ChatUsage | null;
  hint?: ChatUxHint | null;
}
