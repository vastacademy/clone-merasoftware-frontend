import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Sparkles, CheckCircle2, CalendarClock, XCircle, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import Context from '../context';
import displayINRCurrency from '../helpers/displayCurrency';
import DashboardLayout from '../components/DashboardLayout';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import backgroundImage from '../assets/BG.png';
import { getOrderDisplayName } from '../helpers/orderPresentation';
import { isPlanItem } from '../helpers/orderType';
import { goToCustomerReturn } from '../helpers/customerReturnNavigation';

const generateTransactionId = () =>
  `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

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
  partially_paid: { label: 'Partially Paid', tone: 'border-amber-400/40 bg-amber-500/20 text-amber-300', Icon: CalendarClock },
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
  const location = useLocation();
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

  // ---- Canonical in-page payment (SSOT) ----
  // This page is the single source of truth for paying an invoice. It pays THIS invoice
  // by posting to /wallet/verify-payment with invoiceId + orderId (sourceType: 'invoice'),
  // never creating a second order (the DirectPayment.js duplicate-order path is not used).
  // Every other surface just links here; there is no other Pay Now form.
  const context = useContext(Context);
  const [showPayment, setShowPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payTxnId, setPayTxnId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [sharingInvoice, setSharingInvoice] = useState(false);

  const amountDueNow = Math.max(0, Number(invoice?.amount || 0) - Number(invoice?.amountPaid || 0));
  const orderIdForPay = invoice?.orderId?._id || invoice?.orderId;
  const isInstallmentInvoice = Boolean(invoice?.installmentNumber);
  const isStatement = ['project_final', 'service_statement'].includes(invoice?.invoiceType);
  const isServerInvoice = invoice?._id && !String(invoice._id).startsWith('dummy-');
  const invoiceDocumentUrl = isServerInvoice ? `${SummaryApi.invoices.viewDocument.url}/${invoice._id}` : null;

  const handleShareInvoice = async () => {
    if (!invoiceDocumentUrl || !navigator.share || !navigator.canShare) {
      toast.error('PDF sharing is not supported on this browser. Use Download instead.');
      return;
    }
    try {
      setSharingInvoice(true);
      const response = await fetch(`${invoiceDocumentUrl}/download`, { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to prepare invoice PDF');
      const file = new File([await response.blob()], `${invoice.invoiceNumber || 'invoice'}.pdf`, { type: 'application/pdf' });
      if (!navigator.canShare({ files: [file] })) throw new Error('PDF sharing is not supported on this device');
      await navigator.share({ title: invoice.invoiceNumber || 'Invoice', files: [file] });
    } catch (error) {
      if (error.name !== 'AbortError') toast.error(error.message || 'Unable to share invoice');
    } finally {
      setSharingInvoice(false);
    }
  };

  const getInvoiceFallback = () => {
    const order = invoice?.orderId;
    const orderId = order?._id || order;

    if (!orderId) return '/order';
    if (order && typeof order === 'object' && isPlanItem(order)) {
      return `/plan-details/${orderId}`;
    }

    return `/order-detail/${orderId}`;
  };

  const handleBack = () => goToCustomerReturn(navigate, location, getInvoiceFallback());

  // Leaving this page after a payment returns through the customer-navigation SSOT.
  // The marker lets the explicit return page know its data is stale and refetch once.
  const goBackAfterPayment = () => {
    try {
      sessionStorage.setItem('paymentJustSubmitted', String(Date.now()));
    } catch (error) {
      // Private-mode / storage-disabled browsers: the page still falls back to its own polling.
    }
    handleBack();
  };

  const submitVerification = async ({ txnId, upiTransactionId, method }) => {
    const response = await fetch(SummaryApi.wallet.verifyPayment.url, {
      method: SummaryApi.wallet.verifyPayment.method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: txnId,
        amount: amountDueNow,
        upiTransactionId: upiTransactionId || `WALLET-${txnId}`,
        paymentMethod: method,
        sourceType: 'invoice',
        invoiceId: invoice._id,
        orderId: orderIdForPay,
        isInstallmentPayment: isInstallmentInvoice,
        installmentNumber: isInstallmentInvoice ? invoice.installmentNumber : null,
        type: 'payment',
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      }),
    });
    const data = await response.json();
    // An already-submitted transaction is treated as success (same as InstallmentPayment.js).
    if (!data.success && !(data.message || '').includes('already submitted')) {
      throw new Error(data.message || 'Payment verification failed');
    }
  };

  // Wallet covers the due amount → deduct + submit for approval. Else show a UPI QR.
  const handleConfirmPayment = async () => {
    if (payProcessing) return;
    try {
      setPayProcessing(true);
      const walletBalance = context?.walletBalance || 0;

      if (walletBalance >= amountDueNow) {
        // Full wallet cover → instant payment, no admin approval (the wallet is the customer's own,
        // already-approved money). One /wallet/pay-instant call atomically debits the wallet and
        // settles the order/installment server-side.
        const payRes = await fetch(SummaryApi.wallet.payInstant.url, {
          method: SummaryApi.wallet.payInstant.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderIdForPay,
            amount: amountDueNow,
            installmentNumber: isInstallmentInvoice ? invoice.installmentNumber : null,
            // A real plan invoice → the backend also marks the invoice document paid (invoice mode).
            // The temp DUMMY_INVOICES have string ids and no server record; skip invoiceId for those.
            invoiceId: String(invoice._id).startsWith('dummy-') ? null : invoice._id,
          }),
        });
        const payData = await payRes.json();
        if (!payData.success) {
          throw new Error(payData.message || 'Wallet payment failed');
        }
        context?.fetchWalletBalance?.();
        toast.success('Payment successful! Your plan is now active.');
        setShowPayment(false);
        // Tell the explicit return page that its data is stale, so it does not show
        // pre-payment data (for example, ProjectDetails' "Payment Pending" banner).
        goBackAfterPayment();
        return;
      }

      const txnId = generateTransactionId();
      setPayTxnId(txnId);
      const upiId = 'vacomputers.com@okhdfcbank';
      const payeeName = 'VA Computer';
      const upi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amountDueNow}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}&tr=${txnId}`;
      setUpiLink(upi);
      setShowQR(true);
    } catch (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setPayProcessing(false);
    }
  };

  const handleVerifyUpi = async () => {
    if (!upiRef.trim()) {
      toast.error('Please enter your UPI transaction ID');
      return;
    }
    try {
      setPayProcessing(true);
      await submitVerification({ txnId: payTxnId, upiTransactionId: upiRef.trim(), method: 'upi' });
      toast.success('Payment submitted for admin approval.');
      setShowQR(false);
      setShowPayment(false);
      goBackAfterPayment();
    } catch (error) {
      toast.error(error.message || 'Payment verification failed.');
    } finally {
      setPayProcessing(false);
    }
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
              onClick={handleBack}
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
              onClick={handleBack}
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
                {getOrderDisplayName(invoice.orderId, 'Plan')}
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
              {invoice.status === 'paid' || isStatement ? (
                invoiceDocumentUrl && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <a href={`${invoiceDocumentUrl}/view`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-300/60 py-3 text-center text-base font-medium text-emerald-100 hover:bg-white/10">View Invoice</a>
                    <a href={`${invoiceDocumentUrl}/download`} className="rounded-lg bg-emerald-600 py-3 text-center text-base font-medium text-white hover:bg-emerald-700">Download Invoice</a>
                    <button type="button" onClick={handleShareInvoice} disabled={sharingInvoice} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/60 py-3 text-base font-medium text-emerald-100 hover:bg-white/10 disabled:opacity-60"><Share2 size={17} />{sharingInvoice ? 'Preparing…' : 'Share'}</button>
                  </div>
                )
              ) : (
                invoice.status !== 'cancelled' && !isStatement && amountDueNow > 0 && (
                  <button
                    onClick={() => { setShowPayment(true); setShowQR(false); }}
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

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/15 bg-slate-900/95 p-6 text-white shadow-2xl backdrop-blur-2xl">
            {!showQR ? (
              <>
                <h3 className="text-lg font-bold">Pay Invoice {invoice.invoiceNumber}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Amount due</span>
                    <span className="font-semibold text-white">{displayINRCurrency(amountDueNow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Wallet balance</span>
                    <span className="font-semibold text-emerald-300">{displayINRCurrency(context?.walletBalance || 0)}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {(context?.walletBalance || 0) >= amountDueNow
                    ? 'Your wallet covers this amount. It will be deducted and sent for admin approval.'
                    : 'Not enough wallet balance — you will pay via UPI QR next.'}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setShowPayment(false)}
                    disabled={payProcessing}
                    className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={payProcessing}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {payProcessing
                      ? 'Processing...'
                      : (context?.walletBalance || 0) >= amountDueNow
                        ? 'Pay from Wallet'
                        : 'Continue to UPI'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">Scan &amp; Pay {displayINRCurrency(amountDueNow)}</h3>
                <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
                  <QRCodeSVG value={upiLink} size={190} />
                </div>
                <label className="mt-4 block text-sm font-medium text-slate-200">
                  UPI Transaction ID
                </label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(event) => setUpiRef(event.target.value)}
                  placeholder="Enter the UPI reference after paying"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setShowQR(false)}
                    disabled={payProcessing}
                    className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyUpi}
                    disabled={payProcessing}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {payProcessing ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InvoiceDetailPage;
