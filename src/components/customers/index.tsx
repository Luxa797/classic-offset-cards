// src/components/customers/index.tsx
import React, { useState } from 'react';
import CustomerTable from './CustomerTable';
import CustomerFormModal from './CustomerFormModal'; 
import Card from '../ui/Card';

// Define the shape of the customer object for the entire page (same as CustomerFormModal's Customer)
interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  joined_date?: string;
}

const CustomersPage: React.FC = () => {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [showAddModal, setShowAddModal] = useState(false); 

  const handleEdit = (customer: Customer) => { 
    setEditingCustomer(customer);
    setShowAddModal(false); 
  };

  const handleSave = () => {
    setEditingCustomer(null); 
    setRefreshKey(prev => prev + 1); 
    setShowAddModal(false); 
  };

  const handleCancel = () => {
    setEditingCustomer(null); 
    setShowAddModal(false); 
  };

  const handleAddNewCustomerClick = () => {
    setEditingCustomer(null); 
    setShowAddModal(true); 
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white"> Customers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your print shop customers</p>
      </div>

      <div className="grid grid-cols-1 lg:col-span-3 gap-6 items-start"> {/* Removed lg:grid-cols-3, used lg:col-span-3 on table */}
        {/* Left Panel: Table */}
        <div className="lg:col-span-3"> 
          <CustomerTable 
            key={refreshKey} 
            onEdit={handleEdit} 
            onAdd={handleAddNewCustomerClick} 
            onDataChange={handleSave} 
          />
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={!!editingCustomer || showAddModal} 
        onClose={handleCancel}
        onSave={handleSave}
        editingCustomer={editingCustomer}
      />
    </div>
  );
};

export default CustomersPage;