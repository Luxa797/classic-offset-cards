import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`
      bg-white dark:bg-zinc-800 
      rounded-2xl
      shadow-card hover:shadow-card-hover 
      transition-shadow duration-200
      p-6
      border border-gray-100 dark:border-gray-700
      ${className}
    `}>
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Card;
