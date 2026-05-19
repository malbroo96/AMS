import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({ children, className = '', hover = true, padding = 'md' }: CardProps) {
  return (
    <div className={`${hover ? 'card' : 'card-flat'} ${paddingClass[padding]} ${className}`}>
      {children}
    </div>
  );
}
