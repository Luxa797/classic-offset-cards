// src/components/orders/Orders.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderForm from './OrderForm';
import OrdersTable from './OrdersTable';
import { Plus, List } from 'lucide-react';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
  const [searchParams] = useSearchParams(); 
  
  const highlightOrderId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightOrderId) {
      setActiveTab('manage');
    }
  }, [highlightOrderId]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 Orders Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Comprehensive order management system</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'manage'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <List size={16} />
          Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'add'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Plus size={16} />
          Add New Order
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'manage' ? (
          <OrdersTable highlightOrderId={highlightOrderId} />
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* ✅ சரி செய்யப்பட்டது: 'onSubmit' என்பது 'onSuccess' என மாற்றப்பட்டது */}
            <OrderForm onSuccess={() => setActiveTab('manage')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;