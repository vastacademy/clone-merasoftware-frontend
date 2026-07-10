import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpDown, RefreshCw, Search, Users2 } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";

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

const getClientLastUpdated = (client) => client?.updatedAt || client?.createdAt || null;

const AdminClientsPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdatedDesc");

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

  const handleClientOpen = (client) => {
    if (!client?._id) return;
    navigate(`/admin-panel/clients/${client._id}`, { state: { client } });
  };

  const displayedClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = clients;

    if (query) {
      result = result.filter((client) => {
        return (
          client.name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query)
        );
      });
    }

    result = [...result].sort((left, right) => {
      const leftName = (left.name || "").toLowerCase();
      const rightName = (right.name || "").toLowerCase();
      const leftUpdated = new Date(getClientLastUpdated(left) || 0).getTime();
      const rightUpdated = new Date(getClientLastUpdated(right) || 0).getTime();

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
  }, [clients, searchTerm, sortBy]);

  return (
    <AdminLayout
      user={user}
      onLogout={handleLogout}
      mobileTitle="Clients"
      mobileSubtitle="Client list"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Users2 size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Clients</h1>
                <p className="text-sm text-slate-500">Customer list fetched from the admin clients endpoint.</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients by name, email, or phone"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:w-72">
                <ArrowUpDown size={16} className="shrink-0 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full cursor-pointer bg-transparent outline-none"
                  aria-label="Sort clients"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    No.
                  </th>
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
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
                      Loading clients...
                    </td>
                  </tr>
                ) : displayedClients.length > 0 ? (
                  displayedClients.map((client, index) => (
                    <tr
                      key={client._id}
                      onClick={() => handleClientOpen(client)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleClientOpen(client);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-slate-500 sm:px-6">
                        {index + 1}
                      </td>
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
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:px-6">
            Showing {displayedClients.length} of {clients.length} clients
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminClientsPage;
