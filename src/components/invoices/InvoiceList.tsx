import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Eye, Loader2, AlertTriangle, Search } from 'lucide-react';

// View-லிருந்து வரும் தரவிற்கான இடைமுகம்
interface InvoiceRow {
  order_id: number;
  customer_name: string;
  // customers அட்டவணையிலிருந்து phone எண்ணைப் பெற View-ஐ மாற்றியமைக்க வேண்டும்,
  // அல்லது இங்கே தனி அழைப்பு தேவை. தற்போதைக்கு phone எண்ணை நீக்குகிறோம்.
  // phone: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ முக்கிய மாற்றம்: order_summary_with_dues View-லிருந்து நேரடியாகத் தரவைப் பெறுகிறோம்
        const { data, error: viewError } = await supabase
          .from('order_summary_with_dues')
          .select('order_id, customer_name, total_amount, amount_paid, balance_due')
          .order('order_id', { ascending: false });

        if (viewError) throw viewError;

        setInvoices(data || []);
      } catch (err: any) {
        console.error('Error fetching invoice data:', err);
        setError(`Failed to load invoices. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lowercasedTerm = searchTerm.toLowerCase();
    return invoices.filter(inv =>
      inv.customer_name?.toLowerCase().includes(lowercasedTerm) ||
      String(inv.order_id).includes(lowercasedTerm)
    );
  }, [invoices, searchTerm]);


  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 m-4 bg-red-50 text-red-700 border border-red-300 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500"/>
        <p className="font-semibold">Error Loading Data</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">🧾 All Invoices</h1>
      
      <Card>
        <div className="p-4">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
                 <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                 </span>
                <Input
                    id="search-invoices"
                    type="search"
                    placeholder="Search by Customer or Order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.map((inv) => (
                <tr key={inv.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">#{inv.order_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{inv.customer_name || '-'}</td>
                  <td className="px-4 py-3">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-green-600">₹{inv.amount_paid.toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 font-bold ${inv.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{inv.balance_due.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold
                        ${inv.balance_due <= 0 ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200' :
                        inv.amount_paid > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200'}`}>
                        {inv.balance_due <= 0 ? 'Paid' : inv.amount_paid > 0 ? 'Partial' : 'Due'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/invoices/${inv.order_id}`}>
                        <Button variant="icon" size="sm" title="View Invoice">
                            <Eye className="w-4 h-4 text-primary-600"/>
                        </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InvoiceList;