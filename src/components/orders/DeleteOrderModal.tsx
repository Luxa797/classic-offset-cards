import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderDeleted: () => void;
}

const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({ isOpen, onClose, order, onOrderDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  const handleDelete = async () => {
    if (!order) return;

    setLoading(true);
    
    try {
      if (deleteType === 'soft') {
        // Soft delete - mark as deleted but keep record
        const promise = supabase
          .from('orders')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            status: 'Cancelled'
          })
          .eq('id', order.order_id);

        toast.promise(promise, {
          loading: 'Marking order as deleted...',
          success: 'Order marked as deleted successfully!',
          error: (err) => `Failed to delete order: ${err.message}`
        });

        const { error } = await promise;
        if (error) throw error;

        // Log the deletion
        await supabase.from('order_status_log').insert({
          order_id: order.order_id,
          status: 'Cancelled',
          updated_by: 'System',
          notes: 'Order soft deleted'
        });

      } else {
        // Hard delete - permanently remove record
        const promise = supabase
          .from('orders')
          .delete()
          .eq('id', order.order_id);

        toast.promise(promise, {
          loading: 'Permanently deleting order...',
          success: 'Order permanently deleted!',
          error: (err) => `Failed to delete order: ${err.message}`
        });

        const { error } = await promise;
        if (error) throw error;
      }

      onOrderDeleted();
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Order" size="md">
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              Delete Order #{order.order_id}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              Customer: {order.customer_name}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose how you want to delete this order:
          </p>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                name="deleteType"
                value="soft"
                checked={deleteType === 'soft'}
                onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Soft Delete (Recommended)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Mark as deleted but keep record for audit purposes. Can be restored later.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                name="deleteType"
                value="hard"
                checked={deleteType === 'hard'}
                onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                className="text-red-600 focus:ring-red-500"
              />
              <div>
                <div className="font-medium text-red-800 dark:text-red-200">Permanent Delete</div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  Permanently remove from database. This action cannot be undone.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              deleteType === 'soft' ? 'Mark as Deleted' : 'Delete Permanently'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteOrderModal;