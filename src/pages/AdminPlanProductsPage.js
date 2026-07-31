import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Layers3, Plus, RefreshCw, Search } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import AdminWorkspaceList from "../components/admin/AdminWorkspaceList";
import AdminFilterDropdown from "../components/admin/AdminFilterDropdown";

const SERVICE_PLAN_TYPE_LABELS = {
  website_updates: "Website Update",
  digital_marketing: "Digital Marketing",
  google_business_setup: "Google Business Setup",
  social_media_marketing: "Social Media Marketing",
  other: "Other",
};

const getPlanTypeLabel = (plan) => {
  if (plan.isServicePlan) {
    return SERVICE_PLAN_TYPE_LABELS[plan.servicePlan?.planType] || "Service Plan";
  }
  if (plan.isMonthlyRenewablePlan) return "Monthly Renewable";
  if (plan.isMonthlyLimitedPlan) return "Monthly Limited";
  return "Simple";
};

const getPlanValidityLabel = (plan) => {
  if (plan.isServicePlan) {
    const days = plan.servicePlan?.validityInDays;
    return days ? `${days} day(s)` : "N/A";
  }
  return plan.validityPeriod ? `${plan.validityPeriod} day(s)` : "N/A";
};

const sortOptions = [
  { value: "type", label: "Type" },
  { value: "name", label: "Name" },
  { value: "dateAdded", label: "Date Added" },
  { value: "modified", label: "Modified" },
];

const groupOptions = [
  { value: "none", label: "None" },
  { value: "type", label: "Type" },
  { value: "name", label: "Name" },
];

const AdminPlanProductsPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("dateAdded");
  const [groupBy, setGroupBy] = useState("none");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(SummaryApi.adminPlanProducts.url, {
        method: SummaryApi.adminPlanProducts.method.toUpperCase(),
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Plans could not be loaded.");
      }

      setPlans(Array.isArray(result.data) ? result.data : []);
    } catch (fetchError) {
      console.error("Error fetching plan products:", fetchError);
      setError(fetchError.message || "Plans could not be loaded.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlans();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) toast.success(result.message);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      CookieManager.clearAll();
      StorageService.clearUserData();
      dispatch(logout());
      navigate("/");
    }
  };

  const handleAddPlan = () => {
    navigate("/admin-panel/website-management/plans/add");
  };

  const handlePlanOpen = () => {
    toast.info("Plan detail sub-page will be connected in the next step.");
  };

  const visiblePlans = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = plans;

    if (query) {
      result = result.filter((plan) => (
        plan.serviceName?.toLowerCase().includes(query) ||
        getPlanTypeLabel(plan).toLowerCase().includes(query)
      ));
    }

    const getPlanName = (plan) => (plan.serviceName || "").trim();
    const getTimestamp = (value) => {
      const timestamp = value ? new Date(value).getTime() : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    return [...result].sort((left, right) => {
      if (sortBy === "type") {
        return getPlanTypeLabel(left).localeCompare(getPlanTypeLabel(right)) || getPlanName(left).localeCompare(getPlanName(right));
      }

      if (sortBy === "name") {
        return getPlanName(left).localeCompare(getPlanName(right)) || getPlanTypeLabel(left).localeCompare(getPlanTypeLabel(right));
      }

      if (sortBy === "modified") {
        return getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt) || getPlanName(left).localeCompare(getPlanName(right));
      }

      return getTimestamp(right.createdAt) - getTimestamp(left.createdAt) || getPlanName(left).localeCompare(getPlanName(right));
    });
  }, [plans, searchTerm, sortBy]);

  const displayRows = useMemo(() => {
    if (groupBy === "none") {
      return visiblePlans.map((plan, planIndex) => ({
        kind: "plan",
        plan,
        planIndex,
      }));
    }

    const groups = new Map();
    visiblePlans.forEach((plan) => {
      const groupLabel = groupBy === "type"
        ? getPlanTypeLabel(plan)
        : (plan.serviceName || "Unnamed Plan").trim() || "Unnamed Plan";

      if (!groups.has(groupLabel)) groups.set(groupLabel, []);
      groups.get(groupLabel).push(plan);
    });

    let planIndex = 0;
    return [...groups.entries()]
      .sort(([leftLabel], [rightLabel]) => leftLabel.localeCompare(rightLabel))
      .flatMap(([label, groupedPlans]) => [
        { kind: "group", label },
        ...groupedPlans.map((plan) => ({
          kind: "plan",
          plan,
          planIndex: planIndex++,
        })),
      ]);
  }, [groupBy, visiblePlans]);

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          icon={Layers3}
          title="Plans"
          subtitle="Manage reusable plan products."
          actions={
            <div className="flex w-full flex-wrap justify-end gap-2">
              <AdminFilterDropdown
                label="Sort"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                ariaLabel="Sort plans"
              />

              <AdminFilterDropdown
                icon={Layers3}
                label="Group"
                value={groupBy}
                options={groupOptions}
                onChange={setGroupBy}
                ariaLabel="Group plans"
              />

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          }
        />

        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAddPlan}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus size={17} />
              Add Plan
            </button>
          </div>

          <div className="relative mt-3 w-full">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search plans"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchPlans}
                className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold transition hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <AdminWorkspaceList
            columns={[
              { label: "Plan", className: "col-span-12 lg:col-span-4" },
              { label: "Type", className: "col-span-6 lg:col-span-3" },
              { label: "Validity", className: "col-span-6 lg:col-span-2" },
              { label: "Status", className: "col-span-6 lg:col-span-2" },
              { label: "Open", className: "col-span-6 text-right lg:col-span-1" },
            ]}
            loading={loading}
            emptyText="No plans found."
            items={displayRows}
            footer={`Showing ${visiblePlans.length} of ${plans.length} plans`}
            renderRow={(row) => row.kind === "group" ? (
              <div
                key={`group-${row.label}`}
                className="col-span-12 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 sm:px-6"
              >
                {row.label}
              </div>
            ) : (
              (() => {
                const { plan, planIndex } = row;
                return (
              <button
                key={plan._id || plan.id || planIndex}
                type="button"
                onClick={() => handlePlanOpen(plan)}
                className={[
                  "grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6",
                  planIndex % 2 === 0 ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                <div className="col-span-12 lg:col-span-4">
                  <p className="truncate text-base font-bold text-slate-950">{plan.serviceName || "N/A"}</p>
                  <p className="mt-1 text-xs text-slate-500">Plan #{planIndex + 1}</p>
                </div>
                <div className="col-span-6 lg:col-span-3 lg:flex lg:items-center">
                  <p className="text-sm font-semibold text-slate-900">{getPlanTypeLabel(plan)}</p>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <p className="text-sm font-semibold text-slate-900">{getPlanValidityLabel(plan)}</p>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{plan.isHidden ? "Hidden" : "Visible"}</span>
                </div>
                <div className="col-span-6 flex items-center justify-end lg:col-span-1">
                  <span className="text-xs font-semibold text-slate-500">Open</span>
                </div>
              </button>
                );
              })()
            )}
          />
        </div>
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminPlanProductsPage;
