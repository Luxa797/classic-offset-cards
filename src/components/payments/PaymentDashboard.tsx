// src/components/dashboard/PaymentDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, 
  Users, CreditCard, AlertTriangle, CheckCircle,
  Calendar, BarChart3, PieChart, Activity, Loader2, Info
} from 'lucide-react';

// --- Data Interfaces ---
interface PaymentMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  averageOrderValue: number;
  ordersByStatus: {
    paid: number;
    partial: number;
    due: number;
    overdue: number;
  };
  recentPayments: number;
  paymentMethods: Record<string, number>;
}

interface RecentPayment {
  id: string;
  customer_name: string;
  amount_paid: number;
  status: string;
  created_at: string;
}

interface SummaryOrderData {
  order_id: number;
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  date: string;
  delivery_date?: string;
  due_status: 'Paid' | 'Overdue' | 'Due Soon';
}

// --- Reusable Metric Card Component ---
const MetricDisplayCard = ({ title, value, detail, icon, iconBgColor }: { title: string; value: string; detail: string; icon: React.ReactNode; iconBgColor: string; }) => (
    <Card className="p-5 bg-white dark:bg-gray-800 flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
        <div className={`p-4 rounded-full ${iconBgColor}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{detail}</p>
        </div>
    </Card>
);

const PaymentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data: summaryOrders, error: summaryOrdersError } = await supabase
        .from('order_summary_with_dues')
        .select(`order_id, customer_name, total_amount, amount_paid, balance_due, date, delivery_date, due_status`)
        .gte('date', daysAgo.toISOString())
        .order('date', { ascending: false });

      if (summaryOrdersError) throw summaryOrdersError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`id, amount_paid, payment_method, created_at, customers (name)`)
        .gte('created_at', daysAgo.toISOString());

      if (paymentsError) throw paymentsError;

      // --- Data Processing Logic (Unchanged) ---
      const totalOrders = summaryOrders?.length || 0;
      const totalRevenue = summaryOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalReceived = summaryOrders?.reduce((sum, o) => sum + (o.amount_paid || 0), 0) || 0;
      const pendingAmount = summaryOrders?.reduce((sum, o) => sum + (o.balance_due || 0), 0) || 0;
      const overdueAmount = summaryOrders?.reduce((sum, o) => sum + (o.due_status === 'Overdue' ? (o.balance_due || 0) : 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const ordersByStatus = summaryOrders?.reduce((acc, o) => {
        if ((o.balance_due || 0) <= 0) acc.paid += 1;
        else if (o.due_status === 'Overdue') acc.overdue += 1;
        else if (o.due_status === 'Due Soon') {
            if ((o.amount_paid || 0) > 0) acc.partial += 1; else acc.due += 1;
        }
        return acc;
      }, { paid: 0, partial: 0, due: 0, overdue: 0 }) || { paid: 0, partial: 0, due: 0, overdue: 0 };
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const recentPaymentsCount = payments?.filter(p => new Date(p.created_at) > weekAgo).length || 0;
      const paymentMethods = payments?.reduce((acc, p) => {
        const method = p.payment_method || 'Unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setMetrics({
        totalOrders, totalRevenue, totalReceived, pendingAmount, overdueAmount,
        averageOrderValue, ordersByStatus, recentPayments: recentPaymentsCount, paymentMethods
      });
      
      const recent = payments?.map(p => ({
        id: p.id, customer_name: (p.customers as any)?.name || 'Unknown', amount_paid: p.amount_paid,
        status: 'Paid', created_at: p.created_at
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) || [];
      setRecentPayments(recent);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- Main Render Logic ---
  if (loading) {
    return (
      <div className="p-6 space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="p-10 text-center bg-white dark:bg-gray-800">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Failed to Load Data</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{error || "Could not retrieve payment metrics."}</p>
      </Card>
    );
  }
  
  const totalStatusCount = Object.values(metrics.ordersByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Dashboard</h1>
        <div className="relative">
            <Calendar className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" />
            <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
            >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
            </select>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricDisplayCard title="Total Collected" value={`₹${metrics.totalReceived.toLocaleString()}`} detail={`from ${metrics.totalOrders} orders`} icon={<DollarSign className="w-7 h-7 text-green-600" />} iconBgColor="bg-green-100 dark:bg-green-900/50" />
        <MetricDisplayCard title="Pending Amount" value={`₹${metrics.pendingAmount.toLocaleString()}`} detail={`${metrics.ordersByStatus.due + metrics.ordersByStatus.partial} orders pending`} icon={<Clock className="w-7 h-7 text-yellow-600" />} iconBgColor="bg-yellow-100 dark:bg-yellow-900/50" />
        <MetricDisplayCard title="Overdue Amount" value={`₹${metrics.overdueAmount.toLocaleString()}`} detail={`${metrics.ordersByStatus.overdue} overdue orders`} icon={<AlertTriangle className="w-7 h-7 text-red-600" />} iconBgColor="bg-red-100 dark:bg-red-900/50" />
        <MetricDisplayCard title="Avg. Order Value" value={`₹${metrics.averageOrderValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}`} detail={`${metrics.recentPayments} payments this week`} icon={<BarChart3 className="w-7 h-7 text-blue-600" />} iconBgColor="bg-blue-100 dark:bg-blue-900/50" />
      </div>

      {/* Status & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-800 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><PieChart className="w-5 h-5" />Order Payment Status</h3>
          <div className="space-y-4">
             {Object.entries(metrics.ordersByStatus).map(([status, count]) => {
                const colors = { paid: 'bg-green-500', partial: 'bg-yellow-500', due: 'bg-blue-500', overdue: 'bg-red-500'};
                const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
                return(
                    <div key={status}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                            <span className="font-semibold text-gray-800 dark:text-white">{count} Orders</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className={`${colors[status as keyof typeof colors]} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                )
            })}
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-800 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Activity className="w-5 h-5" />Recent Transactions</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full"><CheckCircle className="w-5 h-5 text-green-600"/></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{payment.customer_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(payment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</p>
                      </div>
                  </div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">₹{payment.amount_paid.toLocaleString('en-IN')}</p>
                </div>
              ))
            ) : <div className="text-center py-12 text-gray-500 dark:text-gray-400"><DollarSign className="w-10 h-10 mx-auto text-gray-400" /><p className="mt-2">No recent payment transactions</p></div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDashboard;
