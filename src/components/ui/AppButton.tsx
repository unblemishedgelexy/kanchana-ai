import React from 'react';
import { cn } from '../../shared/cn';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'amber'
  | 'blue'
  | 'indigo'
  | 'outline';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-500',
  secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
  ghost: 'bg-transparent text-slate-400 hover:text-white',
  danger: 'bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white',
  amber: 'bg-amber-600 text-black hover:bg-amber-500',
  blue: 'bg-blue-700 text-white hover:bg-blue-600',
  indigo: 'bg-indigo-700 text-white hover:bg-indigo-600',
  outline: 'border border-white/20 text-white hover:bg-white/10',
};

const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  className,
  fullWidth = false,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={cn(
      'transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
      variantClassMap[variant],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  />
);

export default AppButton;
