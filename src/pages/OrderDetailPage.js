import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, XCircle, CalendarClock, ChevronRight } from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { isOrderApproved } from '../helpers/orderVisibility';
import { getOrderCategory, getOrderDisplayName } from '../helpers/orderPresentation';
import {
  customerReturnState,
  goToCustomerReturn,
} from '../helpers/customerReturnNavigation';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const INSTALLMENT_LABELS = { 1: 'First Installment', 2: 'Second Installment', 3: 'Final Installment' };

const getInstallmentStatus = (installment) => {
  if (installment.paid) {
    return { label: 'Paid', tone: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300', Icon: CheckCircle2 };
  }
  if (installment.paymentStatus === 'pending-approval') {
    return { label: 'Verification Pending', tone: 'border-white/25 bg-white/15 text-white', Icon: Clock3 };
  }
  if (installment.paymentStatus === 'rejected') {
    return { label: 'Rejected', tone: 'border-red-400/40 bg-red-500/20 text-red-300', Icon: XCircle };
  }
  return { label: 'Due', tone: 'border-amber-400/40 bg-amber-500/20 text-amber-300', Icon: CalendarClock };
};

const INVOICE_STATUS_META = {
  paid: { label: 'Paid', tone: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300', Icon: CheckCircle2 },
  unpaid: { label: 'Due', tone: 'border-amber-400/40 bg-amber-500/20 text-amber-300', Icon: CalendarClock },
  overdue: { label: 'Overdue', tone: 'border-red-400/40 bg-red-500/20 text-red-300', Icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'border-white/15 bg-white/10 text-slate-300', Icon: XCircle },
};

// TEMP UI-preview only — real invoice-generation backend doesn't exist for every order yet.
// Remove this once the backend creates a real invoice per order.
const DUMMY_INVOICES = [
  { _id: 'dummy-1', invoiceNumber: 'INV-202604-0001', amount: 3000, status: 'paid', paidDate: '2026-05-21', dueDate: '2026-05-01' },
  { _id: 'dummy-2', invoiceNumber: 'INV-202605-0002', amount: 3000, status: 'unpaid', dueDate: '2026-06-01' },
  { _id: 'dummy-3', invoiceNumber: 'INV-202606-0003', amount: 3000, status: 'overdue', dueDate: '2026-06-01' },
];

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SummaryApi.orderDetails.url}/${orderId}`, {
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(SummaryApi.myPaymentWorkspace.url, {
        method: SummaryApi.myPaymentWorkspace.method,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const orderInvoices = (data.data.invoices || []).filter(
          (inv) => String(inv.orderId?._id || inv.orderId) === String(orderId)
        );
        setInvoices(orderInvoices.length > 0 ? orderInvoices : DUMMY_INVOICES);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  // Route to the actual installment-payment page (wallet-instant / UPI / combined, same SSOT
  // path as ProjectDetails.js's PaymentAlert button). `/direct-payment` was the wrong destination
  // — it only reads `location.state.paymentData`/`retryPaymentId`, never the installment shape
  // this used to send, so every click there landed on "Payment information not found" and bounced
  // to the dashboard without ever reaching a payment endpoint.
  const handlePayInstallment = (installment) => {
    navigate(`/installment-payment/${order._id}/${installment.installmentNumber}`, {
      state: customerReturnState(`/order-detail/${order._id}`),
    });
  };

  const handleBack = () => goToCustomerReturn(navigate, location, '/order');

  const handleRetryPayment = () => {
    navigate(`/direct-payment`, {
      state: {
        ...customerReturnState(`/order-detail/${order._id}`),
        retryPaymentId: order._id,
        productId: order.productId?._id,
        paymentData: {
          product: order.productId,
          selectedFeatures: order.orderItems?.filter(item => item.type === 'feature').map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity || 1,
            sellingPrice: item.originalPrice || 0,
            totalPrice: item.finalPrice || 0,
          })) || [],
          totalPrice: order.price,
          originalTotalPrice: order.originalPrice || order.price,
        },
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

  if (!order) {
    return (
      <DashboardLayout user={user}>
        <div
          className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/20 bg-white/10 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Order Not Found</h2>
            <p className="text-base text-slate-300 mb-4">The order you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-semibold"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isRecurringPlan = order.productId?.category === 'website_updates';

  const startDate = new Date(order.createdAt);
  let endDate = null;
  if (isRecurringPlan) {
    const durationDays = order.productId?.yearlyPlanDuration || 365;
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
  }

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
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {getOrderDisplayName(order, 'Plan')}
              </h1>
              <p className="mt-1 text-base text-slate-300 sm:text-lg">
                {getOrderCategory(order, 'General').split('_').join(' ')}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            <div className="relative grid w-full grid-cols-1 gap-5 lg:grid-cols-2">

              {/* Snapshot card */}
              <div className="rounded-[1.5rem] border border-white/15 bg-white/[0.03] p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">Plan Snapshot</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                    <span className="text-slate-300">Start Date</span>
                    <span className="font-medium text-white">{formatDate(startDate)}</span>
                  </div>

                  {isRecurringPlan ? (
                    <>
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                        <span className="text-slate-300">End Date</span>
                        <span className="font-medium text-white">{formatDate(endDate)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                        <span className="text-slate-300">Payment Due Date</span>
                        <span className="font-medium text-white">
                          {formatDate(order.monthlyLimitResetDate || order.currentMonthExpiryDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                        <span className="text-slate-300">Payment Cycle</span>
                        <span className="font-medium text-white">Monthly</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-2.5 text-base">
                      <span className="text-slate-300">Payment Method</span>
                      <span className="font-medium text-white">
                        {order.isPartialPayment ? 'Installments (3)' : 'Full Payment'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Installments list — only for installment orders (not recurring plans) */}
              {!isRecurringPlan && order.isPartialPayment && order.installments?.length > 0 && (
                <div className="rounded-[1.5rem] border border-white/15 bg-white/[0.03] p-5">
                  <h3 className="mb-3 text-lg font-semibold text-white">Installments</h3>
                  <div className="space-y-3">
                    {order.installments.map((installment) => {
                      const st = getInstallmentStatus(installment);
                      const label = INSTALLMENT_LABELS[installment.installmentNumber] || `Installment #${installment.installmentNumber}`;
                      const canPay = !installment.paid && installment.paymentStatus !== 'pending-approval' && isOrderApproved(order);
                      return (
                        <div
                          key={installment.installmentNumber}
                          onClick={canPay ? () => handlePayInstallment(installment) : undefined}
                          className={`flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${canPay ? 'cursor-pointer hover:border-white/20 hover:bg-white/[0.07]' : ''}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-white">{label}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold backdrop-blur-md ${st.tone}`}>
                                <st.Icon className="h-3.5 w-3.5" />
                                {st.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-300">
                              {installment.paid
                                ? `Paid on ${formatDate(installment.paidDate)}`
                                : `Due on ${formatDate(installment.dueDate)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white">₹{installment.amount.toLocaleString()}</span>
                            {canPay && <ChevronRight className="h-4 w-4 text-slate-300" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoice history — shown whenever this order has any invoice records */}
              {invoices.length > 0 && (
                <div className="rounded-[1.5rem] border border-white/15 bg-white/[0.03] p-5">
                  <h3 className="mb-3 text-lg font-semibold text-white">Invoice History</h3>
                  <div className="space-y-3">
                    {invoices.map((invoice) => {
                      const meta = INVOICE_STATUS_META[invoice.status] || INVOICE_STATUS_META.unpaid;
                      return (
                        <div
                          key={invoice._id}
                          onClick={() => navigate(`/invoice-detail/${invoice._id}`, {
                            state: customerReturnState(`/order-detail/${order._id}`),
                          })}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-white">{invoice.invoiceNumber}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold backdrop-blur-md ${meta.tone}`}>
                                <meta.Icon className="h-3.5 w-3.5" />
                                {meta.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-300">
                              {invoice.status === 'paid'
                                ? `Paid on ${formatDate(invoice.paidDate)}`
                                : `Due on ${formatDate(invoice.dueDate)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white">₹{invoice.amount.toLocaleString()}</span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {order.orderVisibility === 'payment-rejected' && (
              <div className="relative mt-5 rounded-[1.5rem] border border-white/15 bg-white/[0.03] p-5">
                <button
                  onClick={handleRetryPayment}
                  className="w-full rounded-lg bg-red-600 py-3 text-base font-medium text-white transition-colors hover:bg-red-700 sm:w-auto sm:px-8"
                >
                  Retry Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderDetailPage;
