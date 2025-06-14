import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Loader2, CheckSquare, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: Order[];
  onBulkActionComplete: () => void;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedOrders, 
  onBulkActionComplete 
}) => {
  const [action, setAction] = useState<'status' | 'delete' | ''>('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async () => {
    if (!action || selectedOrders.length === 0) return;

    setLoading(true);
    const orderIds = selectedOrders.map(order => order.order_id);

    try {
      if (action === 'status' && newStatus) {
        // Bulk status update
        const promise = Promise.all([
          // Update orders table if needed
          supabase
            .from('orders')
            .update({ updated_at: new Date().toISOString() })
            .in('id', orderIds),
          
          // Add status log entries for each order
          ...orderIds.map(orderId => 
            supabase.from('order_status_log').insert({
              order_id: orderId,
              status: newStatus,
              updated_by: 'Bulk Action',
              notes: `Bulk status update to ${newStatus}`
            })
          )
        ]);

        toast.promise(promise, {
          loading: `Updating ${selectedOrders.length} orders to ${newStatus}...`,
          success: `Successfully updated ${selectedOrders.length} orders!`,
          error: (err) => `Failed to update orders: ${err.message}`
        });

        await promise;

      } else if (action === 'delete') {
        // Bulk soft delete
        const promise = supabase
          .from('orders')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString(),
            status: 'Cancelled'
          })
          .in('id', orderIds);

        toast.promise(promise, {
          loading: `Deleting ${selectedOrders.length} orders...`,
          success: `Successfully deleted ${selectedOrders.length} orders!`,
          error: (err) => `Failed to delete orders: ${err.message}`
        });

        await promise;

        // Log deletions
        await Promise.all(
          orderIds.map(orderId => 
            supabase.from('order_status_log').insert({
              order_id: orderId,
              status: 'Cancelled',
              updated_by: 'Bulk Action',
              notes: 'Bulk soft delete'
            })
          )
        );
      }

      onBulkActionComplete();
      onClose();
    } catch (err: any) {
      console.error('Bulk action error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Actions" size="md">
      <div className="space-y-4 pt-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <CheckSquare className="inline w-4 h-4 mr-1" />
            {selectedOrders.length} orders selected
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="action"
                  value="status"
                  checked={action === 'status'}
                  onChange={(e) => setAction(e.target.value as 'status' | 'delete')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <Edit className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Update Status</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Change status for all selected orders
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={(e) => setAction(e.target.value as 'status' | 'delete')}
                  className="text-red-600 focus:ring-red-500"
                />
                <Trash2 className="w-4 h-4 text-red-400" />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-200">Delete Orders</div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Soft delete all selected orders
                  </div>
                </div>
              </label>
            </div>
          </div>

          {action === 'status' && (
            <Select
              id="newStatus"
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Design', label: 'Design' },
                { value: 'Printing', label: 'Printing' },
                { value: 'Delivered', label: 'Delivered' },
              ]}
              required
              placeholder="Select new status"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant={action === 'delete' ? 'destructive' : 'primary'}
            onClick={handleBulkAction} 
            disabled={loading || !action || (action === 'status' && !newStatus)}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              action === 'delete' ? 'Delete Selected' : 'Update Selected'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkActionsModal;