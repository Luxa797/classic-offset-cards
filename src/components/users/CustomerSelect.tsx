import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CustomerSelectProps {
  onSelect: (selected: { id: string; phone: string; name: string }) => void;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({ onSelect }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('customers').select('id, name, phone');
      if (error) {
        console.error('❌ Failed to fetch customers:', error.message);
      } else {
        setCustomers(data || []);
      }
    };
    fetchCustomers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      onSelect({ id: customer.id, phone: customer.phone, name: customer.name });
    }
  };

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="w-full px-3 py-2 border rounded"
    >
      <option value="">-- Select Customer --</option>
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
};

export default CustomerSelect;