import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpDown, Plus, RefreshCw, Search, UserPlus, X } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import AdminWorkspaceList from "../components/admin/AdminWorkspaceList";
import AdminFilterDropdown from "../components/admin/AdminFilterDropdown";

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-800",
  Qualified: "bg-amber-100 text-amber-800",
  "Proposal Sent": "bg-indigo-100 text-indigo-800",
  Won: "bg-emerald-100 text-emerald-800",
  Lost: "bg-red-100 text-red-800",
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-IN");
};

const sortOptions = [
  { value: "lastUpdatedDesc", label: "Last Updated: Newest" },
  { value: "lastUpdatedAsc", label: "Last Updated: Oldest" },
  { value: "nameAsc", label: "Name: A-Z" },
  { value: "nameDesc", label: "Name: Z-A" },
];

const getLeadLastUpdated = (lead) => lead?.updatedAt || lead?.createdAt || null;

const emptyForm = { name: "", phone: "", email: "", source: "", notes: "" };

const AdminLeadsPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdatedDesc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.adminLeads.url, {
        method: SummaryApi.adminLeads.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load leads");
        return;
      }

      setLeads(result.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Error loading leads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setShowAddModal(false);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateLead = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please provide lead name");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please provide a phone number");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(SummaryApi.createLead.url, {
        method: SummaryApi.createLead.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to create lead");
        return;
      }

      toast.success("Lead created successfully");
      setShowAddModal(false);
      await fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Error creating lead");
    } finally {
      setSaving(false);
    }
  };

  const displayedLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = leads;

    if (query) {
      result = result.filter((lead) => {
        return (
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.toLowerCase().includes(query)
        );
      });
    }

    result = [...result].sort((left, right) => {
      const leftName = (left.name || "").toLowerCase();
      const rightName = (right.name || "").toLowerCase();
      const leftUpdated = new Date(getLeadLastUpdated(left) || 0).getTime();
      const rightUpdated = new Date(getLeadLastUpdated(right) || 0).getTime();

      switch (sortBy) {
        case "lastUpdatedAsc":
          return leftUpdated - rightUpdated || leftName.localeCompare(rightName, "en", { sensitivity: "base" });
        case "nameAsc":
          return leftName.localeCompare(rightName, "en", { sensitivity: "base" });
        case "nameDesc":
          return rightName.localeCompare(leftName, "en", { sensitivity: "base" });
        case "lastUpdatedDesc":
        default:
          return rightUpdated - leftUpdated || leftName.localeCompare(rightName, "en", { sensitivity: "base" });
      }
    });

    return result;
  }, [leads, searchTerm, sortBy]);

  return (
    <AdminLayout
      user={user}
      onLogout={handleLogout}
    >
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          icon={UserPlus}
          title="Leads"
          subtitle="Prospects before they become customers. Manually added here; converted to clients later."
          actions={
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:min-w-[28rem] lg:justify-end">
              <AdminFilterDropdown
                icon={ArrowUpDown}
                label="Sort"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                ariaLabel="Sort leads"
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

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/30"
              >
                <Plus size={16} />
                Add Lead
              </button>
            </div>
          }
        />

        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email, or phone"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <AdminWorkspaceList
            columns={[
              { label: "Lead", className: "col-span-12 lg:col-span-4" },
              { label: "Contact", className: "col-span-6 lg:col-span-3" },
              { label: "Status", className: "col-span-6 lg:col-span-2" },
              { label: "Source", className: "col-span-6 lg:col-span-2" },
              { label: "Added", className: "col-span-6 text-right lg:col-span-1" },
            ]}
            loading={loading}
            emptyText="No leads yet. Use Add Lead to create one."
            items={displayedLeads}
            footer={`Showing ${displayedLeads.length} of ${leads.length} leads`}
            renderRow={(lead, index) => (
              <button
                key={lead._id}
                type="button"
                onClick={() => navigate(`/admin-panel/leads/${lead._id}`)}
                className={[
                  "grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                <div className="col-span-12 lg:col-span-4">
                  <p className="truncate text-base font-bold text-slate-950">{lead.name || "N/A"}</p>
                  <p className="mt-1 text-xs text-slate-500">Lead #{index + 1}</p>
                </div>
                <div className="col-span-6 lg:col-span-3 lg:flex lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{lead.email || "N/A"}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{lead.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", STATUS_STYLES[lead.status] || STATUS_STYLES.New].join(" ")}>
                    {lead.status || "New"}
                  </span>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <p className="truncate text-sm text-slate-700">{lead.source || "—"}</p>
                </div>
                <div className="col-span-6 flex items-center justify-end lg:col-span-1">
                  <p className="text-sm font-semibold text-slate-900">{formatDate(lead.createdAt)}</p>
                </div>
              </button>
            )}
          />
        </div>
      </AdminWorkspaceShell>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Add Lead</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Name<span className="text-red-500"> *</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Lead full name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Phone<span className="text-red-500"> *</span></label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">Phone is required. Email is needed later to convert this lead into a client.</p>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Source</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => handleFormChange("source", e.target.value)}
                  placeholder="e.g. Referral, Website, WhatsApp"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  placeholder="Any context about this lead"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeadsPage;
