import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ListChecks, Plus } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";

const AdminFeatureProductsPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.adminFeatureProducts.url, {
        method: SummaryApi.adminFeatureProducts.method.toUpperCase(),
        credentials: "include",
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to load features");
      setFeatures(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Error fetching feature products:", error);
      toast.error(error.message || "Failed to load features");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleAddFeature = () => {
    toast.info("Add Feature will be connected in the next step.");
  };

  const handleFeatureOpen = () => {
    toast.info("Feature detail sub-page will be connected in the next step.");
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
          icon={ListChecks}
          title="Features"
          subtitle="Manage the Additional Features / Upgrades products (feature_upgrades) used across the customer storefront and the admin Create Project for Client form."
        />

        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAddFeature}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus size={17} />
              Add Feature
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading features...</p>
          ) : features.length === 0 ? (
            <p className="text-sm text-slate-500">No features yet. Click "Add Feature" above.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-12 gap-3 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                <div className="col-span-6">Feature</div>
                <div className="col-span-3">Price (₹)</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Open</div>
              </div>
              {features.map((feature, index) => (
                <button
                  key={feature._id}
                  type="button"
                  onClick={() => handleFeatureOpen(feature)}
                  className={`grid w-full grid-cols-12 items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <div className="col-span-6">
                    <p className="text-sm font-semibold text-slate-900">{feature.serviceName}</p>
                    {feature.packageIncludes?.length ? (
                      <p className="mt-1 truncate text-xs text-slate-500">{feature.packageIncludes.join(", ")}</p>
                    ) : null}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-900">₹{feature.sellingPrice ?? feature.price}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{feature.isHidden ? "Hidden" : "Visible"}</span>
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

export default AdminFeatureProductsPage;
