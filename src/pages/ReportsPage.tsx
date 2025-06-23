// src/pages/ReportsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Download, Loader2, BarChart, Search, X, List, Printer, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

// ADDED: New 'invoice_report' type
type ReportType = 'profit_loss' | 'orders_list' | 'customers_list' | 'payment_details' | 'due_summary' | 'invoice_report';

const reportOptions = [
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'orders_list', label: 'Orders List' },
  { value: 'customers_list', label: 'Customer List' },
  { value: 'payment_details', label: 'Payment Details' },
  { value: 'due_summary', label: 'Due Summary Report' },
  { value: 'invoice_report', label: 'Invoice Report' }, // ADDED
];

// --- இன்வாய்ஸ் விவரங்களைக் காட்டும் புதிய காம்போனென்ட் ---
const InvoiceDetailView = ({ invoiceData, onBack }: { invoiceData: any; onBack: () => void; }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { invoice, payments } = invoiceData;

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Invoice_${invoice.id}`,
        pageStyle: `@media print { body { -webkit-print-color-adjust: exact; } @page { size: A4; margin: 20mm; } }`,
        onBeforeGetContent: () => new Promise<void>((resolve) => setTimeout(resolve, 300)),
    });

    if (!invoice) return null;

    return (
        <Card className="mt-6 animate-slide-up">
            <div className="p-4 flex justify-between items-center border-b">
                <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Download as PDF</Button>
            </div>
            <div ref={printRef} className="p-8 bg-white text-black">
                 <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Classic Offset cards</h1>
                        <p className="text-sm text-gray-500">363, bazar road</p>
                        <p className="text-sm text-gray-500">kadayanallur -62775</p>
                        <p className="text-sm text-gray-500">Tenkasi District, Tamil Nadu.</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-700">INVOICE</h2>
                        <p className="text-sm text-gray-500">Invoice #: {invoice.id}</p>
                        <p className="text-sm text-gray-500">Date: {new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-700">Bill To:</h3>
                    <p className="text-lg font-bold text-gray-800">{invoice.customer_name}</p>
                    <p className="text-sm text-gray-600">{invoice.customer_address || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
                </div>
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 text-left font-semibold text-gray-600">Description</th>
                                <th className="py-2 px-4 text-center font-semibold text-gray-600">Quantity</th>
                                <th className="py-2 px-4 text-right font-semibold text-gray-600">Rate</th>
                                <th className="py-2 px-4 text-right font-semibold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-3 px-4">{invoice.order_type}</td>
                                <td className="py-3 px-4 text-center">{invoice.quantity}</td>
                                <td className="py-3 px-4 text-right">₹{invoice.rate?.toLocaleString('en-IN') || '0.00'}</td>
                                <td className="py-3 px-4 text-right">₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Total:</span>
                            <span className="font-semibold text-gray-800">₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Paid:</span>
                            <span className="font-semibold text-green-600">- ₹{(invoice.total_amount - invoice.balance_amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t text-lg">
                            <span className="font-bold text-gray-800">Balance Due:</span>
                            <span className="font-bold text-red-600">₹{invoice.balance_amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
                 {payments.length > 0 && (
                    <div className="mt-8 border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-2">Payment History:</h3>
                        <ul className="text-xs list-disc list-inside text-gray-600">
                            {payments.map((p: any) => (
                                <li key={p.id}>
                                    Paid ₹{p.amount_paid.toLocaleString('en-IN')} via {p.payment_method} on {new Date(p.payment_date).toLocaleDateString('en-GB')}.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
};


const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [filters, setFilters] = useState<any>({
    startDate: '', endDate: '', orderStatus: '', searchTerm: '', sinceDate: '', customerName: '', orderNumber: '', orderId: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  
  // --- இன்வாய்ஸ் ரிப்போர்ட்டுக்கான புதிய State-கள் ---
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceDetailData, setInvoiceDetailData] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    setReportData(null);
    setTableHeaders([]);
    setSelectedInvoiceId(null);
    setInvoiceDetailData(null);
    clearFilters();
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({...prev, [e.target.id]: e.target.value}));
  };
  
  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', orderStatus: '', searchTerm: '', sinceDate: '', customerName: '', orderNumber: '', orderId: '' });
  }

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setSelectedInvoiceId(null); // Clear detail view on new search

    try {
        let queryData: any[] | null = null, error: any = null, headers: string[] = [];
        
        // Invoice report has a different trigger (Search button)
        if (reportType === 'invoice_report') {
            ({ data: queryData, error } = await supabase.rpc('get_invoice_list', {
                p_start_date: filters.startDate || null,
                p_end_date: filters.endDate || null,
                p_customer_name: filters.searchTerm || null,
                p_order_id: filters.orderId ? parseInt(filters.orderId) : null,
            }));
            headers = ['Order ID', 'Date', 'Customer', 'Total', 'Due', 'Status'];
        } else {
            // Logic for all other reports
            switch (reportType) {
                case 'profit_loss':
                    ({ data: queryData, error } = await supabase.rpc('get_profit_loss_report', { start_date: filters.startDate, end_date: filters.endDate }));
                    headers = ['Category', 'Amount (₹)'];
                    queryData = queryData?.length ? [
                        ['Total Revenue', `+ ₹${queryData[0].total_revenue.toLocaleString('en-IN')}`],
                        ['Total Expenses', `- ₹${queryData[0].total_expenses.toLocaleString('en-IN')}`],
                        ['Net Profit', `₹${queryData[0].net_profit.toLocaleString('en-IN')}`],
                    ] : [];
                    break;
                case 'orders_list':
                    ({ data: queryData, error } = await supabase.rpc('get_orders_report', { start_date: filters.startDate, end_date: filters.endDate, order_status: filters.orderStatus }));
                    headers = ['Order ID', 'Customer', 'Type', 'Qty', 'Amount', 'Status', 'Date'];
                    break;
                case 'due_summary':
                    ({ data: queryData, error } = await supabase.rpc('get_due_summary_report'));
                    headers = ['Order ID', 'Delivery Date', 'Balance Due (₹)'];
                    break;
                // Add other report cases here
            }
        }
        
        if (error) throw error;
        setReportData(queryData);
        setTableHeaders(headers);
        if (!queryData || queryData.length === 0) {
            toast.success('No data found for the selected criteria.');
        }

    } catch (err: any) {
        toast.error(`Report generation failed: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  // --- இன்வாய்ஸ் விவரங்களைப் பெறும் ஃபங்ஷன் ---
  const handleInvoiceSelect = async (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setIsDetailLoading(true);
    setInvoiceDetailData(null);
    try {
        const { data: invoice, error: invoiceError } = await supabase.from('orders').select('*').eq('id', invoiceId).single();
        if (invoiceError) throw invoiceError;
        
        const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').eq('order_id', invoiceId);
        if (paymentsError) throw paymentsError;

        setInvoiceDetailData({ invoice, payments });
    } catch (err: any) {
        toast.error(`Failed to load invoice #${invoiceId}: ${err.message}`);
        setSelectedInvoiceId(null); // Go back to list if fetch fails
    } finally {
        setIsDetailLoading(false);
    }
  }

  const downloadPdf = () => { /* This function is for other reports */ };

  const renderFilters = () => {
    switch (reportType) {
      case 'invoice_report':
        return (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Input id="startDate" label="From Date" type="date" value={filters.startDate} onChange={handleFilterChange} />
                <Input id="endDate" label="To Date" type="date" value={filters.endDate} onChange={handleFilterChange} />
                <Input id="searchTerm" label="Customer Name" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Search name..." />
                <Input id="orderId" label="Order Number" type="number" value={filters.orderId} onChange={handleFilterChange} placeholder="Search ID..." />
            </div>
        );
      // ... other filter rendering logic ...
      default:
        return <div className="md:col-span-3"><p className="text-sm text-gray-500 pt-6">Select a report type to see filters.</p></div>;
    }
  };
  
  // --- முக்கிய ரெண்டரிங் லாஜிக் ---
  const renderContent = () => {
    if (loading) {
        return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }
    
    // View Switcher for Invoice Report
    if (reportType === 'invoice_report') {
        if (isDetailLoading) {
            return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
        }
        if (selectedInvoiceId && invoiceDetailData) {
            return <InvoiceDetailView invoiceData={invoiceDetailData} onBack={() => setSelectedInvoiceId(null)} />;
        }
        // Show the list table if data exists
        if (reportData && reportData.length > 0) {
            return (
                <Card className="mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                           <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>{tableHeaders.map(th => <th key={th} className="px-4 py-2 text-left font-medium">{th}</th>)}</tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.map(invoice => (
                                    <tr key={invoice.order_id} onClick={() => handleInvoiceSelect(invoice.order_id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 font-bold">#{invoice.order_id}</td>
                                        <td className="px-4 py-2">{new Date(invoice.order_date).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-2">{invoice.customer_name}</td>
                                        <td className="px-4 py-2">₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2 text-red-600">₹{invoice.balance_due.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2">{invoice.status || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            );
        }
        return <div className="text-center p-6 text-gray-500">Use the filters and click "Search Invoices" to begin.</div>;
    }
    
    // FIX: மற்ற ரிப்போர்ட்டுகளுக்கான பொதுவான டேபிள் காட்சி
    if (reportData && reportData.length > 0) {
       return (
            <Card className="mt-6">
                 <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Report Preview</h3>
                    <Button onClick={downloadPdf} size="sm"><Download className="mr-2 h-4 w-4" /> Download as PDF</Button>
                </div>
                <div className="overflow-x-auto p-2">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>{tableHeaders.map(th => <th key={th} className="px-4 py-2 text-left font-medium">{th}</th>)}</tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.map((row, i) => (
                                <tr key={i}>
                                  {Array.isArray(row) 
                                    ? row.map((td: any, j) => <td key={j} className="px-4 py-2">{td}</td>)
                                    : Object.values(row).map((td: any, j) => <td key={j} className="px-4 py-2">{String(td)}</td>)
                                  }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
       );
    }
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-3"><BarChart /> Reports Center</h1>
      
      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input as="select" id="reportType" label="Report Type" value={reportType} onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}>
              {reportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Input>
            {renderFilters()}
          </div>
          <div className="flex items-center gap-3">
              <Button onClick={generateReport} disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working...</> : 
                   (reportType === 'invoice_report' ? <><Search className="mr-2 h-4 w-4"/>Search Invoices</> : 'Generate Report')}
              </Button>
              <Button onClick={clearFilters} variant="outline"><X className="mr-2 h-4 w-4" /> Clear</Button>
          </div>
        </div>
      </Card>
      
      {renderContent()}

    </div>
  );
};

export default ReportsPage;