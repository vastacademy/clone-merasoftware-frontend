// src/components/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  Home, ShoppingBag, UserCircle, Wallet, MessageSquare, LogOut,
  FileText, X
} from 'lucide-react';
import SummaryApi from '../common';
import { logout } from '../store/userSlice';
import CookieManager from '../utils/cookieManager';
import StorageService from '../utils/storageService';
import { useOnlineStatus } from '../App';

const DashboardLayout = ({ children, user, walletBalance, cartCount, isLoading, activeProject }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isOnline } = useOnlineStatus();
  const currentPath = location.pathname;
  
  // Get user from Redux store as backup
  const reduxUser = useSelector(state => state?.user?.user);
  const currentUser = user || reduxUser;
  
  // State for logout confirmation popup
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // If user is null/undefined, redirect to login
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, isLoading, navigate]);
  
  // Check if the path is active
  const isActive = (path) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true;
    if (path !== '/dashboard' && currentPath.startsWith(path)) return true;
    return false;
  };

  // Get the page title based on current path
  const getPageTitle = () => {
    if (currentPath.startsWith('/dashboard')) return 'Dashboard';
    if (currentPath.startsWith('/order')) return 'Your Orders';
    if (currentPath.startsWith('/project-details')) return 'Your Project';
    if (currentPath.startsWith('/profile')) return 'Account Details';
    if (currentPath.startsWith('/wallet')) return 'Wallet Details';
    if (currentPath.startsWith('/support')) return 'Contact Support';
    return 'Dashboard';
  };

  const getProjectLink = () => {
    // If activeProject is provided and has an _id, use it
    if (activeProject && activeProject._id) {
      return `/project-details/${activeProject._id}`;
    }
    
    // If user is already on a project details page, keep them on that project
    if (currentPath.startsWith('/project-details/')) {
      return currentPath;
    }
    
    // Otherwise, redirect to orders page where they can select a project
    return '/order';
  };

  // Handle logout confirmation
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  // Handle actual logout
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // 1. Save guest slides before logout
      const guestSlides = StorageService.getGuestSlides();
      if (guestSlides && guestSlides.length > 0) {
        try {
          // Store in multiple locations for backup
          sessionStorage.setItem('sessionGuestSlides', JSON.stringify(guestSlides));
          localStorage.setItem('preservedGuestSlides', JSON.stringify(guestSlides));
          localStorage.setItem('guestSlides', JSON.stringify(guestSlides)); 
          localStorage.setItem('lastLogoutTimestamp', Date.now().toString());
        } catch (backupError) {
          console.error('Failed to backup slides:', backupError);
        }
      }

      // 2. Call logout API if online
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: 'include'
        });
    
        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
        }
      }

      // 3. Clear cookies
      CookieManager.clearAll();
      
      // 4. Clear user data from localStorage
      StorageService.clearUserData();
      
      // 5. Verify guest slides are preserved
      const preserved = localStorage.getItem('preservedGuestSlides');
      const sessionBackup = sessionStorage.getItem('sessionGuestSlides');
      
      if (!localStorage.getItem('guestSlides')) {
        if (preserved) {
          localStorage.setItem('guestSlides', preserved);
        } else if (sessionBackup) {
          localStorage.setItem('guestSlides', sessionBackup);
        }
      }
      
      // 6. Close popup first
      setShowLogoutConfirmation(false);
      
      // 7. Dispatch logout action
      dispatch(logout());
      
      // 8. Navigate after a small delay to prevent race condition
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
      
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle cancel logout
  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // Loading state or no user
  if (isLoading || !currentUser) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-full p-4 flex flex-col">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 lg:pl-72">
        <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-72 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl lg:flex">
          <div className="border-b border-white/10 px-5 pt-8 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
                {currentUser?.profilePic ? (
                  <img
                    src={currentUser.profilePic}
                    alt={currentUser?.name || 'User'}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {(currentUser?.name || 'U').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser?.name || 'User'}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {currentUser?.email || 'Customer Portal'}
                </p>
              </div>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              {getPageTitle()}
            </div>
          </div>

          <div className="flex-1 px-3 py-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Modules
            </p>

            <div className="mt-3 space-y-2">
              <Link
                to="/dashboard"
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/dashboard')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <Home size={18} className="shrink-0" />
                <span className="flex-1">Dashboard</span>
                <span className="text-xs opacity-70">Live</span>
              </Link>

              <Link
                to="/order"
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/order')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <ShoppingBag size={18} className="shrink-0" />
                <span className="flex-1">Orders</span>
              </Link>

              <Link
                to={getProjectLink()}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/project-details')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <FileText size={18} className="shrink-0" />
                <span className="flex-1">Project</span>
              </Link>

              <Link
                to="/profile"
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/profile')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <UserCircle size={18} className="shrink-0" />
                <span className="flex-1">Account</span>
              </Link>

              <Link
                to="/wallet"
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/wallet')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <Wallet size={18} className="shrink-0" />
                <span className="flex-1">Wallet</span>
              </Link>

              <Link
                to="/support"
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/support')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                <MessageSquare size={18} className="shrink-0" />
                <span className="flex-1">Support</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
              disabled={isLoggingOut}
            >
              <LogOut size={18} className="shrink-0" />
              <span className="flex-1">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <main className="min-h-screen overflow-auto bg-slate-100">
            {children}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirmation && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
              <button
                onClick={handleCancelLogout}
                className="text-gray-400 hover:text-gray-600"
                disabled={isLoggingOut}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Hello <span className="font-medium text-gray-800">{currentUser?.name || 'User'}</span>,
              </p>
              <p className="text-gray-600">
                Are you sure you want to logout from your account?
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={isLoggingOut}
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;
