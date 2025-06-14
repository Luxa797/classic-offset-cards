// src/components/orders/OrderStatusStepper.tsx
import React from 'react';
import { Check } from 'lucide-react';

type Status = 'Pending' | 'Design' | 'Printing' | 'Delivered';
const steps: Status[] = ['Pending', 'Design', 'Printing', 'Delivered'];

interface Props {
  currentStatus: Status;
}

const OrderStatusStepper: React.FC<Props> = ({ currentStatus }) => {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-primary-500 border-primary-500 text-white animate-pulse' :
                  'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'}`
              }>
                {isCompleted ? <Check size={16} /> : <span>{index + 1}</span>}
              </div>
              <p className={`mt-1 text-xs text-center ${isActive ? 'font-semibold text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 transition-colors duration-300 mx-1 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;