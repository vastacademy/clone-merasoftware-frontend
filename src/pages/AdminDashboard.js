import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Users,
  Layers3,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import SummaryApi from "../common";

const tabs = [
  { id: "clients", label: "Clients" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "analytics", label: "Analytics" },
];

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-IN");
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
    return clients.filter((client) => (client.status || "active").toLowerCase() === "active").length;
  }, [clients]);

  const joinedThisMonth = useMemo(() => {
    const now = new Date();
    return clients.filter((client) => {
      if (!client.createdAt) return false;
      const createdAt = new Date(client.createdAt);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
  }, [clients]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={14} />
                Admin Panel
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Client operations and management area. Navigation stays on the left side panel for fast module switching.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total Clients" value={clients.length} />
            <StatCard icon={Layers3} label="Active Clients" value={activeClients} />
            <StatCard icon={ShoppingCart} label="Tabs Ready" value={tabs.length} />
            <StatCard icon={BarChart3} label="Joined This Month" value={joinedThisMonth} />
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)] lg:w-72">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-900">Modules</h2>
            <p className="mt-1 text-sm text-slate-500">Switch sections from the side panel.</p>
          </div>

          <div className="p-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "mb-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  <span className="text-xs opacity-70">
                    {tab.id === "clients" ? clients.length : "Soon"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {activeTab === "clients" ? (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client._id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">
                          {client.name || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {client.email || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {client.phone || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {client.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatDate(client.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">Section under construction</p>
              <p className="mt-2 text-sm text-slate-500">
                This tab is reserved for the next admin module.
              </p>
            </section>
          )}
        </section>
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
