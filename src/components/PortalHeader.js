import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";

/**
 * Slim portal top bar: MeraSoftware logo (left) + profile dropdown (right).
 * No nav links or cart here — navigation lives in the sidebar. Reuses the
 * logo block + profile dropdown from the removed public SharedHeader
 * (backup-publicremoval-phase4A/components/SharedHeader.js), stripped down.
 *
 * Rendered full-width at the very top of both portals, above the sidebar
 * (height h-16 = 64px, which is why the sidebars sit at top-16).
 */
const PortalHeader = ({ user, portalLabel = "Portal", dashboardTo = "/dashboard", onLogout, showProfileLink = true, links = [] }) => {
  const menuRef = useRef(null);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoInfoOpen, setDemoInfoOpen] = useState(false);
  const userInitial = (user?.name || "A").trim().charAt(0).toUpperCase();

  const isLinkActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[120rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to={dashboardTo} className="flex shrink-0 items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white">
            M
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-white">MeraSoftware</p>
            <p className="text-[11px] leading-tight text-slate-400">{portalLabel}</p>
          </div>
        </Link>

        {user?.isGuest ? (
          <div
            className="relative hidden shrink-0 sm:block"
            onMouseEnter={() => setDemoInfoOpen(true)}
            onMouseLeave={() => setDemoInfoOpen(false)}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-purple-100 shadow-[0_0_16px_rgba(168,85,247,0.35)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple-300" />
              Demo Mode
            </span>

            <button
              type="button"
              onClick={() => setDemoInfoOpen((open) => !open)}
              aria-label="What is Demo Mode?"
              className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-900 text-yellow-300 transition hover:text-yellow-200"
            >
              <HelpCircle size={17} />
            </button>

            {demoInfoOpen ? (
              <div className="absolute left-1/2 top-11 z-50 w-72 -translate-x-1/2 rounded-2xl border border-yellow-400/30 bg-slate-900 p-4 text-left shadow-xl">
                <p className="text-sm font-semibold text-white">You're in a Guest Demo Account</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  This is a temporary account with ₹50,000 of demo wallet money so you can explore
                  the full portal — create a project, buy a service, pay invoices — with no real
                  money and no approval needed. It's automatically cleared after 24 hours of
                  inactivity.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {links.length > 0 ? (
          <nav className="hidden flex-1 items-center justify-center gap-1 overflow-x-auto lg:flex" aria-label="Primary navigation">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isLinkActive(to)
                    ? "bg-emerald-500 text-black"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div
          className="relative"
          ref={menuRef}
          onMouseEnter={() => user && setMenuOpen(true)}
          onMouseLeave={() => user && setMenuOpen(false)}
        >
          {user ? (
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
              aria-label="Open profile menu"
            >
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name || "User"}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 text-sm font-bold text-white">
                  {userInitial}
                </span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-200 sm:block">
                {user?.name || "Account"}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Sign in
            </Link>
          )}

          {menuOpen && user ? (
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-xl">
              <div className="border-b border-white/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{user.name || "Account"}</p>
                  {user.isGuest ? (
                    <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-200">
                      Guest
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-slate-400">{user.email || ""}</p>
              </div>
              <Link
                to={dashboardTo}
                className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              {showProfileLink ? (
                <Link
                  to="/profile"
                  className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              ) : null}
              {onLogout ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
