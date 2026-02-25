import React from 'react';
import { ChatMessageItemProps } from './types';
import AppImage from '../ui/AppImage';
import { cn } from '../../shared/cn';

const ChatMessageBubble: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[70%] space-y-3">
        <div
          className={cn(
            'p-4 sm:p-6 rounded-[1.8rem] sm:rounded-[2.5rem] border',
            isUser
              ? 'bg-purple-600/10 border-purple-500/20 text-purple-100 rounded-tr-none shadow-xl'
              : 'bg-white/5 border-white/5 text-slate-200 rounded-tl-none backdrop-blur-xl'
          )}
        >
          <p className={cn('text-sm md:text-base leading-relaxed', !isUser ? 'font-playfair italic' : 'font-sans')}>
            {message.text}
          </p>

          {message.imageUrl && (
            <div className="mt-4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer">
              <AppImage
                src={message.imageUrl}
                alt="Kanchana Vision"
                width={1200}
                height={1200}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {message.groundingSources && (
            <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-2">Soul Connections:</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white/5 hover:bg-purple-600/20 border border-white/10 rounded-full text-[10px] text-purple-300 transition-all flex items-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {source.title.length > 20 ? `${source.title.substring(0, 20)}...` : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <span className="block mt-4 text-[9px] opacity-30 font-bold tracking-widest uppercase text-right">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
