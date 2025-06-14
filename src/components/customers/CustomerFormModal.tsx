// src/components/customers/CustomerFormModal.tsx (இது ஒருவேளை நீங்கள் ஏற்கனவே வைத்திருக்கும் மோடல்)
import React from 'react';
import Modal from '../ui/Modal';
import CustomerForm from './CustomerForm'; // Import the CustomerForm component

interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string; // Add address
  joined_date?: string; // Add joined_date
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCustomer?: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSave, editingCustomer }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} size="md">
      {/* CustomerForm கூறு உள்ளே பயன்படுத்தப்படுகிறது */}
      <CustomerForm 
        selectedCustomer={editingCustomer}
        onSave={onSave}
        onCancel={onClose} // Modal ஐ மூட onCancel ஐப் பயன்படுத்துதல்
      />
    </Modal>
  );
};

export default CustomerFormModal;