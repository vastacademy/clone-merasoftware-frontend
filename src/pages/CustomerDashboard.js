import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  FileText,
  LayoutDashboard,
  PlusCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  CheckCircle2,
  TriangleAlert,
  Layers3,
  BadgeCheck,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SummaryApi from '../common';
import Context from '../context';
import displayINRCurrency from '../helpers/displayCurrency';
import { isOrderApproved } from '../helpers/orderVisibility';

const PROJECT_CATEGORIES = new Set([
  'standard_websites',
  'dynamic_websites',
  'cloud_software_development',
  'app_development',
  'web_applications',
  'mobile_apps',
]);

const PLAN_CATEGORY = 'website_updates';

const isProjectItem = (order) => PROJECT_CATEGORIES.has(order?.productId?.category?.toLowerCase());
const isPlanItem = (order) => order?.productId?.category?.toLowerCase() === PLAN_CATEGORY;

const getRemainingDays = (order) => {
  if (!order) return 0;

  if ((order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) && order.currentMonthExpiryDate) {
    const today = new Date();
    const expiryDate = new Date(order.currentMonthExpiryDate);
    return Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)));
  }

  if (!order.createdAt || !order.productId?.validityPeriod) return 0;

  const startDate = new Date(order.createdAt);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + order.productId.validityPeriod);

  return Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
};

const getItemType = (order) => (isPlanItem(order) ? 'Plan' : 'Project');

const getItemStatus = (order) => {
  if (!order) return { label: 'Unknown', tone: 'bg-slate-100 text-slate-700' };

  if (order.orderVisibility === 'payment-rejected') {
    return { label: 'Payment rejected', tone: 'bg-rose-100 text-rose-700' };
  }

  if (order.orderVisibility === 'pending-approval') {
    return { label: 'Pending approval', tone: 'bg-amber-100 text-amber-800' };
  }

  if (isProjectItem(order)) {
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' };
    }

    if (isOrderApproved(order)) {
      return { label: 'In progress', tone: 'bg-blue-100 text-blue-700' };
    }
  }

  if (isPlanItem(order)) {
    const remainingDays = getRemainingDays(order);
    const isExhausted =
      order.planStatus === 'closed' ||
      !order.isActive ||
      (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
        ? (order.totalYearlyDaysRemaining || 0) <= 0
        : (order.updatesUsed || 0) >= (order.productId?.updateCount || 0));

    if (isExhausted) {
      return { label: 'Closed', tone: 'bg-slate-200 text-slate-700' };
    }

    if (isOrderApproved(order) && remainingDays > 0) {
      return { label: 'Active plan', tone: 'bg-violet-100 text-violet-700' };
    }
  }

  return { label: 'Processing', tone: 'bg-slate-100 text-slate-700' };
};

const getItemSummary = (order) => {
  if (isPlanItem(order)) {
    const updateCount = Number(order.productId?.updateCount || 0);
    const updatesUsed = Number(order.updatesUsed || 0);

    if (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) {
      return `${order.totalYearlyDaysRemaining || 0} day(s) left`;
    }

    if (updateCount > 0) {
      return `${Math.max(0, updateCount - updatesUsed)} update(s) left`;
    }

    return 'Plan details available';
  }

  const progress = Math.round(order?.projectProgress || 0);
  return `${progress}% complete`;
};

const getItemLink = (order) => `/project-details/${order._id}`;

const MetricCard = ({ icon: Icon, label, value, helper, tone = 'slate' }) => {
  const toneMap = {
    slate: 'from-slate-900 to-slate-700 text-white',
    blue: 'from-blue-600 to-cyan-500 text-white',
    emerald: 'from-emerald-600 to-teal-500 text-white',
    violet: 'from-violet-600 to-fuchsia-500 text-white',
  };

  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${toneMap[tone]} p-5 shadow-xl`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {helper ? <p className="mt-2 text-sm text-white/75">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const context = useContext(Context);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        const allOrders = Array.isArray(data.data) ? [...data.data] : [];
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(allOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
      if (typeof context?.fetchWalletBalance === 'function') {
        context.fetchWalletBalance();
      }
    }
  }, [user?._id, context]);

  const dashboardItems = useMemo(
    () => orders.filter((order) => isProjectItem(order) || isPlanItem(order)).slice(0, 5),
    [orders]
  );

  const activeProject = useMemo(
    () =>
      orders.find(
        (order) =>
          isProjectItem(order) &&
          isOrderApproved(order) &&
          order.orderVisibility !== 'payment-rejected' &&
          order.orderVisibility !== 'pending-approval' &&
          order.projectProgress < 100 &&
          order.currentPhase !== 'completed'
      ) || null,
    [orders]
  );

  const activePlan = useMemo(
    () =>
      orders.find(
        (order) =>
          isPlanItem(order) &&
          isOrderApproved(order) &&
          order.isActive &&
          order.planStatus !== 'closed' &&
          getRemainingDays(order) > 0 &&
          (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
            ? (order.totalYearlyDaysRemaining || 0) > 0
            : (order.updatesUsed || 0) < (order.productId?.updateCount || 0))
      ) || null,
    [orders]
  );

  const pendingApprovalCount = useMemo(
    () => orders.filter((order) => order.orderVisibility === 'pending-approval').length,
    [orders]
  );

  const rejectedCount = useMemo(
    () => orders.filter((order) => order.orderVisibility === 'payment-rejected').length,
    [orders]
  );

  const completedCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          (isProjectItem(order) && (order.projectProgress >= 100 || order.currentPhase === 'completed')) ||
          (isPlanItem(order) &&
            (order.planStatus === 'closed' ||
              !order.isActive ||
              (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
                ? (order.totalYearlyDaysRemaining || 0) <= 0
                : (order.updatesUsed || 0) >= (order.productId?.updateCount || 0))))
      ).length,
    [orders]
  );

  const hasActiveProject = Boolean(activeProject?._id);
  const primaryAction = hasActiveProject
    ? { label: 'Track Project', to: `/project-details/${activeProject._id}` }
    : { label: 'Start New Project', to: '/home' };

  useEffect(() => {
    if (typeof context?.updateActiveProject === 'function') {
      context.updateActiveProject(activeProject);
    }
  }, [activeProject, context]);

  const openItem = (order) => {
    navigate(getItemLink(order));
  };

  if (loading) {
    return (
      <DashboardLayout user={user} isLoading={loading} activeProject={activeProject}>
        <div />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activeProject={activeProject}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 text-white shadow-2xl">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr,0.8fr] lg:p-8">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Customer dashboard
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                    All key info in one control panel.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    This view keeps the customer portal clean: live project status, wallet snapshot, recent projects and plans,
                    and the next action entry point. Detailed work stays on the project tracking pages.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={primaryAction.to}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    {primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={fetchDashboardData}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Current focus</p>
                      <h2 className="mt-2 text-xl font-bold text-white">
                        {hasActiveProject
                          ? activeProject.productId?.serviceName || 'Live project'
                          : activePlan
                            ? activePlan.productId?.serviceName || 'Active plan'
                            : 'No active project'}
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                      {hasActiveProject ? <TrendingUp className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Status</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {hasActiveProject
                          ? `${Math.round(activeProject.projectProgress || 0)}% progress`
                          : activePlan
                            ? 'Plan active'
                            : 'Ready to start'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Wallet</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {displayINRCurrency(context?.walletBalance || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Pending approvals</p>
                    <p className="mt-3 text-3xl font-black">{pendingApprovalCount}</p>
                    <p className="mt-2 text-sm text-white/80">Items waiting for admin approval</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-violet-600 to-fuchsia-500 p-5 text-white shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Recent items</p>
                    <p className="mt-3 text-3xl font-black">{dashboardItems.length}</p>
                    <p className="mt-2 text-sm text-white/80">Projects and plans in the latest view</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={LayoutDashboard}
              label="Live project"
              value={hasActiveProject ? '1' : '0'}
              helper={
                hasActiveProject
                  ? activeProject.productId?.serviceName || 'Project in progress'
                  : 'No active project running'
              }
              tone="slate"
            />
            <MetricCard
              icon={Wallet}
              label="Wallet balance"
              value={displayINRCurrency(context?.walletBalance || 0)}
              helper="Available wallet amount"
              tone="emerald"
            />
            <MetricCard
              icon={BadgeCheck}
              label="Completed items"
              value={String(completedCount)}
              helper="Finished projects and closed plans"
              tone="blue"
            />
            <MetricCard
              icon={TriangleAlert}
              label="Open alerts"
              value={String(pendingApprovalCount + rejectedCount)}
              helper="Pending approvals and rejected payments"
              tone="violet"
            />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recent projects & plans</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Latest 5 items</h2>
              </div>
              <Link
                to="/order"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                View all orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardItems.length > 0 ? (
                dashboardItems.map((order) => {
                  const status = getItemStatus(order);
                  const isPrimary = isProjectItem(order) && status.label === 'In progress';

                  return (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() => openItem(order)}
                      className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                            {getItemType(order)}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-950">
                              {order.productId?.serviceName || 'Project'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {order.productId?.category?.split('_').join(' ') || 'Unknown category'}
                            </p>
                          </div>
                          <div className="text-sm text-slate-500">
                            <p className="font-medium text-slate-700">{getItemSummary(order)}</p>
                            <p>{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isPrimary ? (
                          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-slate-200 p-2 text-slate-600">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Layers3 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-950">No projects or plans yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Start a new project from the dashboard and the latest tracking info will show here.
                  </p>
                  <div className="mt-5">
                    <Link
                      to="/home"
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Start New Project
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
