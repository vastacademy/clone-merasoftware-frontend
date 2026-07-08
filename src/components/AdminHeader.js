import React, { useRef, useState } from "react";
import { GrSearch } from "react-icons/gr";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import { toast } from "sonner";
import { logout } from "../store/userSlice";
import { useOnlineStatus } from "../App";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { ChevronDown } from "lucide-react";

const AdminHeader = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const { isOnline } = useOnlineStatus();
  const navigate = useNavigate();
  const [menuDisplay, setMenuDisplay] = useState(false);
  const menuRef = useRef(null);
  const [search, setSearch] = useState("");

  const userInitial = (user?.name || "A").trim().charAt(0).toUpperCase();

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
      setMenuDisplay(false);
      setSearch("");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const openMenu = () => setMenuDisplay(true);
  const closeMenu = () => setMenuDisplay(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuDisplay
      ) {
        setMenuDisplay(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (menuDisplay) setMenuDisplay(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [menuDisplay]);

  return (
    <>
      {/* Desktop Admin Header */}
      <header className="hidden md:block bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-4 flex items-center justify-between">
            {/* Logo */}
            <Link to={"/"}>
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900">
                    MeraSoftware
                  </span>
                  <p className="text-xs text-slate-500">Admin Portal</p>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleSearch}
                  value={search}
                />
                <GrSearch
                  size={18}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Profile Section */}
              <div
                className="relative flex justify-center"
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
              >
                {user?._id && (
                  <button
                    type="button"
                    className="cursor-pointer flex items-center gap-3 rounded-full transition-transform hover:scale-105"
                    onClick={openMenu}
                    aria-label="Open admin profile menu"
                  >
                    {user?.profilePic ? (
                      <img
                        src={user?.profilePic}
                        className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover"
                        alt={user?.name}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-900 border-2 border-slate-200">
                        {userInitial}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">
                        {user?.name || "Admin User"}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight">
                        Admin
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 transition-transform duration-200 ${
                        menuDisplay ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}

                {menuDisplay && (
                  <div
                    className="absolute bg-white border border-slate-200 bottom-0 w-56 top-12 h-fit p-3 shadow-xl rounded-lg"
                    ref={menuRef}
                    onMouseEnter={openMenu}
                    onMouseLeave={closeMenu}
                  >
                    <div className="border-b border-slate-200 pb-3 mb-3">
                      <p className="text-slate-900 font-semibold text-sm">{user?.name}</p>
                      <p className="text-slate-500 text-xs">{user?.email}</p>
                      <p className="text-blue-600 text-xs font-medium mt-1">
                        Role: Admin
                      </p>
                    </div>
                    <nav className="space-y-2">
                      <Link
                        to="/admin-panel/dashboard"
                        className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-700 text-sm"
                        onClick={() => setMenuDisplay(false)}
                      >
                        Admin Panel
                      </Link>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-500 text-sm font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </nav>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Admin Header */}
      <header className="md:hidden bg-white shadow-sm border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Link to={"/"}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-md">
                M
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900">MeraSoftware</span>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user?._id && (
              <button
                onClick={() => setMenuDisplay(!menuDisplay)}
                className="flex items-center gap-2 rounded-full transition-transform hover:scale-105"
                aria-label="Open admin profile menu"
              >
                {user?.profilePic ? (
                  <img
                    src={user?.profilePic}
                    className="w-12 h-12 rounded-full border border-slate-200 object-cover"
                    alt={user?.name}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-900 border border-slate-200">
                    {userInitial}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight">
                    Admin
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform duration-200 ${
                    menuDisplay ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {menuDisplay && (
          <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
            <p className="text-slate-900 font-semibold text-sm mb-2">{user?.name}</p>
            <Link
              to="/admin-panel/dashboard"
              className="block px-3 py-2 rounded hover:bg-slate-100 text-slate-700 text-sm mb-2"
              onClick={() => setMenuDisplay(false)}
            >
              Admin Panel
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-500 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </header>
    </>
  );
};

export default AdminHeader;
