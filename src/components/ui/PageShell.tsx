import React from 'react';
import { cn } from '../../shared/cn';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}

const PageShell: React.FC<PageShellProps> = ({ children, className, animated = true }) => (
  <div
    className={cn(
      'h-full w-full overflow-y-auto bg-[#050107] custom-scrollbar pb-32',
      animated && 'animate-fade-in',
      className
    )}
  >
    {children}
  </div>
);

export default PageShell;
