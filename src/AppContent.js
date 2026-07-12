import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useOnlineStatus } from './App';
import { setUserDetails, updateWalletBalance, logout } from './store/userSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import SummaryApi from './common';
import Context from './context';
import CookieManager from './utils/cookieManager';
import StorageService from './utils/storageService';
import ScrollToTop from './helpers/scrollTop';
import { isOrderApproved } from './helpers/orderVisibility';
// import QRModal from './components/QRModal';
// import socket from './components/socket';
// import { AnimatePresence } from 'framer-motion';
// import AnimatedRoutes from './components/AnimatedRoutes';

const STORAGE_KEYS = {
  WALLET_BALANCE: 'walletBalance',
  USER_DETAILS: 'userDetails',
  GUEST_SLIDES: 'guestSlides'
};

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state?.user?.user);
  const { isOnline, isInitialized } = useOnlineStatus(); 
  const [cartProductCount, setCartProductCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeProject, setActiveProject] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch(SummaryApi.logout.url, {
        method: SummaryApi.logout.method,
        credentials: 'include'
      });
      
    
      if (response.ok) {
        // Clear cookies
        CookieManager.clearAll();
        
        // Clear localStorage but preserve essential data
        StorageService.clearAll();

        // Clear session cookie
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        setWalletBalance(0);
      dispatch(updateWalletBalance(0));
      dispatch(logout());
      setCartProductCount(0);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet balance: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const balance = Number(data.data?.walletBalance || 0);
        setWalletBalance(balance);
        dispatch(updateWalletBalance(balance));
        StorageService.setWalletBalance(balance);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      const cachedBalance = StorageService.getWalletBalance();
      if (cachedBalance !== null) {
        setWalletBalance(cachedBalance);
        dispatch(updateWalletBalance(cachedBalance));
      }
    }
  };

  const fetchUserDetails = async () => {
    try {
      let hasUserData = false;

      // First check localStorage
      const cachedDetails = StorageService.getUserDetails();
      if (cachedDetails) {
        dispatch(setUserDetails(cachedDetails));
        const cachedWalletBalance = Number(cachedDetails.walletBalance || 0);
        setWalletBalance(cachedWalletBalance);
        dispatch(updateWalletBalance(cachedWalletBalance));
        hasUserData = true;
      }

      // If online, fetch fresh data
      if (isOnline) {
        const dataResponse = await fetch(SummaryApi.current_user.url, {
          method: SummaryApi.current_user.method,
          credentials: 'include'
        });
        if (!dataResponse.ok) {
          return hasUserData;
        }
        const dataApi = await dataResponse.json();
        
        if (dataApi.success && dataApi.data) {
          // Save to cookies
          CookieManager.setUserDetails({
            _id: dataApi.data._id,
            name: dataApi.data.name,
            email: dataApi.data.email,
            role: dataApi.data.role
          });

          // Save to localStorage
          StorageService.setUserDetails(dataApi.data);
          dispatch(setUserDetails(dataApi.data));
          
          // Update wallet balance if it exists
          if (dataApi.data.walletBalance !== undefined) {
            const balance = Number(dataApi.data.walletBalance || 0);
            setWalletBalance(balance);
            dispatch(updateWalletBalance(balance));
            StorageService.setWalletBalance(balance);
          }
          hasUserData = true;
        }
      }

      return hasUserData;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return false;
    }
  };

  const fetchUserAddToCart = async () => {
    try {
      // First check localStorage
      const cachedCount = StorageService.getCartCount();
      setCartProductCount(cachedCount);

      // If online, fetch fresh data
      if (isOnline) {
        const dataResponse = await fetch(SummaryApi.addToCartProductCount.url, {
          method: SummaryApi.addToCartProductCount.method,
          credentials: 'include'
        });
        const dataApi = await dataResponse.json();
        const newCount = dataApi?.data?.count || 0;
        setCartProductCount(newCount);
        StorageService.setCartCount(newCount);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

   // Add a function to update active project that can be called from child components
 const updateActiveProject = (project) => {
  // console.log("AppContent: updating activeProject:", project);
  setActiveProject(project);
};

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("🔵 [AppContent] initializeData() started - isInitialized:", isInitialized);

        if (!isInitialized) {
          console.log("🔴 [AppContent] isInitialized is false, returning early");
          return;
        }

        // Try to get user data from localStorage first
        const cachedUser = StorageService.getUserDetails();
        console.log("💾 [AppContent] Checking localStorage for userDetails:", cachedUser ? "FOUND" : "NOT FOUND");
        console.log("💾 [AppContent] Cached user data:", cachedUser);

        if (cachedUser) {
          console.log("✅ [AppContent] Restoring user from localStorage:", cachedUser.name);
          await fetchUserDetails();
          await fetchUserAddToCart();
          return;
        }

        if (isOnline) {
          console.log("🌐 [AppContent] User is online, verifying session with API");
          const userLoaded = await fetchUserDetails();

          if (!userLoaded) {
            console.log("❌ [AppContent] API returned not ok, logging out");
            dispatch(logout());
            await fetchUserAddToCart();
            return;
          }

          await fetchUserAddToCart();
        } else {
          // Offline aur no cached user
          console.log("📡 [AppContent] Offline aur no cached user, logging out");
          dispatch(logout());
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        dispatch(logout());
      }
    };

    console.log("🟡 [AppContent] useEffect dependency changed - isInitialized:", isInitialized);
    initializeData();
  }, [isInitialized]);

  // In AppContent.js
useEffect(() => {
  const fetchActiveProject = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        const allOrders = data.data || [];
        
        // Filter for website projects
        const websiteProjects = allOrders.filter(order => {
          const category = order.productId?.category?.toLowerCase();
          return ['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category);
        });
        
        // Find active (in-progress) project
        const activeProj = websiteProjects.find(project => {
          const category = project.productId?.category?.toLowerCase();
          if (!category) return false;
          
          if (['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category)) {
            if (!isOrderApproved(project) || project.orderVisibility === 'payment-rejected') {
              return false;
            }
            return project.projectProgress < 100 || project.currentPhase !== 'completed';
          }
          return false;
        });
        
        // console.log("Setting active project at AppContent level:", activeProj);
        setActiveProject(activeProj || null);
      }
    } catch (error) {
      console.error("Error fetching active project:", error);
    }
  };

  fetchActiveProject();
  
  // Re-fetch at intervals or when user changes
  const interval = setInterval(fetchActiveProject, 300000); // every 5 minutes
  return () => clearInterval(interval);
  
}, [user?._id]);

// useEffect(() => {
//   const handleQR = () => setShowQR(true);
//   socket.on('qr', handleQR);
//   return () => socket.off('qr', handleQR);
// }, []);

// useEffect(() => {
//   const handleReady = () => setShowQR(false);

//   socket.on('ready', handleReady);
//   return () => socket.off('ready', handleReady);
// }, []);
  // const isDashboard = window.location.pathname.includes('/dashboard');

  return (
     <Context.Provider value={{
        fetchUserDetails,
        cartProductCount,
        fetchUserAddToCart,
        walletBalance,
        setWalletBalance,
        fetchWalletBalance,
        handleLogout,
        activeProject,
      updateActiveProject
      }}>
        <div className="flex min-h-screen flex-col">
          <ScrollToTop />
          <Header activeProject={activeProject} />
          <main className="flex-1 pt-0 md:pt-0">
            <Outlet />
          </main>
          <Footer />
        </div>
      </Context.Provider>
  )
}

export default AppContent;
