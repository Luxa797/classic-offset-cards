// src/components/dashboard/summary/FinancialSummary.tsx
import React from 'react';
import MetricCard from '../../ui/MetricCard';
import { ClipboardList, Coins, Wallet, TrendingDown as TrendDown, Hourglass, ArrowUp, ArrowDown } from 'lucide-react';

// Define the type for the props this component will receive
interface FinancialData {
  orders: number;
  revenue: number;
  received: number;
  expenses: number;
  balanceDue: number;
}

interface FinancialSummaryProps {
  data: FinancialData | null;
  previousData?: FinancialData | null; // Data for the previous month (optional)
  loading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data, previousData, loading }) => {
  // A helper function to calculate the percentage trend between two numbers
  const calculateTrend = (current: number, previous: number) => {
    // Handle null/undefined values by defaulting to 0
    const currentValue = current ?? 0;
    const previousValue = previous ?? 0;
    
    if (previousValue === 0) {
      return currentValue > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
    }
    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    return {
      value: Math.round(Math.abs(percentageChange)),
      isPositive: percentageChange >= 0,
    };
  };

  // Show a skeleton UI while data is loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  // If there's no data, return nothing. The parent component will handle error/empty states.
  if (!data) {
    return null;
  }

  // Create an array of metrics to display
  const metrics = [
    { title: "Orders", value: data.orders ?? 0, previousValue: previousData?.orders ?? 0, icon: <ClipboardList size={24} className="text-blue-500" /> },
    { title: "Revenue", value: data.revenue ?? 0, previousValue: previousData?.revenue ?? 0, icon: <Coins size={24} className="text-yellow-500" />, isCurrency: true },
    { title: "Received", value: data.received ?? 0, previousValue: previousData?.received ?? 0, icon: <Wallet size={24} className="text-green-500" />, isCurrency: true },
    { title: "Balance Due", value: data.balanceDue ?? 0, previousValue: previousData?.balanceDue ?? 0, icon: <Hourglass size={24} className="text-orange-500" />, isCurrency: true },
    { title: "Expenses", value: data.expenses ?? 0, previousValue: previousData?.expenses ?? 0, icon: <TrendDown size={24} className="text-red-500" />, isCurrency: true, trendInverted: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(metric => {
        const trend = (metric.previousValue !== undefined) ? calculateTrend(metric.value, metric.previousValue) : null;
        // For expenses, an increase is a negative trend
        const isPositiveTrend = metric.trendInverted ? !trend?.isPositive : trend?.isPositive;

        return (
          <MetricCard
            key={metric.title}
            title={`${metric.title} (This Month)`}
            value={metric.isCurrency ? `₹${metric.value.toLocaleString('en-IN')}` : metric.value.toLocaleString('en-IN')}
            icon={metric.icon}
            // The `trendInfo` prop needs to be handled by your MetricCard component
            trendInfo={trend ? {
              value: `${trend.value}%`,
              Icon: isPositiveTrend ? ArrowUp : ArrowDown,
              color: isPositiveTrend ? 'text-green-600' : 'text-red-600'
            } : undefined}
          />
        );
      })}
    </div>
  );
};

export default FinancialSummary;