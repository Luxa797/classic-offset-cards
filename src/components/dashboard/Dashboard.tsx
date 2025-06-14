// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Frown } from 'lucide-react';

// துணைக்கூறுகளை இறக்குமதி செய்யவும்
import DashboardMetrics from './DashboardMetrics'; 
import RevenueChart from './RevenueChart';
import OrderStatusCard from './OrderStatusCard';
import OrdersChart from './OrdersChart';
import FinancialSummary from './summary/FinancialSummary';
import ActivityLogFeed from './ActivityLogFeed';
import Card from '../ui/Card';

// தரவுகளுக்கான வகைகள்
interface RevenueChartDataPoint { date: string; value: number; }
interface OrdersChartDataPoint { day: string; order_count: number; }
interface PendingOrder { id: number; customer_name: string; date: string; status: string; order_id: string; }
interface FinancialData { orders: number; revenue: number; received: number; expenses: number; balanceDue: number; }

interface ConsolidatedMetricsData {
  total_revenue: number;
  total_paid: number;
  total_expenses: number;
  balance_due: number;
  total_orders_count: number;
  total_customers_count: number;
  orders_fully_paid_count: number;
  orders_partial_count: number;
  orders_due_count: number;
  orders_overdue_count: number;
  stock_alerts_count: number;
}

interface DashboardData {
  financialSummaryData: FinancialData | null;
  previousFinancialSummaryData: FinancialData | null;
  revenueChartData: RevenueChartDataPoint[];
  dailyOrdersChartData: OrdersChartDataPoint[];
  pendingOrders: PendingOrder[];
  consolidatedMetrics: ConsolidatedMetricsData | null;
}

const Dashboard: React.FC = () => {
  const { userProfile } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchDashboardData = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const previousMonthDate = new Date(month);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousMonth = previousMonthDate.toISOString().slice(0, 7);
      
      const fromDateForRevenue = new Date(month);
      fromDateForRevenue.setDate(1);

      const [
        pendingOrdersResponse,
        dailyOrdersResponse,
        currentMonthSummaryResponse,
        previousMonthSummaryResponse,
        revenueResponse,
        consolidatedMetricsResponse,
      ] = await Promise.all([
        supabase.rpc('get_recent_pending_orders'),
        supabase.rpc('get_daily_order_counts', { days_to_check: 7 }),
        supabase.rpc('get_financial_summary', { month: month }),
        supabase.rpc('get_financial_summary', { month: previousMonth }),
        supabase.from('order_summary_with_dues').select('total_amount, date').gte('date', fromDateForRevenue.toISOString()),
        supabase.rpc('get_dashboard_metrics'),
      ]);

      const errors = [
        pendingOrdersResponse.error, 
        dailyOrdersResponse.error, 
        currentMonthSummaryResponse.error, 
        previousMonthSummaryResponse.error, 
        revenueResponse.error,
        consolidatedMetricsResponse.error 
      ].filter(Boolean);
      if (errors.length > 0) throw new Error(errors.map(e => e.message).join(', '));


      const financialData = currentMonthSummaryResponse.data?.[0];
      const prevFinancialData = previousMonthSummaryResponse.data?.[0];
      const revenueData = revenueResponse.data || [];
      const consolidatedMetrics = consolidatedMetricsResponse.data?.[0];

      const revenueByDate = revenueData.reduce((acc: Record<string, number>, order) => {
        const date = new Date(order.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (order.total_amount || 0);
        return acc;
      }, {});
      const revenueChartData = Object.entries(revenueByDate).map(([date, value]) => ({ date, value })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setData({
        dailyOrdersChartData: dailyOrdersResponse.data || [],
        pendingOrders: pendingOrdersResponse.data || [],
        financialSummaryData: financialData ? { orders: financialData.total_orders, revenue: financialData.total_revenue, received: financialData.total_paid, expenses: financialData.total_expenses, balanceDue: financialData.balance_due } : null,
        previousFinancialSummaryData: prevFinancialData ? { orders: prevFinancialData.total_orders, revenue: prevFinancialData.total_revenue, received: prevFinancialData.total_paid, expenses: prevFinancialData.total_expenses, balanceDue: prevFinancialData.balance_due } : null,
        revenueChartData,
        consolidatedMetrics: consolidatedMetrics || null,
      });

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(currentMonth);
  }, [currentMonth, fetchDashboardData]);

  const MonthSelector = () => (
      <input 
        type="month"
        value={currentMonth}
        onChange={(e) => setCurrentMonth(e.target.value)}
        className="input bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-sm"
      />
  );

  if (loading) {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="flex justify-between items-center"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40"></div></div>
            <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="lg:col-span-1 h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div></div>
        </div>
    );
  }
  
  if (error) {
    return (
        <Card className="m-4 p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/30"><AlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-lg font-medium">Something went wrong</h3><p className="mt-1 text-sm">{error}</p></Card>
    );
  }
  
  if (!data || !data.consolidatedMetrics) { 
    return (
      <Card className="m-4 p-12 text-center text-gray-500 dark:text-gray-400"><Frown className="mx-auto h-12 w-12" /><h3 className="mt-2 text-lg font-medium">No Data Available</h3><p className="mt-1 text-sm">Could not fetch dashboard data or metrics.</p></Card>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome, {userProfile?.name || 'Owner'}! 
            {userProfile?.role && (
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({userProfile.role})</span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Here's the financial snapshot for your selected month.</p>
        </div>
        <MonthSelector />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <DashboardMetrics 
            metricsData={data.consolidatedMetrics} 
            loading={loading} 
            error={error} 
          />
      </motion.div>
      
      <FinancialSummary data={data.financialSummaryData} previousData={data.previousFinancialSummaryData} loading={loading}/>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card title="Monthly Revenue Trend">
              <div className="h-80">
                <RevenueChart data={data.revenueChartData} />
              </div>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card title="Daily Orders (Last 7 Days)">
              <div className="h-80">
                <OrdersChart data={data.dailyOrdersChartData} />
              </div>
            </Card>
        </div>

        <div className="lg:col-span-3">
          <ActivityLogFeed />
        </div>

        <div className="lg:col-span-3">
            <OrderStatusCard orders={data.pendingOrders} loading={loading} error={error} onStatusUpdated={() => fetchDashboardData(currentMonth)} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
