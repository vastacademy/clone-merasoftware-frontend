import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  LayoutGrid,
  Layers3,
  RefreshCw,
} from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import CustomerWorkspaceTabs from '../components/CustomerWorkspaceTabs';
import displayINRCurrency from '../helpers/displayCurrency';
import { isOrderApproved } from '../helpers/orderVisibility';
import PaymentStatusChip from '../components/PaymentStatusChip';
import { isProjectItem, isPlanItem, PROJECT_CATEGORIES } from '../helpers/orderType';
import { getOrderCategory, getOrderDisplayName } from '../helpers/orderPresentation';
import { customerChildState } from '../helpers/customerReturnNavigation';

// Display label for one order. Derived by backend/helpers/orderStatusEngine.js and delivered on
// the order as `orderState`, so this page can no longer disagree with the project list or the
// admin workspace about what an order's state is.
//
// This page's own version of these rules had no 'cancelled' branch at all, so a cancelled order
// fell through to its progress and read "Completed"; and it collapsed every approved order into
// "In progress", so an order at 0% and one with a payment due were indistinguishable.
const getOrderStatus = (order) => {
  if (!order) return 'Processing';
  if (order.orderState?.label) return order.orderState.label;

  // ── fallback: payloads that predate the engine ──
  if (order.orderVisibility === 'cancelled') return 'Cancelled';
  if (order.orderVisibility === 'payment-rejected') return 'Rejected';
  if (order.orderVisibility === 'pending-approval') return 'Pending approval';
  if (order.projectProgress >= 100 || order.currentPhase === 'completed') return 'Completed';
  if (isOrderApproved(order)) return 'In progress';
  return 'Processing';
};

// The filter tabs and their counts group orders by MEANING, never by the displayed wording — a
// label change (or a plan reading "Active" where a project reads "In Progress · 40%") must not
// silently empty a tab. `code` is the engine's stable machine value and is what they compare.
const getOrderStatusCode = (order) => {
  if (order?.orderState?.code) return order.orderState.code;

  // ── fallback: derive a code from the same conditions the label fallback uses ──
  if (order?.orderVisibility === 'cancelled') return 'cancelled';
  if (order?.orderVisibility === 'payment-rejected') return 'rejected';
  if (order?.orderVisibility === 'pending-approval') return 'pending_approval';
  if (order?.projectProgress >= 100 || order?.currentPhase === 'completed') return 'completed';
  if (isOrderApproved(order)) return 'in_progress';
  return 'processing';
};

// Which tab an order belongs under. Grouped rather than one-code-per-tab so states the tabs were
// never written for (payment due, not-yet-started, active/closed plans) land somewhere sensible
// instead of vanishing from every tab but "All".
const TAB_CODES = {
  pending: ['pending_approval', 'processing'],
  active: ['in_progress', 'approved_not_started', 'payment_due', 'plan_active'],
  completed: ['completed', 'plan_closed'],
  rejected: ['rejected', 'cancelled'],
};

const matchesTab = (order, tab) => {
  if (tab === 'all') return true;
  return (TAB_CODES[tab] || []).includes(getOrderStatusCode(order));
};

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    'In progress': {
      color: 'bg-blue-500 text-[var(--text-primary)]',
      icon: <RefreshCw size={14} className="mr-1" />,
    },
    'Pending approval': {
      color: 'bg-amber-500 text-[var(--text-primary)]',
      icon: <Clock size={14} className="mr-1" />,
    },
    Rejected: {
      color: 'bg-red-500 text-[var(--text-primary)]',
      icon: <AlertCircle size={14} className="mr-1" />,
    },
    Completed: {
      color: 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 backdrop-blur-md',
      icon: <CheckCircle size={14} className="mr-1" />,
    },
    Processing: {
      color: 'bg-[var(--glass-bg-strong)] text-[var(--text-secondary)]',
      icon: <Clock size={14} className="mr-1" />,
    },
  };

  const config = statusConfig[status] || statusConfig.Processing;

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};

const getPurchaseTypeLabel = (order) => {
  if (isPlanItem(order)) {
    return order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
      ? 'Monthly plan'
      : 'Plan';
  }

  if (isProjectItem(order)) {
    return 'Project';
  }

  return 'Order';
};

const OrderRow = ({ order, navigate, location, formatDate, index }) => {
  const handleClick = () => {
    navigate(`/order-detail/${order._id}`, { state: customerChildState(location) });
  };

  const status = getOrderStatus(order);
  const purchaseType = getPurchaseTypeLabel(order);
  const isProject = isProjectItem(order);
  const isPlan = isPlanItem(order);
  const category = getOrderCategory(order, 'Unknown type').split('_').join(' ');
  const price = displayINRCurrency(order.price || order.totalPrice || 0);

  return (
    <button
      onClick={handleClick}
      type="button"
      className={[
        'grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-[var(--glass-bg-hover)] sm:px-6',
        index % 2 === 0 ? 'bg-[var(--glass-bg-subtle)]' : 'bg-[var(--glass-bg-subtle)]',
      ].join(' ')}
    >
      <div className="col-span-12 lg:col-span-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-md">
            {isProject ? <LayoutGrid className="h-5 w-5" /> : isPlan ? <Layers3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgb(var(--ink-rgb))] px-2.5 py-1 text-sm font-semibold uppercase text-[var(--page-bg)]">
                {purchaseType}
              </span>
            </div>
            <h3 className="mt-2 truncate text-lg font-semibold text-[var(--text-primary)]">
              {getOrderDisplayName(order)}
            </h3>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{category}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:hidden">
              Purchased {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--text-primary)]">{purchaseType}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {isPlan ? 'Plan purchase' : isProject ? 'Project purchase' : 'Order purchase'}
          </p>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <OrderStatusBadge status={status} />
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Calendar size={14} />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Purchased on</p>
        </div>
      </div>

      <div className="col-span-6 flex items-center justify-between lg:col-span-1 lg:justify-end">
        <div className="text-right">
          <p className="text-base font-semibold text-[var(--text-primary)]">{price}</p>
          <p className="text-sm text-[var(--text-secondary)]">Price</p>
          <div className="mt-1 flex lg:justify-end">
            <PaymentStatusChip order={order} />
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--text-muted)]" />
      </div>
    </button>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activeProject, setActiveProject] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchOrders();

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchOrders = async () => {
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

        // The one project still being worked on. Derived from the engine's state code so a
        // cancelled project cannot qualify — the previous version excluded only pending and
        // rejected, so a cancelled project was still picked up as the customer's active work.
        const activeProj = allOrders.find((order) => {
          const category = getOrderCategory(order).toLowerCase();
          if (!category || !PROJECT_CATEGORIES.has(category)) return false;

          const code = getOrderStatusCode(order);
          if (code) return ['in_progress', 'approved_not_started', 'payment_due'].includes(code);

          // ── fallback: payloads that predate the engine ──
          if (['pending-approval', 'payment-rejected', 'cancelled'].includes(order.orderVisibility)) {
            return false;
          }
          return order.projectProgress < 100 || order.currentPhase !== 'completed';
        });

        setActiveProject(activeProj || null);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  const filteredOrders = orders.filter((order) => matchesTab(order, activeTab));

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((order) => matchesTab(order, 'pending')).length,
    active: orders.filter((order) => matchesTab(order, 'active')).length,
    completed: orders.filter((order) => matchesTab(order, 'completed')).length,
    rejected: orders.filter((order) => matchesTab(order, 'rejected')).length,
  };

  const filterTabs = [
    { id: 'all', label: 'All orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected' },
  ].map((tab) => ({ ...tab, label: `${tab.label} (${statusCounts[tab.id] || 0})` }));

  const emptyTitle =
    activeTab === 'pending'
      ? 'No pending orders'
      : activeTab === 'active'
        ? 'No active orders'
        : activeTab === 'completed'
          ? 'No completed orders'
          : activeTab === 'rejected'
            ? 'No rejected orders'
            : 'No orders yet';

  const emptyMessage =
    activeTab === 'pending'
      ? 'Pending approvals will appear here.'
      : activeTab === 'active'
        ? 'Active orders will appear here.'
        : activeTab === 'completed'
          ? 'Completed orders will appear here.'
          : activeTab === 'rejected'
            ? 'Rejected orders will appear here.'
            : 'You do not have any orders yet.';

  return (
    <DashboardLayout
      user={user}
      activeProject={activeProject}
    >
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[var(--scrim)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              Purchase history
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
              Clean order records with price, purchase date, type, and current status. Detail pages stay unchanged.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-3xl border border-[var(--glass-border-strong)] bg-[var(--glass-bg)] shadow-[var(--card-shadow)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[var(--glass-sheen)] to-transparent" />

            <div className="relative flex flex-col gap-3 border-b border-[var(--glass-border)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
              <h2 className="flex items-center text-xl font-semibold text-[var(--text-primary)]">
                <FileText className="mr-2 h-5 w-5" />
                Orders
              </h2>
              <CustomerWorkspaceTabs
                tabs={filterTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                ariaLabel="Order status filters"
                variant="inline"
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-md">
                  Total: {orders.length}
                </div>
                <button
                  type="button"
                  onClick={fetchOrders}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-md transition hover:bg-[var(--glass-bg-strong)]"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="relative grid grid-cols-12 gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-5 py-3 text-sm font-semibold uppercase text-[var(--text-secondary)] sm:px-6">
              <div className="col-span-12 lg:col-span-5">Order</div>
              <div className="col-span-6 lg:col-span-2">Type</div>
              <div className="col-span-6 lg:col-span-2">Status</div>
              <div className="col-span-6 lg:col-span-2">Purchased</div>
              <div className="col-span-6 lg:col-span-1 text-right">Price</div>
            </div>

            {loading ? (
              <div className="relative px-5 py-10 text-center text-base text-[var(--text-secondary)] sm:px-6">Loading orders...</div>
            ) : filteredOrders.length > 0 ? (
              <div className="relative divide-y divide-[var(--divider)]">
                {filteredOrders.map((order, index) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    index={index}
                    navigate={navigate}
                    location={location}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="relative px-5 py-12 text-center sm:px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-md">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{emptyTitle}</h3>
                <p className="mt-2 text-base text-[var(--text-secondary)]">{emptyMessage}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/start-new-project')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--ink-rgb))] px-4 py-3 text-base font-semibold text-[var(--page-bg)] transition hover:bg-[rgb(var(--ink-rgb)/0.85)]"
                  >
                    Browse Services
                  </button>
                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border-strong)] bg-[var(--glass-bg)] px-4 py-3 text-base font-semibold text-[var(--text-primary)] backdrop-blur-md transition hover:bg-[var(--glass-bg-strong)]"
                  >
                    Refresh Orders
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
