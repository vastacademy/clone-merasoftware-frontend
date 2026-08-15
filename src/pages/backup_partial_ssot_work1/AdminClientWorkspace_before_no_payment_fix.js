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
  Loader2,
  ShieldCheck,
  Wallet,
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  X,
  Copy,
  KeyRound,
  ShieldAlert,
  Upload,
  Download,
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
import {
  formatCurrency,
  getLedgerStatusLabel,
  buildLedgerItems,
} from "../helpers/paymentLedger";

const OVERVIEW_TAB = { id: "overview", label: "Overview", active: true };
const PROJECTS_TAB = { id: "projects", label: "Projects", active: true };
const PLANS_TAB = { id: "plans", label: "Plans", active: true };
const PAYMENTS_TAB = { id: "payments", label: "Payment & Invoices", active: true };
const DOCUMENTS_TAB = { id: "documents", label: "Documents", active: true };
const ACCESS_TAB = { id: "access", label: "Account & Access", active: true };

// Fixed tab order (user-confirmed) — same for every client, no longer derived from whether the
// client currently has an active project/plan.
const WORKSPACE_TABS = [PROJECTS_TAB, PLANS_TAB, PAYMENTS_TAB, DOCUMENTS_TAB, ACCESS_TAB, OVERVIEW_TAB];

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

// Pending-approval ranks WITH active (both 0) so a brand-new project — which starts life as
// pending-approval — sorts by its own newest-first date instead of always dropping below active
// projects. Completed/rejected still rank below everything (they're finished/closed work), so
// they stay at the bottom regardless of how recently they were touched.
const getProjectSortRank = (order) => {
  if (isCompletedOrder(order)) return 2;
  if (isRejectedOrder(order)) return 1;
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

const toComparableId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const isSameId = (value, targetId) => {
  const comparable = toComparableId(value);
  return Boolean(comparable && targetId && comparable === String(targetId));
};

const getNodeStatusLabel = (node) => {
  if (node?.status === "deleted") return "Deleted";
  if (node?.status === "archived") return "Archived";
  return "Active";
};

const getNodeSelectionKey = (node) => node?.nodeId;

const getNodeBadgeClass = (node) => {
  const label = getNodeStatusLabel(node).toLowerCase();
  if (label === "active") return "bg-emerald-100 text-emerald-800";
  if (label === "deleted") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const AdminClientWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.user);
  const { isOnline } = useOnlineStatus();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || null);
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
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [workspaceRefreshKey, setWorkspaceRefreshKey] = useState(0);
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
  // Account & Access section state
  const [accessData, setAccessData] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetting, setResetting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [trashing, setTrashing] = useState(false);
  // Documents section state (admin-sent documents timeline for this client)
  const [documentsList, setDocumentsList] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
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
    const activeNodes = (project?.projectNodes || []).filter((node) => node?.status === "active");
    const lastNode = activeNodes[activeNodes.length - 1];
    setSelectedProjectCheckpointId(lastNode ? getNodeSelectionKey(lastNode) : null);
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
    const nodes = activeProject?.projectNodes || [];
    if (!nodes.length) return;

    const selectedExists = nodes.some((node) => getNodeSelectionKey(node) === selectedProjectCheckpointId);
    if (selectedExists) return;

    const activeNodes = nodes.filter((node) => node?.status === "active");
    const lastNode = activeNodes[activeNodes.length - 1];
    setSelectedProjectCheckpointId(lastNode ? getNodeSelectionKey(lastNode) : null);
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

  // --- Account & Access handlers ---
  const loadAccessData = async () => {
    if (!customerId) return;
    try {
      setAccessLoading(true);
      setAccessError("");
      const response = await fetch(`${SummaryApi.clientCredentials.url}/${customerId}/credentials`, {
        method: SummaryApi.clientCredentials.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to load credentials");
      setAccessData(result.data);
    } catch (err) {
      setAccessError(err.message || "Failed to load credentials");
    } finally {
      setAccessLoading(false);
    }
  };

  // Load credentials when the Account & Access tab opens.
  useEffect(() => {
    if (activeTab === "access" && customerId && !accessData && !accessLoading) {
      loadAccessData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerId]);

  // --- Documents handlers ---
  const loadDocuments = async () => {
    if (!customerId) return;
    try {
      setDocumentsLoading(true);
      setDocumentsError("");
      const response = await fetch(`${SummaryApi.adminClientDocuments.url}/${customerId}/documents`, {
        method: SummaryApi.adminClientDocuments.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to load documents");
      setDocumentsList(result.data?.documents || []);
    } catch (err) {
      setDocumentsError(err.message || "Failed to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Load documents when the Documents tab opens.
  useEffect(() => {
    if (activeTab === "documents" && customerId && documentsList === null && !documentsLoading) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerId]);

  const handleUploadDocument = async ({ file, source }) => {
    if (!customerId || !file) return;
    try {
      setDocumentUploading(true);
      const formData = new FormData();
      formData.append("document", file);
      formData.append("source", source || "general");
      const response = await fetch(`${SummaryApi.uploadClientDocument.url}/${customerId}/documents`, {
        method: SummaryApi.uploadClientDocument.method,
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to upload document");
      toast.success("Document uploaded");
      // Refresh the timeline from the source of truth.
      await loadDocuments();
    } catch (err) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleCopyPassword = async () => {
    const pwd = accessData?.plainPassword;
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleResetPassword = async () => {
    if (!customerId) return;
    if (!newPasswordInput || newPasswordInput.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    try {
      setResetting(true);
      const response = await fetch(`${SummaryApi.resetClientPassword.url}/${customerId}/reset-password`, {
        method: SummaryApi.resetClientPassword.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to reset password");
      toast.success("Password reset successfully");
      setNewPasswordInput("");
      await loadAccessData();
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    if (!customerId || !accessData) return;
    const nextActive = !accessData.isActive;
    try {
      setStatusUpdating(true);
      const response = await fetch(`${SummaryApi.updateClientAccountStatus.url}/${customerId}/account-status`, {
        method: SummaryApi.updateClientAccountStatus.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to update account status");
      toast.success(nextActive ? "Account enabled" : "Account disabled");
      setAccessData((prev) => (prev ? { ...prev, isActive: nextActive } : prev));
    } catch (err) {
      toast.error(err.message || "Failed to update account status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Soft-delete this client into Trash (hidden from lists + login blocked). Restorable
  // for 30 days from the admin Trash page. See 49_TRASH_SYSTEM_SOFT_DELETE.md.
  const handleTrashClient = async () => {
    if (!customerId || trashing) return;
    try {
      setTrashing(true);
      const response = await fetch(`${SummaryApi.trashClient.url}/${customerId}/trash`, {
        method: SummaryApi.trashClient.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to move client to Trash");
      toast.success("Client moved to Trash");
      setShowTrashConfirm(false);
      navigate("/admin-panel/clients");
    } catch (err) {
      toast.error(err.message || "Failed to move client to Trash");
    } finally {
      setTrashing(false);
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
  }, [customerId, fallbackClient, workspaceRefreshKey]);

  const projectOrders = useMemo(
    () => allData.orders.filter((order) => !isWebsiteUpdateOrder(order)).slice().sort((a, b) => sortWorkspaceItem(a, b, getProjectSortRank)),
    [allData.orders]
  );

  const planOrders = useMemo(
    () => allData.orders.filter((order) => isWebsiteUpdateOrder(order)).slice().sort((a, b) => sortWorkspaceItem(a, b, getPlanSortRank)),
    [allData.orders]
  );

  // Fixed order (user-confirmed, replaces the earlier active-project/active-plan-dependent
  // ordering): Projects, Plans, Payments, Documents, Access, Overview last — same for every
  // client regardless of what they currently have running.
  const tabs = WORKSPACE_TABS;

  useEffect(() => {
    if (activeTab === null && !dataLoading) setActiveTab(tabs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading]);

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
          activeTab={activeTab || tabs[0].id}
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
                allInvoices={allData.invoices}
                allTransactions={allData.transactions}
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
                headerAction={
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectForm(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Create Project for Client
                  </button>
                }
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
            customerId={customerId}
            walletBalance={Number(allData.summary?.walletBalance ?? customer?.walletBalance ?? 0)}
            onRecharged={() => setWorkspaceRefreshKey((current) => current + 1)}
          />
        )}

        {activeTab === "documents" && (
          <ClientDocumentsPanel
            documents={documentsList}
            loading={documentsLoading}
            error={documentsError}
            uploading={documentUploading}
            onUpload={handleUploadDocument}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "access" && (
          <AccountAccessPanel
            accessData={accessData}
            accessLoading={accessLoading}
            accessError={accessError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onCopyPassword={handleCopyPassword}
            newPasswordInput={newPasswordInput}
            setNewPasswordInput={setNewPasswordInput}
            resetting={resetting}
            onResetPassword={handleResetPassword}
            statusUpdating={statusUpdating}
            onToggleStatus={handleToggleAccountStatus}
            onRequestTrash={() => setShowTrashConfirm(true)}
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

        {showCreateProjectForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
              <CreateProjectForClientForm
                clientName={clientName}
                customerId={customerId}
                onCancel={() => setShowCreateProjectForm(false)}
                onCreated={() => {
                  setShowCreateProjectForm(false);
                  setWorkspaceRefreshKey((current) => current + 1);
                }}
              />
            </div>
          </div>
        ) : null}

        {showTrashConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
              <div className="px-6 pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Trash2 size={24} />
                </div>
                <h2 className="mt-4 text-center text-lg font-bold text-slate-900">Move client to Trash?</h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{customer?.name || "This client"}</span> will be hidden
                  and unable to log in. You can restore it from Trash within 30 days before it is permanently deleted.
                </p>
              </div>
              <div className="flex justify-center gap-3 px-6 py-6">
                <button
                  type="button"
                  onClick={() => !trashing && setShowTrashConfirm(false)}
                  disabled={trashing}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTrashClient}
                  disabled={trashing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {trashing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {trashing ? "Moving…" : "Move to Trash"}
                </button>
              </div>
            </div>
          </div>
        )}

    </AdminLayout>
  );
};

const formatFileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocKindMeta = (doc) => {
  if (doc?.kind === "proposal") {
    return { label: `Proposal v${doc.version}`, badge: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (doc?.source === "agreement") {
    return { label: "Agreement", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  return { label: "Document", badge: "bg-slate-100 text-slate-600 border-slate-200" };
};

const ClientDocumentsPanel = ({ documents, loading, error, uploading, onUpload, formatDateTime }) => {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState("agreement");
  const fileInputRef = useRef(null);

  const submit = async () => {
    if (!file) {
      toast.error("Please choose a file first");
      return;
    }
    await onUpload({ file, source });
    setFile(null);
    setSource("agreement");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mt-5 space-y-5">
      {/* Upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <Upload size={18} />
          <h3 className="text-base font-bold">Send a Document</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Upload an agreement or document for this client. It appears in their Documents page even if no project is running.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1 file:text-white focus:border-slate-400 sm:max-w-sm"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 sm:max-w-[10rem]"
          >
            <option value="agreement">Agreement</option>
            <option value="general">General</option>
          </select>
          <button
            type="button"
            onClick={submit}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Upload size={15} />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {/* Timeline card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <FileText size={18} />
          <h3 className="text-base font-bold">Documents Timeline</h3>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading documents…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : !documents || documents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No documents yet. Proposals sent while this client was a lead, and any agreements you upload, will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((doc) => {
              const meta = getDocKindMeta(doc);
              const sizeLabel = formatFileSize(doc.size);
              return (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-800">{doc.name || "Document"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(doc.date)}
                      {sizeLabel ? ` · ${sizeLabel}` : ""}
                    </p>
                  </div>
                  {doc.downloadLink ? (
                    <a
                      href={doc.downloadLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const AccountAccessPanel = ({
  accessData,
  accessLoading,
  accessError,
  showPassword,
  setShowPassword,
  onCopyPassword,
  newPasswordInput,
  setNewPasswordInput,
  resetting,
  onResetPassword,
  statusUpdating,
  onToggleStatus,
  onRequestTrash,
}) => {
  if (accessLoading) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
        Loading account details…
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {accessError}
      </div>
    );
  }

  if (!accessData) return null;

  const isActive = accessData.isActive !== false;
  const hasPlain = !!accessData.plainPassword;

  return (
    <div className="mt-5 space-y-5">
      {/* Login credentials */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <KeyRound size={18} />
          <h3 className="text-base font-bold">Login Credentials</h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Login Email</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-800">{accessData.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Password</p>
            {hasPlain ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm text-slate-800">
                  {showPassword ? accessData.plainPassword : "••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  title={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  type="button"
                  onClick={onCopyPassword}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  title="Copy"
                >
                  <Copy size={15} />
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Not available yet — will appear after this user's next login, or set a new one below.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reset password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <RotateCcw size={18} />
          <h3 className="text-base font-bold">Reset Password</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Set a new password for this client. They can log in with it immediately.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newPasswordInput}
            onChange={(e) => setNewPasswordInput(e.target.value)}
            placeholder="New password (min 4 characters)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 sm:max-w-xs"
          />
          <button
            type="button"
            onClick={onResetPassword}
            disabled={resetting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Save size={15} />
            {resetting ? "Saving…" : "Set Password"}
          </button>
        </div>
      </div>

      {/* Login access (ban / enable) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          {isActive ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          <h3 className="text-base font-bold">Login Access</h3>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isActive ? "Account is active" : "Account is disabled"}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {isActive
                ? "This client can log in normally."
                : "This client cannot log in until re-enabled."}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={statusUpdating}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              isActive
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {statusUpdating ? "Updating…" : isActive ? "Disable Login" : "Enable Login"}
          </button>
        </div>
      </div>

      {/* Delete client — soft-delete into Trash (restorable for 30 days) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
        <div className="flex items-center gap-2 text-rose-700">
          <Trash2 size={18} />
          <h3 className="text-base font-bold">Delete Client</h3>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Move this client to Trash</p>
            <p className="mt-0.5 text-sm text-slate-500">
              The client is hidden and login is blocked. You can restore it from Trash within 30 days before it is
              permanently deleted.
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestTrash}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <Trash2 size={15} />
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentInvoicesPanel = ({
  transactions,
  invoices,
  getBadgeClassName,
  formatDateTime,
  onOpenRecord,
  customerId,
  walletBalance = 0,
  onRecharged,
}) => {
  const pendingPayments = transactions.filter((transaction) => transaction?.status === "pending");
  const unpaidInvoices = invoices.filter((invoice) => ["unpaid", "overdue"].includes(invoice?.status));
  const paidInvoices = invoices.filter((invoice) => invoice?.status === "paid");
  const completedPayments = transactions.filter((transaction) => transaction?.status === "completed");
  const ledgerItems = buildLedgerItems(transactions, invoices);

  // Admin wallet recharge — instant credit (creditWalletInstant), shows up in the same ledger.
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeMethod, setRechargeMethod] = useState("upi");
  const [rechargeReference, setRechargeReference] = useState("");
  const [rechargeNote, setRechargeNote] = useState("");
  const [recharging, setRecharging] = useState(false);

  const resetRecharge = () => {
    setShowRecharge(false);
    setRechargeAmount("");
    setRechargeMethod("upi");
    setRechargeReference("");
    setRechargeNote("");
  };

  const handleRecharge = async () => {
    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      setRecharging(true);
      const response = await fetch(
        `${SummaryApi.adminRechargeWallet.url}/${customerId}/recharge-wallet`,
        {
          method: SummaryApi.adminRechargeWallet.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            paymentMethod: rechargeMethod,
            reference: rechargeReference.trim(),
            note: rechargeNote.trim(),
          }),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Recharge failed");
      }
      toast.success(result.message || "Wallet recharged");
      resetRecharge();
      onRecharged?.();
    } catch (error) {
      console.error("Error recharging wallet:", error);
      toast.error(error.message || "Recharge failed");
    } finally {
      setRecharging(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <AdminInfoPill label="Paid Payments" value={completedPayments.length} />
        <AdminInfoPill label="Pending Payments" value={pendingPayments.length} />
        <AdminInfoPill label="Unpaid Invoices" value={unpaidInvoices.length} />
        <AdminInfoPill label="Paid Invoices" value={paidInvoices.length} />
      </div>

      {/* Wallet balance + admin recharge */}
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Wallet balance</p>
            <p className="text-xl font-bold text-slate-900">₹{walletBalance.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowRecharge(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Wallet size={16} />
          Recharge Wallet
        </button>
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

      {/* Admin recharge modal */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={resetRecharge}>
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Wallet recharge</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Add money to client wallet</h3>
                <p className="mt-1 text-sm text-slate-500">Credited instantly — no approval needed. Appears in the client's wallet history.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Amount (₹)</span>
                <input
                  type="number"
                  min="1"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Method</span>
                <select
                  value={rechargeMethod}
                  onChange={(e) => setRechargeMethod(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Reference (optional)</span>
                <input
                  type="text"
                  value={rechargeReference}
                  onChange={(e) => setRechargeReference(e.target.value)}
                  placeholder="UPI ID / bank reference"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Note (internal, optional)</span>
                <textarea
                  value={rechargeNote}
                  onChange={(e) => setRechargeNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Cash collected in person"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetRecharge}
                disabled={recharging}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecharge}
                disabled={recharging}
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recharging ? "Recharging…" : "Recharge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const CompactWorkspaceCard = ({ title, subtitle, items, emptyText, onRowClick, onDelete, deletingOrderId, renderMeta, renderRight, headerAction }) => {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
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

const PROJECT_CATEGORIES = [
  { value: "standard_websites", label: "Standard Website" },
  { value: "dynamic_websites", label: "Dynamic Website" },
  { value: "cloud_software_development", label: "Cloud Software" },
  { value: "app_development", label: "App Development" },
];

const FEATURE_UPGRADE_CATEGORY = "feature_upgrades";

const buildInstallmentPreview = (totalAmount, installmentCount) => {
  const count = Number(installmentCount) === 3 ? 3 : 2;
  const splits = count === 3 ? [30, 30, 40] : [50, 50];
  return splits.map((percentage, index) => ({
    installmentNumber: index + 1,
    percentage,
    amount: Math.round((totalAmount * percentage) / 100),
  }));
};

const projectFormInputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const projectFormLabelClassName = "mb-1.5 block text-base font-semibold text-slate-700";

const PAYMENT_METHOD_OPTIONS = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "wallet", label: "Wallet" },
];

const CreateProjectForClientForm = ({ clientName, customerId, onCancel, onCreated }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingNodeTitle, setStartingNodeTitle] = useState("");
  const [category, setCategory] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [installmentCount, setInstallmentCount] = useState("2");

  const [paymentAction, setPaymentAction] = useState("record");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [basePrice, setBasePrice] = useState(0);
  const [basePriceLoading, setBasePriceLoading] = useState(false);
  const [categoryDescription, setCategoryDescription] = useState("");

  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresError, setFeaturesError] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const featureDropdownRef = useRef(null);

  const isWebsiteCategory = category === "standard_websites" || category === "dynamic_websites";

  useEffect(() => {
    const fetchFeatures = async () => {
      setFeaturesLoading(true);
      setFeaturesError("");
      try {
        const response = await fetch(SummaryApi.allProduct.url);
        const dataResponse = await response.json();
        const allProducts = dataResponse?.data || [];
        setAvailableFeatures(
          allProducts.filter((product) => product.category === FEATURE_UPGRADE_CATEGORY)
        );
      } catch (fetchError) {
        console.error("Error fetching additional features:", fetchError);
        setFeaturesError("Additional features could not be loaded.");
      } finally {
        setFeaturesLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  useEffect(() => {
    if (!category) {
      setBasePrice(0);
      setCategoryDescription("");
      return;
    }

    const fetchBasePrice = async () => {
      setBasePriceLoading(true);
      try {
        const response = await fetch(SummaryApi.categoryBasePrices.url, {
          method: SummaryApi.categoryBasePrices.method.toUpperCase(),
          credentials: "include",
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Failed to load base price");
        const entry = (result.data || []).find((item) => item.category === category);
        setBasePrice(entry?.basePrice || 0);
        setCategoryDescription(entry?.description || "");
      } catch (fetchError) {
        console.error("Error fetching category base price:", fetchError);
        toast.error("Could not load base price for this category.");
        setBasePrice(0);
        setCategoryDescription("");
      } finally {
        setBasePriceLoading(false);
      }
    };
    fetchBasePrice();
  }, [category]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (featureDropdownRef.current && !featureDropdownRef.current.contains(event.target)) {
        setIsFeatureDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFeature = (featureId) => {
    setSelectedFeatureIds((current) =>
      current.includes(featureId)
        ? current.filter((id) => id !== featureId)
        : [...current, featureId]
    );
  };

  const selectableFeatures = availableFeatures.filter(
    (feature) => !selectedFeatureIds.includes(feature._id)
  );
  const selectedFeatures = selectedFeatureIds
    .map((id) => availableFeatures.find((feature) => feature._id === id))
    .filter(Boolean);
  const featuresTotal = selectedFeatures.reduce(
    (sum, feature) => sum + (Number(feature.sellingPrice) || 0),
    0
  );
  const referenceTotal = Number(basePrice) + featuresTotal;

  const firstInstallmentAmount = paymentType === "partial" && sellingPrice
    ? buildInstallmentPreview(Number(sellingPrice), installmentCount)[0]?.amount || 0
    : Number(sellingPrice) || 0;

  const handleGoToPaymentStep = () => {
    if (!startingNodeTitle.trim() || !category || !sellingPrice) {
      toast.error("Starting node title, category, and selling price are required.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = {
      startingNodeTitle,
      category,
      totalPages: isWebsiteCategory ? totalPages : null,
      sellingPrice,
      featureIds: selectedFeatureIds,
      paymentType,
      installmentCount: paymentType === "partial" ? installmentCount : null,
      recordPayment: paymentAction === "record"
        ? {
            paymentMethod,
            transactionReference: transactionReference.trim(),
            notes: paymentNotes.trim(),
          }
        : null,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${SummaryApi.adminCreateProjectOrder.url}/${customerId}/create-project`,
        {
          method: SummaryApi.adminCreateProjectOrder.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create project");
      }

      toast.success("Project created and started for this client.");
      onCreated?.();
    } catch (error) {
      console.error("Error creating project for client:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={step === 2 ? handleSubmit : (event) => event.preventDefault()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {step === 1 ? `Create Project for ${clientName}` : "Payment Settings"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1
              ? "This creates a working project for this client only. It will not be saved to the project catalog."
              : "Record the first payment now, or let the client pay later. Step 2 of 2."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-white hover:text-slate-700"
          aria-label="Close create project form"
        >
          <X size={16} />
        </button>
      </div>

      {step === 1 ? (
      <>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className={projectFormLabelClassName}>Starting Node Title *</label>
          <input
            type="text"
            className={projectFormInputClassName}
            value={startingNodeTitle}
            onChange={(event) => setStartingNodeTitle(event.target.value)}
            placeholder="e.g. Project Kickoff"
          />
        </div>

        <div>
          <label className={projectFormLabelClassName}>Category</label>
          <select
            className={projectFormInputClassName}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Select category</option>
            {PROJECT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isWebsiteCategory ? (
          <div>
            <label className={projectFormLabelClassName}>Total Pages</label>
            <input
              type="number"
              min={4}
              max={50}
              className={projectFormInputClassName}
              value={totalPages}
              onChange={(event) => setTotalPages(event.target.value)}
              placeholder="4-50"
            />
          </div>
        ) : null}

        <div>
          <label className={projectFormLabelClassName}>
            Base Price <span className="font-normal normal-case tracking-normal text-slate-400">(fixed per category)</span>
          </label>
          <div className={`${projectFormInputClassName} bg-slate-100 text-slate-700`}>
            {!category
              ? "Select a category first"
              : basePriceLoading
                ? "Loading…"
                : `₹${Number(basePrice).toLocaleString("en-IN")}`}
          </div>
        </div>

        {category && !basePriceLoading && categoryDescription ? (
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-500">Category Description</p>
            <p className="mt-1 text-sm text-slate-700">{categoryDescription}</p>
          </div>
        ) : (
          <div />
        )}

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-600">
            Reference Total (Base Price + Features): ₹{referenceTotal.toLocaleString("en-IN")}
          </p>
        </div>

        <div>
          <label className={projectFormLabelClassName}>
            Selling Price <span className="font-normal normal-case tracking-normal text-slate-400">(what the client pays)</span>
          </label>
          <input
            type="number"
            min={0}
            className={projectFormInputClassName}
            value={sellingPrice}
            onChange={(event) => setSellingPrice(event.target.value)}
            placeholder="e.g. 12000"
          />
          {sellingPrice && Number(sellingPrice) < referenceTotal ? (
            <p className="mt-1.5 text-sm font-semibold text-emerald-600">
              Discount: ₹{(referenceTotal - Number(sellingPrice)).toLocaleString("en-IN")}
            </p>
          ) : null}
        </div>

        <div ref={featureDropdownRef} className="md:col-span-2">
          <span className={projectFormLabelClassName}>
            Additional Features / Upgrades <span className="font-normal normal-case tracking-normal text-slate-400">(optional, used for invoice/billing)</span>
          </span>

          {featuresLoading && (
            <p className="text-xs text-slate-500">Loading available features…</p>
          )}

          {!featuresLoading && featuresError && (
            <p className="text-xs text-red-500">{featuresError}</p>
          )}

          {!featuresLoading && !featuresError && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFeatureDropdownOpen((open) => !open)}
                className={`${projectFormInputClassName} flex items-center justify-between text-left`}
              >
                <span className={selectableFeatures.length === 0 && selectedFeatures.length === 0 ? "text-slate-400" : ""}>
                  {availableFeatures.length === 0
                    ? "No features available"
                    : "Search & select features..."}
                </span>
                <span className="text-slate-400">▾</span>
              </button>

              {isFeatureDropdownOpen && (selectedFeatures.length > 0 || selectableFeatures.length > 0) && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {selectedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b border-slate-100 p-2">
                      {selectedFeatures.map((feature) => (
                        <span
                          key={feature._id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-base font-semibold text-emerald-800"
                        >
                          {feature.serviceName}
                          {typeof feature.sellingPrice === "number" && (
                            <span className="text-emerald-600">₹{feature.sellingPrice}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleFeature(feature._id)}
                            className="text-emerald-500 transition hover:text-red-500"
                            aria-label={`Remove ${feature.serviceName}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {selectableFeatures.map((feature) => (
                    <button
                      key={feature._id}
                      type="button"
                      onClick={() => toggleFeature(feature._id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-base text-black transition hover:bg-emerald-50"
                    >
                      <span>{feature.serviceName}</span>
                      {typeof feature.sellingPrice === "number" && (
                        <span className="text-base font-semibold text-slate-600">₹{feature.sellingPrice}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedFeatures.length > 0 && (
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Features total: ₹{featuresTotal.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <label className={projectFormLabelClassName}>Payment Type</label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPaymentType("full")}
            className={[
              "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              paymentType === "full"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            One-time (Full)
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("partial")}
            className={[
              "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              paymentType === "partial"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Partial (Installments)
          </button>
        </div>

        {paymentType === "partial" ? (
          <div className="mt-4 max-w-xs">
            <label className={projectFormLabelClassName}>Number of Installments</label>
            <select
              className={projectFormInputClassName}
              value={installmentCount}
              onChange={(event) => setInstallmentCount(event.target.value)}
            >
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleGoToPaymentStep}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Next: Payment Settings
        </button>
      </div>
      </>
      ) : (
      <>
      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-500">Amount Due Now</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">₹{firstInstallmentAmount.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-slate-500">
            {paymentType === "partial"
              ? `Installment 1 of ${installmentCount} — remaining installments stay unpaid and can be recorded later.`
              : "Full project amount (one-time payment)."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPaymentAction("record")}
            className={[
              "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              paymentAction === "record"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Record Payment Now
          </button>
          <button
            type="button"
            onClick={() => setPaymentAction("skip")}
            className={[
              "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              paymentAction === "skip"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Just Add Project, Let Client Pay the Bill
          </button>
        </div>

        {paymentAction === "record" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={projectFormLabelClassName}>Payment Method</label>
              <select
                className={projectFormInputClassName}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={projectFormLabelClassName}>Transaction Reference</label>
              <input
                type="text"
                className={projectFormInputClassName}
                value={transactionReference}
                onChange={(event) => setTransactionReference(event.target.value)}
                placeholder="UPI ID or bank reference"
              />
            </div>
            <div className="md:col-span-2">
              <label className={projectFormLabelClassName}>
                Note <span className="font-normal normal-case tracking-normal text-slate-400">(internal only, not shown to client)</span>
              </label>
              <textarea
                rows={3}
                className={projectFormInputClassName}
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="e.g. Collected cash in person"
              />
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The project will be created and started immediately, but its invoice stays unpaid until the client (or admin) records the payment later.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <Save size={16} />
              Create Project
            </>
          )}
        </button>
      </div>
      </>
      )}
    </form>
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
  allInvoices = [],
  allTransactions = [],
}) => {
  const itemStatus = getStatusLabel(item);
  const isProjectDetail = detailLabel === "Project";

  // SSOT per-order ledger: filter the client's invoices + transactions down to THIS order,
  // then merge/dedup with the same buildLedgerItems() helper the Payment & Invoices tab uses.
  // transaction.orderId is a plain ObjectId; invoice.orderId is populated ({_id,...}) — handle both.
  const sameOrder = (ref) => String(ref?._id || ref) === String(item?._id);
  const orderInvoices = (allInvoices || []).filter((inv) => sameOrder(inv.orderId));
  const orderTransactions = (allTransactions || []).filter((txn) => sameOrder(txn.orderId));
  const orderLedgerItems = isProjectDetail
    ? buildLedgerItems(orderTransactions, orderInvoices)
    : [];
  const allNodes = item?.projectNodes || [];
  const activeRun = (item?.projectRuns || []).find((run) => run.status === "active") || null;
  const runNodes = activeRun ? allNodes.filter((node) => node.runId === activeRun.runId) : allNodes;
  const [updateMode, setUpdateMode] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");
  const [selectedNodeKeys, setSelectedNodeKeys] = useState([]);
  const [selectionAnchorKey, setSelectionAnchorKey] = useState(null);
  const [focusedNodeKey, setFocusedNodeKey] = useState(null);
  const nodeRowRefs = useRef({});
  const [hideDeletedNodesForClient, setHideDeletedNodesForClient] = useState(false);
  const [resetPreviewOpen, setResetPreviewOpen] = useState(false);
  const [resetStartingTitle, setResetStartingTitle] = useState("");
  const [nodeActionNotice, setNodeActionNotice] = useState("");
  const [isNodeActionSubmitting, setIsNodeActionSubmitting] = useState(false);
  const [editingNodeKey, setEditingNodeKey] = useState(null);

  // Approval bar state — only for the gap approveProjectOrder.js exists to close: a "Pay Later"
  // (decide_later) order that is pending-approval with NO transaction at all, so there is nothing
  // for the normal transaction-approval flow to act on (see approveProjectOrder.js's header
  // comment). A customer order that already has a pending transaction (full/installment payment
  // via wallet+UPI) is a DIFFERENT case — that payment already exists as a real transaction record
  // and must be approved/rejected from the Payment & Invoices tab (transactionApprovalController),
  // not waved through here with "Approve without Payment" / a duplicate "Record Payment" write.
  const hasPendingTransaction = orderTransactions.some((txn) => txn.status === "pending");
  const isPendingApproval = item?.orderVisibility === "pending-approval" && !hasPendingTransaction;
  const [approvalMode, setApprovalMode] = useState(null); // null | "record" | "reject"
  const [approvalMethod, setApprovalMethod] = useState("upi");
  const [approvalReference, setApprovalReference] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalRejectReason, setApprovalRejectReason] = useState("");
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  const submitApproval = async (mode) => {
    setApprovalSubmitting(true);
    try {
      const response = await fetch(`${SummaryApi.approveProjectOrder.url}/${item._id}/approval`, {
        method: SummaryApi.approveProjectOrder.method.toUpperCase(),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          paymentMethod: mode === "approve_with_payment" ? approvalMethod : undefined,
          transactionReference: mode === "approve_with_payment" ? approvalReference : undefined,
          notes: mode === "approve_with_payment" ? approvalNotes : undefined,
          rejectionReason: mode === "reject" ? approvalRejectReason : undefined,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Approval action failed");
      toast.success(result.message || "Done");
      setApprovalMode(null);
      setApprovalReference("");
      setApprovalNotes("");
      setApprovalRejectReason("");
      onSoftRefresh?.();
    } catch (approvalError) {
      toast.error(approvalError.message || "Approval action failed");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const displayedNodes = [...runNodes].reverse();
  const displayedNodeKeys = displayedNodes.map((node) => getNodeSelectionKey(node));
  const activeNodes = runNodes.filter((node) => node.status === "active");
  const currentProjectProgress = item?.projectProgress || 0;
  const allNodesCompleted = activeNodes.length > 0 && currentProjectProgress >= 100;

  useEffect(() => {
    setUpdateMode(true);
    setUpdateMessage("");
    setSelectedNodeKeys([]);
    setSelectionAnchorKey(null);
    setFocusedNodeKey(null);
    setHideDeletedNodesForClient(false);
    setResetPreviewOpen(false);
    setResetStartingTitle("");
    setNodeActionNotice("");
    setEditingNodeKey(null);
    setApprovalMode(null);
    setApprovalMethod("upi");
    setApprovalReference("");
    setApprovalNotes("");
    setApprovalRejectReason("");
  }, [item?._id]);

  const getNodeSelectionRange = (selectionKey) => {
    const anchorIndex = displayedNodeKeys.indexOf(selectionAnchorKey);
    const targetIndex = displayedNodeKeys.indexOf(selectionKey);
    if (anchorIndex < 0 || targetIndex < 0) return [selectionKey];
    const rangeStart = Math.min(anchorIndex, targetIndex);
    const rangeEnd = Math.max(anchorIndex, targetIndex);
    return displayedNodeKeys.slice(rangeStart, rangeEnd + 1);
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
    setEditingNodeKey(null);
    onSelectCheckpoint?.(selectionKey);
  };

  const callNodeApi = async (apiConfig, pathSuffix, body) => {
    const response = await fetch(`${apiConfig.url}/${item._id}/nodes${pathSuffix}`, {
      method: apiConfig.method.toUpperCase(),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Node action failed");
    return result;
  };

  const handleAddNode = async (title, percentage, message) => {
    setIsNodeActionSubmitting(true);
    setNodeActionNotice("");
    try {
      await callNodeApi(SummaryApi.createProjectNode, "", {
        title,
        cumulativeProgress: Number(percentage),
        message: message || undefined,
      });
      toast.success("Node added successfully.");
      setUpdateMessage("");
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error adding project node:", nodeError);
      toast.error(nodeError.message || "Failed to add node");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const handleStartEditNode = (selectionKey) => {
    setEditingNodeKey(selectionKey);
    setUpdateMode(true);
    setUpdateMessage("");
  };

  const handleCancelEditNode = () => {
    setEditingNodeKey(null);
  };

  const handleSaveCorrection = async (editingNode, title, percentage, message) => {
    setIsNodeActionSubmitting(true);
    setNodeActionNotice("");
    try {
      await callNodeApi(SummaryApi.editProjectNode, "/edit", {
        nodeId: editingNode.nodeId,
        title,
        cumulativeProgress: Number(percentage),
        message: message || undefined,
      });
      toast.success("Node updated successfully.");
      setEditingNodeKey(null);
      setUpdateMessage("");
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error updating project node:", nodeError);
      toast.error(nodeError.message || "Failed to update node");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const handleDeleteSelectedNodes = async () => {
    const nodeIds = selectedNodeKeys.filter((key) => {
      const node = runNodes.find((candidate) => getNodeSelectionKey(candidate) === key);
      return node?.status === "active";
    });
    if (nodeIds.length === 0) return;

    setIsNodeActionSubmitting(true);
    try {
      await callNodeApi(SummaryApi.deleteProjectNodes, "/delete", { nodeIds });
      toast.success(`${nodeIds.length} node(s) deleted.`);
      setSelectedNodeKeys([]);
      setSelectionAnchorKey(null);
      setFocusedNodeKey(null);
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error deleting project nodes:", nodeError);
      toast.error(nodeError.message || "Failed to delete node(s)");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const handleRestoreSelectedNodes = async () => {
    const nodeIds = selectedNodeKeys.filter((key) => {
      const node = runNodes.find((candidate) => getNodeSelectionKey(candidate) === key);
      return node?.status === "deleted";
    });
    if (nodeIds.length === 0) return;

    setIsNodeActionSubmitting(true);
    try {
      await callNodeApi(SummaryApi.restoreProjectNodes, "/restore", { nodeIds });
      toast.success(`${nodeIds.length} node(s) restored.`);
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error restoring project nodes:", nodeError);
      toast.error(nodeError.message || "Failed to restore node(s)");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const handleToggleVisibilitySelectedNodes = async (visibleToClient) => {
    const nodeIds = selectedNodeKeys.filter((key) =>
      runNodes.some((candidate) => getNodeSelectionKey(candidate) === key)
    );
    if (nodeIds.length === 0) return;

    setIsNodeActionSubmitting(true);
    try {
      await callNodeApi(SummaryApi.setProjectNodeVisibility, "/visibility", { nodeIds, visibleToClient });
      toast.success(`${nodeIds.length} node(s) updated.`);
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error updating project node visibility:", nodeError);
      toast.error(nodeError.message || "Failed to update visibility");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const handleResetTimeline = async () => {
    if (!resetStartingTitle.trim()) {
      toast.error("Starting node title is required to reset.");
      return;
    }
    setIsNodeActionSubmitting(true);
    try {
      await callNodeApi(SummaryApi.resetProjectNodes, "/reset", {
        startingNodeTitle: resetStartingTitle.trim(),
      });
      toast.success("Project timeline reset.");
      setResetPreviewOpen(false);
      setResetStartingTitle("");
      setSelectedNodeKeys([]);
      onSoftRefresh?.();
    } catch (nodeError) {
      console.error("Error resetting project timeline:", nodeError);
      toast.error(nodeError.message || "Failed to reset project timeline");
    } finally {
      setIsNodeActionSubmitting(false);
    }
  };

  const selectedNode =
    runNodes.find((node) => getNodeSelectionKey(node) === selectedCheckpointId) ||
    activeNodes[activeNodes.length - 1] ||
    runNodes[runNodes.length - 1] ||
    null;
  const selectedNodeStates = selectedNodeKeys.map(
    (key) => runNodes.find((node) => getNodeSelectionKey(node) === key) || {}
  );
  const hasSelectedActiveNodes = selectedNodeStates.some((node) => node.status === "active");
  const hasSelectedInactiveNodes = selectedNodeStates.some((node) => node.status === "deleted");
  const hasInactiveNodes = runNodes.some((node) => node.status === "deleted");
  const selectedNodesAreHiddenForClient = selectedNodeStates.length > 0 && selectedNodeStates.every(
    (node) => node.visibleToClient === false
  );

  const editingNodeForDetail = editingNodeKey
    ? runNodes.find((node) => getNodeSelectionKey(node) === editingNodeKey) || null
    : null;
  const editBounds = editingNodeForDetail
    ? (() => {
        // activeNodes is already in creation order; the run's first active node
        // is the 0% starting node, and neighbours define the editable band.
        const targetIndex = activeNodes.findIndex(
          (node) => getNodeSelectionKey(node) === editingNodeKey
        );
        const lowerNeighbor = targetIndex > 0 ? activeNodes[targetIndex - 1] : null;
        const upperNeighbor = targetIndex >= 0 ? activeNodes[targetIndex + 1] : null;
        return {
          isStartingNode: targetIndex === 0,
          lowerBound: lowerNeighbor ? Number(lowerNeighbor.cumulativeProgress) || 0 : 0,
          upperBound: upperNeighbor ? Number(upperNeighbor.cumulativeProgress) || 0 : null,
        };
      })()
    : null;

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

      {isProjectDetail && item?.orderVisibility === "pending-approval" && hasPendingTransaction ? (
        <div className="mb-5 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              i
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-sky-900">Payment submitted, awaiting approval</p>
              <p className="mt-1 text-sm text-sky-700">
                The customer already submitted a payment for this project. Go to the Payment & Invoices tab to approve or reject it — this project does not need "Approve without Payment".
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isProjectDetail && isPendingApproval ? (
        <div className="mb-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              !
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-amber-900">This project is waiting for your approval</p>
              <p className="mt-1 text-sm text-amber-700">
                The customer started this project. Approve it (with or without recording a payment), or reject the request.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={approvalSubmitting}
                  onClick={() => submitApproval("approve_no_payment")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Approve without Payment
                </button>
                <button
                  type="button"
                  disabled={approvalSubmitting}
                  onClick={() => setApprovalMode(approvalMode === "record" ? null : "record")}
                  className={[
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                    approvalMode === "record"
                      ? "border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-600"
                      : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50",
                  ].join(" ")}
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  disabled={approvalSubmitting}
                  onClick={() => setApprovalMode(approvalMode === "reject" ? null : "reject")}
                  className={[
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                    approvalMode === "reject"
                      ? "border-rose-400 bg-rose-500 text-white hover:bg-rose-600"
                      : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
                  ].join(" ")}
                >
                  Reject
                </button>
              </div>

              {approvalMode === "record" ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={projectFormLabelClassName}>Payment Method</label>
                      <select
                        className={projectFormInputClassName}
                        value={approvalMethod}
                        onChange={(event) => setApprovalMethod(event.target.value)}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={projectFormLabelClassName}>Transaction Reference</label>
                      <input
                        type="text"
                        className={projectFormInputClassName}
                        value={approvalReference}
                        onChange={(event) => setApprovalReference(event.target.value)}
                        placeholder="UPI ID or bank reference"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={projectFormLabelClassName}>Note (optional)</label>
                    <input
                      type="text"
                      className={projectFormInputClassName}
                      value={approvalNotes}
                      onChange={(event) => setApprovalNotes(event.target.value)}
                      placeholder="Internal note for this payment"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={approvalSubmitting}
                    onClick={() => submitApproval("approve_with_payment")}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {approvalSubmitting ? "Saving..." : "Record Payment & Approve"}
                  </button>
                </div>
              ) : null}

              {approvalMode === "reject" ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4">
                  <label className={projectFormLabelClassName}>Rejection Reason</label>
                  <input
                    type="text"
                    className={projectFormInputClassName}
                    value={approvalRejectReason}
                    onChange={(event) => setApprovalRejectReason(event.target.value)}
                    placeholder="Reason shown to the customer"
                  />
                  <button
                    type="button"
                    disabled={approvalSubmitting || !approvalRejectReason.trim()}
                    onClick={() => submitApproval("reject")}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-400 bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {approvalSubmitting ? "Rejecting..." : "Confirm Reject"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payments &amp; Invoices</h3>
                  <p className="mt-1 text-sm text-slate-500">This project's own payment and invoice history.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {orderLedgerItems.length} records
                </span>
              </div>

              {orderLedgerItems.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No payment or invoice records for this project yet.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {orderLedgerItems.map((led) => {
                    const isTxn = led.kind === "transaction";
                    return (
                      <div key={led.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-500">
                                {isTxn ? "Payment" : "Invoice"}
                              </span>
                              <span className="font-semibold text-slate-900">{led.title}</span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getBadgeClassName(getLedgerStatusLabel(led.status))}`}>
                                {getLedgerStatusLabel(led.status)}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>Type: {led.subtitle}</span>
                              <span>Method: {led.method}</span>
                              <span>Date: {formatDateTime(led.date)}</span>
                            </div>
                            {isTxn && led.raw?.rejectionReason ? (
                              <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
                                Reason: {led.raw.rejectionReason}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Amount</p>
                            <p className="text-base font-bold text-slate-900">{formatCurrency(led.amount)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {isProjectDetail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Progress Nodes</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">Click a node for details</h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {runNodes.length} nodes
                      </span>
                      <button
                        type="button"
                        onClick={() => setResetPreviewOpen((current) => !current)}
                        disabled={runNodes.length === 0 || isNodeActionSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-3 text-xs font-semibold text-rose-800 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Reset history"
                        title={resetPreviewOpen ? "Close reset history" : "Reset history: archive current nodes and restart active progress at 0%"}
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
                      onClick={handleDeleteSelectedNodes}
                      disabled={!hasSelectedActiveNodes || isNodeActionSubmitting}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300 bg-rose-100 text-rose-800 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Delete selected node(s)"
                      title="Delete selected node(s)"
                    >
                      <Trash2 size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditNode(selectedNodeKeys[0])}
                      disabled={selectedNodeKeys.length !== 1 || !hasSelectedActiveNodes || isNodeActionSubmitting}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-800 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Edit selected node"
                      title="Edit selected node (deletes and recreates with corrected values)"
                    >
                      <Pencil size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreSelectedNodes}
                      disabled={!hasSelectedInactiveNodes || isNodeActionSubmitting}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Restore selected node(s)"
                      title="Restore selected node(s)"
                    >
                      <Undo2 size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilitySelectedNodes(selectedNodesAreHiddenForClient)}
                      disabled={selectedNodeKeys.length === 0 || isNodeActionSubmitting}
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
                    <div className="mt-3 space-y-2.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Reset project timeline</p>
                        <p className="mt-0.5 text-xs text-slate-500">Current nodes become archived history; active progress restarts at 0% with a new starting node.</p>
                      </div>
                      <input
                        type="text"
                        value={resetStartingTitle}
                        onChange={(event) => setResetStartingTitle(event.target.value)}
                        placeholder="New starting node title"
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleResetTimeline}
                          disabled={isNodeActionSubmitting || !resetStartingTitle.trim()}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Confirm reset
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 max-h-[25rem] space-y-2 overflow-y-auto pr-1">
                    {runNodes.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        No node history available for this project.
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setUpdateMode(true);
                            setEditingNodeKey(null);
                          }}
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
                                {allNodesCompleted ? "Send Update" : "Add Node"}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Action
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>{allNodesCompleted ? "Project update" : "Add a new progress node"}</span>
                              <span>Click to open</span>
                            </div>
                          </div>
                        </button>

                        {displayedNodes.map((node) => {
                        const selectionKey = getNodeSelectionKey(node);
                        const isSelected = selectionKey === selectedCheckpointId;
                        const isInactive = node.status === "deleted";
                        const isVisibleToClient = node.visibleToClient !== false;
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
                              aria-label={`Select ${node.title} for node management`}
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
                                  const currentIndex = displayedNodeKeys.indexOf(selectionKey);
                                  const direction = event.key === "ArrowUp" ? -1 : 1;
                                  const nextIndex = Math.min(
                                    Math.max(currentIndex + direction, 0),
                                    displayedNodeKeys.length - 1
                                  );
                                  const nextKey = displayedNodeKeys[nextIndex];
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
                                <p className="truncate font-semibold text-slate-900">{node.title}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getNodeBadgeClass(node)}`}>
                                  {getNodeStatusLabel(node)}
                                </span>
                                {isHiddenFromClient ? (
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Client hidden</span>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>Progress: {node.cumulativeProgress}%</span>
                                <span>Created: {formatDateTime(node.createdAt)}</span>
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
                  node={selectedNode}
                  messages={item?.messages}
                  updateMode={updateMode}
                  updateModeLabel={allNodesCompleted ? "Send Update" : "Add Node"}
                  updateMessage={updateMessage}
                  onUpdateMessageChange={setUpdateMessage}
                  currentProjectProgress={currentProjectProgress}
                  formatDateTime={formatDateTime}
                  onAddNode={handleAddNode}
                  isSubmitting={isNodeActionSubmitting}
                  editingNode={editingNodeForDetail}
                  editBounds={editBounds}
                  onSaveCorrection={handleSaveCorrection}
                  onCancelEdit={handleCancelEditNode}
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
