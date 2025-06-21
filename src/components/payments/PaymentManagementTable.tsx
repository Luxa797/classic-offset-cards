// src/components/PaymentManagementTable.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { 
  Search, Filter, Download, RefreshCw, Edit, Trash2, Eye, 
  Calendar, DollarSign, User, FileText, ArrowUpDown, 
  CheckSquare, Square, MoreHorizontal, Loader2, AlertTriangle,
  Plus, Minus, CreditCard, Clock, TrendingUp, TrendingDown, Info, Archive, Palette
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- Interfaces (Unchanged) ---
interface Payment {
  id: string; customer_id: string; order_id: number; amount_paid: number;
  due_date: string; status: 'Paid' | 'Partial' | 'Due' | 'Overdue';
  payment_method?: string; notes?: string; created_at: string; updated_at?: string;
  customer_name?: string; customer_phone?: string; order_total_amount: number;
  order_amount_paid: number; order_balance_due: number;
}
interface PaymentHistory {
  id: string; payment_id: string; action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: any; new_data?: any; changed_by: string; changed_at: string; notes?: string;
}
type SortField = 'created_at' | 'amount_paid' | 'order_total_amount' | 'due_date' | 'status' | 'customer_name';
type SortOrder = 'asc' | 'desc';

// --- Main Component ---
const PaymentManagementTable: React.FC = () => {
    const { user } = useUser();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // All other state declarations are unchanged
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedPayments, setSelectedPayments] = useState<Payment[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editForm, setEditForm] = useState({ amount_paid: '', due_date: '', status: '', payment_method: '', notes: '' });
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // --- All data fetching and handling logic remains exactly the same ---
    const fetchPayments = useCallback(async () => { 
        setLoading(true); setError(null);
        try {
            const { data: paymentsData, error: fetchPaymentsError } = await supabase.from('payments').select(`*, customers (name, phone)`).order(sortField, { ascending: sortOrder === 'asc' });
            if (fetchPaymentsError) throw fetchPaymentsError;
            const orderIds = paymentsData.map(p => p.order_id).filter(id => id !== null) as number[];
            let orderSummaries: any[] = [];
            if (orderIds.length > 0) {
                const { data: orderSummaryData, error: fetchSummaryError } = await supabase.from('order_summary_with_dues').select('order_id, total_amount, amount_paid, balance_due').in('order_id', orderIds);
                if (fetchSummaryError) throw fetchSummaryError;
                orderSummaries = orderSummaryData || [];
            }
            const processedPayments = (paymentsData || []).map(payment => {
                const orderSummary = orderSummaries.find(os => os.order_id === payment.order_id);
                const orderTotalAmount = orderSummary?.total_amount || 0;
                const orderAmountPaid = orderSummary?.amount_paid || 0;
                const orderBalanceDue = orderSummary?.balance_due || 0;
                let calculatedStatus: 'Paid' | 'Partial' | 'Due' | 'Overdue' = payment.status;
                if (orderBalanceDue <= 0) calculatedStatus = 'Paid';
                else if (orderAmountPaid > 0 && orderBalanceDue > 0) calculatedStatus = 'Partial';
                else if (payment.due_date && new Date(payment.due_date) < new Date() && orderBalanceDue > 0) calculatedStatus = 'Overdue';
                else if (orderBalanceDue > 0) calculatedStatus = 'Due';
                return { ...payment, customer_name: payment.customers?.name || 'Unknown', customer_phone: payment.customers?.phone || '', status: calculatedStatus, order_total_amount: orderTotalAmount, order_amount_paid: orderAmountPaid, order_balance_due: orderBalanceDue };
            });
            setPayments(processedPayments);
        } catch (err: any) { setError(err.message || 'Failed to fetch payments'); toast.error('Failed to load payments'); } finally { setLoading(false); }
    }, [sortField, sortOrder]);
    const fetchPaymentHistory = async (paymentId: string) => { 
        setLoadingHistory(true);
        try{
            const { data, error } = await supabase.from('payment_history').select('*').eq('payment_id', paymentId).order('changed_at', { ascending: false });
            if (error) throw error;
            setPaymentHistory(data || []);
        } catch(err:any){ console.error(err) } finally { setLoadingHistory(false) }
    };
    useEffect(() => { fetchPayments(); }, [fetchPayments]);
    const filteredAndSortedPayments = useMemo(() => { 
        return payments.filter(p => (p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(p.order_id).includes(searchQuery)) && (!statusFilter || p.status === statusFilter) && (!dateFilter || p.due_date.startsWith(dateFilter)));
    }, [payments, searchQuery, statusFilter, dateFilter]);

    const handleSort = (field: SortField) => { if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortOrder('desc'); }};
    const handleSelectPayment = (payment: Payment) => { setSelectedPayments(prev => prev.some(p => p.id === payment.id) ? prev.filter(p => p.id !== payment.id) : [...prev, payment]); };
    const handleSelectAll = () => { if (selectAll) setSelectedPayments([]); else setSelectedPayments(filteredAndSortedPayments); setSelectAll(!selectAll); };
    const handleEdit = (payment: Payment) => { setEditingPayment(payment); setEditForm({amount_paid: String(payment.amount_paid), due_date: payment.due_date, status: payment.status, payment_method: payment.payment_method || '', notes: payment.notes || ''}); setShowEditModal(true);};
    const handleSaveEdit = async () => { /* ... Your existing save logic ... */ };
    const handleView = (payment: Payment) => { setViewingPayment(payment); setShowViewModal(true); fetchPaymentHistory(payment.id); };
    const handleDelete = (payment: Payment) => { setPaymentToDelete(payment); setShowDeleteModal(true); };
    const confirmDelete = async () => { /* ... Your existing delete logic ... */ };
    const handleBulkDelete = async () => { /* ... Your existing bulk delete logic ... */ };
    const exportToCSV = () => { /* ... Your existing CSV export logic ... */ };

    const getStatusColor = (status: string) => { 
        switch (status) { case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'; case 'Partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'; case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'; case 'Due': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; }
    };
    const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => ( <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-primary-600"> {children} <ArrowUpDown size={14} /> </button> );

    if (loading) { return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" /></div>; }
    if (error) { return <Card className="p-6 text-center text-red-600 bg-red-50"><AlertTriangle className="mx-auto h-10 w-10" /><p className="mt-2">{error}</p></Card>; }

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage all payment transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={fetchPayments} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Refresh Data</Button>
                     <Button onClick={exportToCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input icon={<Search size={16} />} placeholder="Search Customer or Order ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, { value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }, { value: 'Due', label: 'Due' }, { value: 'Overdue', label: 'Overdue' }]} />
                    <Input type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    {selectedPayments.length > 0 && <Button onClick={() => setShowBulkModal(true)} variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedPayments.length})</Button>}
                </div>
            </Card>

            {/* Mobile & Desktop Views (unchanged from previous version) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {filteredAndSortedPayments.map(p => ( <Card key={p.id} className="p-4 space-y-3">...</Card> ))}
            </div>
            <div className="hidden md:block">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">...</table>
                    </div>
                </Card>
            </div>
             {filteredAndSortedPayments.length === 0 && <div className="text-center py-16 text-gray-500"><Info className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-4">No payments found.</p></div>}
            
            {/* --- MODALS --- */}
            {showEditModal && editingPayment && (
                <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Payment for Order #${editingPayment.order_id}`} size="lg">
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6 p-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Amount Paid (₹)" id="amount_paid" type="number" value={editForm.amount_paid} onChange={(e) => setEditForm({...editForm, amount_paid: e.target.value})} required/>
                            <Input label="Due Date" id="due_date" type="date" value={editForm.due_date} onChange={(e) => setEditForm({...editForm, due_date: e.target.value})} required/>
                        </div>
                        <Select label="Status" id="status" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} options={[{value: 'Paid', label: 'Paid'}, {value: 'Partial', label: 'Partial'}, {value: 'Due', label: 'Due'}, {value: 'Overdue', label: 'Overdue'}]} />
                        <Select label="Payment Method" id="payment_method" value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})} options={[{value: 'Cash', label: 'Cash'}, {value: 'UPI', label: 'UPI'}, {value: 'Bank Transfer', label: 'Bank Transfer'}]} />
                        <textarea id="notes" value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} placeholder="Add notes..." className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"></textarea>
                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-600">
                            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {showViewModal && viewingPayment && (
                <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Details for Payment on Order #${viewingPayment.order_id}`} size="2xl">
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-4 space-y-3">
                                <h4 className="font-semibold flex items-center gap-2"><User size={18}/> Customer</h4>
                                <p><strong>Name:</strong> {viewingPayment.customer_name}</p>
                                <p><strong>Phone:</strong> {viewingPayment.customer_phone}</p>
                            </Card>
                             <Card className="p-4 space-y-3">
                                <h4 className="font-semibold flex items-center gap-2"><FileText size={18}/> Order Summary</h4>
                                <p><strong>Order Total:</strong> ₹{viewingPayment.order_total_amount.toLocaleString()}</p>
                                <p><strong>Total Paid:</strong> ₹{viewingPayment.order_amount_paid.toLocaleString()}</p>
                                <p className="font-bold"><strong>Balance Due:</strong> <span className="text-red-600">₹{viewingPayment.order_balance_due.toLocaleString()}</span></p>
                            </Card>
                        </div>
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><DollarSign size={18}/> This Transaction</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <p><strong>Amount:</strong> <span className="font-bold text-green-600 text-lg">₹{viewingPayment.amount_paid.toLocaleString()}</span></p>
                                <p><strong>Method:</strong> {viewingPayment.payment_method}</p>
                                <p><strong>Due Date:</strong> {new Date(viewingPayment.due_date).toLocaleDateString('en-GB')}</p>
                                <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(viewingPayment.status)}`}>{viewingPayment.status}</span></p>
                            </div>
                        </Card>
                        {paymentHistory.length > 0 && (
                             <Card className="p-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2"><Clock size={18}/> Payment History</h4>
                                <div className="space-y-2">
                                    {paymentHistory.map(h => <div key={h.id} className="text-xs p-2 bg-slate-100 dark:bg-slate-700 rounded-md"><strong>{h.action}:</strong> by {h.changed_by} at {new Date(h.changed_at).toLocaleString('en-GB')}</div>)}
                                </div>
                            </Card>
                        )}
                    </div>
                </Modal>
            )}
            
            {showDeleteModal && (
                <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirm Deletion" confirmText="Yes, Delete" description={`Are you sure you want to permanently delete this payment of ₹${paymentToDelete?.amount_paid}? This cannot be undone.`} />
            )}
             {showBulkModal && (
                <ConfirmationModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} onConfirm={handleBulkDelete} title="Confirm Bulk Deletion" confirmText={`Yes, Delete ${selectedPayments.length} Payments`} description={`Are you sure you want to permanently delete ${selectedPayments.length} selected payments? This action cannot be undone.`} />
            )}
        </div>
    );
};

export default PaymentManagementTable;
