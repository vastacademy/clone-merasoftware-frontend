import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SummaryApi from '../common';
import { Clock, RefreshCw, Sparkles, CalendarClock, AlertTriangle, Lock } from 'lucide-react';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import UpdateRequestModal from '../components/UpdateRequestModal'

// ---------------------------------------------------------------------------
// UI-ONLY MOCK DATA
// Temporary sample plans used to design/review every card state side-by-side.
// Shaped like real order objects, but not fetched from the API.
// Will be removed once this design is wired to live data in a later phase.
// ---------------------------------------------------------------------------
const MOCK_PLANS = [
  {
    _id: 'mock-simple-active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatesUsed: 2,
    planStatus: 'active',
    productId: {
      serviceName: 'Basic Website Support',
      updateCount: 5,
      validityPeriod: 30,
      isMonthlyLimitedPlan: false,
      isMonthlyRenewablePlan: false,
    },
  },
  {
    _id: 'mock-simple-usedup',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatesUsed: 3,
    planStatus: 'active',
    productId: {
      serviceName: 'Website Single Section Addition',
      updateCount: 3,
      validityPeriod: 30,
      isMonthlyLimitedPlan: false,
      isMonthlyRenewablePlan: false,
    },
  },
  {
    _id: 'mock-simple-expired',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatesUsed: 1,
    planStatus: 'active',
    productId: {
      serviceName: 'Landing Page Refresh Plan',
      updateCount: 4,
      validityPeriod: 30,
      isMonthlyLimitedPlan: false,
      isMonthlyRenewablePlan: false,
    },
  },
  {
    _id: 'mock-recurring-active',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    planStatus: 'active',
    autoRenewalStatus: 'active',
    currentMonthUpdatesUsed: 0,
    currentMonthUpdatesLimit: 1,
    currentMonthExpiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyLimitResetDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    totalYearlyDaysRemaining: 210,
    productId: {
      serviceName: 'Support Portal — Monthly Care Plan',
      isMonthlyLimitedPlan: true,
      isMonthlyRenewablePlan: false,
      monthlyUpdateLimit: 1,
      yearlyPlanDuration: 365,
    },
  },
  {
    _id: 'mock-recurring-usedup',
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    planStatus: 'active',
    autoRenewalStatus: 'active',
    currentMonthUpdatesUsed: 1,
    currentMonthUpdatesLimit: 1,
    currentMonthExpiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyLimitResetDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    totalYearlyDaysRemaining: 155,
    productId: {
      serviceName: 'Support Portal — Single Update',
      isMonthlyLimitedPlan: true,
      isMonthlyRenewablePlan: false,
      monthlyUpdateLimit: 1,
      yearlyPlanDuration: 365,
    },
  },
  {
    _id: 'mock-recurring-paused',
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    planStatus: 'active',
    autoRenewalStatus: 'paused',
    currentMonthUpdatesUsed: 0,
    currentMonthUpdatesLimit: 1,
    currentMonthExpiryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyLimitResetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalYearlyDaysRemaining: 90,
    productId: {
      serviceName: 'Yearly Renewable Plan',
      isMonthlyLimitedPlan: false,
      isMonthlyRenewablePlan: true,
      monthlyRenewalPrice: 3000,
      yearlyPlanDuration: 365,
    },
  },
  {
    _id: 'mock-recurring-yearly-ended',
    createdAt: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(),
    planStatus: 'active',
    autoRenewalStatus: 'expired',
    currentMonthUpdatesUsed: 0,
    currentMonthUpdatesLimit: 1,
    currentMonthExpiryDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyLimitResetDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    totalYearlyDaysRemaining: 0,
    productId: {
      serviceName: 'Yearly Renewable Plan',
      isMonthlyLimitedPlan: false,
      isMonthlyRenewablePlan: true,
      monthlyRenewalPrice: 3000,
      yearlyPlanDuration: 365,
    },
  },
  {
    _id: 'mock-closed',
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    planStatus: 'closed',
    autoRenewalStatus: 'paused',
    currentMonthUpdatesUsed: 0,
    currentMonthUpdatesLimit: 1,
    currentMonthExpiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    monthlyLimitResetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalYearlyDaysRemaining: 40,
    productId: {
      serviceName: 'Support Portal — Closed by Admin',
      isMonthlyLimitedPlan: true,
      isMonthlyRenewablePlan: false,
      monthlyUpdateLimit: 1,
      yearlyPlanDuration: 365,
    },
  },
];

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// -- Visual-only status derivation. Reads the mock plan shape today; this is
// the same shape real orders already have, so no rewrite is needed when this
// gets wired to fetchUserUpdatePlans() in a later phase. --
const getCardVisualStatus = (plan) => {
  const product = plan.productId || {};
  const isRecurring = Boolean(product.isMonthlyLimitedPlan || product.isMonthlyRenewablePlan);

  if (plan.planStatus === 'closed') {
    return { badge: 'Closed', tone: 'closed', isRecurring };
  }

  if (isRecurring && plan.autoRenewalStatus === 'paused') {
    return { badge: 'Payment overdue', tone: 'paused', isRecurring };
  }

  if (isRecurring && (plan.totalYearlyDaysRemaining ?? 0) <= 0) {
    return { badge: 'Yearly plan ended', tone: 'expired', isRecurring };
  }

  if (isRecurring) {
    const used = plan.currentMonthUpdatesUsed || 0;
    const limit = plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1;
    if (used >= limit) {
      return { badge: "This month's updates used", tone: 'used_up', isRecurring };
    }
    return { badge: 'Active', tone: 'active', isRecurring };
  }

  // simple plan
  const validityInDays = product.validityPeriod;
  const startDate = new Date(plan.createdAt);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (validityInDays || 0));
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

  if (daysLeft <= 0) {
    return { badge: 'Expired', tone: 'expired', isRecurring, daysLeft };
  }
  if ((plan.updatesUsed || 0) >= (product.updateCount || 0)) {
    return { badge: 'Updates used', tone: 'used_up', isRecurring, daysLeft };
  }
  return { badge: 'Active', tone: 'active', isRecurring, daysLeft };
};

const BADGE_TONE_CLASSES = {
  active: 'bg-emerald-100 text-emerald-700',
  used_up: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-700',
  paused: 'bg-rose-100 text-rose-700',
  closed: 'bg-slate-800 text-white',
};

const UserUpdateDashboard = () => {
  const user = useSelector((state) => state?.user?.user);
  const [updatePlans, setUpdatePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch user's orders using your existing getUserOrders API
  const fetchUserUpdatePlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        // Filter for website update plans by category
        const userUpdatePlans = data.data.filter(order =>
          order.productId?.category === 'website_updates' && order.isActive
        );
        setUpdatePlans(userUpdatePlans || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching update plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserUpdatePlans();
  }, []);

  const handleRequestUpdate = (plan) => {
    setSelectedPlan(plan);
    setShowRequestModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="fixed inset-0 flex items-center justify-center">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  // -- UI-only: rendering MOCK_PLANS to design/review every card state.
  // Real fetched updatePlans are still loaded above (fetchUserUpdatePlans is
  // untouched) but not rendered yet — that swap happens in the data-wiring phase.
  const plansToRender = MOCK_PLANS;

  return (
    <DashboardLayout user={user}>
      <div
        className="min-h-full bg-slate-950 bg-cover bg-center px-4 py-5 sm:px-6 lg:px-8 lg:py-8"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              My Updates
            </div>
            <h1 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white">
              My Website Update Plans
            </h1>
          </div>

          <div className="p-5 sm:p-6">
            {plansToRender.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-base text-black mb-4">You don't have any active update plans.</p>
                <button
                  onClick={() => window.location.href = '/website-updates'}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Browse Update Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plansToRender.map(plan => {
                  const status = getCardVisualStatus(plan);
                  const product = plan.productId || {};
                  const canRequest = status.tone === 'active';

                  return (
                    <div key={plan._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-black">{product.serviceName}</h3>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE_CLASSES[status.tone]}`}>
                          {status.badge}
                        </span>
                      </div>

                      {status.isRecurring ? (
                        <div className="space-y-4 mb-4">
                          {/* This month's updates */}
                          <div>
                            <div className="flex justify-between text-sm text-black mb-1">
                              <span>This Month's Updates</span>
                              <span className="text-base font-medium text-black">
                                {Math.max(0, (plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1) - (plan.currentMonthUpdatesUsed || 0))} of {plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, ((plan.currentMonthUpdatesUsed || 0) / (plan.currentMonthUpdatesLimit || product.monthlyUpdateLimit || 1)) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Resets on */}
                          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            <CalendarClock className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Resets on <span className="font-medium text-black">{formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate)}</span></span>
                          </div>

                          {/* Yearly plan */}
                          <div>
                            <div className="flex justify-between text-sm text-black mb-1">
                              <span>Yearly Plan</span>
                              <span className="text-base font-medium text-black">
                                {plan.totalYearlyDaysRemaining ?? 0} of {product.yearlyPlanDuration || 365} days left
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-violet-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, ((plan.totalYearlyDaysRemaining ?? 0) / (product.yearlyPlanDuration || 365)) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 mb-4">
                          {/* Updates Remaining */}
                          <div>
                            <div className="flex justify-between text-sm text-black mb-1">
                              <span>Updates Remaining</span>
                              <span className="text-base font-medium text-black">
                                {Math.max(0, (product.updateCount || 0) - (plan.updatesUsed || 0))} of {product.updateCount || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (((product.updateCount || 0) - (plan.updatesUsed || 0)) / (product.updateCount || 1)) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Validity Period */}
                          <div>
                            <div className="flex justify-between text-sm text-black mb-1">
                              <span>Validity Period</span>
                              <span className="text-base font-medium text-black flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {status.daysLeft} days left
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, ((status.daysLeft || 0) / (product.validityPeriod || 1)) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <button
                          onClick={() => handleRequestUpdate(plan)}
                          disabled={!canRequest}
                          className={`w-full py-2 rounded-lg text-base font-medium flex items-center justify-center ${
                            canRequest
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Website Update
                        </button>

                        {status.tone === 'used_up' && (
                          <p className="text-amber-600 text-sm mt-2 text-center">
                            {status.isRecurring
                              ? `You've used this month's update. Resets on ${formatDate(plan.monthlyLimitResetDate || plan.currentMonthExpiryDate)}.`
                              : "You've used all your updates. Please purchase a new plan."}
                          </p>
                        )}

                        {status.tone === 'expired' && !status.isRecurring && (
                          <p className="text-slate-600 text-sm mt-2 text-center">
                            Your update plan has expired. Please purchase a new plan.
                          </p>
                        )}

                        {status.tone === 'expired' && status.isRecurring && (
                          <p className="text-slate-600 text-sm mt-2 text-center">
                            Your yearly plan has ended. Please purchase a new plan.
                          </p>
                        )}

                        {status.tone === 'paused' && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              Payment overdue for this plan. Clear the pending invoice to continue requesting updates.{' '}
                              <a href="/my-invoices" className="font-semibold underline underline-offset-2 hover:text-rose-800">
                                View invoices
                              </a>
                            </span>
                          </div>
                        )}

                        {status.tone === 'closed' && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>This plan was closed. Contact support if this looks wrong.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {showRequestModal && selectedPlan && (
        <UpdateRequestModal
          plan={selectedPlan}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedPlan(null);
          }}
          onSubmitSuccess={fetchUserUpdatePlans}
        />
      )}
    </DashboardLayout>
  );
};

export default UserUpdateDashboard;
