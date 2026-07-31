import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, XCircle, CalendarClock, ChevronRight } from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { isOrderApproved } from '../helpers/orderVisibility';

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
    return { label: 'Paid', tone: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 };
  }
  if (installment.paymentStatus === 'pending-approval') {
    return { label: 'Verification Pending', tone: 'bg-blue-100 text-blue-700', Icon: Clock3 };
  }
  if (installment.paymentStatus === 'rejected') {
    return { label: 'Rejected', tone: 'bg-rose-100 text-rose-700', Icon: XCircle };
  }
  return { label: 'Due', tone: 'bg-amber-100 text-amber-800', Icon: CalendarClock };
};

const INVOICE_STATUS_META = {
  paid: { label: 'Paid', tone: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  unpaid: { label: 'Due', tone: 'bg-amber-100 text-amber-800', Icon: CalendarClock },
  overdue: { label: 'Overdue', tone: 'bg-rose-100 text-rose-700', Icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'bg-slate-200 text-slate-600', Icon: XCircle },
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

  const handlePayInstallment = (installment) => {
    navigate(`/direct-payment`, {
      state: {
        installmentPayment: true,
        orderId: order._id,
        installmentNumber: installment.installmentNumber,
        installmentAmount: installment.amount,
        productName: order.productId?.serviceName || 'Product',
      },
    });
  };

  const handleRetryPayment = () => {
    navigate(`/direct-payment`, {
      state: {
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
          className="min-h-full bg-slate-950 bg-cover bg-center px-4 py-5 sm:px-6 lg:px-8 lg:py-8"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Order Not Found</h2>
            <p className="text-base text-black mb-4">The order you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/order')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold"
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
        className="min-h-full bg-slate-950 bg-cover bg-center px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => navigate('/order')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="mt-4 max-w-xl">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {order.productId?.serviceName || 'Plan'}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  {order.productId?.category?.split('_').join(' ') || 'General'}
                </p>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

                <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">

                  {/* Snapshot card */}
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-black">Plan Snapshot</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                        <span className="text-black">Start Date</span>
                        <span className="font-medium text-black">{formatDate(startDate)}</span>
                      </div>

                      {isRecurringPlan ? (
                        <>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                            <span className="text-black">End Date</span>
                            <span className="font-medium text-black">{formatDate(endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                            <span className="text-black">Payment Due Date</span>
                            <span className="font-medium text-black">
                              {formatDate(order.monthlyLimitResetDate || order.currentMonthExpiryDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                            <span className="text-black">Payment Cycle</span>
                            <span className="font-medium text-black">Monthly</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-base">
                          <span className="text-black">Payment Method</span>
                          <span className="font-medium text-black">
                            {order.isPartialPayment ? 'Installments (3)' : 'Full Payment'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Installments list — only for installment orders (not recurring plans) */}
                  {!isRecurringPlan && order.isPartialPayment && order.installments?.length > 0 && (
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-3 text-lg font-semibold text-black">Installments</h3>
                      <div className="space-y-3">
                        {order.installments.map((installment) => {
                          const st = getInstallmentStatus(installment);
                          const label = INSTALLMENT_LABELS[installment.installmentNumber] || `Installment #${installment.installmentNumber}`;
                          const canPay = !installment.paid && installment.paymentStatus !== 'pending-approval' && isOrderApproved(order);
                          return (
                            <div
                              key={installment.installmentNumber}
                              onClick={canPay ? () => handlePayInstallment(installment) : undefined}
                              className={`flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${canPay ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-100' : ''}`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-medium text-black">{label}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${st.tone}`}>
                                    <st.Icon className="h-3.5 w-3.5" />
                                    {st.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-black">
                                  {installment.paid
                                    ? `Paid on ${formatDate(installment.paidDate)}`
                                    : `Due on ${formatDate(installment.dueDate)}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-black">₹{installment.amount.toLocaleString()}</span>
                                {canPay && <ChevronRight className="h-4 w-4 text-black" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Invoice history — shown whenever this order has any invoice records */}
                  {invoices.length > 0 && (
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-3 text-lg font-semibold text-black">Invoice History</h3>
                      <div className="space-y-3">
                        {invoices.map((invoice) => {
                          const meta = INVOICE_STATUS_META[invoice.status] || INVOICE_STATUS_META.unpaid;
                          return (
                            <div
                              key={invoice._id}
                              onClick={() => navigate(`/invoice-detail/${invoice._id}`)}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-slate-300 hover:shadow-md"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-medium text-black">{invoice.invoiceNumber}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${meta.tone}`}>
                                    <meta.Icon className="h-3.5 w-3.5" />
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-black">
                                  {invoice.status === 'paid'
                                    ? `Paid on ${formatDate(invoice.paidDate)}`
                                    : `Due on ${formatDate(invoice.dueDate)}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-black">₹{invoice.amount.toLocaleString()}</span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-black" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {order.orderVisibility === 'payment-rejected' && (
                <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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
      </div>
    </DashboardLayout>
  );
};

export default OrderDetailPage;
