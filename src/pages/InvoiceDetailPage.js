import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, CheckCircle2, CalendarClock, XCircle } from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import backgroundImage from '../assets/BG.png';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const INVOICE_STATUS_META = {
  paid: { label: 'Paid', tone: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  unpaid: { label: 'Due', tone: 'bg-amber-100 text-amber-800', Icon: CalendarClock },
  overdue: { label: 'Overdue', tone: 'bg-rose-100 text-rose-700', Icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'bg-slate-200 text-slate-600', Icon: XCircle },
};

// TEMP UI-preview only — matches OrderDetailPage.js's DUMMY_INVOICES. Remove both once
// the backend creates a real invoice per order.
const DUMMY_INVOICES = {
  'dummy-1': { _id: 'dummy-1', invoiceNumber: 'INV-202604-0001', amount: 3000, status: 'paid', invoiceDate: '2026-05-01', dueDate: '2026-05-01', paidDate: '2026-05-21', paymentMethod: 'upi' },
  'dummy-2': { _id: 'dummy-2', invoiceNumber: 'INV-202605-0002', amount: 3000, status: 'unpaid', invoiceDate: '2026-05-25', dueDate: '2026-06-01' },
  'dummy-3': { _id: 'dummy-3', invoiceNumber: 'INV-202606-0003', amount: 3000, status: 'overdue', invoiceDate: '2026-05-25', dueDate: '2026-06-01' },
};

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchInvoice();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);

      if (DUMMY_INVOICES[invoiceId]) {
        setInvoice(DUMMY_INVOICES[invoiceId]);
        return;
      }

      const response = await fetch(SummaryApi.myPaymentWorkspace.url, {
        method: SummaryApi.myPaymentWorkspace.method,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const found = (data.data.invoices || []).find(
          (inv) => String(inv._id) === String(invoiceId)
        );
        setInvoice(found || null);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    navigate(`/direct-payment`, {
      state: {
        invoicePayment: true,
        invoiceId: invoice._id,
        orderId: invoice.orderId?._id,
        invoiceAmount: invoice.amount,
        productName: invoice.orderId?.productId?.serviceName || 'Plan',
      },
    });
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout user={user}>
        <div
          className="min-h-full bg-slate-950 bg-cover bg-center px-4 py-5 sm:px-6 lg:px-8 lg:py-8"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Invoice Not Found</h2>
            <p className="text-base text-black mb-4">The invoice you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const meta = INVOICE_STATUS_META[invoice.status] || INVOICE_STATUS_META.unpaid;

  return (
    <DashboardLayout user={user}>
      <div
        className="min-h-full bg-slate-950 bg-cover bg-center px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">

          <button
            onClick={() => navigate(-1)}
            className="flex w-fit items-center text-base font-semibold text-blue-600 hover:underline"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </button>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Invoice
                  </div>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                    {invoice.invoiceNumber}
                  </h1>
                  <p className="mt-1 text-sm text-slate-300">
                    {invoice.orderId?.productId?.serviceName || 'Plan'}
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-4 py-2 text-base font-semibold ${meta.tone}`}>
                  <meta.Icon className="h-4 w-4" />
                  {meta.label}
                </span>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                    <span className="text-black">Amount</span>
                    <span className="font-semibold text-black">₹{invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                    <span className="text-black">Invoice Date</span>
                    <span className="font-medium text-black">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                    <span className="text-black">Due Date</span>
                    <span className="font-medium text-black">{formatDate(invoice.dueDate)}</span>
                  </div>
                  {invoice.status === 'paid' && (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                      <span className="text-black">Paid Date</span>
                      <span className="font-medium text-black">{formatDate(invoice.paidDate)}</span>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                      <span className="text-black">Payment Method</span>
                      <span className="font-medium capitalize text-black">{invoice.paymentMethod}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  {invoice.status === 'paid' ? (
                    invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-lg bg-blue-600 py-3 text-center text-base font-medium text-white hover:bg-blue-700"
                      >
                        Download Invoice
                      </a>
                    )
                  ) : (
                    invoice.status !== 'cancelled' && (
                      <button
                        onClick={handlePayNow}
                        className="w-full rounded-lg bg-green-600 py-3 text-base font-medium text-white hover:bg-green-700"
                      >
                        Pay Now
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetailPage;
