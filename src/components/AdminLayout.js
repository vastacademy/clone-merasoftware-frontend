import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  Layers3,
  LogOut,
  PanelsTopLeft,
  Users2,
} from "lucide-react";

export const adminSidebarModules = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, live: true, to: "/admin-panel/dashboard" },
  { id: "clients", label: "Clients", icon: Users2, live: true, to: "/admin-panel/clients" },
  {
    id: "website-management",
    label: "Website Management",
    icon: PanelsTopLeft,
    group: true,
    children: [
      { id: "projects", label: "Projects", icon: BriefcaseBusiness, live: true, to: "/admin-panel/website-management/projects" },
    ],
  },
  { id: "upcoming-orders", label: "Upcoming Orders", icon: Layers3, soon: true },
  { id: "upcoming-reports", label: "Upcoming Reports", icon: BarChart3, soon: true },
];

const AdminLayout = ({
  user,
  onLogout,
  children,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

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
          Admin Panel
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Modules
        </p>

        <div className="mt-3 space-y-2">
          {adminSidebarModules.map((module) => {
            if (module.group) {
              const GroupIcon = module.icon;
              return (
                <div key={module.id} className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    <GroupIcon size={16} className="shrink-0" />
                    <span>{module.label}</span>
                  </div>
                  {module.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childIsActive = currentPath === child.to || currentPath.startsWith(`${child.to}/`);
                    return (
                      <Link
                        key={child.id}
                        to={child.to}
                        className={`group ml-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${childIsActive ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30" : "bg-slate-900/70 text-slate-200 hover:bg-slate-800"}`}
                      >
                        <ChildIcon size={18} className="shrink-0" />
                        <span className="flex-1">{child.label}</span>
                        <span className="text-xs opacity-70">{child.live ? "Live" : "Soon"}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isActive =
              currentPath === module.to ||
              (module.to && currentPath.startsWith(`${module.to}/`));
            const Icon = module.icon;
            const isUpcoming = Boolean(module.soon);
            const buttonClassName = [
              "group flex w-full min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all",
              isActive
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30"
                : isUpcoming
                  ? "cursor-not-allowed bg-slate-900/40 text-slate-500"
                  : "bg-slate-900/70 text-slate-200 hover:bg-slate-800",
            ].join(" ");

            if (module.to) {
              return (
                <Link
                  key={module.id}
                  to={module.to}
                  className={buttonClassName}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{module.label}</span>
                  <span className="text-xs opacity-70">
                    {module.live ? "Live" : "Soon"}
                  </span>
                </Link>
              );
            }

            return (
              <button
                key={module.id}
                type="button"
                disabled={isUpcoming}
                className={buttonClassName}
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
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <LogOut size={18} className="shrink-0" />
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

      <main className="min-h-screen overflow-auto bg-slate-100">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
