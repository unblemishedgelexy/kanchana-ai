import React from 'react';

const ChatTypingIndicator: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="bg-white/5 px-6 py-3 rounded-full border border-white/5 flex gap-2">
      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
    </div>
  </div>
);

export default ChatTypingIndicator;
