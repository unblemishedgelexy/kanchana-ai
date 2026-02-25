import React from 'react';
import { cn } from '../../shared/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => (
  <div className={cn('glass-panel border-white/5', className)} {...props}>
    {children}
  </div>
);

export default GlassCard;
