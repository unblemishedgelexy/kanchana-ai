import React from 'react';

const ChatEmptyState: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 sm:space-y-6 px-2">
    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-900/20 rounded-full flex items-center justify-center animate-pulse border border-purple-500/10">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-purple-400"
      >
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        <path d="M12 6v6l4 2" />
      </svg>
    </div>
    <p className="font-playfair italic text-base sm:text-xl text-slate-300">
      "Maine tumhare liye tasveerein aur yaadein sanjo kar rakhi hain."
    </p>
  </div>
);

export default ChatEmptyState;
