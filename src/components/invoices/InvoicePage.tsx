// src/components/invoices/InvoicePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient'; // உங்கள் Supabase கிளையன்ட் பாதை
import InvoiceView from './InvoiceView'; // உங்கள் InvoiceView கூறின் பாதை
import { useReactToPrint } from 'react-to-print';
import { Printer, MessageCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button'; // உங்கள் Button கூறின் பாதை
import Card from '../ui/Card'; // உங்கள் Card கூறின் பாதை

// View-லிருந்து வரும் தரவிற்கான தெளிவான வகை வரையறை
interface OrderDetails {
  id: number;
  date: string;
  total_amount: number;
  paid: number;   // View-லிருந்து நேரடியாகப் பெறப்படும்
  balance: number; // View-லிருந்து நேரடியாகப் பெறப்படும்
  customer_id: string; // ✅ Added customer_id field
  customer: {
    name: string;
    phone: string;
    address: string;
  } | null;
}

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice #${id}`,
    pageStyle: `
      @media print {
        body { -webkit-print-color-adjust: exact; }
        @page { size: A4; margin: 20mm; }
      }
    `,
  });

  useEffect(() => {
    if (!id) {
        setError("Invoice ID not found in URL.");
        setLoading(false);
        return;
    }

    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ First query: Get order summary data including customer_id and customer_name
        const { data: summaryData, error: viewError } = await supabase
          .from('order_summary_with_dues')
          .select(`
            order_id,
            date,
            total_amount,
            amount_paid,
            balance_due,
            customer_id,
            customer_name
          `)
          .eq('order_id', id)
          .single();

        if (viewError) throw viewError;
        if (!summaryData) throw new Error(`Invoice with ID #${id} not found.`);

        // ✅ Second query: Get full customer details separately
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('name, phone, address')
          .eq('id', summaryData.customer_id)
          .single();

        if (customerError) {
          console.warn("Could not fetch customer details:", customerError);
        }

        // ✅ Combine the results from both queries
        setOrder({
          id: summaryData.order_id,
          date: summaryData.date,
          total_amount: summaryData.total_amount,
          paid: summaryData.amount_paid,
          balance: summaryData.balance_due,
          customer_id: summaryData.customer_id,
          customer: customerData || {
            name: summaryData.customer_name || 'Unknown Customer',
            phone: '',
            address: ''
          },
        });

      } catch (err: any) {
         console.error("Error fetching invoice data:", err);
         setError(err.message || 'Failed to load invoice data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading Invoice #{id}...</p>
        </div>
    );
  }

  if (error || !order) {
    return (
        <Card className="p-6 m-4 bg-red-50 text-red-700 border border-red-300 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="font-semibold text-lg">Error Loading Invoice</p>
            <p className="text-sm mb-4">{error || 'Invoice could not be found.'}</p>
            <Link to="/invoices">
                <Button variant="secondary" className="flex items-center mx-auto">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Invoices
                </Button>
            </Link>
        </Card>
    );
  }

  const { customer } = order;
  const whatsappMessage = `Hello ${customer?.name || ''},\n\nHere is a summary for your Invoice #${order.id}:\n\nTotal Amount: ₹${order.total_amount.toLocaleString()}\nAmount Paid: ₹${order.paid.toLocaleString()}\nBalance Due: ₹${order.balance.toLocaleString()}\n\nThank you!`;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <Link to="/invoices" className="text-sm text-primary-600 hover:underline flex items-center mb-1">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to All Invoices
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">🧾 Invoice #{order.id}</h1>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button onClick={handlePrint} variant="secondary" className="w-1/2 sm:w-auto flex-1 sm:flex-none">
            <Printer className="w-4 h-4 mr-2" />
            Print / Download
          </Button>
          <a
            href={`https://wa.me/${customer?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
              whatsappMessage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-1/2 sm:w-auto flex-1 sm:flex-none"
          >
            <Button variant="success" className="w-full" disabled={!customer?.phone}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-2 sm:p-4">
          <InvoiceView ref={invoiceRef} order={order} />
      </div>
    </div>
  );
};

export default InvoicePage;