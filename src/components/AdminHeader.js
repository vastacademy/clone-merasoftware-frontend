import React, { useRef, useState } from "react";
import { GrSearch } from "react-icons/gr";
import { FaRegCircleUser } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import { toast } from "sonner";
import { logout } from "../store/userSlice";
import { useOnlineStatus } from "../App";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { MdAdminPanelSettings } from "react-icons/md";

const AdminHeader = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const { isOnline } = useOnlineStatus();
  const navigate = useNavigate();
  const [menuDisplay, setMenuDisplay] = useState(false);
  const menuRef = useRef(null);
  const [search, setSearch] = useState("");

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
    const { value } = e.target;
    setSearch(value);
  };

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
      <header className="hidden md:block bg-slate-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-4 flex items-center justify-between">
            {/* Logo */}
            <Link to={"/"}>
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <span className="font-bold text-lg text-white">
                    MeraSoftware
                  </span>
                  <p className="text-xs text-gray-400">Admin Portal</p>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleSearch}
                  value={search}
                />
                <GrSearch
                  size={18}
                  className="absolute left-3 top-2.5 text-gray-500"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Admin Panel Button */}
              <Link
                to="/admin-panel/dashboard"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                <MdAdminPanelSettings className="text-lg" />
                Admin Panel
              </Link>

              {/* Profile Section */}
              <div className="relative flex justify-center">
                {user?._id && (
                  <div
                    className="cursor-pointer flex justify-center"
                    onClick={() => setMenuDisplay((prev) => !prev)}
                  >
                    {user?.profilePic ? (
                      <img
                        src={user?.profilePic}
                        className="w-10 h-10 rounded-full border-2 border-blue-500"
                        alt={user?.name}
                      />
                    ) : (
                      <FaRegCircleUser className="text-2xl text-gray-300" />
                    )}
                  </div>
                )}

                {menuDisplay && (
                  <div
                    className="absolute bg-slate-800 border border-slate-700 bottom-0 w-56 top-12 h-fit p-3 shadow-xl rounded-lg"
                    ref={menuRef}
                  >
                    <div className="border-b border-slate-700 pb-3 mb-3">
                      <p className="text-white font-semibold text-sm">{user?.name}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                      <p className="text-blue-400 text-xs font-medium mt-1">
                        Role: Admin
                      </p>
                    </div>
                    <nav className="space-y-2">
                      <Link
                        to="/admin-panel/dashboard"
                        className="block px-3 py-2 rounded hover:bg-slate-700 text-gray-200 text-sm"
                        onClick={() => setMenuDisplay(false)}
                      >
                        Dashboard
                      </Link>
                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded hover:bg-red-600/20 text-red-400 text-sm font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </nav>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="hidden md:block">
                {user?._id && (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 font-medium transition-all"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Admin Header */}
      <header className="md:hidden bg-slate-900 shadow-lg px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Link to={"/"}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white font-bold rounded-md">
                M
              </div>
              <div>
                <span className="font-bold text-sm text-white">MeraSoftware</span>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user?._id && (
              <button
                onClick={() => setMenuDisplay(!menuDisplay)}
                className="w-8 h-8 flex items-center justify-center"
              >
                {user?.profilePic ? (
                  <img
                    src={user?.profilePic}
                    className="w-8 h-8 rounded-full border border-blue-500"
                    alt={user?.name}
                  />
                ) : (
                  <FaRegCircleUser className="text-lg text-gray-300" />
                )}
              </button>
            )}
          </div>
        </div>

        {menuDisplay && (
          <div className="mt-3 bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-white font-semibold text-sm mb-2">{user?.name}</p>
            <Link
              to="/admin-panel/dashboard"
              className="block px-3 py-2 rounded hover:bg-slate-700 text-gray-200 text-sm mb-2"
              onClick={() => setMenuDisplay(false)}
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded hover:bg-red-600/20 text-red-400 text-sm font-medium"
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
