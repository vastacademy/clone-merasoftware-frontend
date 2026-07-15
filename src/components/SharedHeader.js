import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Menu, ShoppingCart, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import SummaryApi from "../common";
import Context from "../context";
import { useOnlineStatus } from "../App";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import displayCurrency from "../helpers/displayCurrency";
import NotificationBell from "./NotificationBell";
import BrandLogo from "./BrandLogo";

const publicNavigation = [
  { label: "Home", to: "/home" },
  { label: "Services", to: "/service-card" },
  { label: "Contact", to: "/contact-us" },
];

const customerNavigation = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Projects & Plans", to: "/projects-and-plans" },
  { label: "Orders", to: "/order" },
  { label: "Support", to: "/support" },
];

const adminNavigation = [
  { label: "Dashboard", to: "/admin-panel/dashboard" },
  { label: "Clients", to: "/admin-panel/clients" },
];

const getHeaderSurface = (pathname) => {
  if (pathname.startsWith("/admin-panel")) return "admin";

  const customerPaths = [
    "/dashboard",
    "/projects-and-plans",
    "/cart",
    "/order",
    "/order-detail",
    "/project-details",
    "/wallet",
    "/my-updates",
    "/my-invoices",
    "/direct-payment",
    "/support",
    "/installment-payment",
    "/profile",
    "/support-tickets",
    "/complete-profile",
  ];

  return customerPaths.some((path) => pathname.startsWith(path)) ? "customer" : "public";
};

const getPortalPath = (user) =>
  user?.role === "admin" ? "/admin-panel/dashboard" : "/dashboard";

const SharedHeader = () => {
  const user = useSelector((state) => state?.user?.user);
  const context = useContext(Context);
  const { isOnline } = useOnlineStatus();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const surface = getHeaderSurface(location.pathname);
  const navigation = surface === "admin" ? adminNavigation : surface === "customer" ? customerNavigation : publicNavigation;
  const userInitial = (user?.name || "A").trim().charAt(0).toUpperCase();

  useEffect(() => {
    const closeMenus = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const handleLogout = async () => {
    try {
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) toast.success(data.message);
      }

      CookieManager.clearAll();
      StorageService.clearUserData();
      dispatch(logout());
      setMenuOpen(false);
      setMobileOpen(false);
      navigate("/home");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const isActive = (to) =>
    to === "/home" ? location.pathname === "/home" : location.pathname.startsWith(to);

  const closeMobile = () => setMobileOpen(false);
  const portalLabel = surface === "admin" ? "Admin Portal" : surface === "customer" ? "Customer Portal" : "Digital Solutions";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="flex shrink-0 items-center gap-3" onClick={closeMobile}>
          <BrandLogo />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-slate-950">MeraSoftware</p>
            <p className="text-[11px] leading-tight text-slate-500">{portalLabel}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.to} to={item.to} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive(item.to) ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative flex items-center gap-2">
          {surface === "customer" ? (
            <>
              <NotificationBell />
              <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Open cart">
                <ShoppingCart size={19} />
                {context?.cartProductCount > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-emerald-500 px-1 text-center text-[10px] font-bold text-slate-950">{context.cartProductCount}</span> : null}
              </Link>
              <Link to="/wallet" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 xl:flex">
                <Wallet size={17} />
                {displayCurrency(context?.walletBalance || 0)}
              </Link>
            </>
          ) : null}

          <div className="relative" ref={menuRef} onMouseEnter={() => user && setMenuOpen(true)} onMouseLeave={() => user && setMenuOpen(false)}>
            {user ? (
              <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100" aria-label="Open profile menu">
                {user?.profilePic ? <img src={user.profilePic} alt={user.name || "User"} className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-sm font-bold text-slate-900">{userInitial}</span>}
                <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 sm:block">{user?.name || "Account"}</span>
                <ChevronDown size={16} className={`text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`} />
              </button>
            ) : (
              <Link to="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Sign in</Link>
            )}

            {menuOpen && user ? (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name || "Account"}</p>
                  <p className="truncate text-xs text-slate-500">{user.email || ""}</p>
                </div>
                <Link to={getPortalPath(user)} className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                {surface === "customer" ? <Link to="/profile" className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>Profile</Link> : null}
                <button type="button" onClick={handleLogout} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Logout</button>
              </div>
            ) : null}
          </div>

          <button type="button" onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </div>

      {mobileOpen ? <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-[90rem] flex-col gap-1 sm:px-2">{navigation.map((item) => <Link key={item.to} to={item.to} onClick={closeMobile} className={`rounded-xl px-3 py-3 text-sm font-semibold ${isActive(item.to) ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{item.label}</Link>)}</div></nav> : null}
    </header>
  );
};

export default SharedHeader;
