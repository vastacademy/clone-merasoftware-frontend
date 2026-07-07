// src/components/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  Home, ShoppingBag, UserCircle, Wallet, MessageSquare, LogOut,
  Search, Bell, ChevronDown, User,
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
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar - Only visible on desktop */}
        <aside className="hidden lg:block lg:w-64 bg-white border-r shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
            <h1 className="mr-2 text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            </div>
          </div>
          
          <div className="py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase">Main Menu</div>
            <ul>
              <li>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/dashboard') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home size={20} className="mr-3" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/order" 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/order') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag size={20} className="mr-3" />
                  <span className="font-medium">Your Orders</span>
                </Link>
              </li>
              <li>
                <Link 
                   to={getProjectLink()} 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/project-details') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={20} className="mr-3" />
                  <span className="font-medium">Your Project</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/profile') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserCircle size={20} className="mr-3" />
                  <span className="font-medium">Account</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/wallet" 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/wallet') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Wallet size={20} className="mr-3" />
                  <span className="font-medium">Wallet</span>
                </Link>
              </li>
            </ul>
            
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase">Help & Support</div>
            <ul>
              <li>
                <Link 
                  to="/support" 
                  className={`flex items-center px-4 py-3 ${
                    isActive('/support') 
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare size={20} className="mr-3" />
                  <span className="font-medium">Contact Support</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="mt-auto border-t p-4">
            <button 
              onClick={handleLogoutClick}
              className="flex items-center text-red-600 hover:text-red-700 w-full"
              disabled={isLoggingOut}
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Page Content */}
          <main className="flex-1 overflow-auto">
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
