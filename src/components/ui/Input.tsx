// src/components/ui/Input.tsx
import React, { Children } from 'react';
import { twMerge } from 'tailwind-merge';

// Extend props to accept general element attributes and 'as' prop
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode; // To allow for <option> elements
}

const Input: React.FC<InputProps> = ({ label, id, icon, error, className = '', as = 'input', children, ...props }) => {
  const commonStyles = `
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
    disabled:opacity-50
    ${error ? 'border-destructive focus:ring-destructive' : ''}
    ${icon ? 'pl-10' : ''}
  `;

  const Component = as === 'select' ? 'select' : 'input';

  return (
    <div className={twMerge("w-full", as === 'input' ? className : '')}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
          {label} {props.required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <Component
          id={id}
          className={twMerge(commonStyles, as === 'select' ? className : '')}
          {...props}
        >
          {children}
        </Component>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default Input;
