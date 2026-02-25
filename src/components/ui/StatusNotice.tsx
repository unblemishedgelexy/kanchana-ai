import React from 'react';
import AppButton from './AppButton';

type NoticeVariant = 'error' | 'info';

interface StatusNoticeProps {
  message: string;
  variant: NoticeVariant;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<NoticeVariant, string> = {
  error:
    'bg-red-950/80 border border-red-500/50 text-white',
  info:
    'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200',
};

const StatusNotice: React.FC<StatusNoticeProps> = ({ message, variant, className = '', onClose }) => {
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-[10px] font-bold animate-fade-in backdrop-blur-md ${variantStyles[variant]} ${className}`}
      role="status"
    >
      <div className="flex items-center gap-2">
        {variant === 'error' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        )}
        <span>{message}</span>
        {onClose && (
          <AppButton onClick={onClose} variant="ghost" className="ml-2" type="button" aria-label="close-notice">
            x
          </AppButton>
        )}
      </div>
    </div>
  );
};

export default StatusNotice;
