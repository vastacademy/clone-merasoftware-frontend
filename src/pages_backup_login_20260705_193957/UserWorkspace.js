import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Shield, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import AddRoleToUserModal from '../components/AddRoleToUserModal';
import EditDeveloper from '../components/EditDeveloper';
import EditUserBasicModal from '../components/EditUserBasicModal';
import ProjectWorkspaceModal from '../components/admin/ProjectWorkspaceModal';
import UpdateRequestWorkspaceModal from '../components/admin/UpdateRequestWorkspaceModal';
import {
  fetchWorkspaceActivityCounts,
  getBadgeClasses,
  getClientActiveCount,
  getClientBadgeState,
  getModuleCount,
  getModuleBadgeState,
  getModuleItems,
  hasClientUnreadActivity,
  hasModuleUnreadActivity,
} from '../helpers/adminActivitySignals';

const roleTheme = {
  customer: 'bg-blue-100 text-blue-800',
  developer: 'bg-indigo-100 text-indigo-800',
  partner: 'bg-emerald-100 text-emerald-800',
  manager: 'bg-pink-100 text-pink-800',
  admin: 'bg-slate-100 text-slate-800',
};

const getTimestamp = (value) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getOrderSortPriority = (order) => {
  if (order.orderVisibility === 'pending-approval') return 1;
  if (order.orderVisibility === 'payment-rejected') return 2;
  if ((order.projectProgress || 0) >= 100 || order.currentPhase === 'completed') return 4;
  return 3;
};

const getUpdateSortPriority = (update) => {
  if (update.status === 'pending') return 1;
  if (update.status === 'in_progress') return 2;
  if (update.status === 'rejected') return 3;
  if (update.status === 'completed') return 4;
  return 5;
};

const UserWorkspace = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [developerProfile, setDeveloperProfile] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [openEditDeveloper, setOpenEditDeveloper] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activityCounts, setActivityCounts] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUpdateRequest, setSelectedUpdateRequest] = useState(null);
  const [loadingDeveloperWork, setLoadingDeveloperWork] = useState(false);
  const [developerAssignedProjects, setDeveloperAssignedProjects] = useState([]);
  const [developerAssignedUpdates, setDeveloperAssignedUpdates] = useState([]);
  const [allData, setAllData] = useState({
    orders: [],
    renewals: [],
    transactions: [],
    invoices: [],
    updates: [],
    plans: [],
    summary: null,
  });

  const loadWorkspaceActivity = async () => {
    try {
      const response = await fetchWorkspaceActivityCounts();
      setActivityCounts(response.clientMap?.[userId] || null);
    } catch (error) {
      console.error('Error fetching workspace activity counts:', error);
    }
  };

  const loadUserDetails = async () => {
    try {
      setLoadingUser(true);
      const [usersResponse, developerResponse] = await Promise.all([
        fetch(SummaryApi.allUser.url, {
          method: SummaryApi.allUser.method,
          credentials: 'include',
        }),
        fetch(SummaryApi.allDevelopers.url, {
          method: SummaryApi.allDevelopers.method,
          credentials: 'include',
        }),
      ]);

      const usersResult = await usersResponse.json();
      const developerResult = await developerResponse.json();

      if (!usersResult.success) {
        toast.error(usersResult.message || 'Failed to load user');
        return;
      }

      const selectedUser = usersResult.data.find((item) => item._id === userId) || null;
      setUser(selectedUser);
      setDevelopers(developerResult.success ? (developerResult.data || []) : []);

      if (selectedUser && developerResult.success) {
        const matchedDeveloper = (developerResult.data || []).find(
          (profile) => profile.email?.toLowerCase() === selectedUser.email?.toLowerCase()
        );
        setDeveloperProfile(matchedDeveloper || null);
      } else {
        setDeveloperProfile(null);
      }
    } catch (error) {
      console.error('Error fetching workspace user:', error);
      toast.error('Error loading user workspace');
    } finally {
      setLoadingUser(false);
    }
  };

  const loadWorkspaceData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`${SummaryApi.adminUserWorkspace.url}/${userId}`, {
        method: SummaryApi.adminUserWorkspace.method,
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || 'Failed to load workspace modules');
        const emptyData = {
          orders: [],
          renewals: [],
          transactions: [],
          invoices: [],
          updates: [],
          plans: [],
          summary: null,
        };
        setAllData(emptyData);
        return emptyData;
      }

      const nextData = {
        orders: result.data?.orders || [],
        renewals: result.data?.renewals || [],
        transactions: result.data?.transactions || [],
        invoices: result.data?.invoices || [],
        updates: result.data?.updates || [],
        plans: result.data?.plans || [],
        summary: result.data?.summary || null,
      };
      setAllData(nextData);
      return nextData;
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      toast.error('Error loading workspace modules');
      return null;
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadWorkspaceData();
      loadWorkspaceActivity();
    }
  }, [userId]);

  useEffect(() => {
    const loadDeveloperWork = async () => {
      if (!user?.roles?.includes('developer') || !developerProfile?._id) {
        setDeveloperAssignedProjects([]);
        setDeveloperAssignedUpdates([]);
        return;
      }

      try {
        setLoadingDeveloperWork(true);
        const [projectsResponse, updatesResponse] = await Promise.all([
          fetch(SummaryApi.adminProjects.url, { credentials: 'include' }),
          fetch(SummaryApi.adminUpdateRequests.url, { credentials: 'include' }),
        ]);

        const [projectsResult, updatesResult] = await Promise.all([
          projectsResponse.json(),
          updatesResponse.json(),
        ]);

        const developerId = String(developerProfile._id);

        const assignedProjects = (projectsResult.success ? (projectsResult.data || []) : []).filter(
          (project) => String(project.assignedDeveloper?._id || project.assignedDeveloper) === developerId
        );

        const assignedUpdates = (updatesResult.success ? (updatesResult.data || []) : []).filter(
          (update) => String(update.assignedDeveloper?._id || update.assignedDeveloper) === developerId
        );

        setDeveloperAssignedProjects(assignedProjects);
        setDeveloperAssignedUpdates(assignedUpdates);
      } catch (error) {
        console.error('Error loading developer assigned work:', error);
        setDeveloperAssignedProjects([]);
        setDeveloperAssignedUpdates([]);
      } finally {
        setLoadingDeveloperWork(false);
      }
    };

    loadDeveloperWork();
  }, [developerProfile, user]);

  useEffect(() => {
    if (!user?.roles?.length) return;

    const requestedRole = location.state?.defaultRole;
    if (requestedRole && user.roles.includes(requestedRole)) {
      setSelectedRole(requestedRole);
      return;
    }

    if (user.roles.includes('customer')) {
      setSelectedRole('customer');
      return;
    }

    setSelectedRole((prev) => (user.roles.includes(prev) ? prev : user.roles[0]));
  }, [location.state, user]);

  const tabs = useMemo(() => {
    if (!user) return [];

    const roleTabs = {
      customer: [
        { id: 'overview', label: 'Overview' },
        { id: 'orders', label: 'Orders & Projects' },
        { id: 'renewals', label: 'Renewals' },
        { id: 'payments', label: 'Payments & Wallet' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'updates', label: 'Update Requests' },
        { id: 'closure', label: 'Plan Closure' },
      ],
      developer: [
        { id: 'overview', label: 'Overview' },
        { id: 'developer', label: 'Developer Profile' },
        { id: 'assigned-work', label: 'Assigned Work' },
      ],
      partner: [
        { id: 'overview', label: 'Overview' },
        { id: 'partner', label: 'Partner View' },
      ],
      manager: [
        { id: 'overview', label: 'Overview' },
        { id: 'manager', label: 'Manager View' },
      ],
      admin: [
        { id: 'overview', label: 'Overview' },
        { id: 'admin', label: 'Admin View' },
      ],
    };

    return roleTabs[selectedRole] || [{ id: 'overview', label: 'Overview' }];
  }, [selectedRole, user]);

  useEffect(() => {
    if (tabs.length && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const handleBasicProfileUpdate = async (payload) => {
    try {
      setSavingProfile(true);
      const response = await fetch(SummaryApi.updateUser.url, {
        method: SummaryApi.updateUser.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          name: payload.name,
          email: payload.email,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || 'Failed to update profile');
        return;
      }

      setUser((prev) => ({
        ...prev,
        name: payload.name,
        email: payload.email,
      }));
      toast.success('Profile updated successfully');
      setOpenEditProfile(false);
    } catch (error) {
      console.error(error);
      toast.error('Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const workspaceSummary = allData.summary || null;

  const sortedOrders = useMemo(() => {
    return [...allData.orders].sort((left, right) => {
      const priorityDiff = getOrderSortPriority(left) - getOrderSortPriority(right);
      if (priorityDiff !== 0) return priorityDiff;
      return getTimestamp(right.updatedAt || right.createdAt) - getTimestamp(left.updatedAt || left.createdAt);
    });
  }, [allData.orders]);

  const sortedUpdates = useMemo(() => {
    return [...allData.updates].sort((left, right) => {
      const priorityDiff = getUpdateSortPriority(left) - getUpdateSortPriority(right);
      if (priorityDiff !== 0) return priorityDiff;
      return getTimestamp(right.updatedAt || right.createdAt || right.completedAt) - getTimestamp(left.updatedAt || left.createdAt || left.completedAt);
    });
  }, [allData.updates]);

  const renderStatusChip = (value, palette = {}) => {
    const cls = palette[value] || 'bg-slate-100 text-slate-700';
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
        {value || 'N/A'}
      </span>
    );
  };

  const getItemActivityState = (moduleKey, itemId) => {
    const match = getModuleItems(activityCounts, moduleKey).find((item) => item.id === String(itemId));
    return match?.state || 'clear';
  };

  const renderActivityDot = (moduleKey, itemId) => {
    const state = getItemActivityState(moduleKey, itemId);
    if (state === 'attention') return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />;
    if (state === 'inProgress') return <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />;
    return null;
  };

  const OverviewTab = () => {
    const activeProjects = workspaceSummary?.activeProjects || [];
    const activeUpdatePlans = workspaceSummary?.activeUpdatePlans || [];
    const totalOrders = workspaceSummary?.counts?.orders ?? allData.orders.length;
    const activeProjectsCount = workspaceSummary?.counts?.activeProjects ?? activeProjects.length ?? 0;
    const completedProjectsCount = workspaceSummary?.counts?.completedProjects ?? 0;
    const completedUpdatesCount = workspaceSummary?.counts?.completedUpdates ?? 0;
    const activePlan = activeUpdatePlans[0] || workspaceSummary?.activePlan || null;

    const getPlanValidityLabel = (plan) => {
      if (!plan) return 'N/A';
      if (plan.validityDays !== null && plan.validityDays !== undefined) {
        return `${plan.validityDays} day${Number(plan.validityDays) === 1 ? '' : 's'} left`;
      }
      if (plan.expiryDate) {
        return `Until ${formatDate(plan.expiryDate)}`;
      }
      return 'Validity unavailable';
    };

    const getProjectStatusLabel = (project) => {
      if (!project) return 'In Progress';
      if (project.state === 'attention') return 'Pending Approval';
      if (project.state === 'blocked') return 'Blocked';
      if (project.state === 'completed') return 'Completed';
      return 'In Progress';
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setActiveTab('orders')}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-400 cursor-pointer"
          >
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalOrders}</p>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-400 cursor-pointer"
          >
            <p className="text-sm text-slate-500">Active Projects</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{activeProjectsCount}</p>
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Active Plans</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{activeUpdatePlans.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {completedProjectsCount} projects, {completedUpdatesCount} updates
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {activeProjects.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Active Projects</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeProjectsCount > 0
                      ? `${activeProjectsCount} active project${activeProjectsCount === 1 ? '' : 's'}`
                      : 'No active projects'}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Click to open details</p>
              </div>

              <div className="mt-5 grid gap-4">
                {activeProjects.map((project) => {
                  const linkedOrder = allData.orders.find((order) => String(order._id) === project.id) || null;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProject(linkedOrder)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
                            {getProjectStatusLabel(project)}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-slate-900">{project.title}</h4>
                          <p className="mt-1 text-sm text-slate-600">
                            {project.phase ? `Phase: ${project.phase}` : 'Current phase unavailable'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{project.progress || 0}%</p>
                          <p className="text-xs text-slate-500">{formatDate(project.updatedAt)}</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(Number(project.progress || 0), 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeUpdatePlans.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Active Update Plans</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeUpdatePlans.length > 0
                      ? `${activeUpdatePlans.length} active update plan${activeUpdatePlans.length === 1 ? '' : 's'}`
                      : 'No active update plans'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {activeUpdatePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wide text-violet-600">
                          Update Plan
                        </p>
                        <h5 className="mt-2 text-lg font-semibold text-slate-900">{plan.title}</h5>
                        <p className="mt-1 text-sm text-slate-600 capitalize">{plan.status || 'active'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {plan.validityDays !== null && plan.validityDays !== undefined
                            ? `${plan.validityDays} day${Number(plan.validityDays) === 1 ? '' : 's'} left`
                            : plan.expiryDate
                              ? `Until ${formatDate(plan.expiryDate)}`
                              : 'Validity unavailable'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {plan.remainingUpdates !== null && plan.remainingUpdates !== undefined
                            ? `${plan.remainingUpdates} remaining`
                            : 'Remaining unavailable'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {plan.totalUpdates !== null && plan.totalUpdates !== undefined ? plan.totalUpdates : 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Consumed</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{plan.consumedUpdates || 0}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Remaining</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {plan.remainingUpdates !== null && plan.remainingUpdates !== undefined
                            ? plan.remainingUpdates
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    );
  };

  const OrdersTab = () => {
    const getOrderDisplayStatus = (order) => {
      if (order.orderVisibility === 'pending-approval') return 'Processing';
      if (order.orderVisibility === 'payment-rejected') return 'Rejected';
      if ((order.projectProgress || 0) >= 100 || order.currentPhase === 'completed') return 'Completed';
      return 'In Progress';
    };

    const getProgressPercent = (order) => {
      const isWebsiteUpdate = order.productId?.category?.toLowerCase() === 'website_updates';
      if (isWebsiteUpdate) {
        const total = order.productId?.updateCount || 0;
        const consumed = order.updatesUsed || 0;
        return total > 0 ? Math.round((consumed / total) * 100) : 0;
      }
      return order.projectProgress || 0;
    };

    const getProgressLabel = (order) => {
      const isWebsiteUpdate = order.productId?.category?.toLowerCase() === 'website_updates';
      if (isWebsiteUpdate) {
        const consumed = order.updatesUsed || 0;
        const total = order.productId?.updateCount || 0;
        return `${consumed}/${total} updates`;
      }
      return `${order.projectProgress || 0}%`;
    };

    const getTotalBenefit = (order) => {
      const isWebsiteUpdate = order.productId?.category?.toLowerCase() === 'website_updates';
      if (isWebsiteUpdate) {
        return order.productId?.updateCount || 'N/A';
      }
      return order.productId?.totalPages || 'N/A';
    };

    const getExpiryDate = (order) => {
      const isWebsiteUpdate = order.productId?.category?.toLowerCase() === 'website_updates';
      if (isWebsiteUpdate) {
        const expiryDate = order.currentMonthExpiryDate || order.monthlyLimitResetDate;
        return expiryDate ? formatDate(expiryDate) : 'N/A';
      }
      return order.expectedCompletionDate ? formatDate(order.expectedCompletionDate) : 'N/A';
    };

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {allData.orders.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No orders found for this user</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Project / Plan</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Progress</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Purchase Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Expiry Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Total Benefit</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedOrders.map((order) => {
                  const displayStatus = getOrderDisplayStatus(order);
                  const progressPercent = getProgressPercent(order);
                  const progressLabel = getProgressLabel(order);
                  const totalBenefit = getTotalBenefit(order);
                  const expiryDate = getExpiryDate(order);

                  return (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedProject(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedProject(order);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{order.productId?.serviceName || 'N/A'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            <span className="inline-flex items-center gap-1">
                              {renderActivityDot('orders', order._id)}
                              Order: {order._id?.slice(-8)}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusChip(displayStatus, {
                          Processing: 'bg-amber-100 text-amber-800',
                          Rejected: 'bg-rose-100 text-rose-800',
                          Completed: 'bg-emerald-100 text-emerald-800',
                          'In Progress': 'bg-blue-100 text-blue-800',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{progressLabel}</p>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-700">{expiryDate}</td>
                      <td className="px-6 py-4 text-slate-700">{totalBenefit}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(order.totalPrice || order.price || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const RenewalsTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {allData.renewals.length === 0 ? (
        <div className="p-6 text-center text-slate-500">No renewals found for this user</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Renewal ID</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Plan</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allData.renewals.map((renewal) => (
                <tr key={renewal._id}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      {renderActivityDot('renewals', renewal._id)}
                      <span>{renewal._id?.slice(-8)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">{renewal.planDetails?.planName || 'N/A'}</td>
                  <td className="px-6 py-4">{formatCurrency(renewal.amount || 0)}</td>
                  <td className="px-6 py-4">
                    {renderStatusChip(renewal.status, {
                      pending: 'bg-amber-100 text-amber-800',
                      approved: 'bg-emerald-100 text-emerald-800',
                      rejected: 'bg-rose-100 text-rose-800',
                    })}
                  </td>
                  <td className="px-6 py-4">{formatDate(renewal.submittedAt || renewal.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const PaymentsTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {allData.transactions.length === 0 ? (
        <div className="p-6 text-center text-slate-500">No transactions found for this user</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allData.transactions.map((transaction) => {
                const displayStatus = transaction.paymentStatus || transaction.status || 'unknown';
                return (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        {renderActivityDot('payments', transaction._id)}
                        <span>{formatDate(transaction.date || transaction.createdAt)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">{transaction.type || 'N/A'}</td>
                    <td className="px-6 py-4">{formatCurrency(transaction.amount || 0)}</td>
                    <td className="px-6 py-4">
                      {renderStatusChip(displayStatus, {
                        pending: 'bg-amber-100 text-amber-800',
                        'pending-approval': 'bg-amber-100 text-amber-800',
                        completed: 'bg-emerald-100 text-emerald-800',
                        approved: 'bg-emerald-100 text-emerald-800',
                        rejected: 'bg-rose-100 text-rose-800',
                      })}
                    </td>
                    <td className="px-6 py-4">{transaction.paymentMethod || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const InvoicesTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {allData.invoices.length === 0 ? (
        <div className="p-6 text-center text-slate-500">No invoices found for this user</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Invoice #</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Due Date</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allData.invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      {renderActivityDot('invoices', invoice._id)}
                      <span>{invoice.invoiceNumber || invoice._id?.slice(-8)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(invoice.amount || 0)}</td>
                  <td className="px-6 py-4">
                    {renderStatusChip(invoice.status, {
                      paid: 'bg-emerald-100 text-emerald-800',
                      unpaid: 'bg-amber-100 text-amber-800',
                      overdue: 'bg-rose-100 text-rose-800',
                    })}
                  </td>
                  <td className="px-6 py-4">{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4">{formatDate(invoice.invoiceDate || invoice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const UpdatesTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {allData.updates.length === 0 ? (
        <div className="p-6 text-center text-slate-500">No update requests found for this user</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Update ID</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Plan</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Assigned Dev</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUpdates.map((update) => (
                <tr
                  key={update._id}
                  onClick={() => setSelectedUpdateRequest(update)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      {renderActivityDot('updates', update._id)}
                      <span>{update._id?.slice(-8)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">{update.updatePlanId?.productId?.serviceName || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {renderStatusChip(update.status, {
                      pending: 'bg-amber-100 text-amber-800',
                      in_progress: 'bg-blue-100 text-blue-800',
                      completed: 'bg-emerald-100 text-emerald-800',
                      rejected: 'bg-rose-100 text-rose-800',
                    })}
                  </td>
                  <td className="px-6 py-4">{update.assignedDeveloper?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4">{formatDate(update.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const ClosureTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {allData.plans.length === 0 ? (
        <div className="p-6 text-center text-slate-500">No plans found for this user</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Plan ID</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Product</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Updates Used</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allData.plans.map((plan) => (
                <tr key={plan._id}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      {renderActivityDot('closure', plan._id)}
                      <span>{plan._id?.slice(-8)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">{plan.productId?.serviceName || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {renderStatusChip(plan.planStatus || 'active', {
                      active: 'bg-emerald-100 text-emerald-800',
                      closed: 'bg-slate-100 text-slate-700',
                    })}
                  </td>
                  <td className="px-6 py-4">{plan.updatesUsed || 0}</td>
                  <td className="px-6 py-4">{formatDate(plan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const DeveloperTab = () => (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Developer Profile</h3>
          {developerProfile && (
            <button
              type="button"
              onClick={() => setOpenEditDeveloper(true)}
              className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Edit Developer Profile
            </button>
          )}
        </div>

        {developerProfile ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Employee ID</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{developerProfile.employeeId || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{developerProfile.status || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{developerProfile.department || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Designation</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{developerProfile.designation || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            This user has the developer role, but no linked developer profile was found yet.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Developer Activity Snapshot</h3>
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Update Requests</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {allData.updates.filter((update) => update.assignedDeveloper?.email === user?.email).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role Combination</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{(user?.roles || []).join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const DeveloperAssignedWorkTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Projects</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{developerAssignedProjects.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Update Requests</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{developerAssignedUpdates.length}</p>
        </div>
      </div>

      {loadingDeveloperWork ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
          Loading assigned work...
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Assigned Projects</h3>
            </div>
            {developerAssignedProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No projects are assigned to this developer</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Project</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Progress</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Ordered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {developerAssignedProjects.map((project) => (
                      <tr
                        key={project._id}
                        onClick={() => setSelectedProject(project)}
                        className="cursor-pointer transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">{project.productId?.serviceName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600">{project.userId?.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {renderStatusChip(
                            project.orderVisibility === 'pending-approval'
                              ? 'Processing'
                              : project.orderVisibility === 'payment-rejected'
                                ? 'Rejected'
                                : (project.projectProgress || 0) >= 100
                                  ? 'Completed'
                                  : 'In Progress',
                            {
                              Processing: 'bg-amber-100 text-amber-800',
                              Rejected: 'bg-rose-100 text-rose-800',
                              Completed: 'bg-emerald-100 text-emerald-800',
                              'In Progress': 'bg-blue-100 text-blue-800',
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{project.projectProgress || 0}%</td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(project.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Assigned Update Requests</h3>
            </div>
            {developerAssignedUpdates.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No update requests are assigned to this developer</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Plan</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {developerAssignedUpdates.map((update) => (
                      <tr
                        key={update._id}
                        onClick={() => setSelectedUpdateRequest(update)}
                        className="cursor-pointer transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">{update.updatePlanId?.productId?.serviceName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600">{update.userId?.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {renderStatusChip(update.status, {
                            pending: 'bg-amber-100 text-amber-800',
                            in_progress: 'bg-blue-100 text-blue-800',
                            completed: 'bg-emerald-100 text-emerald-800',
                            rejected: 'bg-rose-100 text-rose-800',
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(update.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const GenericRolePanel = ({ title, description }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );

  if (loadingUser) {
    return <div className="p-6 text-center text-slate-600">Loading user workspace...</div>;
  }

  const refreshWorkspaceProject = async (projectId) => {
    const latestData = await loadWorkspaceData();
    const nextProject = latestData?.orders?.find((order) => order._id === projectId) || null;
    if (nextProject) {
      setSelectedProject(nextProject);
    }
    return nextProject;
  };

  const refreshWorkspaceUpdateRequest = async (requestId) => {
    const latestData = await loadWorkspaceData();
    const nextRequest = latestData?.updates?.find((update) => update._id === requestId) || null;
    if (nextRequest) {
      setSelectedUpdateRequest(nextRequest);
    }
    return nextRequest;
  };

  if (!user) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="text-slate-500" size={32} />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(user.roles || []).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                        selectedRole === role
                          ? `${roleTheme[role] || 'bg-slate-100 text-slate-700'} border-transparent ring-2 ring-offset-1 ring-slate-300`
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2"><Mail size={16} /> {user.email}</span>
                  <span className="inline-flex items-center gap-2"><Phone size={16} /> {user.phone || 'N/A'}</span>
                  <span className="inline-flex items-center gap-2"><Shield size={16} /> {user.status || 'Active'}</span>
                  {selectedRole === 'customer' && hasClientUnreadActivity(activityCounts) && (
                    <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getBadgeClasses(getClientBadgeState(activityCounts))}`}>
                      {getClientActiveCount(activityCounts)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpenEditProfile(true)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setOpenRoleModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Manage Access
              </button>
              {user.roles?.includes('developer') && developerProfile && (
                <button
                  type="button"
                  onClick={() => setOpenEditDeveloper(true)}
                  className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  Edit Developer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              >
              <span className="inline-flex items-center gap-2">
                <span>{tab.label}</span>
                {hasModuleUnreadActivity(activityCounts, tab.id) && (
                  <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getBadgeClasses(getModuleBadgeState(activityCounts, tab.id))}`}>
                    {getModuleCount(activityCounts, tab.id)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {loadingData ? (
            <div className="py-8 text-center text-slate-500">Loading workspace modules...</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'renewals' && <RenewalsTab />}
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'invoices' && <InvoicesTab />}
              {activeTab === 'updates' && <UpdatesTab />}
              {activeTab === 'closure' && <ClosureTab />}
              {activeTab === 'developer' && <DeveloperTab />}
              {activeTab === 'assigned-work' && <DeveloperAssignedWorkTab />}
              {activeTab === 'partner' && (
                <GenericRolePanel
                  title="Partner Role View"
                  description="This user also holds the partner role. In this phase, the workspace shell surfaces partner-role visibility clearly so the same user does not need to be managed across multiple screens. Existing partner workflows remain unchanged."
                />
              )}
              {activeTab === 'manager' && (
                <GenericRolePanel
                  title="Manager Role View"
                  description="This user is available with the manager role. The unified shell now exposes manager access visibility on the same user page without removing the existing management screens."
                />
              )}
              {activeTab === 'admin' && (
                <GenericRolePanel
                  title="Admin Role View"
                  description="This user is available with the admin role. The current objective of this unified page is to provide role visibility and a common management shell, while the existing admin business screens continue to run in parallel."
                />
              )}
            </>
          )}
        </div>
      </div>

      {openRoleModal && (
        <AddRoleToUserModal
          userId={user._id}
          onClose={() => setOpenRoleModal(false)}
          callFunc={loadUserDetails}
        />
      )}

      {openEditProfile && (
        <EditUserBasicModal
          user={user}
          loading={savingProfile}
          onClose={() => setOpenEditProfile(false)}
          onSubmit={handleBasicProfileUpdate}
        />
      )}

      {openEditDeveloper && developerProfile && (
        <EditDeveloper
          developerData={developerProfile}
          fetchData={loadUserDetails}
          onClose={() => setOpenEditDeveloper(false)}
        />
      )}

      {selectedProject && (
        <ProjectWorkspaceModal
          project={selectedProject}
          developers={developers}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={refreshWorkspaceProject}
          isReadOnly={(selectedProject?.projectProgress || 0) >= 100 || selectedProject?.currentPhase === 'completed' || selectedProject?.orderVisibility === 'payment-rejected'}
        />
      )}

      {selectedUpdateRequest && (
        <UpdateRequestWorkspaceModal
          request={selectedUpdateRequest}
          developers={developers}
          onClose={() => setSelectedUpdateRequest(null)}
          onRequestUpdated={refreshWorkspaceUpdateRequest}
        />
      )}
    </div>
  );
};

export default UserWorkspace;
