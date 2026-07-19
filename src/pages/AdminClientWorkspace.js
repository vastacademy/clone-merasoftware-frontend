import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";
import AdminInfoPill from "../components/admin/AdminInfoPill";
import AdminWorkspaceList from "../components/admin/AdminWorkspaceList";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import AdminWorkspaceTabs from "../components/admin/AdminWorkspaceTabs";
import AdminProjectCheckpointDetail from "../components/admin/AdminProjectCheckpointDetail";

const tabs = [
  { id: "overview", label: "Overview", active: true },
  { id: "projects", label: "Projects", active: true },
  { id: "plans", label: "Plans", active: true },
  { id: "payments", label: "Payment & Invoices", active: true },
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
    case "paid":
    case "verified":
      return "bg-emerald-100 text-emerald-800";
    case "unpaid":
      return "bg-amber-100 text-amber-800";
    case "overdue":
      return "bg-rose-100 text-rose-800";
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
    case "failed":
      return "bg-rose-100 text-rose-800";
    case "cancelled":
    case "canceled":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getPaymentStatusLabel = (transaction) => {
  if (!transaction?.status) return "N/A";
  return String(transaction.status).replace(/_/g, " ");
};

const getInvoiceStatusLabel = (invoice) => {
  if (!invoice?.status) return "N/A";
  return String(invoice.status).replace(/_/g, " ");
};

const getLedgerStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();
  if (["completed", "paid", "approved"].includes(normalizedStatus)) return "Paid";
  if (["pending", "pending-approval", "unpaid", "overdue"].includes(normalizedStatus)) return "Pending";
  if (["rejected", "failed", "cancelled", "canceled"].includes(normalizedStatus)) return "Rejected";
  return status ? String(status).replace(/_/g, " ") : "N/A";
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

const getCheckpointStatusLabel = (checkpoint) => {
  return checkpoint?.completed ? "Completed" : "Pending";
};

const getCheckpointSelectionKey = (checkpoint, index) => {
  if (checkpoint?.checkpointId !== undefined && checkpoint?.checkpointId !== null) {
    return `checkpoint-${checkpoint.checkpointId}`;
  }
  return `checkpoint-index-${checkpoint?.checkpointIndex ?? index}`;
};

const getCheckpointBadgeClass = (checkpoint) => {
  const label = getCheckpointStatusLabel(checkpoint).toLowerCase();
  if (label === "completed") return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
};

const AdminClientWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.user);
  const { isOnline } = useOnlineStatus();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [customerLoading, setCustomerLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [customer, setCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteScan, setDeleteScan] = useState(null);
  const [deleteScanLoading, setDeleteScanLoading] = useState(false);
  const [deleteSelections, setDeleteSelections] = useState({});
  const [deleteError, setDeleteError] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [activeProjectLoading, setActiveProjectLoading] = useState(false);
  const [activeProjectError, setActiveProjectError] = useState("");
  const [activeProjectRefreshKey, setActiveProjectRefreshKey] = useState(0);
  const [selectedProjectCheckpointId, setSelectedProjectCheckpointId] = useState(null);
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

  const resetDeleteFlow = () => {
    setDeleteTarget(null);
    setDeleteScan(null);
    setDeleteScanLoading(false);
    setDeleteSelections({});
    setDeleteError("");
  };

  const handleRequestDelete = async (item) => {
    if (!item?._id) return;

    setDeleteTarget(item);
    setDeleteScan(null);
    setDeleteSelections({});
    setDeleteError("");
    setDeleteScanLoading(true);

    try {
      const response = await fetch(`${SummaryApi.adminDeleteOrderScan.url}/${item._id}/scan`, {
        method: SummaryApi.adminDeleteOrderScan.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to scan project delete plan");
      }

      const scan = result.data || null;
      setDeleteScan(scan);

      const initialSelections = {};
      (scan?.sections || []).forEach((section) => {
        if (section.present) {
          initialSelections[section.key] = false;
        }
      });
      setDeleteSelections(initialSelections);
    } catch (error) {
      console.error("Error scanning delete plan:", error);
      setDeleteError(error.message || "Failed to scan project delete plan");
    } finally {
      setDeleteScanLoading(false);
    }
  };

  const handleOpenProject = (project) => {
    if (!project?._id) return;
    setActiveProjectId(project._id);
    setActiveProject(project);
    setActiveProjectError("");
    const checkpoints = project?.checkpoints || [];
    const initialCheckpointIndex = checkpoints.findIndex((checkpoint) => !checkpoint?.completed);
    const selectedIndex = initialCheckpointIndex >= 0 ? initialCheckpointIndex : checkpoints.length - 1;
    setSelectedProjectCheckpointId(
      selectedIndex >= 0 ? getCheckpointSelectionKey(checkpoints[selectedIndex], selectedIndex) : null
    );
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
    setSelectedProjectCheckpointId(null);
  };

  const handleSoftRefreshActiveProject = () => {
    setActiveProjectRefreshKey((current) => current + 1);
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

  const handleToggleDeleteSection = (sectionKey) => {
    setDeleteSelections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const removeOrderFromWorkspace = (orderId) => {
    setAllData((prev) => {
      const filteredOrders = prev.orders.filter((order) => !isSameId(order?._id, orderId));
      const filteredTransactions = prev.transactions.filter((transaction) => !isSameId(transaction?.orderId, orderId));
      const filteredInvoices = prev.invoices.filter((invoice) => !isSameId(invoice?.orderId, orderId));
      const filteredUpdates = prev.updates.filter((update) => !isSameId(update?.updatePlanId, orderId));
      const filteredRenewals = prev.renewals.filter((renewal) => !isSameId(renewal?.orderId, orderId) && !isSameId(renewal?.planId, orderId));
      const filteredPlans = prev.plans.filter((plan) => !isSameId(plan?._id, orderId));

      return {
        ...prev,
        orders: filteredOrders,
        transactions: filteredTransactions,
        invoices: filteredInvoices,
        updates: filteredUpdates,
        renewals: filteredRenewals,
        plans: filteredPlans,
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
  }, [activeProjectId, activeProjectRefreshKey]);

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
    const checkpoints = activeProject?.checkpoints || [];
    if (!checkpoints.length) return;

    const selectedExists = checkpoints.some(
      (checkpoint, index) => getCheckpointSelectionKey(checkpoint, index) === selectedProjectCheckpointId
    );
    if (selectedExists) return;

    const currentIndex = checkpoints.findIndex((checkpoint) => !checkpoint?.completed);
    const selectedIndex = currentIndex >= 0 ? currentIndex : checkpoints.length - 1;
    setSelectedProjectCheckpointId(
      selectedIndex >= 0 ? getCheckpointSelectionKey(checkpoints[selectedIndex], selectedIndex) : null
    );
  }, [activeProject, selectedProjectCheckpointId]);

  useEffect(() => {
    if (activeTab !== "projects" && activeProjectId) {
      setActiveProjectId(null);
      setActiveProject(null);
      setActiveProjectError("");
      setActiveProjectLoading(false);
      setSelectedProjectCheckpointId(null);
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
    if (!deleteTarget?._id || !deleteScan) return;

    const selectedSections = Object.entries(deleteSelections)
      .filter(([, isSelected]) => isSelected)
      .map(([sectionKey]) => sectionKey);

    const orderId = deleteTarget._id;
    setDeletingOrderId(orderId);

    try {
      const response = await fetch(`${SummaryApi.adminDeleteOrder.url}/${orderId}`, {
        method: SummaryApi.adminDeleteOrder.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedSections }),
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
      if (client?._id || customerId) {
        StorageService.clearUserOrders(client?._id || customerId);
      }
      toast.success(result.message || "Project deleted successfully");
      resetDeleteFlow();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const deleteChecklistSections = deleteScan?.sections || [];
  const deleteRequiredSections = deleteChecklistSections.filter((section) => section.present);
  const allDeleteSectionsSelected =
    deleteRequiredSections.length > 0 &&
    deleteRequiredSections.every((section) => deleteSelections[section.key]);

  const handleOpenPaymentRecord = (item) => {
    if (!item?.raw?._id || !customerId) return;
    navigate(`/admin-panel/clients/${customerId}/payments/${item.kind}/${item.raw._id}`);
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
        setSelectedProjectCheckpointId(null);
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
        value: allData.summary?.pendingUpdates ?? 0,
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
    >
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          eyebrow={
            <>
              <ShieldCheck size={14} />
              Admin Client Workspace
            </>
          }
          title={clientName}
          subtitle={clientEmail}
          leadingAction={
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          }
          meta={
            <>
              <AdminInfoPill label="Client ID" value={customerId || client?._id || "N/A"} variant="dark" />
              <AdminInfoPill label="Status" value={clientStatus} variant="dark" />
              <AdminInfoPill label="Joined" value={createdAt} variant="dark" />
            </>
          }
          loadingText={customerLoading ? "Loading customer profile..." : ""}
        />

        <AdminWorkspaceTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Client workspace sections"
        />

          <div className="p-5 sm:p-6">
        {activeTab === "overview" && (
          <section>
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
                    Orders: {allData.orders.length} | Invoices: {allData.invoices.length} | Update Requests: {allData.summary?.updateCount ?? 0}
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
                selectedCheckpointId={selectedProjectCheckpointId}
                onSelectCheckpoint={setSelectedProjectCheckpointId}
                onSoftRefresh={handleSoftRefreshActiveProject}
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

        {activeTab === "payments" && (
          <PaymentInvoicesPanel
            transactions={allData.transactions}
            invoices={allData.invoices}
            getBadgeClassName={getBadgeClassName}
            formatDateTime={formatDateTime}
            onOpenRecord={handleOpenPaymentRecord}
          />
        )}

        {fetchError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </div>
        ) : null}
          </div>
      </AdminWorkspaceShell>

        {deleteTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    Delete {deleteScan?.orderType === "plan" ? "plan" : "project"} permanently?
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Scan linked data, check only active sections, and delete runs only when all present items are selected.
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {deleteScan?.serviceName || deleteTarget.productId?.serviceName || "Project"} | Order ID: {deleteTarget._id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetDeleteFlow}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close delete dialog"
                  disabled={Boolean(deletingOrderId) || deleteScanLoading}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {deleteScanLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Scanning linked records...
                  </div>
                ) : null}

                {deleteError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {deleteError}
                  </div>
                ) : null}

                {deleteScan && !deleteScanLoading ? (
                  <>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Select every existing section</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Missing sections stay disabled, present sections must be checked.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                          {deleteRequiredSections.length} active
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {deleteChecklistSections.map((section) => {
                          const isLocked = !section.present;
                          const isChecked = isLocked ? true : Boolean(deleteSelections[section.key]);

                          return (
                            <label
                              key={section.key}
                              className={[
                                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                                isLocked
                                  ? "cursor-not-allowed border-slate-200 bg-white text-slate-400"
                                  : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                checked={isChecked}
                                disabled={isLocked || Boolean(deletingOrderId)}
                                onChange={() => handleToggleDeleteSection(section.key)}
                              />
                              <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">
                                {section.label}
                              </span>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {section.count}
                              </span>
                              <span
                                className={[
                                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                  section.present ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                                ].join(" ")}
                              >
                                {section.present ? "Present" : "Missing"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetDeleteFlow}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={Boolean(deletingOrderId) || deleteScanLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(deletingOrderId) || deleteScanLoading || !allDeleteSectionsSelected}
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
                      Delete selected sections
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

    </AdminLayout>
  );
};

const PaymentInvoicesPanel = ({
  transactions,
  invoices,
  getBadgeClassName,
  formatDateTime,
  onOpenRecord,
}) => {
  const pendingPayments = transactions.filter((transaction) => transaction?.status === "pending");
  const unpaidInvoices = invoices.filter((invoice) => ["unpaid", "overdue"].includes(invoice?.status));
  const paidInvoices = invoices.filter((invoice) => invoice?.status === "paid");
  const completedPayments = transactions.filter((transaction) => transaction?.status === "completed");
  const transactionInvoiceIds = new Set(
    transactions
      .filter((transaction) => transaction?.invoiceId)
      .map((transaction) => String(transaction.invoiceId?._id || transaction.invoiceId))
  );
  const ledgerItems = [
    ...transactions.map((transaction) => ({
      id: `transaction-${transaction._id}`,
      kind: "transaction",
      statusLabel: getPaymentStatusLabel(transaction),
      title: transaction.transactionId || transaction.upiTransactionId || `Payment ${String(transaction._id).slice(-6)}`,
      subtitle: `${transaction.sourceType || transaction.type || "payment"} payment`,
      status: transaction.status,
      amount: transaction.amount,
      method: transaction.paymentMethod || "N/A",
      reference: transaction.upiTransactionId || transaction.transactionId || "N/A",
      date: transaction.date || transaction.createdAt,
      raw: transaction,
      sortDate: safeDateTime(transaction.date || transaction.createdAt)?.getTime() || 0,
    })),
    ...invoices
      .filter((invoice) => !transactionInvoiceIds.has(String(invoice._id)))
      .map((invoice) => ({
        id: `invoice-${invoice._id}`,
        kind: "invoice",
        statusLabel: getInvoiceStatusLabel(invoice),
        title: invoice.invoiceNumber || `Invoice ${String(invoice._id).slice(-6)}`,
        subtitle: invoice.orderId?.productId?.serviceName || invoice.serviceName || "Monthly invoice",
        status: invoice.status,
        amount: invoice.amount,
        method: invoice.paymentMethod || "N/A",
        reference: invoice.transactionReference || "N/A",
        date: invoice.paidDate || invoice.invoiceDate || invoice.createdAt,
        raw: invoice,
        sortDate: safeDateTime(invoice.paidDate || invoice.invoiceDate || invoice.createdAt)?.getTime() || 0,
      })),
  ].sort((left, right) => right.sortDate - left.sortDate);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <AdminInfoPill label="Paid Payments" value={completedPayments.length} />
        <AdminInfoPill label="Pending Payments" value={pendingPayments.length} />
        <AdminInfoPill label="Unpaid Invoices" value={unpaidInvoices.length} />
        <AdminInfoPill label="Paid Invoices" value={paidInvoices.length} />
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment Ledger</h2>
            <p className="mt-1 text-sm text-slate-500">Single payment and invoice history from the customer backend.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {ledgerItems.length} records
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
          {ledgerItems.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No payment or invoice records found for this client.</div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white">
              {ledgerItems.map((item) => {
                const isTransaction = item.kind === "transaction";
                const invoice = !isTransaction ? item.raw : null;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenRecord?.(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenRecord?.(item);
                      }
                    }}
                    className="cursor-pointer px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-500">
                            {isTransaction ? "Payment" : "Invoice"}
                          </span>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getBadgeClassName(getLedgerStatusLabel(item.status))}`}>
                            {getLedgerStatusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Type: {item.subtitle}</span>
                          <span>Method: {item.method}</span>
                          <span>Reference: {item.reference}</span>
                          <span>Date: {formatDateTime(item.date)}</span>
                          {invoice?.dueDate ? <span>Due: {formatDateTime(invoice.dueDate)}</span> : null}
                        </div>
                        {isTransaction && item.raw?.rejectionReason ? (
                          <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            Reason: {item.raw.rejectionReason}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Open detail
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const CompactWorkspaceCard = ({ title, subtitle, items, emptyText, onRowClick, onDelete, deletingOrderId, renderMeta, renderRight }) => {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5">
        <AdminWorkspaceList
          columns={[
            { label: "Item", className: "col-span-12 lg:col-span-5" },
            { label: "Details", className: "col-span-12 lg:col-span-4" },
            { label: "Status", className: "col-span-6 lg:col-span-2" },
            { label: "Action", className: "col-span-6 text-right lg:col-span-1" },
          ]}
          loading={false}
          emptyText={emptyText}
          items={items}
          renderRow={(item, index) => (
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
                className={[
                  "grid w-full cursor-pointer grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                <div className="col-span-12 lg:col-span-5">
                  <p className="truncate text-base font-semibold text-slate-900">{item.productId?.serviceName || "N/A"}</p>
                </div>

                <div className="col-span-12 lg:col-span-4 lg:flex lg:items-center">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {renderMeta?.(item)?.map((meta) => (
                      <span key={meta}>{meta}</span>
                    ))}
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <div>{renderRight?.(item)}</div>
                </div>

                <div className="col-span-6 flex items-center justify-end lg:col-span-1">
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
          )}
        />
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
  selectedCheckpointId,
  onSelectCheckpoint,
  onSoftRefresh,
}) => {
  const itemStatus = getStatusLabel(item);
  const isProjectDetail = detailLabel === "Project";
  const checkpoints = item?.checkpoints || [];
  const [updateMode, setUpdateMode] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");
  const [nodeUiState, setNodeUiState] = useState({});
  const [selectedNodeKeys, setSelectedNodeKeys] = useState([]);
  const [selectionAnchorKey, setSelectionAnchorKey] = useState(null);
  const [focusedNodeKey, setFocusedNodeKey] = useState(null);
  const nodeRowRefs = useRef({});
  const [hideDeletedNodesForClient, setHideDeletedNodesForClient] = useState(false);
  const [resetPreviewOpen, setResetPreviewOpen] = useState(false);
  const [nodeActionNotice, setNodeActionNotice] = useState("");
  let cumulativeProgress = 0;
  const checkpointsWithProgress = checkpoints.map((checkpoint, index) => {
    const checkpointWeight = Number(checkpoint?.percentage) || 0;
    if (checkpoint?.completed) {
      cumulativeProgress += checkpointWeight;
    }

    return {
      ...checkpoint,
      checkpointIndex: index,
      cumulativeProgress: Math.round(cumulativeProgress * 100) / 100,
    };
  });
  const displayedCheckpoints = [...checkpointsWithProgress].reverse();
  const displayedCheckpointKeys = displayedCheckpoints.map((checkpoint, index) =>
    getCheckpointSelectionKey(checkpoint, index)
  );
  const pendingCheckpoints = checkpointsWithProgress.filter((checkpoint) => !checkpoint?.completed);
  const allCheckpointsCompleted = checkpoints.length > 0 && pendingCheckpoints.length === 0;

  useEffect(() => {
    setUpdateMode(true);
    setUpdateMessage("");
    setNodeUiState({});
    setSelectedNodeKeys([]);
    setSelectionAnchorKey(null);
    setFocusedNodeKey(null);
    setHideDeletedNodesForClient(false);
    setResetPreviewOpen(false);
    setNodeActionNotice("");
  }, [item?._id]);
  const getNodeSelectionRange = (selectionKey) => {
    const anchorIndex = displayedCheckpointKeys.indexOf(selectionAnchorKey);
    const targetIndex = displayedCheckpointKeys.indexOf(selectionKey);
    if (anchorIndex < 0 || targetIndex < 0) return [selectionKey];
    const rangeStart = Math.min(anchorIndex, targetIndex);
    const rangeEnd = Math.max(anchorIndex, targetIndex);
    return displayedCheckpointKeys.slice(rangeStart, rangeEnd + 1);
  };
  const toggleNodeSelection = (selectionKey) => {
    setSelectedNodeKeys((current) => (
      current.includes(selectionKey)
        ? current.filter((key) => key !== selectionKey)
        : [...current, selectionKey]
    ));
    setSelectionAnchorKey(selectionKey);
  };
  const selectNodeFromList = (selectionKey, { ctrlKey = false, shiftKey = false } = {}) => {
    setFocusedNodeKey(selectionKey);
    if (shiftKey && selectionAnchorKey) {
      const selectedRange = getNodeSelectionRange(selectionKey);
      setSelectedNodeKeys((current) => (
        ctrlKey ? [...new Set([...current, ...selectedRange])] : selectedRange
      ));
    } else if (ctrlKey) {
      setSelectedNodeKeys((current) => (
        current.includes(selectionKey)
          ? current.filter((key) => key !== selectionKey)
          : [...current, selectionKey]
      ));
      setSelectionAnchorKey(selectionKey);
    } else {
      setSelectedNodeKeys([selectionKey]);
      setSelectionAnchorKey(selectionKey);
    }
    setUpdateMode(false);
    setUpdateMessage("");
    onSelectCheckpoint?.(selectionKey);
  };
  const updateSelectedNodeUiState = (patch) => {
    setNodeUiState((current) => selectedNodeKeys.reduce((next, selectionKey) => ({
      ...next,
      [selectionKey]: { ...next[selectionKey], ...patch },
    }), current));
  };
  const updateSelectedInactiveNodeUiState = (patch) => {
    setNodeUiState((current) => selectedNodeKeys.reduce((next, selectionKey) => (
      next[selectionKey]?.isInactive
        ? { ...next, [selectionKey]: { ...next[selectionKey], ...patch } }
        : next
    ), current));
  };
  const handleDeleteNodePreview = () => {
    const selectedActiveCount = selectedNodeKeys.filter((key) => !nodeUiState[key]?.isInactive).length;
    if (selectedActiveCount === 0) return;

    updateSelectedNodeUiState({ isInactive: true });
    setSelectedNodeKeys([]);
    setSelectionAnchorKey(null);
    setFocusedNodeKey(null);
    setNodeActionNotice(`${selectedActiveCount} node(s) marked inactive in the local preview. A project-detail refresh has been requested.`);
    onSoftRefresh?.();
  };
  const selectedCheckpoint =
    checkpointsWithProgress.find(
      (checkpoint, index) => getCheckpointSelectionKey(checkpoint, index) === selectedCheckpointId
    ) ||
    checkpointsWithProgress.find((checkpoint) => !checkpoint?.completed) ||
    checkpointsWithProgress[checkpointsWithProgress.length - 1] ||
    null;
  const selectedNodeStates = selectedNodeKeys.map((key) => nodeUiState[key] || {});
  const hasSelectedActiveNodes = selectedNodeKeys.some((key) => !nodeUiState[key]?.isInactive);
  const hasSelectedInactiveNodes = selectedNodeKeys.some((key) => nodeUiState[key]?.isInactive);
  const hasInactiveNodes = checkpointsWithProgress.some((checkpoint, index) => {
    const selectionKey = getCheckpointSelectionKey(checkpoint, index);
    return nodeUiState[selectionKey]?.isInactive;
  });
  const selectedNodesAreHiddenForClient = selectedNodeStates.length > 0 && selectedNodeStates.every(
    (nodeState) => nodeState.visibleToClient === false
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4 xl:flex-nowrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-slate-900">
            {item?.productId?.serviceName || `${detailLabel} Details`}
          </h2>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-l border-slate-200 pl-4 text-xs text-slate-500 xl:flex-nowrap">
          <span className="whitespace-nowrap">
            <span className="mr-1 font-semibold uppercase tracking-wide text-slate-400">Order ID</span>
            <span className="font-semibold text-slate-700">{item?._id || "N/A"}</span>
          </span>
          <span className="whitespace-nowrap">
            <span className="mr-1 font-semibold uppercase tracking-wide text-slate-400">Starting Date</span>
            <span className="font-semibold text-slate-700">{formatDateTime(item?.createdAt)}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={deletingOrderId === item?._id}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label={`Delete ${detailLabel.toLowerCase()}`}
          title={`Delete ${detailLabel.toLowerCase()}`}
        >
          {deletingOrderId === item?._id ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          ) : (
            <Trash2 size={16} />
          )}
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
          {isProjectDetail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Progress Checkpoints</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">Click a checkpoint for details</h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {checkpoints.length} checkpoints
                      </span>
                      <button
                        type="button"
                        onClick={() => setResetPreviewOpen((current) => !current)}
                        disabled={checkpoints.length === 0}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-3 text-xs font-semibold text-rose-800 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Reset history"
                        title={resetPreviewOpen ? "Close reset history preview" : "Reset history: archive current nodes and restart active progress at 0%"}
                      >
                        <RotateCcw size={19} />
                        <span>Reset history</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
                    <span className="mr-1 text-xs font-semibold text-slate-600">{selectedNodeKeys.length} selected</span>
                    <button
                      type="button"
                      onClick={handleDeleteNodePreview}
                      disabled={!hasSelectedActiveNodes}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300 bg-rose-100 text-rose-800 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Delete selected node(s)"
                      title="Delete selected node(s)"
                    >
                      <Trash2 size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedNodeUiState({ isInactive: false })}
                      disabled={!hasSelectedInactiveNodes}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Undo delete for selected node(s)"
                      title="Undo delete for selected node(s)"
                    >
                      <Undo2 size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedInactiveNodeUiState({ visibleToClient: selectedNodesAreHiddenForClient })}
                      disabled={!hasSelectedInactiveNodes}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-400 bg-slate-100 text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={selectedNodesAreHiddenForClient ? "Show selected node(s) to client" : "Hide selected node(s) from client"}
                      title={selectedNodesAreHiddenForClient ? "Show selected node(s) to client" : "Hide selected node(s) from client"}
                    >
                      {selectedNodesAreHiddenForClient ? <Eye size={19} /> : <EyeOff size={19} />}
                    </button>
                    <label className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={hideDeletedNodesForClient}
                        onChange={(event) => setHideDeletedNodesForClient(event.target.checked)}
                        disabled={!hasInactiveNodes}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Always hide deleted nodes from client
                    </label>
                  </div>

                  {nodeActionNotice ? (
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                      {nodeActionNotice}
                    </p>
                  ) : null}

                  {resetPreviewOpen ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Reset archive preview</p>
                        <p className="mt-0.5 text-xs text-slate-500">Current nodes would become archived history; active progress would restart at 0%.</p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        Show old history to client
                      </label>
                    </div>
                  ) : null}

                  <div className="mt-4 max-h-[25rem] space-y-2 overflow-y-auto pr-1">
                    {checkpoints.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        No checkpoint history available for this project.
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setUpdateMode(true)}
                          className={[
                            "flex w-full items-start gap-4 rounded-2xl border px-4 py-3 text-left transition",
                            updateMode
                              ? "border-slate-500 bg-slate-200 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-slate-900">
                                {allCheckpointsCompleted ? "Send Update" : "Update Node"}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Action
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>{allCheckpointsCompleted ? "Project update" : "Update incomplete nodes"}</span>
                              <span>Click to open</span>
                            </div>
                          </div>
                        </button>

                        {displayedCheckpoints.map((checkpoint, index) => {
                        const selectionKey = getCheckpointSelectionKey(checkpoint, index);
                        const isSelected = selectionKey === selectedCheckpointId;
                        const checkpointUiState = nodeUiState[selectionKey] || {};
                        const isInactive = Boolean(checkpointUiState.isInactive);
                        const isVisibleToClient = checkpointUiState.visibleToClient !== false;
                        const isHiddenFromClient = !isVisibleToClient || (isInactive && hideDeletedNodesForClient);
                        const isFocusedForSelection = focusedNodeKey === selectionKey;

                        return (
                          <div
                            key={selectionKey}
                            className="flex w-full items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={selectedNodeKeys.includes(selectionKey)}
                              onFocus={() => setFocusedNodeKey(selectionKey)}
                              onChange={() => toggleNodeSelection(selectionKey)}
                              className="h-4 w-4 shrink-0 rounded border-slate-300 text-rose-600"
                              aria-label={`Select ${checkpoint.name} for node management`}
                            />
                            <button
                              type="button"
                              ref={(element) => {
                                if (element) nodeRowRefs.current[selectionKey] = element;
                              }}
                              onFocus={() => setFocusedNodeKey(selectionKey)}
                              onKeyDown={(event) => {
                                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                                  event.preventDefault();
                                  const currentIndex = displayedCheckpointKeys.indexOf(selectionKey);
                                  const direction = event.key === "ArrowUp" ? -1 : 1;
                                  const nextIndex = Math.min(
                                    Math.max(currentIndex + direction, 0),
                                    displayedCheckpointKeys.length - 1
                                  );
                                  const nextKey = displayedCheckpointKeys[nextIndex];
                                  nodeRowRefs.current[nextKey]?.focus();
                                  setFocusedNodeKey(nextKey);
                                  return;
                                }
                                if (event.key !== " " && event.key !== "Spacebar") return;
                                event.preventDefault();
                                if (event.shiftKey && selectionAnchorKey) {
                                  setSelectedNodeKeys(getNodeSelectionRange(selectionKey));
                                } else {
                                  toggleNodeSelection(selectionKey);
                                }
                              }}
                              onClick={(event) => selectNodeFromList(selectionKey, {
                                ctrlKey: event.ctrlKey || event.metaKey,
                                shiftKey: event.shiftKey,
                              })}
                              className={[
                                "min-w-0 flex-1 rounded-2xl border px-4 py-3 text-left transition",
                                isSelected
                                  ? "border-emerald-300 bg-emerald-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                isFocusedForSelection ? "ring-2 ring-slate-300 ring-offset-1" : "",
                              ].join(" ")}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-semibold text-slate-900">{checkpoint.name}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getCheckpointBadgeClass(checkpoint)}`}>
                                  {getCheckpointStatusLabel(checkpoint)}
                                </span>
                                {isInactive ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Inactive</span>
                                ) : null}
                                {isHiddenFromClient ? (
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Client hidden</span>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>Weight: {checkpoint.percentage || 0}%</span>
                                <span>Total: {checkpoint.cumulativeProgress}%</span>
                                <span>Completed: {formatDateTime(checkpoint.completedAt)}</span>
                              </div>
                            </button>
                          </div>
                        );
                        })}
                      </>
                    )}
                  </div>
                </div>

                <AdminProjectCheckpointDetail
                  checkpoint={selectedCheckpoint}
                  cumulativeProgress={selectedCheckpoint?.cumulativeProgress}
                  messages={item?.messages}
                  updateMode={updateMode}
                  updateModeLabel={allCheckpointsCompleted ? "Send Update" : "Update Node"}
                  updateMessage={updateMessage}
                  onUpdateMessageChange={setUpdateMessage}
                  currentProjectProgress={item?.projectProgress || 0}
                  formatDateTime={formatDateTime}
                />
              </div>

            </div>
          ) : null}

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

          {!isProjectDetail && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Notes</p>
              <p className="mt-2 text-sm text-slate-600">
                {notesText}
              </p>
            </div>
          )}
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

export default AdminClientWorkspace;
