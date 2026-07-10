import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Layers3,
  LogOut,
  Menu,
  RotateCw,
  Users2,
  X,
} from "lucide-react";

export const adminSidebarModules = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, live: true, to: "/admin-panel/dashboard" },
  { id: "clients", label: "Clients", icon: Users2, live: true, to: "/admin-panel/clients" },
  { id: "upcoming-orders", label: "Upcoming Orders", icon: Layers3, soon: true },
  { id: "upcoming-reports", label: "Upcoming Reports", icon: BarChart3, soon: true },
];

const AdminLayout = ({
  user,
  onLogout,
  onLandscapeMode,
  orientationLocking = false,
  isLandscape = false,
  mobileTitle = "Admin Dashboard",
  mobileSubtitle = "Clients module",
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
                  onClick={() => setMobileSidebarOpen(false)}
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
                onClick={() => setMobileSidebarOpen(false)}
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
        {onLandscapeMode ? (
          <button
            type="button"
            onClick={onLandscapeMode}
            className="mb-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10 lg:hidden"
          >
            <span>Landscape Mode</span>
            <RotateCw size={16} className={orientationLocking ? "animate-spin" : ""} />
          </button>
        ) : null}

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
            <p className="text-sm font-semibold text-slate-900">{mobileTitle}</p>
            <p className="text-xs text-slate-500">{mobileSubtitle}</p>
          </div>

          {onLandscapeMode ? (
            <button
              type="button"
              onClick={onLandscapeMode}
              disabled={orientationLocking}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw size={16} className={orientationLocking ? "animate-spin" : ""} />
              {isLandscape ? "Portrait" : "Landscape"}
            </button>
          ) : (
            <span className="inline-flex h-10 w-10" />
          )}
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

      <main className="min-h-screen overflow-auto bg-slate-100 pt-20 lg:pt-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
