import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart3,
  Layers3,
  Menu,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  X,
  Users2,
  Users,
} from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";

const sidebarModules = [
  { id: "clients", label: "Clients", icon: Users2, live: true },
  { id: "upcoming-orders", label: "Upcoming Orders", icon: Layers3, soon: true },
  { id: "upcoming-reports", label: "Upcoming Reports", icon: BarChart3, soon: true },
];

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-IN");
};

const AdminDashboard = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const [activeModule, setActiveModule] = useState("clients");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orientationLocking, setOrientationLocking] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

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
      setMobileSidebarOpen(false);
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
        (left, right) =>
          new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const orientationQuery = window.matchMedia("(orientation: landscape)");

    const syncOrientation = () => {
      setIsLandscape(orientationQuery.matches);
    };

    syncOrientation();

    if (orientationQuery.addEventListener) {
      orientationQuery.addEventListener("change", syncOrientation);
      return () => orientationQuery.removeEventListener("change", syncOrientation);
    }

    orientationQuery.addListener(syncOrientation);
    return () => orientationQuery.removeListener(syncOrientation);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
  };

  const handleModuleSelect = (moduleId) => {
    setActiveModule(moduleId);
    setMobileSidebarOpen(false);
  };

  const handleLandscapeMode = async () => {
    const orientation = window.screen?.orientation;

    try {
      setOrientationLocking(true);
      if (isLandscape) {
        if (orientation?.unlock) {
          orientation.unlock();
        }
        toast.success("Portrait mode enabled");
      } else if (orientation?.lock) {
        await orientation.lock("landscape");
        toast.success("Landscape mode enabled");
      } else {
        toast.error("Landscape mode is not supported in this browser");
      }
      setMobileSidebarOpen(false);
    } catch (error) {
      console.error("Failed to lock orientation:", error);
      toast.error("Could not enable landscape mode");
    } finally {
      setOrientationLocking(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) => {
      return (
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
      );
    });
  }, [clients, searchTerm]);

  const activeClients = useMemo(() => {
    return clients.filter(
      (client) => (client.status || "active").toLowerCase() === "active"
    ).length;
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

  const sidebarContent = (
    <div className="flex h-full w-full flex-col">
      <div className="border-b border-slate-800 px-5 pt-8 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user?.name || "Admin"}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-lg font-bold">
                {(user?.name || "A").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || "Admin"}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.email || "Admin Panel"}
            </p>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Dashboard
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Modules
        </p>

        <div className="mt-3 space-y-2">
          {sidebarModules.map((module) => {
            const isActive = activeModule === module.id;
            const Icon = module.icon;
            const isUpcoming = Boolean(module.soon);
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => !isUpcoming && handleModuleSelect(module.id)}
                disabled={isUpcoming}
                className={[
                  "group flex w-full min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all",
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30"
                    : isUpcoming
                      ? "bg-slate-900/40 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900/70 text-slate-200 hover:bg-slate-800",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{module.label}</span>
                <span className="text-xs opacity-70">
                  {module.live ? "Live" : "Soon"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLandscapeMode}
          className="mb-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10 lg:hidden"
        >
          <span>Landscape Mode</span>
          <RotateCw size={16} className={orientationLocking ? "animate-spin" : ""} />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <span className="flex-1">Logout</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 lg:pl-72">
      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-72 border-r border-slate-800 bg-slate-950 text-white shadow-2xl lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">Admin Dashboard</p>
            <p className="text-xs text-slate-500">Clients module</p>
          </div>

          <button
            type="button"
            onClick={handleLandscapeMode}
            disabled={orientationLocking}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw size={16} className={orientationLocking ? "animate-spin" : ""} />
            {isLandscape ? "Portrait" : "Landscape"}
          </button>
        </div>
      </header>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            aria-label="Close admin menu overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="absolute left-0 top-16 h-[calc(100vh-4rem)] w-[86vw] max-w-xs border-r border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Admin Menu</p>
                <p className="text-xs text-slate-400">Select module</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300"
                aria-label="Close admin menu"
              >
                <X size={18} />
              </button>
            </div>

            {sidebarContent}
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-6 pt-20 sm:px-6 lg:px-8 lg:pt-6">
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
                Fixed sidebar layout on desktop, drawer on mobile, and clients module as the active source right now.
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
            <StatCard
              icon={BarChart3}
              label="Joined This Month"
              value={joinedThisMonth}
            />
          </div>
        </section>

        {activeModule === "clients" && (
          <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Clients</h2>
                <p className="text-sm text-slate-500">
                  Customer list fetched from the admin clients endpoint.
                </p>
              </div>

              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients by name, email, or phone"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6"
                      >
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client._id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900 sm:px-6">
                          {client.name || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                          {client.email || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                          {client.phone || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm sm:px-6">
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {client.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                          {formatDate(client.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6"
                      >
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:px-6">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </section>
        )}
      </main>
    </div>
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
