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
import UpdateRequestModal from '../components/UpdateRequestModal';
import PaymentAlert from '../components/PaymentAlert';
import { logout } from '../store/userSlice';
import CookieManager from '../utils/cookieManager';
import StorageService from '../utils/storageService';
import { useOnlineStatus } from '../App';

const normalizeCheckpointKey = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const getCheckpointKey = (checkpoint, index = 0) => {
  const rawKey =
    checkpoint?.checkpointId ??
    checkpoint?._id ??
    checkpoint?.id ??
    checkpoint?.name ??
    `checkpoint-${index}`;

  return normalizeCheckpointKey(rawKey);
};

const getMessageCheckpointKey = (message, index = 0) => {
  const rawKey =
    message?.checkpointId ??
    message?.checkpointKey ??
    message?.checkpointName ??
    message?.nodeName ??
    message?.name ??
    `message-${index}`;

  return normalizeCheckpointKey(rawKey);
};

const getDefaultCheckpointKey = (checkpoints = []) => {
  const activeCheckpoint = checkpoints.find((checkpoint) => !checkpoint.completed);

  if (activeCheckpoint) {
    return getCheckpointKey(activeCheckpoint, checkpoints.indexOf(activeCheckpoint));
  }

  if (checkpoints.length > 0) {
    return getCheckpointKey(checkpoints[checkpoints.length - 1], checkpoints.length - 1);
  }

  return '';
};

const TimelineCheckpointItem = ({
  checkpoint,
  isCompleted,
  isInProgress,
  isSelected,
  messageCount,
  formatDate,
  onSelect,
  compact = false,
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

  const statusTone = isCompleted
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isInProgress
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-white text-slate-600';

  return (
    <button
      type="button"
      data-timeline-key={checkpoint.timelineKey}
      onClick={onSelect}
      className={[
        compact
          ? 'flex w-full items-start gap-3 rounded-[1.25rem] border p-3.5 text-left transition'
          : 'relative flex w-full items-start gap-3 rounded-[1.25rem] border p-3 text-left transition',
        isSelected
          ? compact
            ? 'border-blue-300 bg-slate-50 ring-2 ring-blue-100'
            : 'border-blue-300 bg-white shadow-md ring-2 ring-blue-100'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : isCompleted
              ? 'border-emerald-500 bg-emerald-50'
              : isInProgress
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-white',
        ].join(' ')}
      >
        {isCompleted ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : isInProgress ? (
          <Clock className="h-4 w-4 text-blue-500" />
        ) : (
          <span className="h-3 w-3 rounded-full bg-slate-300"></span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={compact ? 'flex items-center justify-between gap-2' : 'flex flex-wrap items-center gap-2'}>
          <h3 className={compact ? 'truncate text-sm font-semibold text-slate-900' : 'truncate text-sm font-semibold text-slate-900'}>
            {checkpoint.name}
          </h3>
          <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone].join(' ')}>
            {statusLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{messageCount} updates</span>
          <span>{checkpoint.completedAt ? formatDate(checkpoint.completedAt) : 'Upcoming'}</span>
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
  const [selectedCheckpointId, setSelectedCheckpointId] = useState('');

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
        mobileTitle: 'Project Details',
        mobileSubtitle: order?.productId?.serviceName || 'Admin View',
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

        const normalizedCheckpoints = Array.isArray(order.checkpoints) ? order.checkpoints : [];
        const normalizedMessages = Array.isArray(order.messages)
          ? order.messages.map((message, index) => {
              const messageCheckpointKey = getMessageCheckpointKey(message, index);
              const exactMatchedCheckpoint = normalizedCheckpoints.find((checkpoint, checkpointIndex) => {
                const checkpointKey = getCheckpointKey(checkpoint, checkpointIndex);
                return checkpointKey === messageCheckpointKey || normalizeCheckpointKey(checkpoint.checkpointId) === messageCheckpointKey;
              });
              const fallbackCheckpoint = exactMatchedCheckpoint || normalizedCheckpoints[Math.min(index, Math.max(normalizedCheckpoints.length - 1, 0))];

              return {
                ...message,
                timelineCheckpointKey: fallbackCheckpoint ? getCheckpointKey(fallbackCheckpoint, normalizedCheckpoints.indexOf(fallbackCheckpoint)) : '',
                checkpointName: message.checkpointName || fallbackCheckpoint?.name || 'Project Update',
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
  }, [orderId, checkPaymentStatus]);

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

  const handleMakePayment = () => {
    if (currentInstallment) {
      navigate(`/installment-payment/${orderId}/${currentInstallment.installmentNumber}`);
    }
  };

  const sortedCheckpoints = useMemo(() => {
    const checkpoints = order?.checkpoints || [];

    return [...checkpoints].sort((a, b) => {
      const aMatch = a.name?.match(/(\d+)/);
      const bMatch = b.name?.match(/(\d+)/);
      if (aMatch && bMatch) {
        return parseInt(aMatch[0]) - parseInt(bMatch[0]);
      }
      return 0;
    });
  }, [order?.checkpoints]);

  const inProgressCheckpoint = useMemo(
    () => sortedCheckpoints.find((checkpoint) => !checkpoint.completed),
    [sortedCheckpoints]
  );
  const nextUpcomingCheckpoint = useMemo(
    () =>
      inProgressCheckpoint
        ? sortedCheckpoints.find(
            (checkpoint) => !checkpoint.completed && checkpoint !== inProgressCheckpoint
          )
        : null,
    [inProgressCheckpoint, sortedCheckpoints]
  );
  const visibleCheckpoints = useMemo(
    () => [
      ...sortedCheckpoints.filter((checkpoint) => checkpoint.completed),
      inProgressCheckpoint,
      nextUpcomingCheckpoint,
    ].filter(Boolean),
    [inProgressCheckpoint, nextUpcomingCheckpoint, sortedCheckpoints]
  );
  const timelineNodes = useMemo(
    () =>
      [...visibleCheckpoints].reverse().map((checkpoint, index) => ({
        ...checkpoint,
        timelineKey: getCheckpointKey(checkpoint, index),
      })),
    [visibleCheckpoints]
  );
  const selectedCheckpoint = useMemo(
    () =>
      timelineNodes.find(
        (checkpoint) => normalizeCheckpointKey(checkpoint.timelineKey) === normalizeCheckpointKey(selectedCheckpointId)
      ) || null,
    [selectedCheckpointId, timelineNodes]
  );
  const selectedCheckpointMessages = useMemo(
    () =>
      (order?.messages || []).filter(
        (message) =>
          normalizeCheckpointKey(message.timelineCheckpointKey) ===
          normalizeCheckpointKey(selectedCheckpoint?.timelineKey)
      ),
    [order?.messages, selectedCheckpoint?.timelineKey]
  );
  const checkpointMessageCounts = useMemo(
    () =>
      timelineNodes.reduce((acc, checkpoint) => {
        acc[checkpoint.timelineKey] = (order?.messages || []).filter(
          (message) =>
            normalizeCheckpointKey(message.timelineCheckpointKey) ===
            normalizeCheckpointKey(checkpoint.timelineKey)
        ).length;
        return acc;
      }, {}),
    [order?.messages, timelineNodes]
  );

  useEffect(() => {
    const defaultCheckpointKey = getDefaultCheckpointKey(sortedCheckpoints);

    setSelectedCheckpointId((currentSelection) => {
      const selectionExists = timelineNodes.some(
        (checkpoint) => normalizeCheckpointKey(checkpoint.timelineKey) === normalizeCheckpointKey(currentSelection)
      );

      if (selectionExists) {
        return currentSelection;
      }

      return defaultCheckpointKey;
    });
  }, [orderId, sortedCheckpoints, timelineNodes]);

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
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">Payment Processing</h3>
                <div className="mt-2 text-blue-700">
                  <p>{order.pendingMessage}</p>
                  <p className="mt-2">This process usually takes 1-4 hours. You'll receive a notification once your payment is approved.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                <h3 className="text-lg font-medium text-red-800">Payment Rejected</h3>
                <div className="mt-2 text-red-700">
                  <p>Your payment for this project was rejected.</p>
                  <p className="mt-2 font-medium">Reason: {order.rejectionReason || "Payment verification failed"}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => navigate(`/direct-payment`, {
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
                            totalPrice: item.finalPrice || 0
                          })) || [],
                          totalPrice: order.price,
                          originalTotalPrice: order.originalPrice || order.price
                        }
                      }
                    })}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
            <h2 className="text-xl font-bold text-red-600 mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
            <button
                    onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
  const currentStageLabel = inProgressCheckpoint?.name || selectedCheckpoint?.name || 'All stages completed';
  const totalUpdates = order?.messages?.length || 0;

  return (
    <Shell {...shellProps}>
      <div className="min-h-[calc(100vh-88px)] w-full bg-slate-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {order.productId?.serviceName}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-300 sm:text-base">
                {order.productId?.category?.split('_').join(' ') || 'Project'}
              </p>
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

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="hidden gap-5 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch">
                <aside className="flex flex-col gap-4 self-stretch lg:h-[470px]">
                  <div className="flex shrink-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-center justify-center">
                        <div className="relative flex h-40 w-40 items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-[12px] border-slate-200"></div>
                          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="46"
                              fill="none"
                              stroke={isProjectPaused ? "#EF4444" : "#2563EB"}
                              strokeWidth="8"
                              strokeDasharray={`${progressPercentage * 2.89} 1000`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-bold text-slate-900">{progressPercentage}%</span>
                            <span className="mt-1 text-sm font-medium text-slate-500">Complete</span>
                          </div>
                        </div>
                      </div>

                      {!isAdminView ? (
                        <button
                          type="button"
                          onClick={() => setUpdateModalOpen(true)}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4" />
                          Request Update
                        </button>
                      ) : null}

                      {order.projectLink && order.projectLink.trim() !== '' ? (
                        <a
                          href={order.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Project
                        </a>
                      ) : null}
                  </div>

                  <section className="flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Snapshot</p>
                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                          <span className="text-sm text-slate-500">Last update</span>
                          <span className="text-sm font-semibold text-slate-900">{formatDateTime(order.updatedAt || order.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                          <span className="text-sm text-slate-500">Updates linked</span>
                          <span className="text-sm font-semibold text-slate-900">{totalUpdates}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                          <span className="text-sm text-slate-500">Current phase</span>
                          <span className="text-sm font-semibold text-slate-900">{order.currentPhase || 'N/A'}</span>
                        </div>
                      </div>
                    </section>

                </aside>

                <section className="min-w-0 h-full lg:h-[470px]">
                  <div className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Progress Timeline</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">Click any checkpoint to inspect its record</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {timelineNodes.length} stages
                      </span>
                    </div>

                    <div ref={timelineRef} className="mt-3 flex-1 min-h-0 overflow-auto pr-1">
                      <div className="relative pl-2">
                        <div className="absolute left-[22px] top-2 bottom-2 w-px bg-slate-200"></div>
                        <div className="space-y-2">
                          {timelineNodes.map((checkpoint) => {
                            const isCompleted = checkpoint.completed;
                            const isInProgress = !isCompleted && checkpoint === inProgressCheckpoint;
                            const isSelected = normalizeCheckpointKey(selectedCheckpointId) === normalizeCheckpointKey(checkpoint.timelineKey);

                            return (
                              <TimelineCheckpointItem
                                key={checkpoint.timelineKey}
                                checkpoint={checkpoint}
                              isCompleted={isCompleted}
                              isInProgress={isInProgress}
                              isSelected={isSelected}
                              messageCount={checkpointMessageCounts[checkpoint.timelineKey] || 0}
                              formatDate={formatDate}
                              onSelect={() => setSelectedCheckpointId(checkpoint.timelineKey)}
                            />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="h-full min-w-0 lg:h-[470px]">
                  <div className="sticky top-6 flex h-full flex-col">
                    <section
                      className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Checkpoint Details</p>
                          <h2 className="mt-1 text-xl font-bold text-slate-900">
                            {selectedCheckpoint ? selectedCheckpoint.name : 'No checkpoint selected'}
                          </h2>
                        </div>
                        {selectedCheckpoint ? (
                          <span className={[
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            selectedCheckpoint.completed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
                          ].join(" ")}>
                            {selectedCheckpoint.completed ? 'Completed' : 'Active'}
                          </span>
                        ) : null}
                      </div>

                      {selectedCheckpoint ? (
                        <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-auto pr-1">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Checkpoint</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCheckpoint.name}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Date</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {selectedCheckpoint.completedAt ? formatDate(selectedCheckpoint.completedAt) : 'Upcoming'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Updates</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCheckpointMessages.length}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCheckpoint.timelineKey || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex min-h-0 flex-1 flex-col rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">Textual Record</p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                {selectedCheckpointMessages.length} note{selectedCheckpointMessages.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-auto pr-1">
                              {selectedCheckpointMessages.length > 0 ? (
                                selectedCheckpointMessages.map((message, index) => (
                                  <div
                                    key={message._id || message.id || `${selectedCheckpoint.timelineKey}-message-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-white p-3"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {message.checkpointName || selectedCheckpoint.name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {message.timestamp ? formatDateTime(message.timestamp) : 'No date'}
                                      </p>
                                    </div>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                                      {message.message || message.remark || message.notes || 'No textual details available.'}
                                    </p>
                                    {(message.fileSize || message.fileName) ? (
                                      <p className="mt-2 text-xs text-slate-500">
                                        {message.fileName ? `File: ${message.fileName}` : 'Attachment'}
                                        {message.fileSize ? ` | Size: ${message.fileSize}` : ''}
                                      </p>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">
                                  No textual record is linked to this checkpoint yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          Timeline data is not available yet.
                        </div>
                      )}
                    </section>
                  </div>
                </aside>
              </div>

              <div className="space-y-4 lg:hidden">
                <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Current Stage</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{currentStageLabel}</h2>
                    </div>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke={isProjectPaused ? "#EF4444" : "#2563EB"}
                          strokeWidth="8"
                          strokeDasharray={`${progressPercentage * 2.89} 1000`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-slate-900">{progressPercentage}%</span>
                        <span className="text-[11px] font-medium text-slate-500">Complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Updates</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{totalUpdates}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Checkpoints</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{timelineNodes.length}</p>
                    </div>
                  </div>

                  {!isAdminView ? (
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => setUpdateModalOpen(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4" />
                        Request Update
                      </button>
                      {order.projectLink && order.projectLink.trim() !== '' ? (
                        <a
                          href={order.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Project
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Progress Timeline</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">Timeline</h2>
                    </div>
                    <button
                      onClick={() => setTimelineExpanded(!timelineExpanded)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
                      className="mt-4 max-h-[318px] overflow-auto pr-1"
                    >
                      <div className="space-y-2.5">
                        {timelineNodes.map((checkpoint) => {
                          const isCompleted = checkpoint.completed;
                          const isInProgress = !isCompleted && checkpoint === inProgressCheckpoint;
                          const isSelected = normalizeCheckpointKey(selectedCheckpointId) === normalizeCheckpointKey(checkpoint.timelineKey);

                          return (
                            <TimelineCheckpointItem
                              key={checkpoint.timelineKey}
                              checkpoint={checkpoint}
                              isCompleted={isCompleted}
                              isInProgress={isInProgress}
                              isSelected={isSelected}
                              messageCount={checkpointMessageCounts[checkpoint.timelineKey] || 0}
                              formatDate={formatDate}
                              onSelect={() => setSelectedCheckpointId(checkpoint.timelineKey)}
                              compact
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Open the timeline to select a checkpoint.
                    </div>
                  )}
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Checkpoint Details</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {selectedCheckpoint ? selectedCheckpoint.name : 'No checkpoint selected'}
                      </h2>
                    </div>
                    {selectedCheckpoint ? (
                      <span className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        selectedCheckpoint.completed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
                      ].join(" ")}>
                        {selectedCheckpoint.completed ? 'Completed' : 'Active'}
                      </span>
                    ) : null}
                  </div>

                  {selectedCheckpoint ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedCheckpoint.completedAt ? formatDate(selectedCheckpoint.completedAt) : 'Upcoming'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Updates</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{selectedCheckpointMessages.length}</p>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">Textual Record</p>
                        <div className="mt-3 space-y-3">
                          {selectedCheckpointMessages.length > 0 ? (
                            selectedCheckpointMessages.map((message, index) => (
                              <div key={message._id || message.id || `${selectedCheckpoint.timelineKey}-message-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {message.checkpointName || selectedCheckpoint.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {message.timestamp ? formatDateTime(message.timestamp) : 'No date'}
                                  </p>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                  {message.message || message.remark || message.notes || 'No textual details available.'}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No textual record is linked to this checkpoint yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Timeline data is not available yet.
                    </div>
                  )}
                </section>
              </div>
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
      </div>
    </Shell>
  );
};

export default ProjectDetails;
