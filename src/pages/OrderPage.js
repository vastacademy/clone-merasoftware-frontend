import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import TriangleMazeLoader from '../components/TriangleMazeLoader';
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

const getOrderStatus = (order) => {
  if (!order) return 'Processing';

  if (order.orderVisibility === 'payment-rejected') {
    return 'Rejected';
  }

  if (order.orderVisibility === 'pending-approval') {
    return 'Pending approval';
  }

  if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
    return 'Completed';
  }

  if (isOrderApproved(order)) {
    return 'In progress';
  }

  return 'Processing';
};

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    'In progress': {
      color: 'bg-blue-500 text-white',
      icon: <RefreshCw size={14} className="mr-1" />,
    },
    'Pending approval': {
      color: 'bg-amber-500 text-white',
      icon: <Clock size={14} className="mr-1" />,
    },
    Rejected: {
      color: 'bg-red-500 text-white',
      icon: <AlertCircle size={14} className="mr-1" />,
    },
    Completed: {
      color: 'bg-green-500 text-white',
      icon: <CheckCircle size={14} className="mr-1" />,
    },
    Processing: {
      color: 'bg-gray-500 text-white',
      icon: <Clock size={14} className="mr-1" />,
    },
  };

  const config = statusConfig[status] || statusConfig.Processing;

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
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

const OrderRow = ({ order, navigate, formatDate, index }) => {
  const handleClick = () => {
    navigate(`/order-detail/${order._id}`);
  };

  const status = getOrderStatus(order);
  const purchaseType = getPurchaseTypeLabel(order);
  const isProject = isProjectItem(order);
  const isPlan = isPlanItem(order);
  const category = order.productId?.category?.split('_').join(' ') || 'Unknown type';
  const price = displayINRCurrency(order.price || order.totalPrice || 0);

  return (
    <button
      onClick={handleClick}
      type="button"
      className={[
        'grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6',
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
      ].join(' ')}
    >
      <div className="col-span-12 lg:col-span-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            {isProject ? <LayoutGrid className="h-5 w-5" /> : isPlan ? <Layers3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {purchaseType}
              </span>
            </div>
            <h3 className="mt-2 truncate text-base font-bold text-slate-950 sm:text-lg">
              {order.productId?.serviceName || 'Untitled'}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-500">{category}</p>
            <p className="mt-2 text-xs text-slate-500 sm:hidden">
              Purchased {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{purchaseType}</p>
          <p className="text-xs text-slate-500">
            {isPlan ? 'Plan purchase' : isProject ? 'Project purchase' : 'Order purchase'}
          </p>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <OrderStatusBadge status={status} />
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calendar size={14} />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <p className="text-xs text-slate-500">Purchased on</p>
        </div>
      </div>

      <div className="col-span-6 flex items-center justify-between lg:col-span-1 lg:justify-end">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{price}</p>
          <p className="text-xs text-slate-500">Price</p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400" />
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

        const activeProj = allOrders.find((order) => {
          const category = order.productId?.category?.toLowerCase();
          if (!category) return false;

          if (PROJECT_CATEGORIES.has(category)) {
            if (order.orderVisibility === 'pending-approval' || order.orderVisibility === 'payment-rejected') {
              return false;
            }

            return order.projectProgress < 100 || order.currentPhase !== 'completed';
          }

          return false;
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

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const status = getOrderStatus(order);

      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return status === 'Pending approval' || status === 'Processing';
      if (activeTab === 'active') return status === 'In progress';
      if (activeTab === 'completed') return status === 'Completed';
      if (activeTab === 'rejected') return status === 'Rejected';

      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((order) => {
      const status = getOrderStatus(order);
      return status === 'Pending approval' || status === 'Processing';
    }).length,
    active: orders.filter((order) => getOrderStatus(order) === 'In progress').length,
    completed: orders.filter((order) => getOrderStatus(order) === 'Completed').length,
    rejected: orders.filter((order) => getOrderStatus(order) === 'Rejected').length,
  };

  const filterTabs = [
    { id: 'all', label: 'All orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected' },
  ];

  if (loading) {
    return (
      <DashboardLayout
        user={user}
        activeProject={activeProject}
      >
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Orders</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Purchase history</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Clean order records with price, purchase date, type, and current status. Detail pages stay unchanged.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchOrders}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {tab.label}
                  <span className="ml-2 text-[11px] opacity-75">({statusCounts[tab.id] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:px-6">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 lg:col-span-5">Order</div>
                <div className="col-span-6 lg:col-span-2">Type</div>
                <div className="col-span-6 lg:col-span-2">Status</div>
                <div className="col-span-6 lg:col-span-2">Purchased</div>
                <div className="col-span-6 lg:col-span-1 text-right">Price</div>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredOrders.map((order, index) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    index={index}
                    navigate={navigate}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">{emptyTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/home')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Browse Services
                  </button>
                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Refresh Orders
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
