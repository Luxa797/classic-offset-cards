// src/components/customers/CustomerOrdersModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal'; // உங்கள் Modal கூறின் பாதை
import { Loader2, AlertTriangle, FileX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

// View-லிருந்து வரும் தரவிற்கான வகை
interface Order {
  order_id: number;
  order_type: string;
  quantity: number;
  total_amount: number;
  status?: string;
  created_at: string; // Changed from 'date' to 'created_at'
}

interface CustomerOrdersModalProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({ customerId, customerName, isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
          // ✅ முக்கிய மாற்றம்: orders table-லிருந்து நேரடியாக தரவை பெறுகிறோம்
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, order_type, quantity, total_amount, created_at')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

          if (ordersError) throw ordersError;

          // ஒவ்வொரு order-க்கும் latest status-ஐ பெறுகிறோம்
          const ordersWithStatus = await Promise.all(
            (ordersData || []).map(async (order) => {
              const { data: statusData } = await supabase
                .from('order_status_log')
                .select('status')
                .eq('order_id', order.id)
                .order('updated_at', { ascending: false })
                .limit(1);

              return {
                order_id: order.id,
                order_type: order.order_type,
                quantity: order.quantity,
                total_amount: order.total_amount,
                status: statusData?.[0]?.status || 'N/A',
                created_at: order.created_at
              };
            })
          );
          
          setOrders(ordersWithStatus);
        } catch (err: any) {
            console.error('Error fetching orders for customer:', err);
            setError(err.message || 'Could not load orders.');
        } finally {
            setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [isOpen, customerId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🧾 Orders for ${customerName}`}
      size="2xl" // Modal-ஐ சற்று பெரிதாக்கலாம்
    >
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="py-10 text-center text-red-600">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <FileX className="mx-auto h-10 w-10 mb-2" />
          <p>No orders found for this customer.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              <tr>
                <th className="px-4 py-2">Order #</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">#{order.order_id}</td>
                  <td className="px-4 py-2">{order.order_type}</td>
                  <td className="px-4 py-2">{order.quantity}</td>
                  <td className="px-4 py-2">₹{order.total_amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium
                      ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                       order.status === 'Printing' ? 'bg-blue-100 text-blue-700' :
                       order.status === 'Design' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-red-100 text-red-700'}`}>
                      {order.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/invoices/${order.order_id}`}>
                      <Button variant="link" size="sm">View Invoice</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default CustomerOrdersModal;