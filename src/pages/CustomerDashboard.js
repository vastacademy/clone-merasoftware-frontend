import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  LayoutDashboard,
  LayoutGrid,
  PlusCircle,
  RefreshCw,
  Wallet,
  TriangleAlert,
  Layers3,
  BadgeCheck,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
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

const MetricCard = ({ icon: Icon, label, value, helper, tone = 'slate', to }) => {
  const glowMap = {
    slate: 'bg-slate-400/25',
    blue: 'bg-blue-400/30',
    emerald: 'bg-emerald-400/30',
    violet: 'bg-violet-400/30',
  };

  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        'group relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-950/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:border-white/25 hover:bg-slate-950/70',
        to ? 'block' : '',
      ].join(' ')}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full ${glowMap[tone]} blur-3xl`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold uppercase text-white">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-200">{helper}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
          {to ? <ArrowRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" /> : <Icon className="h-5 w-5 text-white" />}
        </div>
      </div>
    </Wrapper>
  );
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const context = useContext(Context);

  const [orders, setOrders] = useState([]);

  const fetchDashboardData = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
    }
  }, [user?._id]);

  const dashboardItems = useMemo(
    () => orders.filter((order) => isProjectItem(order) || isPlanItem(order)).slice(0, 5),
    [orders]
  );

  const activeProjects = useMemo(
    () =>
      orders.filter(
        (order) =>
          isProjectItem(order) &&
          isOrderApproved(order) &&
          order.orderVisibility !== 'payment-rejected' &&
          order.orderVisibility !== 'pending-approval' &&
          order.projectProgress < 100 &&
          order.currentPhase !== 'completed'
      ),
    [orders]
  );

  const activePlans = useMemo(
    () =>
      orders.filter(
        (order) =>
          isPlanItem(order) &&
          isOrderApproved(order) &&
          order.orderVisibility !== 'payment-rejected' &&
          order.orderVisibility !== 'pending-approval' &&
          order.planStatus !== 'closed' &&
          order.isActive &&
          getRemainingDays(order) > 0
      ),
    [orders]
  );

  const activeWorkItemsCount = activeProjects.length + activePlans.length;

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

  const primaryWorkItem = activeProjects[0] || activePlans[0] || activeProject || null;
  const primaryAction = (() => {
    if (activeProjects.length === 1 && activePlans.length === 0) {
      return { label: 'Track Project', to: `/project-details/${activeProjects[0]._id}` };
    }

    if (activeProjects.length === 0 && activePlans.length === 1) {
      return { label: 'Request Website Update', to: '/my-updates' };
    }

    if (activeProjects.length > 0 && activePlans.length > 0) {
      return { label: `${activeWorkItemsCount} Active Services`, to: '/projects-and-plans' };
    }

    if (activeProjects.length > 1) {
      return { label: `${activeProjects.length} Active Projects`, to: '/projects-and-plans' };
    }

    if (activePlans.length > 1) {
      return { label: `${activePlans.length} Active Plans`, to: '/projects-and-plans' };
    }

    return { label: 'Start New Project', to: '/start-new-project' };
  })();

  useEffect(() => {
    if (typeof context?.updateActiveProject === 'function') {
      context.updateActiveProject(activeProject);
    }
  }, [activeProject, context]);

  const openItem = (order) => {
    navigate(getItemLink(order));
  };

  return (
      <DashboardLayout user={user} activeProject={activeProject}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Dashboard
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Open the live project, check wallet balance, or start new work from here.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={LayoutDashboard}
              label={primaryWorkItem ? 'Live project' : 'Start New Project'}
              value={
                primaryWorkItem
                  ? primaryWorkItem.productId?.serviceName || 'Active work'
                  : primaryAction.label
              }
              helper={
                primaryWorkItem
                  ? activeWorkItemsCount > 1
                    ? `${activeWorkItemsCount} active items`
                    : primaryAction.label
                  : 'No active project running'
              }
              tone="slate"
              to={primaryAction.to}
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
          </div>

          <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            <div className="relative flex flex-col gap-3 border-b border-white/15 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
              <h2 className="flex items-center text-xl font-semibold text-white">
                <Layers3 className="mr-2 h-5 w-5" />
                Recent projects & plans
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/order"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  View all orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {dashboardItems.length > 0 ? (
              <>
                <div className="relative grid grid-cols-12 gap-3 border-b border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase text-slate-300 sm:px-6">
                  <div className="col-span-12 lg:col-span-5">Item</div>
                  <div className="col-span-6 lg:col-span-2">Type</div>
                  <div className="col-span-6 lg:col-span-2">Status</div>
                  <div className="col-span-6 lg:col-span-2">Updated</div>
                  <div className="col-span-6 lg:col-span-1 text-right">Open</div>
                </div>

                <div className="relative divide-y divide-white/10">
                  {dashboardItems.map((order, index) => {
                    const status = getItemStatus(order);
                    const isProject = isProjectItem(order);
                    const isPlan = isPlanItem(order);
                    const summary = isPlan ? getItemSummary(order) : 'Project';
                    const progress = Math.round(order?.projectProgress || 0);
                    const remainingDays = getRemainingDays(order);
                    const category = order.productId?.category?.split('_').join(' ') || 'Unknown type';
                    const currentValue = isPlan
                      ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
                        ? `${order.totalYearlyDaysRemaining || 0} day(s) left`
                        : `${Math.max(0, Number(order.productId?.updateCount || 0) - Number(order.updatesUsed || 0))} update(s) left`)
                      : `${progress}% complete`;

                    return (
                      <button
                        key={order._id}
                        type="button"
                        onClick={() => openItem(order)}
                        className={[
                          'grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-white/[0.1] sm:px-6',
                          index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <div className="col-span-12 lg:col-span-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
                              {isProject ? <LayoutGrid className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold uppercase text-slate-900">
                                  {getItemType(order)}
                                </span>
                                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-sm font-semibold uppercase text-slate-200">
                                  {summary}
                                </span>
                              </div>
                              <h3 className="mt-2 truncate text-lg font-semibold text-white">
                                {order.productId?.serviceName || 'Untitled'}
                              </h3>
                              <p className="mt-1 truncate text-sm text-slate-300">{category}</p>
                              <p className="mt-2 text-sm text-slate-300 sm:hidden">
                                Updated {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-white">{isPlan ? 'Plan' : 'Project'}</p>
                            <p className="text-sm text-slate-300">
                              {isPlan ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan ? 'Monthly' : 'Update based') : 'Work item'}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-white">{new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-GB')}</p>
                            <p className="text-sm text-slate-300">{order.assignedDeveloper?.name || 'Not assigned'}</p>
                            <p className="text-sm text-slate-300">{currentValue}</p>
                          </div>
                        </div>

                        <div className="col-span-6 flex items-center justify-between lg:col-span-1 lg:justify-end">
                        <div className="hidden text-right lg:block">
                          <p className="text-sm text-slate-300">
                            {isPlan ? `${remainingDays} day(s) left` : `${progress}%`}
                          </p>
                        </div>
                          <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="relative px-5 py-12 text-center sm:px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
                  <Layers3 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">No projects or plans yet</h3>
                <p className="mt-2 text-base text-slate-300">
                  Start a new project from the dashboard and the latest tracking info will show here.
                </p>
                <div className="mt-5">
                  <Link
                    to="/home"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Start New Project
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
