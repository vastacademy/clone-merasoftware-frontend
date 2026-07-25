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
  active: 'bg-emerald-100 text-emerald-700',
  used_up: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-700',
  paused: 'bg-rose-100 text-rose-700',
  closed: 'bg-slate-800 text-white',
};

const REQUEST_STATUS_META = {
  pending: { label: 'Pending', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  in_progress: { label: 'In Progress', tone: 'border-blue-200 bg-blue-50 text-blue-700' },
  completed: { label: 'Completed', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
};

const RequestHistoryItem = ({ request, isSelected, onSelect }) => {
  const meta = REQUEST_STATUS_META[request.status] || REQUEST_STATUS_META.pending;
  const fileCount = request.files?.length || 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative flex w-full items-start gap-3 rounded-[1.25rem] border p-3 text-left transition',
        isSelected
          ? 'border-blue-300 bg-white shadow-md ring-2 ring-blue-100'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white',
        ].join(' ')}
      >
        {request.status === 'completed' ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Upload className="h-4 w-4 text-slate-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-black">{formatDate(request.createdAt)}</h3>
          <span className={['rounded-full border px-2 py-0.5 text-sm font-semibold', meta.tone].join(' ')}>
            {meta.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-black">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold"
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
      <div className="w-full bg-slate-50 px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
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
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {product.serviceName}
                </h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE_CLASSES[status.tone]}`}>
                  {status.badge}
                </span>
              </div>
              <p className="mt-2 text-base font-medium text-white">
                {product.category?.split('_').join(' ') || 'Plan'}
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              {/* Desktop 3-column layout, same skeleton as ProjectDetails.js */}
              <div className="hidden gap-5 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:items-stretch">
                <aside className="grid h-[470px] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                  <div className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex items-center justify-center">
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-[12px] border-slate-200"></div>
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke={status.tone === 'active' ? '#2563EB' : '#94A3B8'}
                            strokeWidth="8"
                            strokeDasharray={`${donutPercentage * 2.89} 1000`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-bold text-black">{usedUpdates} / {totalUpdates}</span>
                          <span className="mt-1 text-sm font-medium text-black">Updates Used</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRequestModal(true)}
                      disabled={!status.canRequest}
                      className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-base font-semibold transition ${
                        status.canRequest
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Request Update
                    </button>

                    {status.tone === 'used_up' && (
                      <p className="mt-2 text-center text-sm text-amber-600">
                        {status.isRecurring
                          ? `Resets on ${formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate)}.`
                          : "All updates used. Purchase a new plan."}
                      </p>
                    )}
                    {status.tone === 'expired' && (
                      <p className="mt-2 text-center text-sm text-slate-600">
                        {status.isRecurring ? 'Yearly plan has ended.' : 'Plan validity has expired.'}
                      </p>
                    )}
                    {status.tone === 'paused' && (
                      <p className="mt-2 flex items-start gap-1.5 text-center text-sm text-rose-600">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Payment overdue — clear invoice to continue.
                      </p>
                    )}
                    {status.tone === 'closed' && (
                      <p className="mt-2 flex items-start gap-1.5 text-center text-sm text-slate-600">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This plan was closed.
                      </p>
                    )}
                  </div>

                  <section className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-lg font-semibold text-black">Plan Snapshot</p>
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                        <span className="text-sm text-black">{status.isRecurring ? 'Resets on' : 'Days left'}</span>
                        <span className="flex items-center gap-1 text-base font-semibold text-black">
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
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                        <span className="text-sm text-black">Total updates granted</span>
                        <span className="text-base font-semibold text-black">{totalUpdates}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
                        <span className="text-sm text-black">File limit per request</span>
                        <span className="text-base font-semibold text-black">Up to 20 files, 5MB each</span>
                      </div>
                    </div>
                  </section>
                </aside>

                <section className="min-w-0 h-full lg:h-[470px]">
                  <div className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-black">Update History</p>
                        <h2 className="mt-1 text-xl font-bold text-black">Click any request to inspect its files</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-black">
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
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-base text-black">
                          No updates requested yet.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <aside className="h-full min-w-0 lg:h-[470px]">
                  <div className="sticky top-6 flex h-full flex-col">
                    <section className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                        <div>
                          <p className="text-sm font-medium text-black">Request Details</p>
                          <h2 className="mt-1 text-xl font-bold text-black">
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
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm font-semibold uppercase text-black">Submitted</p>
                            <p className="mt-1 text-base font-semibold text-black">{formatDateTime(selectedRequest.createdAt)}</p>
                          </div>

                          {selectedRequest.instructions?.length > 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-sm font-semibold uppercase text-black">Instructions</p>
                              {selectedRequest.instructions.map((note, index) => (
                                <p key={index} className="mt-1 whitespace-pre-line text-base text-black">{note.text}</p>
                              ))}
                            </div>
                          ) : null}

                          <div className="flex min-h-0 flex-1 flex-col rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-base font-semibold text-black">Files</p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-black">
                                {selectedRequest.files?.length || 0} file{(selectedRequest.files?.length || 0) === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="mt-3 flex-1 min-h-0 space-y-2 overflow-auto pr-1">
                              {selectedRequest.files?.length > 0 ? (
                                selectedRequest.files.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                                  >
                                    {getFileIcon(file.type)}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-black">{file.originalName}</p>
                                      <p className="text-xs text-black">{formatFileSize(file.size)} • {(file.type || '').split('/')[1] || 'file'}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-base text-black">No files attached to this request.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-base text-black">
                          Select a request from the history to view its files.
                        </div>
                      )}
                    </section>
                  </div>
                </aside>
              </div>

              {/* Mobile stacked layout */}
              <div className="space-y-4 lg:hidden">
                <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-black">Plan Status</p>
                      <h2 className="mt-1 text-xl font-bold text-black">{status.badge}</h2>
                    </div>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke={status.tone === 'active' ? '#2563EB' : '#94A3B8'}
                          strokeWidth="8"
                          strokeDasharray={`${donutPercentage * 2.89} 1000`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-bold text-black">{usedUpdates}/{totalUpdates}</span>
                        <span className="text-sm font-medium text-black">Used</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm uppercase text-black">{status.isRecurring ? 'Resets' : 'Days left'}</p>
                      <p className="mt-1 text-base font-semibold text-black">
                        {status.isRecurring ? formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate) : `${status.daysLeft} days`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm uppercase text-black">Requests</p>
                      <p className="mt-1 text-base font-semibold text-black">{requests.length}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(true)}
                      disabled={!status.canRequest}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition ${
                        status.canRequest
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Request Update
                    </button>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-black">Update History</p>
                      <h2 className="mt-1 text-lg font-semibold text-black">{requests.length} request{requests.length === 1 ? '' : 's'}</h2>
                    </div>
                    <button
                      onClick={() => setTimelineExpanded(!timelineExpanded)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-black transition hover:bg-slate-100"
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
                    <div className="mt-4 max-h-[318px] overflow-auto pr-1">
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
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-base text-black">
                      Open history to select a request.
                    </div>
                  )}
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-sm font-medium text-black">Request Details</p>
                      <h2 className="mt-1 text-lg font-semibold text-black">
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
                    <div className="mt-4 space-y-4">
                      {selectedRequest.instructions?.length > 0 ? (
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-base font-semibold text-black">Instructions</p>
                          {selectedRequest.instructions.map((note, index) => (
                            <p key={index} className="mt-2 whitespace-pre-line text-base text-black">{note.text}</p>
                          ))}
                        </div>
                      ) : null}

                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-base font-semibold text-black">Files ({selectedRequest.files?.length || 0})</p>
                        <div className="mt-3 space-y-2">
                          {selectedRequest.files?.length > 0 ? (
                            selectedRequest.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                {getFileIcon(file.type)}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-black">{file.originalName}</p>
                                  <p className="text-xs text-black">{formatFileSize(file.size)} • {(file.type || '').split('/')[1] || 'file'}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-base text-black">No files attached.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-black">
                      Select a request from history to view details.
                    </div>
                  )}
                </section>
              </div>
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
