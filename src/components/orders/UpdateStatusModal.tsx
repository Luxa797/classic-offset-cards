// src/components/orders/UpdateStatusModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activityLogger'; // ✅ logActivity-ஐ இறக்குமதி செய்யவும்
import { useUser } from '@/context/UserContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface Props {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const statusOptions = ['Pending', 'Design', 'Printing', 'Delivered'];

const UpdateStatusModal: React.FC<Props> = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useUser();

  const handleUpdate = async () => {
    setLoading(true);
    const userName = userProfile?.name || 'Admin';
    
    // Supabase இல் நிலையை மேம்படுத்தவும்
    const { error: supabaseError } = await supabase.from('order_status_log').insert({
      order_id: order.order_id,
      status: newStatus,
      updated_by: userName,
    });

    if (supabaseError) {
      toast.error(`Failed to update status: ${supabaseError.message}`);
      setLoading(false);
      return;
    }

    toast.success(`Status updated to "${newStatus}"!`);

    // Firestore இல் அறிவிப்பை உருவாக்கவும்
    try {
      await addDoc(collection(db, "notifications"), {
        orderId: order.order_id,
        customerName: order.customer_name,
        newStatus: newStatus,
        message: `Order #${order.order_id} for ${order.customer_name} has been updated to "${newStatus}".`,
        timestamp: serverTimestamp(),
        read: false,
        updatedBy: userName,
      });
    } catch (firestoreError) {
      console.error("Error adding notification to Firestore:", firestoreError);
      toast.error("Failed to create live notification.");
    }
    
    // ✅ செயல்பாட்டைப் பதிவு செய்யவும்
    const activityMessage = `Updated status of Order #${order.order_id} to "${newStatus}"`;
    await logActivity(activityMessage, userName);


    onStatusUpdated();
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status for Order #${order.order_id}`}>
      <div className="space-y-4 pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">Select the new status for this order.</p>
        <div className="grid grid-cols-2 gap-3">
            {statusOptions.map(status => (
                <button 
                    key={status} 
                    onClick={() => setNewStatus(status)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                        newStatus === status ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                    }`}
                >
                    <p className={`font-semibold ${newStatus === status ? 'text-primary-700 dark:text-primary-200' : 'text-gray-800 dark:text-gray-100'}`}>{status}</p>
                </button>
            ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading || newStatus === order.status}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                Update Status
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateStatusModal;
