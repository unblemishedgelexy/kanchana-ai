import React from 'react';
import { cn } from '../../shared/cn';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  className,
  containerClassName,
  ...props
}) => (
  <div className={cn('space-y-1', containerClassName)}>
    {label && (
      <label className="px-2 sm:px-4 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        {label}
      </label>
    )}
    <input
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 outline-none focus:border-purple-500 transition-all text-white placeholder:text-slate-800 text-sm',
        className
      )}
      {...props}
    />
  </div>
);

export default AppInput;
