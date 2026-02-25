import React from 'react';
import { cn } from '../../shared/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, className, actions }) => (
  <header className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
    <div className="space-y-4">
      <h1 className="font-cinzel text-3xl sm:text-4xl text-white tracking-[0.12em] sm:tracking-widest uppercase">
        {title}
      </h1>
      {subtitle && <p className="font-playfair italic text-purple-400">{subtitle}</p>}
    </div>
    {actions}
  </header>
);

export default PageHeader;
