import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Calendar, User, Package, DollarSign, Phone, MapPin, FileText, Clock, Loader2 } from 'lucide-react';
import { Order } from './OrdersTable';
import OrderStatusStepper from './OrderStatusStepper';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

interface OrderDetails extends Order {
  total_amount: number;
  amount_received: number;
  balance_amount: number;
  payment_method: string;
  notes?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  designer_name?: string;
  design_needed: boolean;
}

interface StatusHistory {
  id: string;
  status: string;
  updated_by: string;
  updated_at: string;
  notes?: string;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            phone,
            email,
            address
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('order_status_log')
        .select('*')
        .eq('order_id', orderId)
        .order('updated_at', { ascending: false });

      if (historyError) throw historyError;

      setOrderDetails({
        ...orderData,
        order_id: orderData.id,
        customer_name: orderData.customers?.name || orderData.customer_name,
        customer_phone: orderData.customers?.phone || orderData.customer_phone,
        customer_email: orderData.customers?.email,
        customer_address: orderData.customers?.address,
      });
      setStatusHistory(historyData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Details #${orderId}`} size="2xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading order details...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p className="font-semibold">Error loading order details</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : orderDetails ? (
        <div className="space-y-6">
          {/* Order Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Current Status</h3>
            <OrderStatusStepper currentStatus={orderDetails.status as any} />
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{orderDetails.customer_name}</span>
                </div>
                {orderDetails.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{orderDetails.customer_phone}</span>
                  </div>
                )}
                {orderDetails.customer_email && (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-gray-400">@</span>
                    <span>{orderDetails.customer_email}</span>
                  </div>
                )}
                {orderDetails.customer_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{orderDetails.customer_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{orderDetails.order_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-gray-400">#</span>
                  <span>Quantity: {orderDetails.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Order Date: {new Date(orderDetails.date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Delivery: {new Date(orderDetails.delivery_date).toLocaleDateString('en-GB')}</span>
                </div>
                {orderDetails.designer_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Designer: {orderDetails.designer_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                <p className="font-semibold text-lg">₹{orderDetails.total_amount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount Received:</span>
                <p className="font-semibold text-lg text-green-600">₹{orderDetails.amount_received?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Balance Due:</span>
                <p className={`font-semibold text-lg ${orderDetails.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{orderDetails.balance_amount?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            {orderDetails.payment_method && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Payment Method: </span>
                <span className="font-medium">{orderDetails.payment_method}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {orderDetails.notes && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" />
                Notes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{orderDetails.notes}</p>
            </div>
          )}

          {/* Status History */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5" />
              Status History
            </h3>
            {statusHistory.length > 0 ? (
              <div className="space-y-3">
                {statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-white">{entry.status}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {entry.updated_by} • {new Date(entry.updated_at).toLocaleString('en-GB')}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No status history available</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => window.open(`/invoices/${orderId}`, '_blank')}
              variant="primary"
            >
              View Invoice
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default OrderDetailsModal;