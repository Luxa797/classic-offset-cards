// src/components/ui/MetricCard.tsx
import React from 'react';
import Card from './Card'; // Import the updated Card component

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value }) => {
  return (
    <Card 
      interactive={true} // Enable hover and tap animations
      className="p-4 flex flex-col justify-between h-full"
    >
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
        </div>
        <div className="mt-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
            </h3>
        </div>
    </Card>
  );
};

export default MetricCard;
