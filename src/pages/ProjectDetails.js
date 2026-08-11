import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, ArrowLeft, Clock, Check, List, Upload,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import AdminLayout from '../components/AdminLayout';
import backgroundImage from '../assets/BG.png';
import UpdateRequestModal from '../components/UpdateRequestModal';
import PaymentAlert from '../components/PaymentAlert';
import { logout } from '../store/userSlice';
import CookieManager from '../utils/cookieManager';
import StorageService from '../utils/storageService';
import { useOnlineStatus } from '../App';
import { isPlanItem } from '../helpers/orderType';

const normalizeNodeKey = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const getDefaultNodeId = (nodes = []) => {
  const activeNodes = nodes.filter((node) => node.status === 'active');
  const lastActiveNode = activeNodes[activeNodes.length - 1];

  if (lastActiveNode) {
    return normalizeNodeKey(lastActiveNode.nodeId);
  }

  if (nodes.length > 0) {
    return normalizeNodeKey(nodes[nodes.length - 1].nodeId);
  }

  return '';
};

const TimelineCheckpointItem = ({
  checkpoint: node,
  isCompleted,
  isInProgress,
  isSelected,
  messageCount,
  formatDate,
  onSelect,
  compact = false,
  isGlass = false,
}) => {
  const statusLabel = compact
    ? isCompleted
      ? 'Done'
      : isInProgress
        ? 'Live'
        : 'Soon'
    : isCompleted
      ? 'Completed'
      : isInProgress
        ? 'In Progress'
        : 'Upcoming';

  const statusTone = isGlass
    ? isCompleted
      ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
      : isInProgress
        ? 'border-white/25 bg-white/15 text-white'
        : 'border-white/15 bg-white/10 text-slate-300'
    : isCompleted
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : isInProgress
        ? 'border-slate-300 bg-slate-100 text-slate-700'
        : 'border-slate-200 bg-white text-slate-600';

  const cardTone = isGlass
    ? isSelected
      ? compact
        ? 'border-white/40 bg-white/[0.1] ring-2 ring-white/20'
        : 'border-white/40 bg-white/[0.1] shadow-md ring-2 ring-white/20'
      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]'
    : isSelected
      ? compact
        ? 'border-slate-300 bg-slate-50 ring-2 ring-slate-200'
        : 'border-slate-300 bg-white shadow-md ring-2 ring-slate-200'
      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';

  const badgeTone = isGlass
    ? isSelected
      ? 'border-white/40 bg-white/15'
      : isCompleted
        ? 'border-emerald-400/60 bg-emerald-500/20'
        : isInProgress
          ? 'border-white/30 bg-white/15'
          : 'border-white/15 bg-white/10'
    : isSelected
      ? 'border-slate-400 bg-slate-100'
      : isCompleted
        ? 'border-emerald-500 bg-emerald-50'
        : isInProgress
          ? 'border-slate-400 bg-slate-100'
          : 'border-slate-300 bg-white';

  return (
    <button
      type="button"
      data-node-id={node.nodeId}
      onClick={onSelect}
      className={[
        compact
          ? 'flex w-full items-start gap-3 rounded-[1.25rem] border p-3.5 text-left transition backdrop-blur-md'
          : 'relative flex w-full items-start gap-3 rounded-[1.25rem] border p-3 text-left transition backdrop-blur-md',
        cardTone,
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          badgeTone,
        ].join(' ')}
      >
        {isCompleted ? (
          <Check className={isGlass ? 'h-4 w-4 text-emerald-400' : 'h-4 w-4 text-emerald-500'} />
        ) : isInProgress ? (
          <Clock className={isGlass ? 'h-4 w-4 text-white' : 'h-4 w-4 text-slate-600'} />
        ) : (
          <span className={isGlass ? 'h-3 w-3 rounded-full bg-white/30' : 'h-3 w-3 rounded-full bg-slate-300'}></span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={compact ? 'flex items-center justify-between gap-2' : 'flex flex-wrap items-center gap-2'}>
          <h3 className={isGlass ? 'truncate text-base font-semibold text-white' : 'truncate text-base font-semibold text-black'}>
            {node.title}
          </h3>
          <span className={["rounded-full border px-2 py-0.5 text-sm font-semibold", statusTone].join(' ')}>
            {statusLabel}
          </span>
        </div>
        <div className={isGlass ? 'mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-300' : 'mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-black'}>
          <span>{messageCount} updates</span>
          <span>{formatDate(node.createdAt)}</span>
        </div>
      </div>
    </button>
  );
};

const ProjectDetails = ({ isAdminView = false }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.user);
  const { isOnline } = useOnlineStatus();
  const timelineRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowPaymentAlert, setShouldShowPaymentAlert] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isProjectPaused, setIsProjectPaused] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const g = (adminClass, customerClass) => (isAdminView ? adminClass : customerClass);
  const [selectedNodeId, setSelectedNodeId] = useState('');

  const handleLogout = async () => {
    try {
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
        }
      }

      CookieManager.clearAll();
      StorageService.clearUserData();

      dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const Shell = isAdminView ? AdminLayout : DashboardLayout;
  const shellProps = isAdminView
    ? {
        user,
        onLogout: handleLogout,
      }
    : {
        user,
      };
  const checkPaymentStatus = useCallback(async (order) => {
    // If project is already completed, don't show payment alert
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      setShouldShowPaymentAlert(false);
      setIsProjectPaused(false);
      return;
    }

    try {
      // Check if there are any pending transactions for this order first
      const pendingTransResponse = await fetch(`${SummaryApi.checkPendingOrderTransactions.url}/${order._id}`, {
        credentials: 'include',
      });
      
      const pendingTransData = await pendingTransResponse.json();
      const hasPendingTransaction = pendingTransData.success && pendingTransData.data.hasPending;
      
      // If there's a pending transaction, show the pending approval alert
      if (hasPendingTransaction) {
        // Get the installment number from the transaction
        const installmentNumber = pendingTransData.data.installmentNumber || 1;
        
        // Find the corresponding installment or create one if it doesn't exist
        let relevantInstallment = order.installments && order.installments.find(
          inst => inst.installmentNumber === installmentNumber
        );

        // If we can't find a relevant installment, create a placeholder
        if (!relevantInstallment) {
          relevantInstallment = {
            installmentNumber: installmentNumber || 1,
            amount: pendingTransData.data.amount || 0,
          };
        }
        
        // Set the current installment with pending-approval status
        setShouldShowPaymentAlert(true);
        setIsProjectPaused(false); // Not paused while payment is being verified
        setCurrentInstallment({
          ...relevantInstallment,
          paymentStatus: 'pending-approval'
        });
        return;
      }
    } catch (error) {
      console.error('Error checking pending transactions:', error);
    }

    // Regular installment check flow
    if (order.installments && order.installments.length > 0) {
      const nextUnpaidInstallment = order.installments.find(inst => !inst.paid);
      
      if (nextUnpaidInstallment) {
        // Check if there's a pending approval for this installment in the order record
        const isPendingApproval = nextUnpaidInstallment.paymentStatus === 'pending-approval';
        
        // If payment is awaiting verification based on order status, show the pending alert
        if (isPendingApproval) {
          setShouldShowPaymentAlert(true);
          setIsProjectPaused(false); // Not paused while payment is being verified
          setCurrentInstallment({
            ...nextUnpaidInstallment,
            paymentStatus: 'pending-approval'
          });
          return;
        }
        
        // Determine if we should show the alert based on progress
        const shouldPause = 
          (nextUnpaidInstallment.installmentNumber === 2 && Math.round(order.projectProgress) >= 40) ||
          (nextUnpaidInstallment.installmentNumber === 3 && Math.round(order.projectProgress) >= 75);
        
        setShouldShowPaymentAlert(shouldPause);
        setIsProjectPaused(shouldPause);
        setCurrentInstallment(nextUnpaidInstallment);
      } else {
        // All installments paid, no alert needed
        setShouldShowPaymentAlert(false);
        setIsProjectPaused(false);
      }
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    try {
      // First fetch order data
      const orderResponse = await fetch(`${SummaryApi.orderDetails.url}/${orderId}`, {
        credentials: 'include',
      });
      const orderData = await orderResponse.json();
      
      if (orderData.success) {
        const order = orderData.data;

        if (!isAdminView && isPlanItem(order)) {
          navigate(`/plan-details/${orderId}`, { replace: true });
          return;
        }

        // Check if this order is visible to the user
        if (order.orderVisibility === 'pending-approval') {
          setOrder({
            ...order,
            isPendingApproval: true,
            pendingMessage: "Your payment is being processed. Project details will be available after admin approval."
          });
          setLoading(false);
          return;
        }
        
        if (order.orderVisibility === 'payment-rejected') {
          setOrder({
            ...order,
            isPaymentRejected: true,
            rejectionReason: order.rejectionReason || "Your payment was rejected. Please retry payment to access this project."
          });
          setLoading(false);
          return;
        }

        const nodes = Array.isArray(order.projectNodes) ? order.projectNodes : [];
        const normalizedMessages = Array.isArray(order.messages)
          ? order.messages.map((message) => {
              const linkedNode = message.nodeId
                ? nodes.find((node) => node.nodeId === message.nodeId)
                : null;

              return {
                ...message,
                checkpointName: linkedNode?.title || 'Project Update',
              };
            })
          : [];

        const mappedOrder = {
          ...order,
          messages: normalizedMessages,
        };

        setOrder(mappedOrder);

        // Check if this is a partial payment order and if we should show payment alert
        if (order.isPartialPayment) {
          checkPaymentStatus(mappedOrder);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId, checkPaymentStatus, isAdminView]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Add polling mechanism
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrderDetails();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchOrderDetails]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const handleBack = () => {
    if (isAdminView) {
      navigate(-1);
      return;
    }

    navigate('/dashboard');
  };

  // SSOT: all payment goes through the canonical invoice page. This project page never
  // hosts its own payment form — it only routes to /invoice-detail/:invoiceId, which is
  // the single place an invoice is paid.
  const handleMakePayment = () => {
    if (order?.unpaidInvoice?._id) {
      navigate(`/invoice-detail/${order.unpaidInvoice._id}`);
    } else {
      navigate(`/order-detail/${orderId}`);
    }
  };

  const sortedNodes = useMemo(() => {
    const nodes = order?.projectNodes || [];
    return [...nodes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [order?.projectNodes]);

  const inProgressNode = useMemo(() => {
    const activeNodes = sortedNodes.filter((node) => node.status === 'active');
    return activeNodes[activeNodes.length - 1] || null;
  }, [sortedNodes]);

  const timelineNodes = useMemo(
    () => [...sortedNodes].reverse(),
    [sortedNodes]
  );
  const selectedNode = useMemo(
    () =>
      timelineNodes.find(
        (node) => normalizeNodeKey(node.nodeId) === normalizeNodeKey(selectedNodeId)
      ) || null,
    [selectedNodeId, timelineNodes]
  );
  const selectedNodeMessages = useMemo(
    () =>
      (order?.messages || []).filter(
        (message) => normalizeNodeKey(message.nodeId) === normalizeNodeKey(selectedNode?.nodeId)
      ),
    [order?.messages, selectedNode?.nodeId]
  );
  const nodeMessageCounts = useMemo(
    () =>
      timelineNodes.reduce((acc, node) => {
        acc[node.nodeId] = (order?.messages || []).filter(
          (message) => normalizeNodeKey(message.nodeId) === normalizeNodeKey(node.nodeId)
        ).length;
        return acc;
      }, {}),
    [order?.messages, timelineNodes]
  );

  useEffect(() => {
    const defaultNodeId = getDefaultNodeId(sortedNodes);

    setSelectedNodeId((currentSelection) => {
      const selectionExists = timelineNodes.some(
        (node) => normalizeNodeKey(node.nodeId) === normalizeNodeKey(currentSelection)
      );

      if (selectionExists) {
        return currentSelection;
      }

      return defaultNodeId;
    });
  }, [orderId, sortedNodes, timelineNodes]);

  if (loading) {
    return (
      <Shell {...shellProps}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      </Shell>
    );
  }

  // Special rendering for pending approval
  if (order && order.isPendingApproval && !isAdminView) {
    return (
      <Shell {...shellProps}>
        <div className="p-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-amber-800">Payment Processing</h3>
                <div className="mt-2 text-base text-amber-700">
                  <p>{order.pendingMessage}</p>
                  <p className="mt-2">This process usually takes 1-4 hours. You'll receive a notification once your payment is approved.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-semibold"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // Special rendering for rejected payments
  if (order && order.isPaymentRejected && !isAdminView) {
    return (
      <Shell {...shellProps}>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">Payment Rejected</h3>
                <div className="mt-2 text-base text-red-700">
                  <p>Your payment for this project was rejected.</p>
                  <p className="mt-2 font-medium">Reason: {order.rejectionReason || "Payment verification failed"}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-base font-semibold"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      // SSOT: retry pays the same invoice via the canonical invoice page —
                      // no re-order through DirectPayment.js (which would create a duplicate).
                      if (order?.unpaidInvoice?._id) {
                        navigate(`/invoice-detail/${order.unpaidInvoice._id}`);
                      } else {
                        navigate(`/order-detail/${order._id}`);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-base font-semibold"
                  >
                    Retry Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell {...shellProps}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Project Not Found</h2>
            <p className="text-base text-black mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
            <button
                    onClick={handleBack}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Shell>
    );
  }
  
  // Calculate progress percentage
  const progressPercentage = Math.round(order.projectProgress);
  const currentStageLabel = inProgressNode?.title || selectedNode?.title || 'All stages completed';
  const totalUpdates = order?.messages?.length || 0;

  return (
    <Shell {...shellProps}>
      <div
        className={
          isAdminView
            ? 'w-full bg-slate-50 px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10'
            : 'relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14'
        }
        style={isAdminView ? undefined : { backgroundImage: `url(${backgroundImage})` }}
      >
        {!isAdminView && <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />}

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className={g(
                'absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-lg font-semibold text-black transition hover:bg-slate-50',
                'absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15'
              )}
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <h1 className={g('text-2xl font-bold tracking-tight text-black sm:text-3xl', 'text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl')}>
                {order.productId?.serviceName}
              </h1>
              <p className={g('mt-1 text-base text-black', 'mt-1 text-base text-slate-300 sm:text-lg')}>
                {order.productId?.category?.split('_').join(' ') || 'Project'}
              </p>
            </div>
          </div>

          {!isAdminView && shouldShowPaymentAlert && currentInstallment && (
            <PaymentAlert
              installmentNumber={currentInstallment.installmentNumber}
              amount={currentInstallment.amount}
              projectId={orderId}
              progress={Math.round(order.projectProgress)}
              paymentStatus={currentInstallment.paymentStatus || 'none'}
              onClick={handleMakePayment}
            />
          )}

          {!isAdminView && order.hasUnpaidInvoice && (
            <div className={g(
              'mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4',
              'mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/15 p-4 backdrop-blur-md'
            )}>
              <p className={g('text-base font-semibold text-amber-800', 'text-base font-semibold text-amber-200')}>
                Payment Pending
              </p>
              <p className={g('mt-1 text-sm text-amber-700', 'mt-1 text-sm text-amber-100/90')}>
                This project is active, but invoice {order.unpaidInvoice?.invoiceNumber} (₹{Number(order.unpaidInvoice?.amount || 0).toLocaleString('en-IN')}) is still unpaid.
                Some actions are unavailable until payment is recorded.
              </p>
              {order.unpaidInvoice?._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/invoice-detail/${order.unpaidInvoice._id}`)}
                  className={g(
                    'mt-2 text-sm font-semibold text-amber-800 underline underline-offset-2 transition hover:text-amber-900',
                    'mt-2 text-sm font-semibold text-amber-200 underline underline-offset-2 transition hover:text-amber-100'
                  )}
                >
                  Proceed for payment
                </button>
              )}
            </div>
          )}

          <div className={g('hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch', 'relative hidden overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch')}>
                {!isAdminView && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />}
                <aside className={g('h-[620px] border-r border-slate-200', 'relative h-[620px] border-r border-white/15')}>
                  <div className="flex h-full min-h-0 flex-col p-4">
                      <div className="flex items-center justify-center">
                        <div className="relative flex h-40 w-40 items-center justify-center">
                          <div className={g('absolute inset-0 rounded-full border-[12px] border-slate-200', 'absolute inset-0 rounded-full border-[12px] border-white/15')}></div>
                          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="46"
                              fill="none"
                              stroke={isProjectPaused ? "#EF4444" : "#10B981"}
                              strokeWidth="8"
                              strokeDasharray={`${progressPercentage * 2.89} 1000`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className={g('text-2xl font-bold text-black', 'text-2xl font-bold text-white')}>{progressPercentage}%</span>
                            <span className={g('mt-1 text-sm font-medium text-black', 'mt-1 text-sm font-medium text-slate-300')}>Complete</span>
                          </div>
                        </div>
                      </div>

                      {!isAdminView ? (
                        <button
                          type="button"
                          onClick={() => setUpdateModalOpen(true)}
                          disabled={order.hasUnpaidInvoice}
                          title={order.hasUnpaidInvoice ? "Available after payment is recorded" : undefined}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Data
                        </button>
                      ) : null}

                      {order.projectLink && order.projectLink.trim() !== '' ? (
                        <a
                          href={order.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={g(
                            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-100',
                            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15'
                          )}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Project
                        </a>
                      ) : null}

                      <div className={g('mt-4 border-t border-slate-200 pt-4', 'mt-4 border-t border-white/15 pt-4')}>
                        <p className={g('text-lg font-semibold text-black', 'text-lg font-semibold text-white')}>Snapshot</p>
                        {/* Document style: divider-separated key/value rows, no boxes */}
                        <div className={g('mt-2 divide-y divide-slate-200', 'mt-2 divide-y divide-white/10')}>
                          <div className="flex items-center justify-between py-2.5">
                            <span className={g('text-sm text-slate-600', 'text-sm text-slate-300')}>Last update</span>
                            <span className={g('text-base font-semibold text-black', 'text-base font-semibold text-white')}>{formatDateTime(order.updatedAt || order.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between py-2.5">
                            <span className={g('text-sm text-slate-600', 'text-sm text-slate-300')}>Updates linked</span>
                            <span className={g('text-base font-semibold tabular-nums text-black', 'text-base font-semibold tabular-nums text-white')}>{totalUpdates}</span>
                          </div>
                          <div className="flex items-center justify-between py-2.5">
                            <span className={g('text-sm text-slate-600', 'text-sm text-slate-300')}>Current phase</span>
                            <span className={g('text-base font-semibold text-black', 'text-base font-semibold text-white')}>{order.currentPhase || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </aside>

                <section className={g('min-w-0 h-[620px] border-r border-slate-200', 'relative min-w-0 h-[620px] border-r border-white/15')}>
                  <div className="flex h-full min-h-0 flex-col p-4">
                    <div className={g('flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between', 'flex flex-col gap-2 border-b border-white/15 pb-4 sm:flex-row sm:items-center sm:justify-between')}>
                      <div>
                        <p className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Progress Timeline</p>
                        <h2 className={g('mt-1 text-xl font-bold text-black', 'mt-1 text-xl font-bold text-white')}>Click any checkpoint to inspect its record</h2>
                      </div>
                      <span className={g('rounded-full bg-white px-3 py-1 text-sm font-semibold text-black', 'rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md')}>
                        {timelineNodes.length} stages
                      </span>
                    </div>

                    <div ref={timelineRef} className="mt-3 flex-1 min-h-0 overflow-auto pr-1">
                      <div className="relative pl-2">
                        <div className="space-y-2">
                          {timelineNodes.map((node) => {
                            const isInProgress = node === inProgressNode;
                            const isCompleted = node.status === 'active' && !isInProgress;
                            const isSelected = normalizeNodeKey(selectedNodeId) === normalizeNodeKey(node.nodeId);

                            return (
                              <TimelineCheckpointItem
                                key={node.nodeId}
                                checkpoint={node}
                              isCompleted={isCompleted}
                              isInProgress={isInProgress}
                              isSelected={isSelected}
                              messageCount={nodeMessageCounts[node.nodeId] || 0}
                              formatDate={formatDate}
                              onSelect={() => setSelectedNodeId(node.nodeId)}
                              isGlass={!isAdminView}
                            />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="h-[620px] min-w-0">
                  <div className="flex h-full flex-col p-4">
                    <section
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className={g('flex items-start justify-between gap-4 border-b border-slate-200 pb-3', 'flex items-start justify-between gap-4 border-b border-white/15 pb-3')}>
                        <div>
                          <p className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Checkpoint Details</p>
                          <h2 className={g('mt-1 text-xl font-bold text-black', 'mt-1 text-xl font-bold text-white')}>
                            {selectedNode ? selectedNode.title : 'No node selected'}
                          </h2>
                        </div>
                        {selectedNode ? (
                          <span className={[
                            "rounded-full px-3 py-1 text-sm font-semibold",
                            selectedNode === inProgressNode
                              ? g('bg-slate-100 text-slate-700', 'border border-white/25 bg-white/15 text-white')
                              : g('bg-emerald-100 text-emerald-700', 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'),
                          ].join(" ")}>
                            {selectedNode === inProgressNode ? 'Active' : 'Completed'}
                          </span>
                        ) : null}
                      </div>

                      {selectedNode ? (
                        <div className="mt-4 flex-1 min-h-0 space-y-5 overflow-auto pr-1">
                          {/* Meta row — document style: divider-separated columns, no boxes */}
                          <div className={g('flex divide-x divide-slate-200 border-b border-slate-200 pb-4', 'flex divide-x divide-white/10 border-b border-white/15 pb-4')}>
                            <div className="flex-1 pr-4">
                              <p className={g('text-xs font-semibold uppercase tracking-wide text-slate-500', 'text-xs font-semibold uppercase tracking-wide text-slate-400')}>Date</p>
                              <p className={g('mt-1 text-base font-bold tabular-nums text-black', 'mt-1 text-base font-bold tabular-nums text-white')}>
                                {formatDate(selectedNode.createdAt)}
                              </p>
                            </div>
                            <div className="flex-1 px-4">
                              <p className={g('text-xs font-semibold uppercase tracking-wide text-slate-500', 'text-xs font-semibold uppercase tracking-wide text-slate-400')}>Progress</p>
                              <p className={g('mt-1 text-base font-bold tabular-nums text-black', 'mt-1 text-base font-bold tabular-nums text-white')}>{selectedNode.cumulativeProgress}%</p>
                            </div>
                            <div className="flex-1 pl-4">
                              <p className={g('text-xs font-semibold uppercase tracking-wide text-slate-500', 'text-xs font-semibold uppercase tracking-wide text-slate-400')}>Updates</p>
                              <p className={g('mt-1 text-base font-bold tabular-nums text-black', 'mt-1 text-base font-bold tabular-nums text-white')}>{selectedNodeMessages.length}</p>
                            </div>
                          </div>

                          {/* Textual Record — section label with a trailing rule, no wrapper box */}
                          <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex items-center gap-3">
                              <p className={g('text-xs font-semibold uppercase tracking-wide text-slate-500', 'text-xs font-semibold uppercase tracking-wide text-slate-400')}>
                                Textual Record · {selectedNodeMessages.length} note{selectedNodeMessages.length === 1 ? '' : 's'}
                              </p>
                              <span className={g('h-px flex-1 bg-slate-200', 'h-px flex-1 bg-white/15')} />
                            </div>
                            <div className="mt-1 flex-1 min-h-0 overflow-auto pr-1">
                              {selectedNodeMessages.length > 0 ? (
                                selectedNodeMessages.map((message, index) => (
                                  <div
                                    key={message._id || message.id || `${selectedNode.nodeId}-message-${index}`}
                                    className={g('border-b border-slate-200 py-4 last:border-b-0', 'border-b border-white/10 py-4 last:border-b-0')}
                                  >
                                    <div className="flex items-baseline justify-between gap-3">
                                      <p className={g('text-base font-semibold text-black', 'text-base font-semibold text-white')}>
                                        {message.checkpointName || selectedNode.title}
                                      </p>
                                      <p className={g('shrink-0 text-sm tabular-nums text-slate-500', 'shrink-0 text-sm tabular-nums text-slate-400')}>
                                        {message.timestamp ? formatDateTime(message.timestamp) : 'No date'}
                                      </p>
                                    </div>
                                    <p className={g('mt-1.5 whitespace-pre-line text-base leading-6 text-slate-700', 'mt-1.5 whitespace-pre-line text-base leading-6 text-slate-200')}>
                                      {message.message || message.remark || message.notes || 'No textual details available.'}
                                    </p>
                                    {(message.fileSize || message.fileName) ? (
                                      <p className={g('mt-2 text-sm font-medium text-emerald-700', 'mt-2 text-sm font-medium text-emerald-300')}>
                                        ↳ {message.fileName ? message.fileName : 'Attachment'}
                                        {message.fileSize ? ` · ${message.fileSize}` : ''}
                                      </p>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className={g('py-4 text-base text-slate-500', 'py-4 text-base text-slate-400')}>
                                  No textual record is linked to this node yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={g('mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-base text-black', 'mt-4 rounded-[1.25rem] border border-white/10 bg-white/10 p-4 text-base text-slate-300')}>
                          Timeline data is not available yet.
                        </div>
                      )}
                    </section>
                  </div>
                </aside>
              </div>

              <div className="space-y-4 lg:hidden">
                <section className={g('rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm', 'relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150')}>
                  {!isAdminView && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />}
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Current Stage</p>
                      <h2 className={g('mt-1 text-xl font-bold text-black', 'mt-1 text-xl font-bold text-white')}>{currentStageLabel}</h2>
                    </div>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className={g('absolute inset-0 rounded-full border-8 border-slate-200', 'absolute inset-0 rounded-full border-8 border-white/15')}></div>
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke={isProjectPaused ? "#EF4444" : "#10B981"}
                          strokeWidth="8"
                          strokeDasharray={`${progressPercentage * 2.89} 1000`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={g('text-lg font-bold text-black', 'text-lg font-bold text-white')}>{progressPercentage}%</span>
                        <span className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-2 gap-3">
                    <div className={g('rounded-2xl border border-slate-200 bg-white p-3', 'rounded-2xl border border-white/10 bg-white/10 p-3')}>
                      <p className={g('text-sm uppercase text-black', 'text-sm uppercase text-slate-300')}>Updates</p>
                      <p className={g('mt-1 text-base font-semibold text-black', 'mt-1 text-base font-semibold text-white')}>{totalUpdates}</p>
                    </div>
                    <div className={g('rounded-2xl border border-slate-200 bg-white p-3', 'rounded-2xl border border-white/10 bg-white/10 p-3')}>
                      <p className={g('text-sm uppercase text-black', 'text-sm uppercase text-slate-300')}>Checkpoints</p>
                      <p className={g('mt-1 text-base font-semibold text-black', 'mt-1 text-base font-semibold text-white')}>{timelineNodes.length}</p>
                    </div>
                  </div>

                  {!isAdminView ? (
                    <div className="relative mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => setUpdateModalOpen(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Data
                      </button>
                      {order.projectLink && order.projectLink.trim() !== '' ? (
                        <a
                          href={order.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Project
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <section className={g('rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm', 'relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150')}>
                  {!isAdminView && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />}
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Progress Timeline</p>
                      <h2 className={g('mt-1 text-lg font-semibold text-black', 'mt-1 text-lg font-semibold text-white')}>Timeline</h2>
                    </div>
                    <button
                      onClick={() => setTimelineExpanded(!timelineExpanded)}
                      className={g('inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-black transition hover:bg-slate-100', 'inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15')}
                    >
                      {timelineExpanded ? (
                        <>
                          <X className="mr-1 h-4 w-4" />
                          Close
                        </>
                      ) : (
                        <>
                          <List className="mr-1 h-4 w-4" />
                          View
                        </>
                      )}
                    </button>
                  </div>

                  {timelineExpanded ? (
                    <div
                      ref={timelineRef}
                      className="relative mt-4 max-h-[318px] overflow-auto pr-1"
                    >
                      <div className="space-y-2.5">
                        {timelineNodes.map((node) => {
                          const isInProgress = node === inProgressNode;
                          const isCompleted = node.status === 'active' && !isInProgress;
                          const isSelected = normalizeNodeKey(selectedNodeId) === normalizeNodeKey(node.nodeId);

                          return (
                            <TimelineCheckpointItem
                              key={node.nodeId}
                              checkpoint={node}
                              isCompleted={isCompleted}
                              isInProgress={isInProgress}
                              isSelected={isSelected}
                              messageCount={nodeMessageCounts[node.nodeId] || 0}
                              formatDate={formatDate}
                              onSelect={() => setSelectedNodeId(node.nodeId)}
                              compact
                              isGlass={!isAdminView}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className={g('mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-base text-black', 'relative mt-4 rounded-2xl border border-dashed border-white/15 bg-white/10 p-4 text-base text-slate-300')}>
                      Open the timeline to select a node.
                    </div>
                  )}
                </section>

                <section className={g('rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm', 'relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150')}>
                  {!isAdminView && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />}
                  <div className={g('flex items-start justify-between gap-4 border-b border-slate-200 pb-4', 'relative flex items-start justify-between gap-4 border-b border-white/15 pb-4')}>
                    <div>
                      <p className={g('text-sm font-medium text-black', 'text-sm font-medium text-slate-300')}>Checkpoint Details</p>
                      <h2 className={g('mt-1 text-lg font-semibold text-black', 'mt-1 text-lg font-semibold text-white')}>
                        {selectedNode ? selectedNode.title : 'No node selected'}
                      </h2>
                    </div>
                    {selectedNode ? (
                      <span className={[
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        selectedNode === inProgressNode
                          ? g('bg-slate-100 text-slate-700', 'border border-white/25 bg-white/15 text-white')
                          : g('bg-emerald-100 text-emerald-700', 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'),
                      ].join(" ")}>
                        {selectedNode === inProgressNode ? 'Active' : 'Completed'}
                      </span>
                    ) : null}
                  </div>

                  {selectedNode ? (
                    <div className="relative mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={g('rounded-2xl border border-slate-200 bg-slate-50 p-3', 'rounded-2xl border border-white/10 bg-white/10 p-3')}>
                          <p className={g('text-sm uppercase text-black', 'text-sm uppercase text-slate-300')}>Date</p>
                          <p className={g('mt-1 text-base font-semibold text-black', 'mt-1 text-base font-semibold text-white')}>
                            {formatDate(selectedNode.createdAt)}
                          </p>
                        </div>
                        <div className={g('rounded-2xl border border-slate-200 bg-slate-50 p-3', 'rounded-2xl border border-white/10 bg-white/10 p-3')}>
                          <p className={g('text-sm uppercase text-black', 'text-sm uppercase text-slate-300')}>Updates</p>
                          <p className={g('mt-1 text-base font-semibold text-black', 'mt-1 text-base font-semibold text-white')}>{selectedNodeMessages.length}</p>
                        </div>
                      </div>

                      <div className={g('rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4', 'rounded-[1.25rem] border border-white/10 bg-white/10 p-4')}>
                        <p className={g('text-base font-semibold text-black', 'text-base font-semibold text-white')}>Textual Record</p>
                        <div className="mt-3 space-y-3">
                          {selectedNodeMessages.length > 0 ? (
                            selectedNodeMessages.map((message, index) => (
                              <div key={message._id || message.id || `${selectedNode.nodeId}-message-${index}`} className={g('rounded-2xl border border-slate-200 bg-white p-3', 'rounded-2xl border border-white/15 bg-white/10 p-3')}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className={g('text-base font-semibold text-black', 'text-base font-semibold text-white')}>
                                    {message.checkpointName || selectedNode.title}
                                  </p>
                                  <p className={g('text-sm text-black', 'text-sm text-slate-300')}>
                                    {message.timestamp ? formatDateTime(message.timestamp) : 'No date'}
                                  </p>
                                </div>
                                <p className={g('mt-2 whitespace-pre-line text-base text-black', 'mt-2 whitespace-pre-line text-base text-slate-200')}>
                                  {message.message || message.remark || message.notes || 'No textual details available.'}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className={g('text-base text-black', 'text-base text-slate-300')}>No textual record is linked to this node yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={g('mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-black', 'relative mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-base text-slate-300')}>
                      Timeline data is not available yet.
                    </div>
                  )}
                </section>
              </div>
          </div>
        </div>

        {/* Update Request Modal */}
        {updateModalOpen && !isAdminView && (
          <UpdateRequestModal
            plan={order}
            onClose={() => setUpdateModalOpen(false)}
            onSubmitSuccess={() => {
              setUpdateModalOpen(false);
              fetchOrderDetails();
            }}
          />
        )}
    </Shell>
  );
};


export default ProjectDetails;
