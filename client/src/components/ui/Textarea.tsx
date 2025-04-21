import React, { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    className, 
    fullWidth = false,
    ...props 
  }, ref) => {
    return (
      <div className={clsx('flex flex-col space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium leading-none text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'flex min-h-[80px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-neutral-400',
            error && 'border-error-500 focus:ring-error-500',
            'animate-fade-in',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error-600 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;