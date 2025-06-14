// src/components/orders/OrderForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import CustomerSelect from '../CustomerSelect';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderFormProps {
    onSuccess: () => void;
}

interface Product {
    id: number;
    name: string;
    unit_price: number;
    category: string;
}

interface Employee {
    id: string; // UUID
    name: string;
    job_role: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess }) => {
    const { user } = useUser();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [designers, setDesigners] = useState<Employee[]>([]); 
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        customerName: '',
        orderType: '',
        productId: '',
        quantity: '1',
        rate: '0',
        totalAmount: '0',
        amountReceived: '0',
        designNeeded: 'No',
        designerId: '',
        deliveryDate: '',
        paymentMethod: 'Cash',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase.from('products').select('id, name, unit_price, category');
            setProducts(data || []);
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchDesigners = async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('id, name, job_role')
                .eq('job_role', 'Designer')
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching designers:', error.message);
                toast.error('Failed to load designers.');
            } else {
                setDesigners(data || []);
            }
        };
        fetchDesigners();
    }, []);

    useEffect(() => {
        const qty = parseInt(formData.quantity || '0');
        const rate = parseFloat(formData.rate || '0');
        setFormData(prev => ({ ...prev, totalAmount: (qty * rate).toFixed(2) }));
    }, [formData.quantity, formData.rate]);

    useEffect(() => {
        if (formData.orderType) {
            setFilteredProducts(products.filter(p => p.category === formData.orderType));
        } else {
            setFilteredProducts([]);
        }
    }, [formData.orderType, products]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        let newFormData = { ...formData, [id]: value };

        if (id === 'productId' && value) {
            const selectedProduct = products.find(p => p.id === parseInt(value));
            if (selectedProduct) {
                newFormData.rate = String(selectedProduct.unit_price);
            }
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.customerId) {
            setError("A customer must be selected.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const orderPayload = {
                user_id: user.id,
                date: formData.date,
                customer_id: formData.customerId,
                customer_name: formData.customerName,
                order_type: formData.orderType,
                product_id: parseInt(formData.productId) || null,
                quantity: parseInt(formData.quantity),
                rate: parseFloat(formData.rate),
                total_amount: parseFloat(formData.totalAmount),
                amount_received: parseFloat(formData.amountReceived || '0'), // இது orders டேபிளில் ஆரம்பப் பணத்தைப் பதிவு செய்யும்
                balance_amount: parseFloat(formData.totalAmount) - parseFloat(formData.amountReceived || '0'),
                design_needed: formData.designNeeded === 'Yes',
                designer_id: formData.designNeeded === 'Yes' ? formData.designerId || null : null,
                delivery_date: formData.deliveryDate,
                payment_method: formData.paymentMethod,
                notes: formData.notes,
                is_deleted: false,
            };

            const { data: newOrder, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single();
            if (orderError || !newOrder) throw orderError || new Error("Failed to create order.");
            
            await supabase.from('order_status_log').insert({ order_id: newOrder.id, status: 'Pending', updated_by: user?.email });

            // ✅ சரிசெய்யப்பட்டது: ஆரம்பப் பணம் payments டேபிளில் செருகப்படும்
            if (orderPayload.amount_received > 0) {
                await supabase.from('payments').insert({
                    order_id: newOrder.id,
                    customer_id: orderPayload.customer_id,
                    amount_paid: orderPayload.amount_received,
                    payment_date: orderPayload.date, // payment_date ஆக ஆர்டர் தேதியைப் பயன்படுத்துதல்
                    payment_method: orderPayload.paymentMethod,
                    created_by: user.id,
                    total_amount: orderPayload.total_amount, // payments டேபிளின் total_amount க்காக
                    status: (orderPayload.amount_received >= orderPayload.total_amount) ? 'Paid' : 'Partial' // கட்டண நிலையை அமைக்கவும்
                });
            }

            toast.success(`✅ New order #${newOrder.id} created successfully!`);
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to create order.");
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const orderTypeOptions = [
        { value: '', label: 'Select Order Type' },
        { value: 'Invitation Cards', label: 'Invitation Cards' },
        { value: 'Posters', label: 'Posters' },
    ];

    const designNeededOptions = [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' },
    ];

    const paymentMethodOptions = [
        { value: 'Cash', label: 'Cash' },
        { value: 'UPI', label: 'UPI' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Debit Card', label: 'Debit Card' },
        { value: 'Check', label: 'Check' },
    ];

    return (
        <Card title="➕ New Order">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-red-500 p-2 bg-red-50 rounded">{error}</p>}
                <CustomerSelect onSelect={({ id, name }) => setFormData(prev => ({...prev, customerId: id, customerName: name}))} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="date" label="Order Date" type="date" value={formData.date} onChange={handleInputChange} required />
                    <Input id="deliveryDate" label="Delivery Date" type="date" value={formData.deliveryDate} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select id="orderType" label="Order Type" options={orderTypeOptions} value={formData.orderType} onChange={handleInputChange} required placeholder="Select Order Type" />
                    <Select id="productId" label="Product" options={filteredProducts.map(p => ({ value: p.id, label: p.name }))} value={formData.productId} onChange={handleInputChange} required disabled={!formData.orderType} placeholder="Select Product" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input id="quantity" label="Quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
                    <Input id="rate" label="Rate" type="number" value={formData.rate} onChange={handleInputChange} required />
                    <Input id="totalAmount" label="Total" type="number" value={formData.totalAmount} disabled />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="amountReceived" label="Amount Received" type="number" value={formData.amountReceived} onChange={handleInputChange} placeholder="Initial payment"/>
                    <Select id="paymentMethod" label="Payment Method" options={paymentMethodOptions} value={formData.paymentMethod} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select id="designNeeded" label="Design Needed?" options={designNeededOptions} value={formData.designNeeded} onChange={handleInputChange} />
                    {formData.designNeeded === 'Yes' && (
                        <Select
                            id="designerId"
                            label="Designer Name"
                            options={designers.map(d => ({ value: d.id, label: d.name }))}
                            value={formData.designerId}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            placeholder="Select Designer"
                        />
                    )}
                </div>
                <TextArea id="notes" label="Notes" value={formData.notes} onChange={handleInputChange} />
                <Button type="submit" variant="primary" fullWidth disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Save Order'}
                </Button>
            </form>
        </Card>
    );
};

export default OrderForm;