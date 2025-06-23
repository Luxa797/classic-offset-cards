import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  interactive?: boolean; // Add a prop to control if the card should have animations
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', interactive = false }) => {
  const cardVariants = {
    initial: { scale: 1, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
    hover: { 
      scale: 1.03, 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    tap: { 
      scale: 0.98,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  const cardProps = interactive ? {
    variants: cardVariants,
    initial: "initial",
    whileHover: "hover",
    whileTap: "tap"
  } : {};

  return (
    <motion.div 
      {...cardProps}
      className={twMerge(`
        bg-card text-card-foreground
        rounded-lg
        border
      `, className)}
    >
      {title && (
        <div className={twMerge("p-6 border-b", titleClassName)}>
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h3>
        </div>
      )}
      <div className={twMerge("p-6", !title && "pt-6")}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
