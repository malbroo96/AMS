import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';
import { inputClassName, selectClassName } from './formStyles';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error.message}</p>}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
}

export function TextInput({ label, error, hint, required, className = '', ...props }: TextInputProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <input {...props} className={`${inputClassName} ${className}`} />
    </FormField>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: ReactNode;
}

export function SelectInput({ label, error, required, children, className = '', ...props }: SelectInputProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <select {...props} className={`${selectClassName} ${className}`}>
        {children}
      </select>
    </FormField>
  );
}
