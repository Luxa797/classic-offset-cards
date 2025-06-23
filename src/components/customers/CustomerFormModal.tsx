// src/components/customers/CustomerFormModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Define the shape of a Customer
interface Customer {
  id: string;
  name: string;
  phone: string;
}

// Define the props for the modal
interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: Customer) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!name.trim() || !phone.trim()) {
      setError('Both name and phone number are required.');
      toast.error('Name and phone cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      // Insert into the 'customers' table without the 'created_by' field
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({ name, phone })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }

      toast.success(`Customer "${name}" was added successfully!`);
      onSuccess(data as Customer); // Pass the newly created customer to the parent
      onClose(); // Close the modal
      
      // Reset form for next time
      setName('');
      setPhone('');

    } catch (err: any) {
      console.error('Error adding customer:', err);
      toast.error(err.message || 'An unexpected error occurred.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a New Customer">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
        
        <Input
          id="name"
          label="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter the customer's full name"
          required
        />

        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter a 10-digit phone number"
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {loading ? 'Saving...' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
