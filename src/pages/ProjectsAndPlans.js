import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FileText,
  Layers3,
  RefreshCw,
} from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import { AnimatedSection } from '../components/PageMotion';
import backgroundImage from '../assets/BG.png';
import CustomerWorkspaceTabs from '../components/CustomerWorkspaceTabs';
import OrderListRow, { OrderListHeader } from '../components/OrderListRow';
import Context from '../context';
import { isOrderApproved } from '../helpers/orderVisibility';
import { isProjectItem, isPlanItem, sortItemsLatestFirst } from '../helpers/orderType';
import { getRemainingDays } from '../helpers/orderPresentation';
import { customerChildState } from '../helpers/customerReturnNavigation';

const ProjectsAndPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    let list = items;
    if (view === 'projects') list = items.filter(isProjectItem);
    else if (view === 'plans') list = items.filter(isPlanItem);
    return [...list].sort(sortItemsLatestFirst);
  }, [items, view]);

  const activeWorkCount = activeProjects.length + activePlans.length;
  const currentWorkItem = context?.activeProject || activeProjects[0] || activePlans[0] || null;

  const openDetails = (order) => {
    if (isPlanItem(order)) {
      navigate(`/plan-details/${order._id}`, { state: customerChildState(location) });
    } else {
      navigate(`/project-details/${order._id}`, { state: customerChildState(location) });
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

          <AnimatedSection className="relative mt-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
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

            <OrderListHeader />

            {loading ? (
              <div className="relative px-5 py-10 text-center text-base text-slate-300 sm:px-6">Loading projects and plans...</div>
            ) : visibleItems.length > 0 ? (
                  <div className="relative divide-y divide-white/10">
                    {visibleItems.map((order, index) => (
                      <OrderListRow
                        key={order._id}
                        order={order}
                        index={index}
                        onClick={openDetails}
                      />
                    ))}
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
                    to="/start-new-project"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                  >
                    Explore Services
                  </Link>
                </div>
              </div>
            )}
          </AnimatedSection>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectsAndPlans;
