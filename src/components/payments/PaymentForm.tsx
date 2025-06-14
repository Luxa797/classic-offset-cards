import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/activityLogger';

// Customer and Order interfaces
interface Customer {
  id: string;
  name: string;
  phone?: string;
}

// Order interface will still reflect 'orders' table column names for update operations
// but values will be populated from 'order_summary_with_dues'
interface Order {
  id: number;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  amount_received: number; // Corresponds to amount_paid from view
  balance_amount: number; // Corresponds to balance_due from view
}

interface PaymentFormProps {
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
  const { user, userProfile } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    totalAmount: '',
    amountPaid: '',
    dueDate: '',
    status: 'Due',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers and orders on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name, phone')
          .order('name');
        
        if (customersError) throw customersError;
        setCustomers(customersData || []);

        // UPDATED: Fetch orders from order_summary_with_dues view for consistency
        const { data: ordersData, error: ordersError } = await supabase
          .from('order_summary_with_dues') // Use the view
          .select('order_id, customer_id, customer_name, total_amount, amount_paid, balance_due') // Select view's columns
          .gt('balance_due', 0) // Only get orders with a balance greater than 0
          .order('order_id', { ascending: false });

        if (ordersError) throw ordersError;

        // Map view data to the 'Order' interface, converting names for internal consistency
        const processedOrders = (ordersData || []).map(o => ({
            id: o.order_id, // Use view's order_id as Order.id
            customer_id: o.customer_id,
            customer_name: o.customer_name,
            total_amount: o.total_amount,
            amount_received: o.amount_paid, // Map view's amount_paid to Order.amount_received
            balance_amount: o.balance_due,  // Map view's balance_due to Order.balance_amount
        }));

        setOrders(processedOrders);
      } catch (err: any) {
        setError("Failed to load initial data. Please refresh the page.");
        console.error('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Filter orders when customer changes
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setFormData({ ...formData, customerId, orderId: '', totalAmount: '', amountPaid: '' });
    setSelectedOrder(null);
    
    if (customerId) {
      const customerOrders = orders.filter(order => order.customer_id === customerId);
      setFilteredOrders(customerOrders);
    } else {
      setFilteredOrders([]);
    }
  };

  // Handle order selection
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderIdStr = e.target.value;
    const orderId = orderIdStr ? parseInt(orderIdStr, 10) : null;
    
    setFormData({ 
      ...formData, 
      orderId: orderIdStr,
      totalAmount: '',
      amountPaid: ''
    });

    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        // Use order's total_amount as the authoritative source
        setFormData(prev => ({
          ...prev,
          totalAmount: String(order.total_amount || 0),
          amountPaid: ''
        }));
      }
    } else {
      setSelectedOrder(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Calculate payment status based on amounts
  const calculateStatus = (totalAmount: number, amountPaid: number): string => {
    if (amountPaid >= totalAmount) return 'Paid';
    if (amountPaid > 0) return 'Partial';
    return 'Due';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in to add a payment.");
      return;
    }

    if (!selectedOrder) {
      setError("Please select a valid order.");
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    const amountPaid = parseFloat(formData.amountPaid);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }

    if (isNaN(amountPaid) || amountPaid <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (amountPaid > totalAmount) {
      setError("Payment amount cannot be greater than total amount.");
      return;
    }

    setLoading(true);

    try {
      // Calculate status based on payment
      const calculatedStatus = calculateStatus(totalAmount, amountPaid);

      // Create payment record - ensure total_amount is never null
      const paymentData = {
        customer_id: formData.customerId,
        order_id: parseInt(formData.orderId),
        total_amount: selectedOrder.total_amount || 0, // Provide default value of 0 if null/undefined
        amount_paid: amountPaid, // Amount being paid now from the form
        due_date: formData.dueDate || null,
        status: calculatedStatus,
        payment_date: formData.paymentDate,
        created_by: user.id,
        payment_method: formData.paymentMethod,
        notes: formData.notes || null,
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      // Update the order's payment information in the 'orders' table
      // Use amount_received and balance_amount as these are columns in the 'orders' table
      const newAmountReceived = (selectedOrder.amount_received || 0) + amountPaid;
      const newBalanceAmount = (selectedOrder.total_amount || 0) - newAmountReceived;

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          amount_received: newAmountReceived,
          balance_amount: newBalanceAmount
        })
        .eq('id', selectedOrder.id);

      if (orderUpdateError) throw orderUpdateError;

      toast.success('Payment recorded successfully!');

      // Log activity
      const userName = userProfile?.name || 'Admin';
      const activityMessage = `Received a payment of ₹${amountPaid.toLocaleString('en-IN')} for Order #${selectedOrder.id} from ${selectedOrder.customer_name}.`;
      await logActivity(activityMessage, userName);
      
      // Reset form
      setFormData({
        customerId: '',
        orderId: '',
        totalAmount: '',
        amountPaid: '',
        dueDate: '',
        status: 'Due',
        paymentDate: new  Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: '',
      });
      setSelectedOrder(null);
      setFilteredOrders([]);
      
      onSuccess();

    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Due', label: 'Due' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
  ];

  const paymentMethodOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'Check', label: 'Check' },
  ];

  return (
    <Card title="Record New Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Selection */}
        <Select
          id="customerId"
          label="Customer *"
          value={formData.customerId}
          onChange={handleCustomerChange}
          options={customers.map(customer => ({
            value: customer.id,
            label: `${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`
          }))}
          placeholder="Select a customer"
          required
          disabled={loading}
        />

        {/* Order Selection */}
        <Select
          id="orderId"
          label="Order *"
          value={formData.orderId}
          onChange={handleOrderChange}
          options={filteredOrders.map(order => ({
            value: String(order.id),
            label: `Order #${order.id} - Due: ₹${order.balance_amount.toLocaleString('en-IN')}` // Using balance_amount from the mapped view data
          }))}
          placeholder="Select an order"
          required
          disabled={!formData.customerId || loading}
        />

        {/* Order Details Display */}
        {selectedOrder && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Order Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Total Amount:</span>
                <div className="font-semibold">₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Already Paid:</span>
                <div className="font-semibold text-green-600">₹{(selectedOrder.amount_received || 0).toLocaleString('en-IN')}</div> {/* Using amount_received from mapped view data */}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Balance Due:</span>
                <div className="font-semibold text-red-600">₹{(selectedOrder.balance_amount || 0).toLocaleString('en-IN')}</div> {/* Using balance_amount from mapped view data */}
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="totalAmount"
            label="Total Amount (₹) *"
            type="number"
            step="0.01"
            min="0"
            value={formData.totalAmount}
            onChange={handleInputChange}
            required
            disabled={loading || !selectedOrder}
            placeholder="Total order amount"
          />

          <Input
            id="amountPaid"
            label="Amount Paid (₹) *"
            type="number"
            step="0.01"
            min="0"
            value={formData.amountPaid}
            onChange={handleInputChange}
            required
            disabled={loading || !selectedOrder}
            placeholder="Amount being paid now"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="paymentDate"
            label="Payment Date *"
            type="date"
            value={formData.paymentDate}
            onChange={handleInputChange}
            required
            disabled={loading}
          />

          <Input
            id="dueDate"
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="status"
            label="Payment Status"
            value={formData.status}
            onChange={handleInputChange}
            options={statusOptions}
            disabled={loading}
          />

          <Select
            id="paymentMethod"
            label="Payment Method"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            options={paymentMethodOptions}
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={handleInputChange}
            disabled={loading}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Any additional notes about this payment..."
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !selectedOrder}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Recording Payment...
            </>
          ) : (
            'Record Payment'
          )}
        </Button>
      </form>
    </Card>
  );
};

export default PaymentForm;
