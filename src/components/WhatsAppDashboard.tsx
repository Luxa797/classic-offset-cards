// src/components/WhatsAppDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Select from './ui/Select';
import TextArea from './ui/TextArea';
import { MessageCircle, Send, MessageSquare, History, Loader2, AlertTriangle, FileText, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
// REMOVED: TemplateManager இனி இங்கே இறக்குமதி செய்யப்படாது
// import TemplateManager from './whatsapp/TemplateManager';

// Define types for your data
interface Customer { id: string; name: string; phone: string; }
interface DueOrder { 
  order_id: number; 
  customer_id: string; 
  customer_name: string; 
  balance_due: number; 
  total_amount: number; 
  date: string; 
  delivery_date: string; 
  order_type: string; 
  status?: string; 
  amount_paid: number; 
}
interface Template { id: string; name: string; category: string; body: string; }

const SendMessageUI = ({ customers, dueOrders, templates, onRefresh }) => {
  const { user } = useUser();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    const order = dueOrders.find(o => o.order_id === parseInt(selectedOrderId));

    if (!selectedTemplate || !order || !customer) {
        if (message && !selectedOrderId) setMessage('');
        return;
    }

    // Debugging logs (can remove after verification)
    console.log('--- Debugging payment_amount ---');
    console.log('Selected Order (from dueOrders):', order);
    console.log('Order ID:', order.order_id);
    console.log('Order amount_paid (from order object):', order.amount_paid);
    console.log('Order delivery_date (from order object):', order.delivery_date);

    const paymentAmount = order.amount_paid || 0;
    const pickupDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : 'N/A';

    let finalMessage = selectedTemplate.body;
    const variables = {
        customer_name: customer.name,
        order_id: String(order.order_id),
        order_type: order.order_type,
        total_amount: String(order.total_amount),
        balance_due: String(order.balance_due),
        delivery_date: new Date(order.delivery_date).toLocaleDateString('en-GB'),
        shop_name: 'Classic Offset',
        status: order.status || '',
        payment_amount: String(paymentAmount),
        pickup_date: pickupDate,
    };

    Object.entries(variables).forEach(([key, value]) => {
        finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });
    setMessage(finalMessage);
  }, [selectedCustomerId, selectedOrderId, selectedTemplate, customers, dueOrders]);

  const handleSend = async () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer || !customer.phone || !message) {
      return toast.error('Please select a customer and ensure message is not empty.');
    }

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    const { error } = await supabase.from('whatsapp_log').insert({
        customer_id: customer.id,
        customer_name: customer.name,
        phone: customer.phone,
        message: message,
        template_name: selectedTemplate?.name,
        sent_by: user?.id,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
        toast.success("Message sent and logged!");
        onRefresh();
    }
  };
  
  const filteredOrders = dueOrders.filter(o => o.customer_id === selectedCustomerId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card title="Compose Message">
                <div className="p-5 space-y-4">
                    <Select label="1. Select Customer" options={customers.map(c => ({value: c.id, label: `${c.name} (${c.phone})`}))} value={selectedCustomerId} onChange={(e) => {setSelectedCustomerId(e.target.value); setSelectedOrderId(''); setSelectedTemplate(null);}} placeholder="Choose a customer" />
                    <Select label="2. Select Order (for template data)" options={filteredOrders.map(o => ({value: o.order_id, label: `#${o.order_id} - ${o.order_type} (Due: ₹${o.balance_due})`}))} value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} disabled={!selectedCustomerId} placeholder="Choose an order"/>
                    <Select label="3. Select Message Template" options={templates.map(t => ({value: t.name, label: t.name}))} value={selectedTemplate?.name || ''} onChange={(e) => setSelectedTemplate(templates.find(t => t.name === e.target.value) || null)} disabled={!selectedOrderId} placeholder="Choose a template"/>
                    
                    <TextArea label="4. Review and Send" value={message} onChange={(e) => setMessage(e.target.value)} rows={7} placeholder="Message will be generated here..."/>

                    <Button onClick={handleSend} fullWidth variant="success" disabled={!message}>
                        <Send className="w-4 h-4 mr-2"/> Send on WhatsApp
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const WhatsAppDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send'>('send'); // UPDATED: 'templates' tab நீக்கப்பட்டது
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dueOrders, setDueOrders] = useState<DueOrder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]); // templates state ஐ வைத்திருத்தல்
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersRes, dueOrdersRes, templatesRes] = await Promise.all([
        supabase.from('customers').select('id, name, phone').order('name'),
        supabase.from('order_summary_with_dues').select('*').gt('balance_due', 0),
        supabase.from('whatsapp_templates').select('*').order('name') // templates ஐப் பெறுதல் தொடரும்
      ]);

      const errors = [customersRes.error, dueOrdersRes.error, templatesRes.error].filter(Boolean);
      if(errors.length > 0) throw errors[0];

      setCustomers(customersRes.data || []);
      setDueOrders(dueOrdersRes.data || []);
      setTemplates(templatesRes.data || []);

    } catch(err: any) {
        toast.error(err.message || "Failed to load initial data.");
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, refreshKey]);

  const renderContent = () => {
    if (loading) return <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div>
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>

    switch(activeTab) {
        case 'send':
            return <SendMessageUI customers={customers} dueOrders={dueOrders} templates={templates} onRefresh={() => setRefreshKey(k => k + 1)} />;
        // REMOVED: 'templates' case இனி இங்கே இருக்காது
        // case 'templates':
        //     return <TemplateManager initialTemplates={templates} onDataChange={() => setRefreshKey(k => k + 1)} />;
        default:
            return null;
    }
  }

  // UPDATED: 'templates' tab நீக்கப்பட்டது
  const tabs = [
    { id: 'send', label: 'Send Message', icon: Send },
    // { id: 'templates', label: 'Template Manager', icon: FileText },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <MessageSquare size={28} className="text-green-500" /> 
            WhatsApp Suite
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Send messages and manage templates.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2
                        ${activeTab === tab.id
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Icon size={16} />
                        {tab.label}
                    </button>
                )
            })}
        </nav>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default WhatsAppDashboard;