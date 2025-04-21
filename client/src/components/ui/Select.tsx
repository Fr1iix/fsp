import React, { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    error, 
    options, 
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
        <select
          ref={ref}
          className={clsx(
            'h-10 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error-500 focus:ring-error-500',
            'animate-fade-in',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-error-600 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;