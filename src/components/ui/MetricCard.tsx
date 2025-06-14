// src/components/ui/MetricCard.tsx
import React from 'react';
import { motion } from 'framer-motion';

// props-க்கான மேம்படுத்தப்பட்ட வகை வரையறை
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  // Trend தொடர்பான தகவல்களை ஒரு αντικείμενο-ஆகப் பெறுகிறோம்
  trendInfo?: {
    value: string;
    Icon: React.ElementType; // ஐகான் கூறினை ஒரு prop ஆகப் பெறுகிறோம்
    color: string; // வண்ணத்திற்கான CSS வகுப்பைப் பெறுகிறோம்
    period?: string; // எ.கா., "from last month"
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trendInfo,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        bg-white dark:bg-gray-800 
        rounded-2xl
        shadow-lg hover:shadow-xl
        transition-all duration-300
        p-5
        border border-gray-100 dark:border-gray-700
        flex flex-col justify-between h-full
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg text-primary-500 dark:text-primary-300">
          {icon}
        </div>
      </div>
      
      {trendInfo && (
        <div className={`mt-4 flex items-center text-sm font-semibold ${trendInfo.color}`}>
          <trendInfo.Icon size={16} strokeWidth={3} className="mr-1" />
          <span>{trendInfo.value}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
            {trendInfo.period || 'from last month'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;