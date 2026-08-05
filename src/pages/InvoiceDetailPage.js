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
  paid: { label: 'Paid', tone: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300', Icon: CheckCircle2 },
  unpaid: { label: 'Due', tone: 'border-amber-400/40 bg-amber-500/20 text-amber-300', Icon: CalendarClock },
  overdue: { label: 'Overdue', tone: 'border-red-400/40 bg-red-500/20 text-red-300', Icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'border-white/15 bg-white/10 text-slate-300', Icon: XCircle },
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
          className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/20 bg-white/10 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Invoice Not Found</h2>
            <p className="text-base text-slate-300 mb-4">The invoice you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-semibold"
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
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Invoice
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-1 text-base text-slate-300 sm:text-lg">
                {invoice.orderId?.productId?.serviceName || 'Plan'}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-4 py-2 text-base font-semibold backdrop-blur-md ${meta.tone}`}>
              <meta.Icon className="h-4 w-4" />
              {meta.label}
            </span>
          </div>

          <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                <span className="text-slate-300">Amount</span>
                <span className="font-semibold text-white">₹{invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                <span className="text-slate-300">Invoice Date</span>
                <span className="font-medium text-white">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                <span className="text-slate-300">Due Date</span>
                <span className="font-medium text-white">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.status === 'paid' && (
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                  <span className="text-slate-300">Paid Date</span>
                  <span className="font-medium text-white">{formatDate(invoice.paidDate)}</span>
                </div>
              )}
              {invoice.paymentMethod && (
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                  <span className="text-slate-300">Payment Method</span>
                  <span className="font-medium capitalize text-white">{invoice.paymentMethod}</span>
                </div>
              )}
            </div>

            <div className="relative mt-5">
              {invoice.status === 'paid' ? (
                invoice.pdfUrl && (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-emerald-600 py-3 text-center text-base font-medium text-white hover:bg-emerald-700"
                  >
                    Download Invoice
                  </a>
                )
              ) : (
                invoice.status !== 'cancelled' && (
                  <button
                    onClick={handlePayNow}
                    className="w-full rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700"
                  >
                    Pay Now
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetailPage;
