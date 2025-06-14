import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

interface EditableOrderData {
  customer_name: string;
  customer_phone: string;
  order_type: string;
  quantity: number;
  delivery_date: string;
  payment_method: string;
  notes: string;
  designer_name: string;
  design_needed: boolean;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, order, onOrderUpdated }) => {
  const [formData, setFormData] = useState<EditableOrderData>({
    customer_name: '',
    customer_phone: '',
    order_type: '',
    quantity: 1,
    delivery_date: '',
    payment_method: '',
    notes: '',
    designer_name: '',
    design_needed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
    }
  }, [isOpen, order]);

  const fetchOrderDetails = async () => {
    if (!order) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.order_id)
        .single();

      if (fetchError) throw fetchError;

      setFormData({
        customer_name: data.customer_name || '',
        customer_phone: data.customer_phone || '',
        order_type: data.order_type || '',
        quantity: data.quantity || 1,
        delivery_date: data.delivery_date || '',
        payment_method: data.payment_method || '',
        notes: data.notes || '',
        designer_name: data.designer_name || '',
        design_needed: data.design_needed || false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
            type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setLoading(true);
    setError(null);

    const promise = supabase
      .from('orders')
      .update({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        order_type: formData.order_type,
        quantity: formData.quantity,
        delivery_date: formData.delivery_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
        designer_name: formData.designer_name,
        design_needed: formData.design_needed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.order_id);

    toast.promise(promise, {
      loading: 'Updating order...',
      success: 'Order updated successfully!',
      error: (err) => `Failed to update order: ${err.message}`
    });

    try {
      const { error: updateError } = await promise;
      if (updateError) throw updateError;

      onOrderUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Order #${order.order_id}`} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="customer_name"
            label="Customer Name *"
            value={formData.customer_name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Input
            id="customer_phone"
            label="Customer Phone"
            type="tel"
            value={formData.customer_phone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="order_type"
            label="Order Type *"
            value={formData.order_type}
            onChange={handleChange}
            options={[
              { value: 'Business Cards', label: 'Business Cards' },
              { value: 'Invitation Cards', label: 'Invitation Cards' },
              { value: 'Flyers', label: 'Flyers' },
              { value: 'Brochures', label: 'Brochures' },
              { value: 'Posters', label: 'Posters' },
              { value: 'Banners', label: 'Banners' },
            ]}
            required
            disabled={loading}
          />
          <Input
            id="quantity"
            label="Quantity *"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="delivery_date"
            label="Delivery Date *"
            type="date"
            value={formData.delivery_date}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <Select
            id="payment_method"
            label="Payment Method"
            value={formData.payment_method}
            onChange={handleChange}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Credit Card', label: 'Credit Card' },
              { value: 'Check', label: 'Check' },
            ]}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="design_needed"
              checked={formData.design_needed}
              onChange={handleChange}
              disabled={loading}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="design_needed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Design Needed
            </label>
          </div>
          {formData.design_needed && (
            <Input
              id="designer_name"
              label="Designer Name"
              value={formData.designer_name}
              onChange={handleChange}
              disabled={loading}
            />
          )}
        </div>

        <TextArea
          id="notes"
          label="Notes"
          value={formData.notes}
          onChange={handleChange}
          disabled={loading}
          rows={3}
          placeholder="Any additional notes about this order..."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditOrderModal;