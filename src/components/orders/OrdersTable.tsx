// src/components/orders/OrdersTable.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import OrderStatusStepper from './OrderStatusStepper';
import UpdateStatusModal from './UpdateStatusModal';
import OrderDetailsModal from './OrderDetailsModal';
import EditOrderModal from './EditOrderModal';
import DeleteOrderModal from './DeleteOrderModal';
import BulkActionsModal from './BulkActionsModal';
import {
  Loader2, AlertTriangle, FileX, Search, MessageCircle, Eye, Edit, Trash2,
  CheckSquare, Square, MoreHorizontal, Filter, Download, RefreshCw,
  ArrowUpDown, Calendar, User, Package, Clock, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export interface Order {
  order_id: number;
  customer_name: string;
  order_type: string;
  quantity: number;
  date: string;
  delivery_date: string;
  status: string;
  customer_phone?: string;
  total_amount?: number;
  amount_received?: number;
  balance_amount?: number;
  is_deleted?: boolean;
}

type SortField = 'order_id' | 'customer_name' | 'date' | 'delivery_date' | 'status';
type SortOrder = 'asc' | 'desc';

interface OrdersTableProps {
  highlightOrderId: string | null;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ highlightOrderId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [detailsOrderId, setDetailsOrderId] = useState<number | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('order_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selection states
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, customer_id, order_type, quantity, date, delivery_date, total_amount, 
          amount_received, balance_amount, is_deleted,
          customers!inner(name, phone)
        `);

      if (highlightOrderId) {
        query = query.eq('id', highlightOrderId);
      } else {
        if (!showDeleted) {
          query = query.or('is_deleted.is.null,is_deleted.eq.false');
        }
        query = query.order('id', { ascending: false });
      }

      const { data: ordersData, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const { data: statusData, error: statusError } = await supabase
        .from('order_status_log')
        .select('order_id, status, updated_at')
        .order('updated_at', { ascending: false });

      if (statusError) throw statusError;

      const latestStatusMap: Record<number, string> = {};
      statusData?.forEach((log) => {
        if (log.order_id && !latestStatusMap[log.order_id]) {
          latestStatusMap[log.order_id] = log.status;
        }
      });
      
      const ordersWithStatus = ordersData?.map((order) => ({
        order_id: order.id,
        customer_name: order.customers?.name || 'Unknown Customer',
        customer_phone: order.customers?.phone || undefined,
        order_type: order.order_type,
        quantity: order.quantity,
        date: order.date,
        delivery_date: order.delivery_date,
        total_amount: order.total_amount,
        amount_received: order.amount_received,
        balance_amount: order.balance_amount,
        is_deleted: order.is_deleted,
        status: latestStatusMap[order.id] || 'Pending',
      })) || [];

      setOrders(ordersWithStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [showDeleted, highlightOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleClearHighlight = () => {
    navigate('/orders', { replace: true });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrders(prev => {
      const isSelected = prev.some(o => o.order_id === order.order_id);
      if (isSelected) {
        return prev.filter(o => o.order_id !== order.order_id);
      } else {
        return [...prev, order];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredAndSortedOrders);
    }
    setSelectAll(!selectAll);
  };

  const filteredAndSortedOrders = useMemo(() => {
    if (highlightOrderId && orders.length > 0) {
      return orders;
    }
    
    let filtered = orders.filter(order => {
      const matchesSearch =
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.order_id).includes(searchQuery);
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesDate = !dateFilter || order.date.startsWith(dateFilter);
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    filtered.sort((a, b) => {
        let aValue: any = a[sortField as keyof Order];
        let bValue: any = b[sortField as keyof Order];
        if (sortField === 'date' || sortField === 'delivery_date') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, dateFilter, sortField, sortOrder, highlightOrderId]);

  useEffect(() => {
    setSelectAll(
      filteredAndSortedOrders.length > 0 && 
      selectedOrders.length === filteredAndSortedOrders.length
    );
  }, [selectedOrders, filteredAndSortedOrders]);

  const handleStatusUpdate = (order: Order) => { setSelectedOrder(order); setShowUpdateModal(true); };
  const handleViewDetails = (orderId: number) => { setDetailsOrderId(orderId); setShowDetailsModal(true); };
  const handleEditOrder = (order: Order) => { setSelectedOrder(order); setShowEditModal(true); };
  const handleDeleteOrder = (order: Order) => { setSelectedOrder(order); setShowDeleteModal(true); };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Order Type', 'Quantity', 'Order Date', 'Delivery Date', 'Status', 'Total Amount'];
    const csvData = filteredAndSortedOrders.map(order => [
      order.order_id, order.customer_name, order.order_type, order.quantity,
      new Date(order.date).toLocaleDateString(), new Date(order.delivery_date).toLocaleDateString(),
      order.status, order.total_amount ? `₹${order.total_amount}` : 'N/A'
    ]);
    const csvContent = [headers, ...csvData].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
    </button>
  );

  if (loading) return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  if (error) return <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-center"><AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" /><p className="font-semibold">Error Loading Orders</p><p className="text-sm">{error}</p></Card>;

  return (
    <>
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">📋 Orders Management</h3>
            <div className="flex items-center gap-2">
              <Button onClick={fetchOrders} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
              <Button onClick={exportToCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Export</Button>
              {selectedOrders.length > 0 && <Button onClick={() => setShowBulkModal(true)} variant="primary" size="sm">Bulk Actions ({selectedOrders.length})</Button>}
            </div>
          </div>

          {highlightOrderId ? (
            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 text-primary-800 dark:text-primary-200 p-3 rounded-lg flex justify-between items-center mb-4">
              <p className="font-medium text-sm">Showing details for highlighted Order #{highlightOrderId}.</p>
              <Button onClick={handleClearHighlight} variant="ghost" size="sm" className="flex items-center gap-1"><X size={16}/> Clear Highlight</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative"><Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" /><Input id="search" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
              <Select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, { value: 'Pending', label: 'Pending' }, { value: 'Design', label: 'Design' }, { value: 'Printing', label: 'Printing' }, { value: 'Delivered', label: 'Delivered' }]} />
              <Input id="dateFilter" type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              <div className="flex items-center gap-2"><input type="checkbox" id="showDeleted" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="rounded border-gray-300" /><label htmlFor="showDeleted" className="text-sm">Show Deleted</label></div>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFilter(''); setShowDeleted(false); }}>Clear Filters</Button>
            </div>
          )}
        </div>
        
        <div className="md:hidden p-4 space-y-3">
          {filteredAndSortedOrders.length > 0 ? filteredAndSortedOrders.map(order => (
            <div key={order.order_id} className={`p-4 rounded-lg border ${order.is_deleted ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedOrders.some(o => o.order_id === order.order_id)} onChange={() => handleSelectOrder(order)} />
                        <div>
                            <Link to={`/invoices/${order.order_id}`} className="font-bold hover:underline">#{order.order_id}</Link>
                            <p className="text-sm font-medium">{order.customer_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetails(order.order_id)}><Eye size={16} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditOrder(order)}><Edit size={16} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteOrder(order)}><Trash2 size={16} className="text-red-500" /></Button>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{order.order_type} • Qty: {order.quantity}</p>
                <div className="text-xs text-gray-500 mb-3 space-y-1"><div className="flex items-center gap-1"><Calendar size={12} /> Order: {new Date(order.date).toLocaleDateString('en-GB')}</div><div className="flex items-center gap-1"><Clock size={12} /> Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB')}</div></div>
                <div className="mb-3"><OrderStatusStepper currentStatus={order.status as any} /></div>
                <div className="flex justify-between items-center"><Button size="sm" variant="outline" onClick={() => handleStatusUpdate(order)}>Update Status</Button>{order.customer_phone && <a href={`https://wa.me/${order.customer_phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600"><MessageCircle size={16} /> WhatsApp</a>}</div>
            </div>
          )) : <div className="text-center py-12 text-gray-500"><FileX className="w-12 h-12 mx-auto mb-4" /><p>No orders found</p></div>}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                <th className="px-4 py-3"><SortButton field="order_id">Order</SortButton></th>
                <th className="px-4 py-3"><SortButton field="customer_name">Customer</SortButton></th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3"><SortButton field="date">Dates</SortButton></th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedOrders.length > 0 ? filteredAndSortedOrders.map((order) => (
                <tr key={order.order_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${order.is_deleted ? 'opacity-60 bg-red-50' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedOrders.some(o => o.order_id === order.order_id)} onChange={() => handleSelectOrder(order)} /></td>
                  <td className="px-4 py-3"><Link to={`/invoices/${order.order_id}`} className="font-semibold text-primary-600">#{order.order_id}</Link></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><User size={14} /><span>{order.customer_name}</span></div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Package size={14} /><div>{order.order_type}<div className="text-xs">Qty: {order.quantity}</div></div></div></td>
                  <td className="px-4 py-3 text-xs"><div className="space-y-1"><div className="flex items-center gap-1"><Calendar size={12} />Order: {new Date(order.date).toLocaleDateString('en-GB')}</div><div className="flex items-center gap-1"><Clock size={12} />Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB')}</div></div></td>
                  <td className="px-4 py-3 w-64"><OrderStatusStepper currentStatus={order.status as any} /></td>
                  <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><Button size="sm" variant="ghost" onClick={() => handleViewDetails(order.order_id)}><Eye size={16} /></Button><Button size="sm" variant="ghost" onClick={() => handleEditOrder(order)}><Edit size={16} /></Button><Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(order)}><MoreHorizontal size={16} /></Button><Button size="sm" variant="ghost" onClick={() => handleDeleteOrder(order)}><Trash2 size={16} className="text-red-500" /></Button>{order.customer_phone && <a href={`https://wa.me/${order.customer_phone}`}><Button size="sm" variant="ghost"><MessageCircle size={16} className="text-green-500" /></Button></a>}</div></td>
                </tr>
              )) : <tr><td colSpan={7} className="text-center py-12"><FileX className="mx-auto" />No orders found</td></tr>}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedOrders.length > 0 && <div className="px-4 py-3 border-t"><span className="text-sm text-gray-500">Showing {filteredAndSortedOrders.length} of {orders.length} orders</span></div>}
      </Card>
      
      {showUpdateModal && selectedOrder && <UpdateStatusModal order={selectedOrder} isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} onStatusUpdated={() => { fetchOrders(); setShowUpdateModal(false); }} />}
      {showDetailsModal && detailsOrderId && <OrderDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} orderId={detailsOrderId} />}
      {showEditModal && selectedOrder && <EditOrderModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} order={selectedOrder} onOrderUpdated={() => { fetchOrders(); setShowEditModal(false); }} />}
      {showDeleteModal && selectedOrder && <DeleteOrderModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} order={selectedOrder} onOrderDeleted={() => { fetchOrders(); setShowDeleteModal(false); }} />}
      {showBulkModal && <BulkActionsModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} selectedOrders={selectedOrders} onBulkActionComplete={() => { fetchOrders(); setSelectedOrders([]); setShowBulkModal(false); }} />}
    </>
  );
};

export default OrdersTable;