import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BarChart3, Layers3, RefreshCw, ShieldCheck, Users } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";

const AdminDashboard = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.adminClients.url, {
        method: SummaryApi.adminClients.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load clients");
        return;
      }

      const customerList = (result.data || []).sort(
        (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
      );

      setClients(customerList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Error loading clients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
  };

  const activeClients = useMemo(() => {
    return clients.filter((client) => (client.status || "active").toLowerCase() === "active").length;
  }, [clients]);

  const joinedThisMonth = useMemo(() => {
    const now = new Date();
    return clients.filter((client) => {
      if (!client.createdAt) return false;
      const createdAt = new Date(client.createdAt);
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [clients]);

  return (
    <AdminLayout
      user={user}
      onLogout={handleLogout}
      mobileTitle="Admin Dashboard"
      mobileSubtitle="Summary overview"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={14} />
                Admin Panel
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Dashboard summary stays here. Clients now live on their own route, so back navigation keeps history clean.
              </p>
            </div>

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

          <div className="grid grid-cols-1 gap-4 border-t border-white/10 p-6 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={Users} label="Total Clients" value={clients.length} />
            <StatCard icon={Layers3} label="Active Clients" value={activeClients} />
            <StatCard icon={BarChart3} label="Joined This Month" value={joinedThisMonth} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quick Note</h2>
              <p className="mt-1 text-sm text-slate-500">
                Open the Clients tab from the sidebar to view the list and open any client detail page.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 text-white">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
