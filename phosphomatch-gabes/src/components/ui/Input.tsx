import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? label;
    return (
      <label className="block" htmlFor={inputId}>
        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          {icon}
          {label}
        </span>
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        />
        {helper && !error ? <span className="mt-1 block text-xs text-muted">{helper}</span> : null}
        {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
