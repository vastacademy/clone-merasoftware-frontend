import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Clock, CalendarClock, AlertTriangle, Lock, Upload,
  List, X, FileText, Image as ImageIcon, Check,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import UpdateRequestModal from '../components/UpdateRequestModal';
import SummaryApi from '../common';
import backgroundImage from '../assets/BG.png';
import { isPlanItem } from '../helpers/orderType';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${formatDate(d)} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const getFileIcon = (fileType = '') => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-slate-400" />;
  }
  return <FileText className="h-5 w-5 text-slate-400" />;
};

// -- Visual-only status derivation, mirrors UserUpdateDashboard.js's
// getCardVisualStatus so every page reads plan data the same way. --
const getPlanVisualStatus = (plan) => {
  const product = plan.productId || {};
  const isRecurring = Boolean(product.isMonthlyLimitedPlan || product.isMonthlyRenewablePlan);

  if (plan.planStatus === 'closed') {
    return { badge: 'Closed', tone: 'closed', isRecurring, canRequest: false };
  }

  if (isRecurring && plan.autoRenewalStatus === 'paused') {
    return { badge: 'Payment overdue', tone: 'paused', isRecurring, canRequest: false };
  }

  if (isRecurring && (plan.totalYearlyDaysRemaining ?? 0) <= 0) {
    return { badge: 'Yearly plan ended', tone: 'expired', isRecurring, canRequest: false };
  }

  if (isRecurring) {
    const used = plan.currentMonthUpdatesUsed || 0;
    const limit = plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1;
    const usedUp = used >= limit;
    return {
      badge: usedUp ? "This month's updates used" : 'Active',
      tone: usedUp ? 'used_up' : 'active',
      isRecurring,
      canRequest: !usedUp,
    };
  }

  // simple plan — gated by BOTH days-left AND updates-left independently
  const validityInDays = product.validityPeriod;
  const startDate = new Date(plan.createdAt);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (validityInDays || 0));
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

  const updatesUsed = plan.updatesUsed || 0;
  const updateCount = product.updateCount || 0;
  const updatesLeft = Math.max(0, updateCount - updatesUsed);

  const isExpired = daysLeft <= 0;
  const isUsedUp = updatesUsed >= updateCount;

  if (isExpired) {
    return { badge: 'Expired', tone: 'expired', isRecurring, daysLeft, updatesLeft, canRequest: false };
  }
  if (isUsedUp) {
    return { badge: 'Updates used', tone: 'used_up', isRecurring, daysLeft, updatesLeft, canRequest: false };
  }
  return { badge: 'Active', tone: 'active', isRecurring, daysLeft, updatesLeft, canRequest: true };
};

const BADGE_TONE_CLASSES = {
  active: 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300',
  used_up: 'border border-amber-400/40 bg-amber-500/20 text-amber-300',
  expired: 'border border-white/25 bg-white/15 text-white',
  paused: 'border border-rose-400/40 bg-rose-500/20 text-rose-300',
  closed: 'border border-white/25 bg-white/15 text-white',
};

const REQUEST_STATUS_META = {
  pending: { label: 'Pending', tone: 'border-amber-400/40 bg-amber-500/20 text-amber-300' },
  in_progress: { label: 'In Progress', tone: 'border-white/25 bg-white/15 text-white' },
  completed: { label: 'Completed', tone: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300' },
  rejected: { label: 'Rejected', tone: 'border-rose-400/40 bg-rose-500/20 text-rose-300' },
};

const RequestHistoryItem = ({ request, isSelected, onSelect }) => {
  const meta = REQUEST_STATUS_META[request.status] || REQUEST_STATUS_META.pending;
  const fileCount = request.files?.length || 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative flex w-full items-start gap-3 rounded-[1.25rem] border p-3 text-left transition backdrop-blur-md',
        isSelected
          ? 'border-white/40 bg-white/[0.1] shadow-md ring-2 ring-white/20'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-white/40 bg-white/15' : 'border-white/15 bg-white/10',
        ].join(' ')}
      >
        {request.status === 'completed' ? (
          <Check className="h-4 w-4 text-emerald-400" />
        ) : (
          <Upload className="h-4 w-4 text-white" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-white">{formatDate(request.createdAt)}</h3>
          <span className={['rounded-full border px-2 py-0.5 text-sm font-semibold', meta.tone].join(' ')}>
            {meta.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-300">
          <span>{fileCount} file{fileCount === 1 ? '' : 's'}</span>
          <span>{request.instructions?.length || 0} note{(request.instructions?.length || 0) === 1 ? '' : 's'}</span>
        </div>
      </div>
    </button>
  );
};

const PlanDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [plan, setPlan] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const [orderResponse, requestsResponse] = await Promise.all([
        fetch(`${SummaryApi.orderDetails.url}/${orderId}`, { credentials: 'include' }),
        fetch(SummaryApi.userUpdateRequests.url, {
          method: SummaryApi.userUpdateRequests.method,
          credentials: 'include',
        }),
      ]);

      const orderData = await orderResponse.json();
      if (!orderData.success || !orderData.data) {
        setPlan(null);
        setNotFound(true);
        return;
      }

      if (!isPlanItem(orderData.data)) {
        navigate(`/project-details/${orderId}`, { replace: true });
        return;
      }

      setPlan(orderData.data);

      const requestsData = await requestsResponse.json();
      const planRequests = requestsData.success
        ? (requestsData.data || []).filter((request) => request.updatePlanId?._id === orderId)
        : [];
      planRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(planRequests);
      setSelectedRequestId(planRequests[0]?._id || '');
    } catch (error) {
      console.error('Error fetching plan details:', error);
      setPlan(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const handleBack = () => {
    navigate('/projects-and-plans');
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !plan) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Plan Not Found</h2>
            <p className="text-base text-black mb-4">The plan you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-semibold"
            >
              Back to Projects and Plans
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const product = plan.productId || {};
  const status = getPlanVisualStatus(plan);
  const selectedRequest = requests.find((r) => r._id === selectedRequestId) || null;

  const totalUpdates = status.isRecurring
    ? (plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1)
    : (product.updateCount || 0);
  const usedUpdates = status.isRecurring
    ? (plan.currentMonthUpdatesUsed || 0)
    : (plan.updatesUsed || 0);
  const donutPercentage = totalUpdates > 0 ? Math.min(100, Math.round((usedUpdates / totalUpdates) * 100)) : 0;

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
              <div className="flex flex-wrap items-center justify-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {product.serviceName}
                </h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE_CLASSES[status.tone]}`}>
                  {status.badge}
                </span>
              </div>
              <p className="mt-1 text-base text-slate-300 sm:text-lg">
                {product.category?.split('_').join(' ') || 'Plan'}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            {/* Desktop 3-column layout, same skeleton as ProjectDetails.js */}
            <div className="relative hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch">
              <aside className="relative h-[620px] border-r border-white/15">
                <div className="flex h-full min-h-0 flex-col p-4">
                  <div className="flex items-center justify-center">
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-[12px] border-white/15"></div>
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke={status.tone === 'active' ? '#10B981' : '#94A3B8'}
                            strokeWidth="8"
                            strokeDasharray={`${donutPercentage * 2.89} 1000`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-bold text-white">{usedUpdates} / {totalUpdates}</span>
                          <span className="mt-1 text-sm font-medium text-slate-300">Updates Used</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRequestModal(true)}
                      disabled={!status.canRequest}
                      className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-base font-semibold transition ${
                        status.canRequest
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-white/10 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Request Update
                    </button>

                    {status.tone === 'used_up' && (
                      <p className="mt-2 text-center text-sm text-amber-300">
                        {status.isRecurring
                          ? `Resets on ${formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate)}.`
                          : "All updates used. Purchase a new plan."}
                      </p>
                    )}
                    {status.tone === 'expired' && (
                      <p className="mt-2 text-center text-sm text-slate-300">
                        {status.isRecurring ? 'Yearly plan has ended.' : 'Plan validity has expired.'}
                      </p>
                    )}
                    {status.tone === 'paused' && (
                      <p className="mt-2 flex items-start gap-1.5 text-center text-sm text-rose-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Payment overdue — clear invoice to continue.
                      </p>
                    )}
                    {status.tone === 'closed' && (
                      <p className="mt-2 flex items-start gap-1.5 text-center text-sm text-slate-300">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This plan was closed.
                      </p>
                    )}

                    <div className="mt-4 border-t border-white/15 pt-4">
                      <p className="text-lg font-semibold text-white">Plan Snapshot</p>
                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                          <span className="text-sm text-slate-300">{status.isRecurring ? 'Resets on' : 'Days left'}</span>
                          <span className="flex items-center gap-1 text-base font-semibold text-white">
                            {status.isRecurring ? (
                              <>
                                <CalendarClock className="h-3.5 w-3.5" />
                                {formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate)}
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                {status.daysLeft} days
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                          <span className="text-sm text-slate-300">Total updates granted</span>
                          <span className="text-base font-semibold text-white">{totalUpdates}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                          <span className="text-sm text-slate-300">File limit per request</span>
                          <span className="text-base font-semibold text-white">Up to 20 files, 5MB each</span>
                        </div>
                      </div>
                    </div>
                </div>
              </aside>

              <section className="relative min-w-0 h-[620px] border-r border-white/15">
                <div className="flex h-full min-h-0 flex-col p-4">
                  <div className="flex flex-col gap-2 border-b border-white/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Update History</p>
                      <h2 className="mt-1 text-xl font-bold text-white">Click any request to inspect its files</h2>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
                      {requests.length} request{requests.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-3 flex-1 min-h-0 overflow-auto pr-1">
                    {requests.length > 0 ? (
                      <div className="space-y-2">
                        {requests.map((request) => (
                          <RequestHistoryItem
                            key={request._id}
                            request={request}
                            isSelected={selectedRequestId === request._id}
                            onSelect={() => setSelectedRequestId(request._id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4 text-base text-slate-300">
                        No updates requested yet.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <aside className="h-[620px] min-w-0">
                <div className="flex h-full flex-col p-4">
                  <section className="flex h-full min-h-0 flex-col">
                    <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-300">Request Details</p>
                        <h2 className="mt-1 text-xl font-bold text-white">
                          {selectedRequest ? formatDate(selectedRequest.createdAt) : 'No request selected'}
                        </h2>
                      </div>
                      {selectedRequest ? (
                        <span className={[
                          'rounded-full border px-3 py-1 text-sm font-semibold',
                          (REQUEST_STATUS_META[selectedRequest.status] || REQUEST_STATUS_META.pending).tone,
                        ].join(' ')}>
                          {(REQUEST_STATUS_META[selectedRequest.status] || REQUEST_STATUS_META.pending).label}
                        </span>
                      ) : null}
                    </div>

                    {selectedRequest ? (
                      <div className="mt-3 flex-1 min-h-0 space-y-3 overflow-auto pr-1">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                          <p className="text-sm font-semibold uppercase text-slate-300">Submitted</p>
                          <p className="mt-1 text-base font-semibold text-white">{formatDateTime(selectedRequest.createdAt)}</p>
                        </div>

                        {selectedRequest.instructions?.length > 0 ? (
                          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                            <p className="text-sm font-semibold uppercase text-slate-300">Instructions</p>
                            {selectedRequest.instructions.map((note, index) => (
                              <p key={index} className="mt-1 whitespace-pre-line text-base text-white">{note.text}</p>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex min-h-0 flex-1 flex-col rounded-[1.25rem] border border-white/10 bg-white/10 p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-semibold text-white">Files</p>
                            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-sm font-semibold text-white">
                              {selectedRequest.files?.length || 0} file{(selectedRequest.files?.length || 0) === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="mt-3 flex-1 min-h-0 space-y-2 overflow-auto pr-1">
                            {selectedRequest.files?.length > 0 ? (
                              selectedRequest.files.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3"
                                >
                                  {getFileIcon(file.type)}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{file.originalName}</p>
                                    <p className="text-xs text-slate-300">{formatFileSize(file.size)} • {(file.type || '').split('/')[1] || 'file'}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-base text-slate-300">No files attached to this request.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/10 p-4 text-base text-slate-300">
                        Select a request from the history to view its files.
                      </div>
                    )}
                  </section>
                </div>
              </aside>
            </div>

              {/* Mobile stacked layout */}
              <div className="relative space-y-4 p-5 lg:hidden">
                <section className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Plan Status</p>
                      <h2 className="mt-1 text-xl font-bold text-white">{status.badge}</h2>
                    </div>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-8 border-white/15"></div>
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke={status.tone === 'active' ? '#10B981' : '#94A3B8'}
                          strokeWidth="8"
                          strokeDasharray={`${donutPercentage * 2.89} 1000`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-bold text-white">{usedUpdates}/{totalUpdates}</span>
                        <span className="text-sm font-medium text-slate-300">Used</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-sm uppercase text-slate-300">{status.isRecurring ? 'Resets' : 'Days left'}</p>
                      <p className="mt-1 text-base font-semibold text-white">
                        {status.isRecurring ? formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate) : `${status.daysLeft} days`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-sm uppercase text-slate-300">Requests</p>
                      <p className="mt-1 text-base font-semibold text-white">{requests.length}</p>
                    </div>
                  </div>

                  <div className="relative mt-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(true)}
                      disabled={!status.canRequest}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition ${
                        status.canRequest
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-white/10 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Request Update
                    </button>
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Update History</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{requests.length} request{requests.length === 1 ? '' : 's'}</h2>
                    </div>
                    <button
                      onClick={() => setTimelineExpanded(!timelineExpanded)}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
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
                    <div className="relative mt-4 max-h-[318px] overflow-auto pr-1">
                      <div className="space-y-2.5">
                        {requests.map((request) => (
                          <RequestHistoryItem
                            key={request._id}
                            request={request}
                            isSelected={selectedRequestId === request._id}
                            onSelect={() => setSelectedRequestId(request._id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative mt-4 rounded-2xl border border-dashed border-white/15 bg-white/10 p-4 text-base text-slate-300">
                      Open history to select a request.
                    </div>
                  )}
                </section>

                <section className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
                  <div className="relative flex items-start justify-between gap-4 border-b border-white/15 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Request Details</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">
                        {selectedRequest ? formatDate(selectedRequest.createdAt) : 'No request selected'}
                      </h2>
                    </div>
                    {selectedRequest ? (
                      <span className={[
                        'rounded-full border px-3 py-1 text-sm font-semibold',
                        (REQUEST_STATUS_META[selectedRequest.status] || REQUEST_STATUS_META.pending).tone,
                      ].join(' ')}>
                        {(REQUEST_STATUS_META[selectedRequest.status] || REQUEST_STATUS_META.pending).label}
                      </span>
                    ) : null}
                  </div>

                  {selectedRequest ? (
                    <div className="relative mt-4 space-y-4">
                      {selectedRequest.instructions?.length > 0 ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
                          <p className="text-base font-semibold text-white">Instructions</p>
                          {selectedRequest.instructions.map((note, index) => (
                            <p key={index} className="mt-2 whitespace-pre-line text-base text-slate-200">{note.text}</p>
                          ))}
                        </div>
                      ) : null}

                      <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
                        <p className="text-base font-semibold text-white">Files ({selectedRequest.files?.length || 0})</p>
                        <div className="mt-3 space-y-2">
                          {selectedRequest.files?.length > 0 ? (
                            selectedRequest.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                                {getFileIcon(file.type)}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">{file.originalName}</p>
                                  <p className="text-xs text-slate-300">{formatFileSize(file.size)} • {(file.type || '').split('/')[1] || 'file'}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-base text-slate-300">No files attached.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-base text-slate-300">
                      Select a request from history to view details.
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      {showRequestModal && (
        <UpdateRequestModal
          plan={plan}
          onClose={() => setShowRequestModal(false)}
          onSubmitSuccess={() => {
            setShowRequestModal(false);
            fetchPlanDetails();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default PlanDetails;
