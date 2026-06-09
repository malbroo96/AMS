import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { button } from './designTokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClass: Record<ButtonVariant, string> = {
  primary: button.primary,
  secondary: button.secondary,
  ghost: button.ghost,
  danger: button.danger,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  fullWidth,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
