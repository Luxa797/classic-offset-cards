// src/components/ui/Select.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

// Allow all standard select element attributes
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  className?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  error,
  className = '',
  placeholder,
  ...props
}) => {
  return (
    <div className={className}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
      >
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm appearance-none
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-colors duration-200
            bg-white dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Select;