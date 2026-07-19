import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FolderKanban, Layers3, Plus, RefreshCw, Search } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import AdminWorkspaceList from "../components/admin/AdminWorkspaceList";
import AdminFilterDropdown from "../components/admin/AdminFilterDropdown";

const PROJECT_CATEGORIES = {
  standard_websites: "Standard Website",
  dynamic_websites: "Dynamic Website",
  cloud_software_development: "Cloud Software",
  app_development: "App Development",
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

const AdminProjectProductsPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("dateAdded");
  const [groupBy, setGroupBy] = useState("none");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(SummaryApi.adminProjectProducts.url, {
        method: SummaryApi.adminProjectProducts.method.toUpperCase(),
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Projects could not be loaded.");
      }

      setProjects(Array.isArray(result.data) ? result.data : []);
    } catch (fetchError) {
      console.error("Error fetching project products:", fetchError);
      setError(fetchError.message || "Projects could not be loaded.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProjects();
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

  const handleAddProject = () => {
    toast.info("Add Project form will be connected in the next UI step.");
  };

  const handleProjectOpen = () => {
    toast.info("Project detail sub-page will be connected in the next step.");
  };

  const visibleProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = projects;

    if (query) {
      result = result.filter((project) => (
        project.serviceName?.toLowerCase().includes(query) ||
        PROJECT_CATEGORIES[project.category]?.toLowerCase().includes(query) ||
        project.startingNodeTitle?.toLowerCase().includes(query)
      ));
    }

    const getProjectType = (project) => PROJECT_CATEGORIES[project.category] || "Other";
    const getProjectName = (project) => (project.serviceName || "").trim();
    const getTimestamp = (value) => {
      const timestamp = value ? new Date(value).getTime() : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    return [...result].sort((left, right) => {
      if (sortBy === "type") {
        return getProjectType(left).localeCompare(getProjectType(right)) || getProjectName(left).localeCompare(getProjectName(right));
      }

      if (sortBy === "name") {
        return getProjectName(left).localeCompare(getProjectName(right)) || getProjectType(left).localeCompare(getProjectType(right));
      }

      if (sortBy === "modified") {
        return getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt) || getProjectName(left).localeCompare(getProjectName(right));
      }

      return getTimestamp(right.createdAt) - getTimestamp(left.createdAt) || getProjectName(left).localeCompare(getProjectName(right));
    });
  }, [projects, searchTerm, sortBy]);

  const displayRows = useMemo(() => {
    if (groupBy === "none") {
      return visibleProjects.map((project, projectIndex) => ({
        kind: "project",
        project,
        projectIndex,
      }));
    }

    const groups = new Map();
    visibleProjects.forEach((project) => {
      const groupLabel = groupBy === "type"
        ? PROJECT_CATEGORIES[project.category] || "Other"
        : (project.serviceName || "Unnamed Project").trim() || "Unnamed Project";

      if (!groups.has(groupLabel)) groups.set(groupLabel, []);
      groups.get(groupLabel).push(project);
    });

    let projectIndex = 0;
    return [...groups.entries()]
      .sort(([leftLabel], [rightLabel]) => leftLabel.localeCompare(rightLabel))
      .flatMap(([label, groupedProjects]) => [
        { kind: "group", label },
        ...groupedProjects.map((project) => ({
          kind: "project",
          project,
          projectIndex: projectIndex++,
        })),
      ]);
  }, [groupBy, visibleProjects]);

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          icon={FolderKanban}
          title="Projects"
          subtitle="Manage reusable project products."
          actions={
            <div className="flex w-full flex-wrap justify-end gap-2">
              <AdminFilterDropdown
                label="Sort"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                ariaLabel="Sort projects"
              />

              <AdminFilterDropdown
                icon={Layers3}
                label="Group"
                value={groupBy}
                options={groupOptions}
                onChange={setGroupBy}
                ariaLabel="Group projects"
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
              onClick={handleAddProject}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus size={17} />
              Add Project
            </button>
          </div>

          <div className="relative mt-3 w-full">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search projects"
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
                onClick={fetchProjects}
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
              { label: "Project", className: "col-span-12 lg:col-span-4" },
              { label: "Category", className: "col-span-6 lg:col-span-2" },
              { label: "Starting Node", className: "col-span-6 lg:col-span-3" },
              { label: "Status", className: "col-span-6 lg:col-span-2" },
              { label: "Open", className: "col-span-6 text-right lg:col-span-1" },
            ]}
            loading={loading}
            emptyText="No projects found."
            items={displayRows}
            footer={`Showing ${visibleProjects.length} of ${projects.length} projects`}
            renderRow={(row) => row.kind === "group" ? (
              <div
                key={`group-${row.label}`}
                className="col-span-12 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 sm:px-6"
              >
                {row.label}
              </div>
            ) : (
              (() => {
                const { project, projectIndex } = row;
                return (
              <button
                key={project._id || project.id || projectIndex}
                type="button"
                onClick={() => handleProjectOpen(project)}
                className={[
                  "grid w-full grid-cols-12 gap-3 px-5 py-4 text-left transition hover:bg-slate-100 sm:px-6",
                  projectIndex % 2 === 0 ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                <div className="col-span-12 lg:col-span-4">
                  <p className="truncate text-base font-bold text-slate-950">{project.serviceName || "N/A"}</p>
                  <p className="mt-1 text-xs text-slate-500">Project #{projectIndex + 1}</p>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <p className="text-sm font-semibold text-slate-900">{PROJECT_CATEGORIES[project.category] || "N/A"}</p>
                </div>
                <div className="col-span-6 lg:col-span-3 lg:flex lg:items-center">
                  <p className="truncate text-sm font-semibold text-slate-900">{project.startingNodeTitle || "N/A"}</p>
                </div>
                <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{project.isHidden ? "Hidden" : "Visible"}</span>
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

export default AdminProjectProductsPage;
