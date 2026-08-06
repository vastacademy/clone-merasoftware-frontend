import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IndianRupee, Plus, X } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";

const CATEGORY_LABELS = {
  standard_websites: "Standard Website",
  dynamic_websites: "Dynamic Website",
  cloud_software_development: "Cloud Software",
  app_development: "App Development",
};

const formInputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const formLabelClassName = "mb-1.5 block text-base font-semibold text-slate-700";

const CategoryEditForm = ({ entry, onCancel, onSaved }) => {
  const [basePrice, setBasePrice] = useState(entry.basePrice ?? 0);
  const [description, setDescription] = useState(entry.description ?? "");
  const [startingNodeTitle, setStartingNodeTitle] = useState(entry.startingNodeTitle ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericBasePrice = Number(basePrice);
    if (!Number.isFinite(numericBasePrice) || numericBasePrice < 0) {
      toast.error("Base price must be a non-negative number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(SummaryApi.categoryBasePrices.url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: entry.category,
          basePrice: numericBasePrice,
          description: description.trim(),
          startingNodeTitle: startingNodeTitle.trim(),
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to save category");
      toast.success("Category saved.");
      onSaved?.();
    } catch (error) {
      console.error("Error saving category base price:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">
          {CATEGORY_LABELS[entry.category] || entry.category}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-white hover:text-slate-700"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5">
        <div>
          <label className={formLabelClassName}>Base Price (₹)</label>
          <input
            type="number"
            min={0}
            className={formInputClassName}
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
          />
        </div>

        <div>
          <label className={formLabelClassName}>Description</label>
          <textarea
            className={formInputClassName}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Shown to admin when this category is selected"
          />
        </div>

        <div>
          <label className={formLabelClassName}>
            Starting Node Title <span className="font-normal normal-case tracking-normal text-slate-400">(first project timeline node for this category)</span>
          </label>
          <input
            type="text"
            className={formInputClassName}
            value={startingNodeTitle}
            onChange={(event) => setStartingNodeTitle(event.target.value)}
            placeholder="e.g. Project Kickoff"
          />
        </div>
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
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

const AdminCategoryBasePricePage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.categoryBasePrices.url, {
        method: SummaryApi.categoryBasePrices.method.toUpperCase(),
        credentials: "include",
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to load base prices");
      setPrices(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Error fetching category base prices:", error);
      toast.error(error.message || "Failed to load base prices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleAddCategory = () => {
    const unconfigured = prices.find(
      (entry) => !entry.basePrice && !entry.description && !entry.startingNodeTitle
    );
    if (!unconfigured) {
      toast.info("All categories are already configured. Open one below to edit it.");
      return;
    }
    setEditingEntry(unconfigured);
  };

  const handleCategoryOpen = (entry) => {
    setEditingEntry(entry);
  };

  const handleCategorySaved = () => {
    setEditingEntry(null);
    fetchPrices();
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

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          icon={IndianRupee}
          title="Category Base Price"
          subtitle="Fixed base price and description per project category, used when admin creates a project for a client."
        />

        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAddCategory}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus size={17} />
              Add Category
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading base prices...</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-12 gap-3 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                <div className="col-span-5">Category</div>
                <div className="col-span-3">Base Price (₹)</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1 text-right">Open</div>
              </div>
              {prices.map((entry, index) => (
                <button
                  key={entry.category}
                  type="button"
                  onClick={() => handleCategoryOpen(entry)}
                  className={`grid w-full grid-cols-12 items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <div className="col-span-5">
                    <p className="text-sm font-semibold text-slate-900">
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-900">₹{Number(entry.basePrice || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="truncate text-xs text-slate-500">{entry.description || "No description"}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <span className="text-xs font-semibold text-slate-500">Open</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {editingEntry ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <CategoryEditForm
                entry={editingEntry}
                onCancel={() => setEditingEntry(null)}
                onSaved={handleCategorySaved}
              />
            </div>
          </div>
        ) : null}
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminCategoryBasePricePage;
