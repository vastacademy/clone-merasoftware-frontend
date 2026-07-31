import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  FileText,
  Layers3,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import CustomerWorkspaceTabs from '../components/CustomerWorkspaceTabs';
import Context from '../context';
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

const formatDate = (date) => {
  if (!date) return 'N/A';

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusMeta = (order) => {
  if (!order) {
    return { label: 'Unknown', tone: 'bg-slate-100 text-slate-700' };
  }

  if (order.orderVisibility === 'payment-rejected') {
    return { label: 'Payment Rejected', tone: 'bg-rose-100 text-rose-700' };
  }

  if (order.orderVisibility === 'pending-approval') {
    return { label: 'Booked', tone: 'bg-amber-100 text-amber-800' };
  }

  if (isProjectItem(order)) {
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' };
    }

    if (isOrderApproved(order)) {
      const progress = Math.round(order.projectProgress || 0);
      if (progress === 0) {
        return { label: 'Developer Assigned', tone: 'bg-blue-100 text-blue-700' };
      }
      return { label: `${progress}% Complete`, tone: 'bg-blue-100 text-blue-700' };
    }
  }

  if (isPlanItem(order)) {
    const isClosed =
      order.planStatus === 'closed' ||
      !order.isActive ||
      (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
        ? (order.totalYearlyDaysRemaining || 0) <= 0
        : (order.updatesUsed || 0) >= (order.productId?.updateCount || 0));

    if (isClosed) {
      return { label: 'Closed', tone: 'bg-slate-200 text-slate-700' };
    }

    if (isOrderApproved(order) && getRemainingDays(order) > 0) {
      return { label: 'Active plan', tone: 'bg-violet-100 text-violet-700' };
    }
  }

  return { label: 'Processing', tone: 'bg-slate-100 text-slate-700' };
};

const getSummaryText = (order) => {
  if (isPlanItem(order)) {
    if (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) {
      return `${order.totalYearlyDaysRemaining || 0} day(s) left`;
    }

    const totalUpdates = Number(order.productId?.updateCount || 0);
    const usedUpdates = Number(order.updatesUsed || 0);
    return totalUpdates > 0 ? `${Math.max(0, totalUpdates - usedUpdates)} update(s) left` : 'Plan details available';
  }

  return `${Math.round(order?.projectProgress || 0)}% complete`;
};

const getTypeLabel = (order) => (isPlanItem(order) ? 'Plan' : 'Project');

const ProjectsAndPlans = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const context = useContext(Context);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        const nextOrders = Array.isArray(result.data) ? [...result.data] : [];
        nextOrders.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        setOrders(nextOrders);
      }
    } catch (error) {
      console.error('Error fetching projects and plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user?._id]);

  const items = useMemo(
    () => orders.filter((order) => isProjectItem(order) || isPlanItem(order)),
    [orders]
  );

  const activeProjects = useMemo(
    () =>
      items.filter(
        (order) =>
          isProjectItem(order) &&
          isOrderApproved(order) &&
          order.orderVisibility !== 'payment-rejected' &&
          order.orderVisibility !== 'pending-approval' &&
          order.projectProgress < 100 &&
          order.currentPhase !== 'completed'
      ),
    [items]
  );

  const activePlans = useMemo(
    () =>
      items.filter(
        (order) =>
          isPlanItem(order) &&
          isOrderApproved(order) &&
          order.orderVisibility !== 'payment-rejected' &&
          order.orderVisibility !== 'pending-approval' &&
          order.planStatus !== 'closed' &&
          order.isActive &&
          getRemainingDays(order) > 0
      ),
    [items]
  );

  const visibleItems = useMemo(() => {
    if (view === 'projects') return items.filter(isProjectItem);
    if (view === 'plans') return items.filter(isPlanItem);
    return items;
  }, [items, view]);

  const activeWorkCount = activeProjects.length + activePlans.length;
  const currentWorkItem = context?.activeProject || activeProjects[0] || activePlans[0] || null;

  const openDetails = (order) => {
    if (isPlanItem(order)) {
      navigate(`/plan-details/${order._id}`);
    } else {
      navigate(`/project-details/${order._id}`);
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeProject={currentWorkItem}
      activeWorkItem={currentWorkItem}
      activeWorkItemsCount={activeWorkCount}
    >
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Projects and Plans
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Compact list of all project and plan records with status, type, progress, and ownership in one view.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            <div className="relative flex flex-col gap-3 border-b border-white/15 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
              <h2 className="flex items-center text-xl font-semibold text-white">
                <Layers3 className="mr-2 h-5 w-5" />
                Projects and Plans
              </h2>
              <CustomerWorkspaceTabs
                tabs={[
                  { id: 'all', label: 'All' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'plans', label: 'Plans' },
                ]}
                activeTab={view}
                onChange={setView}
                ariaLabel="Projects and plans filters"
                variant="inline"
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                  Total: {items.length}
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                  Active: {activeWorkCount}
                </div>
                <button
                  type="button"
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="relative grid grid-cols-12 gap-3 border-b border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase text-slate-300 sm:px-6">
              <div className="col-span-12 lg:col-span-5">Item</div>
              <div className="col-span-6 lg:col-span-2">Type</div>
              <div className="col-span-6 lg:col-span-2">Status</div>
              <div className="col-span-6 lg:col-span-2">Updated</div>
              <div className="col-span-6 lg:col-span-1 text-right">Open</div>
            </div>

            {loading ? (
              <div className="relative px-5 py-10 text-center text-base text-slate-300 sm:px-6">Loading projects and plans...</div>
            ) : visibleItems.length > 0 ? (
                  <div className="relative divide-y divide-white/10">
                    {visibleItems.map((order, index) => {
                  const status = getStatusMeta(order);
                  const isProject = isProjectItem(order);
                  const isPlan = isPlanItem(order);
                  const summary = isPlan ? getSummaryText(order) : 'Project';
                  const category = order.productId?.category?.split('_').join(' ') || 'Unknown type';
                  const currentValue = isPlan
                    ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
                      ? `${order.totalYearlyDaysRemaining || 0} day(s) left`
                      : `${Math.max(0, Number(order.productId?.updateCount || 0) - Number(order.updatesUsed || 0))} update(s) left`)
                    : null;

                  return (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() => openDetails(order)}
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
                                {getTypeLabel(order)}
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
                              Updated {formatDate(order.updatedAt || order.createdAt)}
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
                          <p className="text-base font-semibold text-white">{formatDate(order.updatedAt || order.createdAt)}</p>
                          {isPlan && <p className="text-sm text-slate-300">{currentValue}</p>}
                        </div>
                      </div>

                      <div className="col-span-6 flex items-center justify-end lg:col-span-1">
                        <div className="hidden text-right lg:block">
                          {isPlan && (
                            <p className="text-sm text-slate-300">
                              {currentValue}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative px-5 py-12 text-center sm:px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">No items found</h3>
                <p className="mt-2 text-base text-slate-300">There are no projects or plans in this view.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Back to Dashboard
                  </Link>
                  <Link
                    to="/home"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                  >
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

export default ProjectsAndPlans;
