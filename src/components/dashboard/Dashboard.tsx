// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Frown, RefreshCw, GripVertical, Calendar } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Import sub-components
import DashboardMetrics from './DashboardMetrics'; 
import RevenueChart from './RevenueChart';
import OrderStatusCard from './OrderStatusCard';
import OrdersChart from './OrdersChart';
import FinancialSummary from './summary/FinancialSummary';
import ActivityLogFeed from './ActivityLogFeed';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Keep existing data types
interface RevenueChartDataPoint { date: string; value: number; }
interface OrdersChartDataPoint { day: string; order_count: number; }
interface PendingOrder { id: number; customer_name: string; date: string; status: string; order_id: string; }
interface FinancialData { orders: number; revenue: number; received: number; expenses: number; balanceDue: number; }
interface ConsolidatedMetricsData {
  total_revenue: number; total_paid: number; total_expenses: number;
  balance_due: number; total_orders_count: number; total_customers_count: number;
  orders_fully_paid_count: number; orders_partial_count: number;
  orders_due_count: number; orders_overdue_count: number; stock_alerts_count: number;
}
interface DashboardData {
  financialSummaryData: FinancialData | null; previousFinancialSummaryData: FinancialData | null;
  revenueChartData: RevenueChartDataPoint[]; dailyOrdersChartData: OrdersChartDataPoint[];
  pendingOrders: PendingOrder[]; consolidatedMetrics: ConsolidatedMetricsData | null;
}

// --- Reusable Draggable Card Wrapper ---
const DraggableDashboardCard = ({ title, provided, isDragging, children }: any) => (
    <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1' : 'shadow-sm'}`}
    >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={20} />
            </div>
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

// --- Component configuration for Drag-and-Drop ---
const componentList = [
    { id: 'metrics', title: 'Overall Metrics', component: DashboardMetrics, gridClass: 'lg:col-span-3' },
    { id: 'financialSummary', title: 'Monthly Financial Summary', component: FinancialSummary, gridClass: 'lg:col-span-3' },
    { id: 'revenueChart', title: 'Monthly Revenue Trend', component: RevenueChart, gridClass: 'lg:col-span-2' },
    { id: 'ordersChart', title: 'Daily Orders (Last 7 Days)', component: OrdersChart, gridClass: 'lg:col-span-1' },
    { id: 'orderStatus', title: 'Pending Orders', component: OrderStatusCard, gridClass: 'lg:col-span-2' },
    { id: 'activityFeed', title: 'Recent Activity', component: ActivityLogFeed, gridClass: 'lg:col-span-1' },
];

const DEFAULT_ORDER = componentList.map(c => c.id);

const Dashboard: React.FC = () => {
  const { userProfile } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [componentOrder, setComponentOrder] = useState<string[]>(() => {
    try {
        const savedOrder = localStorage.getItem('dashboardOrder');
        return savedOrder ? JSON.parse(savedOrder) : DEFAULT_ORDER;
    } catch {
        return DEFAULT_ORDER;
    }
  });

  const fetchDashboardData = useCallback(async (month: string) => {
    // ... (Your existing data fetching logic is perfect and remains unchanged)
    setLoading(true);
    setError(null);
    try {
      const previousMonthDate = new Date(month);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousMonth = previousMonthDate.toISOString().slice(0, 7);
      const fromDateForRevenue = new Date(month); fromDateForRevenue.setDate(1);
      
      const [ p1, p2, p3, p4, p5, p6 ] = await Promise.all([
        supabase.rpc('get_recent_pending_orders'),
        supabase.rpc('get_daily_order_counts', { days_to_check: 7 }),
        supabase.rpc('get_financial_summary', { p_month: month }),
        supabase.rpc('get_financial_summary', { p_month: previousMonth }),
        supabase.from('order_summary_with_dues').select('total_amount, date').gte('date', fromDateForRevenue.toISOString()),
        supabase.rpc('get_dashboard_metrics'),
      ]);

      const responses = [p1,p2,p3,p4,p5,p6];
      const firstError = responses.find(res => res.error);
      if(firstError?.error) throw firstError.error;

      const [ pendingOrdersResponse, dailyOrdersResponse, currentMonthSummaryResponse, previousMonthSummaryResponse, revenueResponse, consolidatedMetricsResponse ] = responses;

      const financialData = currentMonthSummaryResponse.data?.[0];
      const prevFinancialData = previousMonthSummaryResponse.data?.[0];
      const revenueData = revenueResponse.data || [];
      const consolidatedMetrics = consolidatedMetricsResponse.data?.[0];

      const revenueByDate = revenueData.reduce((acc: Record<string, number>, order: any) => {
        const date = new Date(order.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (order.total_amount || 0);
        return acc;
      }, {});
      const revenueChartData = Object.entries(revenueByDate).map(([date, value]) => ({ date, value })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setData({
        dailyOrdersChartData: dailyOrdersResponse.data || [], pendingOrders: pendingOrdersResponse.data || [],
        financialSummaryData: financialData ? { orders: financialData.total_orders, revenue: financialData.total_revenue, received: financialData.total_paid, expenses: financialData.total_expenses, balanceDue: financialData.balance_due } : null,
        previousFinancialSummaryData: prevFinancialData ? { orders: prevFinancialData.total_orders, revenue: prevFinancialData.total_revenue, received: prevFinancialData.total_paid, expenses: prevFinancialData.total_expenses, balanceDue: prevFinancialData.balance_due } : null,
        revenueChartData, consolidatedMetrics: consolidatedMetrics || null,
      });

    } catch (err: any) {
      console.error("Detailed error in fetchDashboardData:", err);
      setError(err.message || "An unknown error occurred while loading dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(currentMonth);
  }, [currentMonth, fetchDashboardData]);
  
  useEffect(() => {
    try {
        localStorage.setItem('dashboardOrder', JSON.stringify(componentOrder));
    } catch (error) {
        console.error("Failed to save dashboard order to localStorage:", error);
    }
  }, [componentOrder]);

  const onDragEnd = (result: DropResult) => {
    // ... (Your existing onDragEnd logic remains unchanged)
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newOrder = Array.from(componentOrder);
    const [reorderedItem] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, reorderedItem);
    setComponentOrder(newOrder);
  };
  
  const resetLayout = () => {
    setComponentOrder(DEFAULT_ORDER);
    localStorage.removeItem('dashboardOrder');
    toast.success("Dashboard layout has been reset!");
  };

  const renderComponent = (id: string) => {
    if (!data || !data.consolidatedMetrics) return null;
    
    switch (id) {
        case 'metrics':
            return <DashboardMetrics metricsData={data.consolidatedMetrics} loading={loading} />;
        case 'financialSummary':
            return <FinancialSummary data={data.financialSummaryData} previousData={data.previousFinancialSummaryData} loading={loading}/>;
        case 'revenueChart':
            return <div className="h-80"><RevenueChart data={data.revenueChartData} /></div>;
        case 'ordersChart':
            return <div className="h-80"><OrdersChart data={data.dailyOrdersChartData} /></div>;
        case 'activityFeed':
            return <ActivityLogFeed />;
        case 'orderStatus':
            return <OrderStatusCard orders={data.pendingOrders} loading={loading} onStatusUpdated={() => fetchDashboardData(currentMonth)} />;
        default:
            return null;
    }
  };

  const MonthSelector = () => (
    <div className="relative">
        <Calendar className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" />
        <input 
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
    </div>
  );
  
  // Improved Loading Skeleton
  if (loading && !data) {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="flex justify-between items-center"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40"></div></div>
            <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl lg:col-span-3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div><div className="lg:col-span-1 h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div><div className="lg:col-span-1 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div></div>
        </div>
    );
  }
  
  if (error) {
    return (
        <Card className="m-4 p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/30"><AlertTriangle className="mx-auto h-12 w-12" /><h3 className="mt-2 text-lg font-medium">Something went wrong</h3><p className="mt-1 text-sm whitespace-pre-line">{error}</p></Card>
    );
  }
  
  if (!data || !data.consolidatedMetrics) { 
    return (
        <Card className="m-4 p-12 text-center text-gray-500 dark:text-gray-400"><Frown className="mx-auto h-12 w-12" /><h3 className="mt-2 text-lg font-medium">No Data Available</h3><p className="mt-1 text-sm">Could not fetch dashboard data for the selected month.</p></Card>
    );
  }


  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, {userProfile?.name || 'Owner'}!</p>
        </div>
        <div className="flex items-center gap-2">
            <MonthSelector />
            <Button onClick={resetLayout} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Layout
            </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard">
            {(provided) => (
                <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {componentOrder.map((id, index) => {
                        const component = componentList.find(c => c.id === id);
                        if (!component) return null;
                        
                        return (
                            <Draggable key={id} draggableId={id} index={index}>
                                {(provided, snapshot) => (
                                    <div className={`${component.gridClass}`}>
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
                                            <DraggableDashboardCard 
                                                title={component.title}
                                                provided={provided}
                                                isDragging={snapshot.isDragging}
                                            >
                                               {renderComponent(id)}
                                            </DraggableDashboardCard>
                                        </motion.div>
                                    </div>
                                )}
                            </Draggable>
                        );
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Dashboard;