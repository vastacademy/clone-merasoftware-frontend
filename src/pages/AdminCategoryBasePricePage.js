import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IndianRupee, Plus } from "lucide-react";
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

const AdminCategoryBasePricePage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    toast.info("Add Category will be connected in the next step.");
  };

  const handleCategoryOpen = () => {
    toast.info("Category detail sub-page will be connected in the next step.");
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
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminCategoryBasePricePage;
