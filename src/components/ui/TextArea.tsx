// src/components/ui/TextArea.tsx
import React from 'react';

// Allow all standard textarea element attributes
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  error,
  className = '',
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
      <textarea
        id={id}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-colors duration-200
          bg-white dark:bg-gray-700
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
          resize-y
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
        rows={props.rows || 4} // Default to 4 rows if not specified
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextArea;