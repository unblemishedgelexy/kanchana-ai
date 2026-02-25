import React from 'react';
import { cn } from '../../shared/cn';

interface AppFileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AppFileInput: React.FC<AppFileInputProps> = ({ className, ...props }) => (
  <input
    type="file"
    className={cn('hidden', className)}
    {...props}
  />
);

export default AppFileInput;
