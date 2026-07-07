import React, { useContext, useEffect, useRef, useState } from "react";
import Logo from "../assest/newlogo.png";
import { GrSearch } from "react-icons/gr";
import { FaRegCircleUser } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import { toast } from "sonner";
import { setUserDetails, logout } from "../store/userSlice";
import ROLE from "../common/role";
import Context from "../context";
import { useOnlineStatus } from "../App";
import { IoWalletOutline } from "react-icons/io5";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import displayCurrency from "../helpers/displayCurrency";
import NotificationBell from "./NotificationBell";
import LoginPopup from "../components/LoginPopup";

const CustomerHeader = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const { isOnline } = useOnlineStatus();
  const context = useContext(Context);
  const activeProject = context.activeProject;
  const navigate = useNavigate();
  const [menuDisplay, setMenuDisplay] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInput = useLocation();
  const URLSearch = new URLSearchParams(searchInput?.search);
  const searchQuery = URLSearch.getAll("q");
  const [search, setSearch] = useState(searchQuery);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const userDetails = useSelector((state) => state.user.user);
  const isAuthenticated = !!userDetails?._id;
  const isInitialized = useSelector((state) => state.user.initialized);

  const location = useLocation();
  const currentPath = location.pathname;

  const onBack = () => {
    navigate(-1);
  };

  const getProjectLink = () => {
    if (activeProject && activeProject._id) {
      return `/project-details/${activeProject._id}`;
    }
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/project-details/")) {
      return currentPath;
    }
    return "/order";
  };

  const buildCategoryQueryString = (categoryValues) => {
    if (!categoryValues || categoryValues.length === 0) return "";
    return categoryValues.map((val) => `category=${val}`).join("&&");
  };

  const handleProtectedNavigation = (e, targetPath) => {
    e.preventDefault();

    if (isInitialized && !userDetails) {
      setShowLoginPopup(true);
    } else {
      navigate(targetPath || e.currentTarget.getAttribute('href'));
    }
  };

  useEffect(() => {
    const loadServiceTypes = async () => {
      const cachedCategories = StorageService.getProductsData("categories");

      if (cachedCategories) {
        processCategories(cachedCategories);
        setLoading(false);
      }

      if (isOnline) {
        try {
          const response = await fetch(SummaryApi.allCategory.url);
          const data = await response.json();

          if (data.success) {
            StorageService.setProductsData("categories", data.data);
            processCategories(data.data);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadServiceTypes();
  }, [isOnline]);

  useEffect(() => {
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

  const processCategories = (data) => {
    const uniqueServiceTypes = [
      ...new Set(data.map((item) => item.serviceType)),
    ];

    const serviceTypeObjects = uniqueServiceTypes.map((type) => {
      const typeCategories = data.filter((cat) => cat.serviceType === type);

      return {
        serviceType: type,
        queryCategoryValues: typeCategories.map((cat) => cat.categoryValue),
      };
    });

    setServiceTypes(serviceTypeObjects);
  };

  const handleLogout = async () => {
    try {
      const guestSlides = StorageService.getGuestSlides();
      if (guestSlides && guestSlides.length > 0) {
        try {
          sessionStorage.setItem(
            "sessionGuestSlides",
            JSON.stringify(guestSlides)
          );
          localStorage.setItem(
            "preservedGuestSlides",
            JSON.stringify(guestSlides)
          );
          localStorage.setItem("guestSlides", JSON.stringify(guestSlides));
          localStorage.setItem("lastLogoutTimestamp", Date.now().toString());
        } catch (backupError) {
          console.error("Failed to backup slides:", backupError);
        }
      }

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

      const preserved = localStorage.getItem("preservedGuestSlides");
      const sessionBackup = sessionStorage.getItem("sessionGuestSlides");

      if (!localStorage.getItem("guestSlides")) {
        if (preserved) {
          localStorage.setItem("guestSlides", preserved);
        } else if (sessionBackup) {
          localStorage.setItem("guestSlides", sessionBackup);
        }
      }

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

    if (value) {
      navigate(`/search?q=${value}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <>
      <header className="hidden md:block bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-4 flex items-center justify-between">
            <Link to={"/"}>
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="font-bold text-xl text-gray-800">
                  MeraSoftware
                </span>
              </div>
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for services..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleSearch}
                  value={search}
                />
                <GrSearch
                  size={18}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Link to={"/wallet"}>
                {user?._id && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full">
                    <IoWalletOutline className="text-xl text-green-600" />
                    <span className="font-medium text-green-600">
                      {displayCurrency(context.walletBalance)}
                    </span>
                  </div>
                )}
              </Link>
              <div className="relative flex justify-center">
                {user?._id && (
                  <div
                    className="text-3xl cursor-pointer relative flex justify-center"
                    onClick={() => setMenuDisplay((preve) => !preve)}
                  >
                    {user?.profilePic ? (
                      <img
                        src={user?.profilePic}
                        className="w-10 h-10 rounded-full"
                        alt={user?.name}
                      />
                    ) : (
                      <FaRegCircleUser />
                    )}
                  </div>
                )}

                {menuDisplay && (
                  <div
                    className="absolute bg-white bottom-0 w-44 top-11 h-fit p-2 shadow-lg rounded"
                    ref={menuRef}
                  >
                    <nav>
                      <Link
                        to={"/order"}
                        className="whitespace-nowrap hidden md:block hover:bg-slate-100 p-2"
                        onClick={() => setMenuDisplay((preve) => !preve)}
                      >
                        Settings
                      </Link>
                      <div className="p-2 hover:bg-slate-100 flex items-center gap-2">
                        <IoWalletOutline />
                        <span>Balance: ₹{context.walletBalance}</span>
                      </div>
                    </nav>
                  </div>
                )}
              </div>

              <NotificationBell />

              <div className="hidden md:block">
                {user?._id ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded-full text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to={"/login"}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-95 transition-all duration-150"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>

          {user?.role !== ROLE.PARTNER && (
            <nav className="border-t py-3">
              <ul className="flex justify-between overflow-x-auto scrollbar-none">
                <li>
                  <a
                    href="/dashboard"
                    onClick={(e) => handleProtectedNavigation(e, '/dashboard')}
                    className="text-gray-800 font-medium whitespace-nowrap hover:text-blue-600 px-3"
                  >
                    My Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/order"
                    onClick={(e) => handleProtectedNavigation(e, '/order')}
                    className="text-gray-800 font-medium whitespace-nowrap hover:text-blue-600 px-3"
                  >
                    My Orders
                  </a>
                </li>
                <li>
                  <Link
                    to={getProjectLink()}
                    onClick={(e) => {
                      if (isInitialized && !userDetails) {
                        e.preventDefault();
                        setShowLoginPopup(true);
                      }
                    }}
                    className="text-gray-800 font-medium whitespace-nowrap hover:text-blue-600 px-3"
                  >
                    My Projects
                  </Link>
                </li>
                <li>
                  <a
                    href="/wallet"
                    onClick={(e) => handleProtectedNavigation(e, '/wallet')}
                    className="text-gray-800 font-medium whitespace-nowrap hover:text-blue-600 px-3"
                  >
                    My Wallet
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    onClick={(e) => handleProtectedNavigation(e, '/support')}
                    className="text-gray-800 font-medium whitespace-nowrap hover:text-blue-600 px-3"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      <header className="md:hidden bg-white shadow-sm px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Link to={"/"}>
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-md mr-2">
                M
              </div>
              <span className="font-bold text-lg">MeraSoftware</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
          </div>
        </div>

        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search projects, orders..."
            className="w-full py-2 px-4 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <GrSearch size={16} />
          </div>
        </div>
      </header>

      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
      />
    </>
  );
};

export default CustomerHeader;
