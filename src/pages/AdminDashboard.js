import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, BarChart3, Clock3, Layers3, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
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

      setClients(result.data || []);
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

  const recentClients = useMemo(() => {
    return clients.slice(0, 6);
  }, [clients]);

  const inactiveClients = useMemo(() => {
    return clients.filter((client) => (client.status || "active").toLowerCase() !== "active").length;
  }, [clients]);

  const openClientsPage = () => {
    navigate("/admin-panel/clients");
  };

  return (
    <AdminLayout
      user={user}
      onLogout={handleLogout}
    >
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
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

        <section className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={openClientsPage}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Open Clients</p>
                <p className="mt-2 text-sm text-slate-500">Search customers and open client workspace.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>
          </button>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Inactive Clients</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{inactiveClients}</p>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Client Search</p>
                <p className="mt-2 text-sm text-slate-500">Available from the Clients route.</p>
              </div>
              <Search className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Clients</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest customer records from the admin clients endpoint.
              </p>
            </div>
            <button
              type="button"
              onClick={openClientsPage}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              View all clients
              <ArrowRight size={16} />
            </button>
          </div>

          <div>
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">Loading recent clients...</div>
            ) : recentClients.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">No clients found.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentClients.map((client, index) => (
                  <button
                    key={client._id}
                    type="button"
                    onClick={() => navigate(`/admin-panel/clients/${client._id}`, { state: { client } })}
                    className={[
                      "grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="col-span-12 lg:col-span-5">
                      <p className="truncate text-base font-bold text-slate-950">{client.name || "N/A"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{client.email || "N/A"}</p>
                    </div>
                    <div className="col-span-6 lg:col-span-3 lg:flex lg:items-center">
                      <p className="truncate text-sm font-semibold text-slate-900">{client.phone || "No phone"}</p>
                    </div>
                    <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {client.status || "Active"}
                      </span>
                    </div>
                    <div className="col-span-12 flex items-center justify-between lg:col-span-2 lg:justify-end">
                      <span className="text-xs text-slate-500">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString("en-IN") : "N/A"}
                      </span>
                      <ArrowRight className="ml-3 h-5 w-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
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
