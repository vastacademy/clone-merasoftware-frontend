import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  FileText,
  Grid2x2,
  Layers3,
  ShieldCheck,
  Wallet,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";

const tabs = [
  { id: "overview", label: "Overview", active: true },
  { id: "projects", label: "Projects", active: true },
  { id: "plans", label: "Plans", active: true },
];

const safeDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const parsed = safeDateTime(value);
  return parsed ? parsed.toLocaleDateString("en-IN") : "N/A";
};

const formatDateTime = (value) => {
  const parsed = safeDateTime(value);
  return parsed ? parsed.toLocaleString("en-IN") : "N/A";
};

const isWebsiteUpdateOrder = (order) =>
  Boolean(order?.productId?.isWebsiteUpdate || order?.productId?.category?.toLowerCase() === "website_updates");

const isCompletedOrder = (order) =>
  (order?.projectProgress || 0) >= 100 ||
  order?.currentPhase === "completed" ||
  order?.status === "completed";

const isRejectedOrder = (order) =>
  order?.orderVisibility === "payment-rejected" ||
  order?.status === "rejected" ||
  order?.status === "cancelled" ||
  order?.status === "canceled";

const isPendingOrder = (order) =>
  order?.orderVisibility === "pending-approval" ||
  order?.status === "pending";

const isActiveOrder = (order) =>
  !isPendingOrder(order) && !isRejectedOrder(order) && !isCompletedOrder(order);

const getProjectSortRank = (order) => {
  if (isCompletedOrder(order)) return 3;
  if (isPendingOrder(order)) return 1;
  if (isRejectedOrder(order)) return 2;
  return 0;
};

const getPlanSortRank = (plan) => {
  if (getPlanDisplayStatus(plan) === "Completed") return 3;
  if (getPlanDisplayStatus(plan) === "Expired" || getPlanDisplayStatus(plan) === "Inactive") return 2;
  return 0;
};

const sortWorkspaceItem = (a, b, getRank) => {
  const rankDiff = getRank(a) - getRank(b);
  if (rankDiff !== 0) return rankDiff;
  return (safeDateTime(b?.updatedAt || b?.createdAt)?.getTime() || 0) - (safeDateTime(a?.updatedAt || a?.createdAt)?.getTime() || 0);
};

const getProjectDisplayStatus = (order) => {
  if (order?.orderVisibility === "pending-approval" || order?.status === "pending") return "Processing";
  if (order?.orderVisibility === "payment-rejected" || ["rejected", "cancelled", "canceled"].includes(order?.status)) {
    return "Rejected";
  }
  if ((order?.projectProgress || 0) >= 100 || order?.currentPhase === "completed" || order?.status === "completed") {
    return "Completed";
  }
  return "In Progress";
};

const getPlanTypeLabel = (plan) => {
  if (plan?.productId?.isMonthlyRenewablePlan) return "Monthly Renewable Plan";
  if (plan?.productId?.isMonthlyLimitedPlan) return "Monthly Limited Plan";
  if (plan?.productId?.isUnlimitedUpdates) return "Unlimited Update Plan";
  return "Website Update Plan";
};

const getPlanDisplayStatus = (plan) => {
  const expiryDate = safeDateTime(plan?.currentMonthExpiryDate);
  const expired = plan?.autoRenewalStatus === "expired" || Boolean(expiryDate && expiryDate.getTime() < Date.now());

  if (plan?.isActive === false || ["cancelled", "canceled", "rejected", "hidden"].includes(plan?.status)) {
    return "Inactive";
  }

  if (expired) return "Expired";
  return "Active";
};

const getBadgeClassName = (label) => {
  switch ((label || "").toLowerCase()) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "inactive":
      return "bg-slate-100 text-slate-700";
    case "expired":
      return "bg-rose-100 text-rose-800";
    case "processing":
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "in progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const toComparableId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const isSameId = (value, targetId) => {
  const comparable = toComparableId(value);
  return Boolean(comparable && targetId && comparable === String(targetId));
};

const AdminClientWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.user);
  const { isOnline } = useOnlineStatus();
  const [activeTab, setActiveTab] = useState("overview");
  const [customerLoading, setCustomerLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [customer, setCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [activeProjectLoading, setActiveProjectLoading] = useState(false);
  const [activeProjectError, setActiveProjectError] = useState("");
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [activePlanLoading, setActivePlanLoading] = useState(false);
  const [activePlanError, setActivePlanError] = useState("");
  const [allData, setAllData] = useState({
    orders: [],
    renewals: [],
    transactions: [],
    invoices: [],
    updates: [],
    plans: [],
    summary: null,
  });

  const fallbackClient = location.state?.client ?? null;
  const client = customer || fallbackClient;
  const clientName = client?.name || "Client";
  const clientEmail = client?.email || "No email available";
  const clientStatus = client?.status || "Active";
  const createdAt = formatDate(client?.createdAt);
  const lastUpdatedAt = formatDateTime(client?.updatedAt || client?.lastUpdated || client?.createdAt);

  const handleRequestDelete = (item) => {
    setDeleteTarget(item);
  };

  const handleOpenProject = (project) => {
    if (!project?._id) return;
    setActiveProjectId(project._id);
    setActiveProject(project);
    setActiveProjectError("");
    setActiveTab("projects");
    setActivePlanId(null);
    setActivePlan(null);
    setActivePlanError("");
    setActivePlanLoading(false);
  };

  const handleBackToProjects = () => {
    setActiveProjectId(null);
    setActiveProject(null);
    setActiveProjectError("");
    setActiveProjectLoading(false);
  };

  const handleOpenPlan = (plan) => {
    if (!plan?._id) return;
    setActivePlanId(plan._id);
    setActivePlan(plan);
    setActivePlanError("");
    setActiveTab("plans");
    setActiveProjectId(null);
    setActiveProject(null);
    setActiveProjectError("");
    setActiveProjectLoading(false);
  };

  const handleBackToPlans = () => {
    setActivePlanId(null);
    setActivePlan(null);
    setActivePlanError("");
    setActivePlanLoading(false);
  };

  const removeOrderFromWorkspace = (orderId) => {
    setAllData((prev) => {
      const filteredOrders = prev.orders.filter((order) => !isSameId(order?._id, orderId));
      const filteredTransactions = prev.transactions.filter((transaction) => !isSameId(transaction?.orderId, orderId));
      const filteredInvoices = prev.invoices.filter((invoice) => !isSameId(invoice?.orderId, orderId));
      const filteredUpdates = prev.updates.filter((update) => !isSameId(update?.updatePlanId, orderId));
      const filteredRenewals = prev.renewals.filter((renewal) => !isSameId(renewal?.orderId, orderId) && !isSameId(renewal?.planId, orderId));

      return {
        ...prev,
        orders: filteredOrders,
        transactions: filteredTransactions,
        invoices: filteredInvoices,
        updates: filteredUpdates,
        renewals: filteredRenewals,
        summary: null,
      };
    });
  };

  useEffect(() => {
    if (!activeProjectId) return;

    let isMounted = true;

    const loadProjectDetails = async () => {
      try {
        setActiveProjectLoading(true);
        setActiveProjectError("");

        const response = await fetch(`${SummaryApi.orderDetails.url}/${activeProjectId}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load project details");
        }

        if (isMounted) {
          setActiveProject(result.data || null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading project details:", error);
        setActiveProjectError(error.message || "Failed to load project details");
      } finally {
        if (isMounted) {
          setActiveProjectLoading(false);
        }
      }
    };

    loadProjectDetails();

    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (!activePlanId) return;

    let isMounted = true;

    const loadPlanDetails = async () => {
      try {
        setActivePlanLoading(true);
        setActivePlanError("");

        const response = await fetch(`${SummaryApi.orderDetails.url}/${activePlanId}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load plan details");
        }

        if (isMounted) {
          setActivePlan(result.data || null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading plan details:", error);
        setActivePlanError(error.message || "Failed to load plan details");
      } finally {
        if (isMounted) {
          setActivePlanLoading(false);
        }
      }
    };

    loadPlanDetails();

    return () => {
      isMounted = false;
    };
  }, [activePlanId]);

  useEffect(() => {
    if (activeTab !== "projects" && activeProjectId) {
      setActiveProjectId(null);
      setActiveProject(null);
      setActiveProjectError("");
      setActiveProjectLoading(false);
    }
  }, [activeTab, activeProjectId]);

  useEffect(() => {
    if (activeTab !== "plans" && activePlanId) {
      setActivePlanId(null);
      setActivePlan(null);
      setActivePlanError("");
      setActivePlanLoading(false);
    }
  }, [activeTab, activePlanId]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;

    const orderId = deleteTarget._id;
    setDeletingOrderId(orderId);

    try {
      const response = await fetch(`${SummaryApi.adminDeleteOrder.url}/${orderId}`, {
        method: SummaryApi.adminDeleteOrder.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete project");
      }

      removeOrderFromWorkspace(orderId);
      if (activeProjectId === orderId) {
        handleBackToProjects();
      }
      if (activePlanId === orderId) {
        handleBackToPlans();
      }
      toast.success(result.message || "Project deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeletingOrderId(null);
    }
  };

  useEffect(() => {
    if (!customerId) return;

    const loadWorkspace = async () => {
      try {
        setCustomerLoading(true);
        setDataLoading(true);
        setFetchError("");

        const response = await fetch(`${SummaryApi.adminUserWorkspace.url}?customerId=${customerId}`, {
          method: SummaryApi.adminUserWorkspace.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const workspaceResult = await response.json();
        if (!workspaceResult.success) {
          throw new Error(workspaceResult.message || "Failed to load customer workspace");
        }

        const workspaceData = workspaceResult.data || {};
        const fetchedCustomer = workspaceData.customer || fallbackClient;

        setCustomer(fetchedCustomer || null);
        setAllData({
          orders: workspaceData.orders || [],
          renewals: workspaceData.renewals || [],
          transactions: workspaceData.transactions || [],
          invoices: workspaceData.invoices || [],
          updates: workspaceData.updates || [],
          plans: workspaceData.plans || [],
          summary: workspaceData.summary || null,
        });
        setActiveProject(null);
        setActiveProjectId(null);
        setActiveProjectError("");
        setActivePlan(null);
        setActivePlanId(null);
        setActivePlanError("");
      } catch (error) {
        console.error("Error loading admin client workspace:", error);
        setFetchError("Failed to load customer data");
      } finally {
        setCustomerLoading(false);
        setDataLoading(false);
      }
    };

    loadWorkspace();
  }, [customerId, fallbackClient]);

  const projectOrders = useMemo(
    () => allData.orders.filter((order) => !isWebsiteUpdateOrder(order)).slice().sort((a, b) => sortWorkspaceItem(a, b, getProjectSortRank)),
    [allData.orders]
  );

  const planOrders = useMemo(
    () => allData.orders.filter((order) => isWebsiteUpdateOrder(order)).slice().sort((a, b) => sortWorkspaceItem(a, b, getPlanSortRank)),
    [allData.orders]
  );

  const cards = useMemo(() => {
    const activeOrders = projectOrders.filter(isActiveOrder);
    const pendingOrders = projectOrders.filter(isPendingOrder);
    const completedOrders = projectOrders.filter(isCompletedOrder);
    const rejectedOrders = projectOrders.filter(isRejectedOrder);
    const activePlans = planOrders.filter((plan) => getPlanDisplayStatus(plan) === "Active");
    const walletBalance = Number(allData.summary?.walletBalance ?? client?.walletBalance ?? 0);

    return [
      {
        id: "total",
        label: "Total Services / Products",
        value: allData.orders.length,
        helper: "All assigned customer orders",
        icon: Layers3,
      },
      {
        id: "active",
        label: "Active",
        value: activeOrders.length,
        helper: "In-progress items",
        icon: BadgeCheck,
      },
      {
        id: "pending",
        label: "Pending",
        value: pendingOrders.length,
        helper: "Awaiting approval",
        icon: Clock3,
      },
      {
        id: "completed",
        label: "Completed",
        value: completedOrders.length,
        helper: "Fully delivered items",
        icon: Grid2x2,
      },
      {
        id: "rejected",
        label: "Rejected / Cancelled",
        value: rejectedOrders.length,
        helper: "Stopped or cancelled items",
        icon: ShieldCheck,
      },
      {
        id: "balance",
        label: "Wallet Balance",
        value: `₹${walletBalance.toLocaleString("en-IN")}`,
        helper: "Customer wallet amount",
        icon: Wallet,
      },
      {
        id: "plans",
        label: "Active Plans",
        value: activePlans.length,
        helper: "Currently usable update plans",
        icon: FileText,
      },
      {
        id: "issues",
        label: "Pending Updates",
        value: allData.summary?.pendingUpdates ?? allData.updates.filter((update) => update?.status === "pending").length,
        helper: "Update requests waiting",
        icon: AlertCircle,
      },
    ];
  }, [
    allData.orders,
    allData.summary,
    allData.updates,
    client,
    projectOrders,
    planOrders,
  ]);

  const handleLogout = async () => {
    try {
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: "include",
        });

        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
        }
      }

      CookieManager.clearAll();
      StorageService.clearUserData();

      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <AdminLayout
      user={user}
      onLogout={handleLogout}
      mobileTitle="Client Workspace"
      mobileSubtitle={clientName}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} />
                  Admin Client Workspace
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {clientName}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{clientEmail}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoPill label="Client ID" value={customerId || client?._id || "N/A"} />
              <InfoPill label="Status" value={clientStatus} />
              <InfoPill label="Joined" value={createdAt} />
            </div>

            {customerLoading ? (
              <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                Loading customer profile...
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={[
                  "inline-flex min-w-[132px] cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Overview</h2>
              <p className="mt-1 text-sm text-slate-500">
                SSOT customer data loaded from the existing backend APIs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">{card.label}</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
                        <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                        <Icon size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Data Snapshot</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Orders: {allData.orders.length} | Invoices: {allData.invoices.length} | Update Requests: {allData.updates.length}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  {dataLoading ? "Loading latest workspace data..." : "Latest customer data loaded"}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "projects" && (
          <section className="space-y-5">
            {activeProject ? (
              <WorkspaceDetailSubpage
                item={activeProject}
                loading={activeProjectLoading}
                error={activeProjectError}
                onBack={handleBackToProjects}
                onDelete={handleRequestDelete}
                deletingOrderId={deletingOrderId}
                getStatusLabel={getProjectDisplayStatus}
                getBadgeClassName={getBadgeClassName}
                formatDateTime={formatDateTime}
                backLabel="Back to Projects"
                detailLabel="Project"
                notesText="This is the workspace subpage version for projects. It stays inside the same client workspace, and the back button returns to the projects list without leaving the page."
                summaryTitle="Project progress snapshot"
              />
            ) : (
              <CompactWorkspaceCard
                title="Projects"
                subtitle={`Auto-sorted by activity. Latest active records stay on top and completed records stay at the end. Last updated: ${lastUpdatedAt}`}
                items={projectOrders}
                emptyText="No projects found for this client."
                onRowClick={handleOpenProject}
                onDelete={handleRequestDelete}
                deletingOrderId={deletingOrderId}
                renderMeta={(order) => [
                  `Order ID: ${order._id?.slice(-8) || "N/A"}`,
                  `Category: ${order.productId?.category || "N/A"}`,
                  `Phase: ${order.currentPhase || "N/A"}`,
                  `Progress: ${order.projectProgress || 0}%`,
                ]}
                renderRight={(order) => (
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getBadgeClassName(getProjectDisplayStatus(order)),
                      ].join(" ")}
                    >
                      {getProjectDisplayStatus(order)}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(order.updatedAt || order.createdAt)}</span>
                  </div>
                )}
              />
            )}
          </section>
        )}

        {activeTab === "plans" && (
          <section className="space-y-5">
            {activePlan ? (
              <WorkspaceDetailSubpage
                item={activePlan}
                loading={activePlanLoading}
                error={activePlanError}
                onBack={handleBackToPlans}
                onDelete={handleRequestDelete}
                deletingOrderId={deletingOrderId}
                getStatusLabel={getPlanDisplayStatus}
                getBadgeClassName={getBadgeClassName}
                formatDateTime={formatDateTime}
                backLabel="Back to Plans"
                detailLabel="Plan"
                notesText="This is the workspace subpage version for plans. It stays inside the same client workspace, and the back button returns to the plans list without leaving the page."
                summaryTitle="Plan activity snapshot"
              />
            ) : (
              <CompactWorkspaceCard
                title="Plans"
                subtitle={`Auto-sorted by activity. Latest active records stay on top and completed records stay at the end. Total plan records: ${planOrders.length}`}
                items={planOrders}
                emptyText="No plans found for this client."
                onRowClick={handleOpenPlan}
                onDelete={handleRequestDelete}
                deletingOrderId={deletingOrderId}
                renderMeta={(plan) => [
                  `Plan ID: ${plan._id?.slice(-8) || "N/A"}`,
                  `Type: ${getPlanTypeLabel(plan)}`,
                  `Usage: ${
                    plan.productId?.isMonthlyRenewablePlan || plan.productId?.isMonthlyLimitedPlan
                      ? `${plan.currentMonthUpdatesUsed || 0} used / ${plan.currentMonthUpdatesRemaining ?? "N/A"} remaining`
                      : `${plan.updatesUsed || 0} updates used`
                  }`,
                ]}
                renderRight={(plan) => (
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getBadgeClassName(getPlanDisplayStatus(plan)),
                      ].join(" ")}
                    >
                      {getPlanDisplayStatus(plan)}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(plan.updatedAt || plan.createdAt)}</span>
                  </div>
                )}
              />
            )}
          </section>
        )}

        {fetchError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </div>
        ) : null}

        {deleteTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">Delete project permanently?</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    This will remove the project from admin and customer views and permanently delete all linked database records for this project.
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{deleteTarget.productId?.serviceName || "Project"}</p>
                    <p className="mt-1">Project ID: {deleteTarget._id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close delete dialog"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={Boolean(deletingOrderId)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(deletingOrderId)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingOrderId ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

const CompactWorkspaceCard = ({ title, subtitle, items, emptyText, onRowClick, onDelete, deletingOrderId, renderMeta, renderRight }) => {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-500">{emptyText}</div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white">
            {items.map((item) => (
              <div
                key={item._id}
                role="button"
                tabIndex={0}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick?.(item);
                  }
                }}
                className="flex w-full cursor-pointer flex-col gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">{item.productId?.serviceName || "N/A"}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {renderMeta?.(item)?.map((meta) => (
                      <span key={meta}>{meta}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-start gap-3">
                  <div>{renderRight?.(item)}</div>
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(item);
                      }}
                      disabled={deletingOrderId === item._id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingOrderId === item._id ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkspaceDetailSubpage = ({
  item,
  loading,
  error,
  onBack,
  onDelete,
  deletingOrderId,
  getStatusLabel,
  getBadgeClassName,
  formatDateTime,
  backLabel,
  detailLabel,
  notesText,
  summaryTitle,
}) => {
  const itemStatus = getStatusLabel(item);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </button>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{item?.productId?.serviceName || `${detailLabel} Details`}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Subpage view for this {detailLabel.toLowerCase()}. Back returns to the list in the same workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={deletingOrderId === item?._id}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {deletingOrderId === item?._id ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          ) : (
            <Trash2 size={16} />
          )}
          Delete
        </button>
      </div>

      {loading ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Loading project details...
        </div>
      ) : error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoPill label="Order ID" value={item?._id || "N/A"} />
            <InfoPill label="Status" value={itemStatus} />
            <InfoPill label="Phase" value={item?.currentPhase || "N/A"} />
            <InfoPill label="Progress" value={`${item?.projectProgress || 0}%`} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Timeline</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{summaryTitle}</h3>
                </div>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    getBadgeClassName(itemStatus),
                  ].join(" ")}
                >
                  {itemStatus}
                </span>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">
                  Last updated: {formatDateTime(item?.updatedAt || item?.createdAt)}
                </p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(0, Math.min(100, item?.projectProgress || 0))}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item?.projectProgress || 0}% complete
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">{detailLabel} Info</p>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <InfoLine label="Category" value={item?.productId?.category || "N/A"} />
                <InfoLine label="Current Phase" value={item?.currentPhase || "N/A"} />
                <InfoLine label="Created" value={formatDateTime(item?.createdAt)} />
                <InfoLine label="Updated" value={formatDateTime(item?.updatedAt || item?.createdAt)} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Notes</p>
            <p className="mt-2 text-sm text-slate-600">
              {notesText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoLine = ({ label, value }) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
};

const InfoPill = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
};

export default AdminClientWorkspace;
