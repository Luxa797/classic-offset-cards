// src/components/dashboard/DashboardMetrics.tsx
import React from 'react'; // useEffect, useState நீக்கப்பட்டுள்ளது
import MetricCard from '../ui/MetricCard';
import { 
    Coins, 
    Wallet, 
    TrendingDown, 
    Landmark, 
    Hourglass, 
    Percent,
    ClipboardList, // New: For total orders
    Users,         // New: For total customers
    Package,       // New: For stock alerts or pending orders count
    AlertTriangle  // Added: For error states
} from 'lucide-react';

// Define the type for a single metric object
interface Metric {
  title: string;
  value: string;
  icon: React.ReactNode;
}

// NEW: Interface for the consolidated metrics data from the RPC
interface ConsolidatedMetricsData {
  total_revenue: number;
  total_paid: number;
  total_expenses: number;
  balance_due: number; // Outstanding Balance
  total_orders_count: number; // New metric
  total_customers_count: number; // New metric
  orders_fully_paid_count: number; // New metric for status breakdown
  orders_partial_count: number;
  orders_due_count: number;
  orders_overdue_count: number;
  stock_alerts_count: number; // New metric
  // Add any other metrics returned by your get_dashboard_metrics RPC
}

// UPDATED: Now accepts metricsData as a prop instead of fetching its own
interface DashboardMetricsProps {
    metricsData: ConsolidatedMetricsData | null;
    loading: boolean;
    error: string | null;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metricsData, loading, error }) => {
  // useEffect நீக்கப்பட்டுள்ளது, ஏனெனில் தரவு props ஆக வருகிறது
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3 col-span-full">
        <AlertTriangle />
        <span>{error}</span>
      </div>
    );
  }

  if (!metricsData) { // If no data even after loading
    return (
      <div className="p-4 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg flex items-center gap-3 col-span-full">
        <AlertTriangle />
        <span>No metrics data available for this period.</span>
      </div>
    );
  }

  const result = metricsData; // Use metricsData directly

  // Calculate new metrics on the client-side from the fetched data
  const netProfit = (result.total_paid || 0) - (result.total_expenses || 0);
  const profitMargin = result.total_revenue > 0 ? (netProfit / result.total_revenue) * 100 : 0;

  // Create the final array of metrics to display
  const formattedMetrics: Metric[] = [
    {
      title: "Total Revenue",
      value: `₹${(result.total_revenue || 0).toLocaleString('en-IN')}`,
      icon: <Coins size={24} className="text-yellow-500" />
    },
    {
      title: "Amount Received",
      value: `₹${(result.total_paid || 0).toLocaleString('en-IN')}`,
      icon: <Wallet size={24} className="text-green-500" />
    },
    {
      title: "Outstanding Balance",
      value: `₹${(result.balance_due || 0).toLocaleString('en-IN')}`, // Directly from RPC result
      icon: <Hourglass size={24} className="text-orange-500" />
    },
    {
      title: "Total Expenses",
      value: `₹${(result.total_expenses || 0).toLocaleString('en-IN')}`,
      icon: <TrendingDown size={24} className="text-red-500" />
    },
    {
      title: "Net Profit",
      value: `₹${netProfit.toLocaleString('en-IN')}`,
      icon: <Landmark size={24} className="text-indigo-500" />
    },
    {
      title: "Profit Margin",
      value: `${profitMargin.toFixed(1)}%`,
      icon: <Percent size={24} className="text-sky-500" />
    },
    // NEW METRICS/CARDS:
    {
      title: "Total Orders",
      value: String(result.total_orders_count || 0),
      icon: <ClipboardList size={24} className="text-purple-500" />
    },
    {
      title: "Total Customers",
      value: String(result.total_customers_count || 0),
      icon: <Users size={24} className="text-blue-500" />
    },
    {
      title: "Stock Alerts",
      value: String(result.stock_alerts_count || 0), // Assuming RPC returns this
      icon: <AlertTriangle size={24} className="text-amber-500" />
    }
  ];
    
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {formattedMetrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;