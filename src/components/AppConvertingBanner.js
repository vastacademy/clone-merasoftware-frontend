import React, { useState, useEffect } from 'react';
import { FiArrowRight } from "react-icons/fi";
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SummaryApi from '../common';
import { useOnlineStatus } from '../App';
import StorageService from '../utils/storageService';
import { getOrderSummary } from '../utils/orderSummaryClient';
import { FileText, Clock, ExternalLink, ChevronRight, Activity, ChevronLeft, ArrowRight } from "lucide-react";
import guestSlide from '../assest/guestslide.png';

const AppConvertingBanner = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isOnline, isInitialized } = useOnlineStatus();
  
  // States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [orders, setOrders] = useState(null);
  const [guestSlides, setGuestSlides] = useState(null);
  const [userWelcome, setUserWelcome] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const user = useSelector(state => state?.user?.user);
  const initialized = useSelector(state => state?.user?.initialized);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions
  const filterWebsiteOrders = (orders) => {
    if (!orders) return [];
  
    // Get all relevant orders (both website projects and updates)
    const relevantOrders = orders.filter(order => {
      const category = order.productId?.category?.toLowerCase();
      return (
        category === 'website_updates' ||
        ['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category)
      );
    });
  
    // Sort orders by date (most recent first)
    const sortedOrders = relevantOrders.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  
    // If there's an active update plan, show it first (handles yearly renewable plans)
    const activeUpdatePlan = sortedOrders.find(order => {
      if (!isUpdatePlan(order.productId?.category)) return false;

      if (isYearlyRenewablePlan(order)) {
        return calculateYearlyRemainingDays(order) > 0;
      }

      const remainingDays = calculateStandardRemainingDays(order);
      return order.isActive && remainingDays > 0;
    });

    if (activeUpdatePlan) {
      return [activeUpdatePlan];
    }
  
    // Otherwise, show the most recent website project
    const websiteProject = sortedOrders.find(order => 
      ['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(
        order.productId?.category?.toLowerCase()
      )
    );
  
    return websiteProject ? [websiteProject] : [];
  };

  // Clear all banner states
  const clearBannerStates = () => {
    setOrders(null);
    setGuestSlides(null);
    setUserWelcome(null);
    setCurrentSlide(0);
    setDataInitialized(false);
    setIsLoading(true);
  };
  
  // Effect to handle user state changes
  useEffect(() => {
    const handleUserStateChange = async () => {
      if (!isInitialized) return;

      // Clear states when user changes
      clearBannerStates();

      if (!user?._id) {
        // Load guest slides
        await loadGuestSlides();
      } else {
        // Start fresh load for logged-in users
        setIsLoading(true);
        setDataInitialized(false);
      }
    };
    
    handleUserStateChange();
  }, [isInitialized, user?._id, initialized]);

  const loadGuestSlides = async () => {
    if (!isInitialized) return;
    
    try {
      // Try to get from localStorage first
      const cachedSlides = StorageService.getGuestSlides();
      // console.log("Cached slides:", cachedSlides); 
      
      if (cachedSlides) {
        setGuestSlides(cachedSlides);
        // console.log("Setting slides from cache:", cachedSlides.length); 
        setDataInitialized(true);
        setIsLoading(false);
        
        // If online, fetch fresh data
        if (isOnline) {
          fetchFreshGuestSlides();
        }
        return;
      }
      
      // If online and no cache, fetch fresh
      if (isOnline) {
        await fetchFreshGuestSlides();
      } else {
        setIsLoading(false);
        setDataInitialized(true);
      }
    } catch (error) {
      console.error('Error in loadGuestSlides:', error);
      setIsLoading(false);
      setDataInitialized(true);
    }
  };

  const fetchFreshGuestSlides = async () => {
    if (!isOnline) return null;
    
    try {
      const response = await fetch(SummaryApi.guestSlides.url);
      const data = await response.json();
      // console.log("API response:", data); 
      
      if (data.success && Array.isArray(data.data)) {
        // console.log("Fetched slides count:", data.data.length); 
      // console.log("Fetched slides:", data.data)
        setGuestSlides(data.data);
        setDataInitialized(true);
        
        // Store in localStorage
        StorageService.setGuestSlides(data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching fresh slides:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Combined data fetching effect
  useEffect(() => {
    const loadData = async () => {
      if (!isInitialized || !initialized) return;
      
      if (!user?._id) {
        await loadGuestSlides();
        return;
      }
      
      // Handle logged-in user data
      try {
        // Check localStorage first
        const cachedOrders = StorageService.getUserOrders(user._id);
        const cachedWelcome = StorageService.getUserWelcome();
        
        // Process orders if they exist
        if (cachedOrders) {
          const filteredOrders = filterWebsiteOrders(cachedOrders);
          setOrders(filteredOrders);
        }
        
        // Process welcome data if it exists
        if (cachedWelcome) {
          setUserWelcome(cachedWelcome);
        }
        
        setDataInitialized(true);
        setIsLoading(false);
        
        // If online, fetch fresh data
        if (isOnline) {
          // Fetch fresh data in parallel
          await Promise.all([
            fetchUserOrders(),
            fetchUserWelcome()
          ]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
        setDataInitialized(true);
      }
    };
    
    loadData();
  }, [user?._id, initialized, isInitialized, isOnline]);

  const fetchUserOrders = async () => {
    try {
      const data = await getOrderSummary();
      if (data) {
        const filteredOrders = filterWebsiteOrders(data);
        setOrders(filteredOrders);
        setDataInitialized(true);
        
        // Store in localStorage
        StorageService.setUserOrders(user._id, data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return null;
    }
  };

  const fetchUserWelcome = async () => {
    try {
      const response = await fetch(SummaryApi.userWelcome.url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserWelcome(data.data);
        
        // Store in localStorage
        StorageService.setUserWelcome(data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user welcome:', error);
      return null;
    }
  };

  // Helper functions remain the same
  const isWebsiteService = (category = '') => {
    return ['standard_websites', 'cloud_software_development', 'app_development'].includes(category?.toLowerCase());
  };

  const isUpdatePlan = (category = '') => {
    return category?.toLowerCase() === 'website_updates';
  };

  const isYearlyRenewablePlan = (order = {}) => {
    return (
      !!order?.productId?.isMonthlyRenewablePlan &&
      isUpdatePlan(order?.productId?.category)
    );
  };

  const calculateStandardRemainingDays = (order = {}) => {
    if (!order?.createdAt || !order?.productId?.validityPeriod) return 0;

    const validityInDays = order.productId.validityPeriod;
    const startDate = new Date(order.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityInDays);

    const today = new Date();
    const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, remainingDays);
  };

  const calculateMonthlyCycleRemainingDays = (order = {}) => {
    if (!isYearlyRenewablePlan(order)) {
      return calculateStandardRemainingDays(order);
    }

    if (order.currentMonthExpiryDate) {
      const today = new Date();
      const expiry = new Date(order.currentMonthExpiryDate);
      const remainingDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return Math.max(0, remainingDays);
    }

    // Fallback to 30 days if no expiry date is available
    return 0;
  };

  const calculateYearlyRemainingDays = (order = {}) => {
    if (!isYearlyRenewablePlan(order)) return 0;

    const yearlyDuration = Number(order?.productId?.yearlyPlanDuration) || 365;
    const rawStartDate = order?.currentPlanStartDate || order?.createdAt;
    if (!rawStartDate) return yearlyDuration;

    const startDate = new Date(rawStartDate);
    if (Number.isNaN(startDate.getTime())) {
      return yearlyDuration;
    }

    // Align with dashboard: compare whole days (midnight-to-midnight)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfPlan = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((startOfToday - startOfPlan) / msPerDay);
    const daysLeft = yearlyDuration - daysPassed;
    return Math.max(0, Math.min(yearlyDuration, daysLeft));
  };

  const calculatePlanRemainingDays = (order = {}) => {
    if (isYearlyRenewablePlan(order)) {
      return calculateMonthlyCycleRemainingDays(order);
    }
    return calculateStandardRemainingDays(order);
  };

  const handleOrderClick = (orderId) => {
    navigate("/my-updates");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Touch handlers for guest slides
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < guestSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };
  
  // Orders Desktop View - New UI that matches UpdateCardUnique
  const OrdersDesktopView = ({ order }) => {
    const isUpdate = isUpdatePlan(order.productId?.category);
    const isYearlyPlan = isYearlyRenewablePlan(order);
    const remainingDays = calculatePlanRemainingDays(order);
    const yearlyDaysLeft = isYearlyPlan ? calculateYearlyRemainingDays(order) : 0;
    const monthlyDaysLeft = remainingDays;

    // Website project progress
    const projectProgress = order.projectProgress || 0;

    // Update-plan metrics
    const totalUpdates = isUpdate && !isYearlyPlan ? (order.productId?.updateCount || 0) : 0;
    const usedUpdates = isUpdate && !isYearlyPlan ? (order.updatesUsed || 0) : 0;
    const currentMonthUpdatesUsed = isYearlyPlan ? (order.currentMonthUpdatesUsed || 0) : 0;
    const isUnlimitedUpdates = !!order.productId?.isUnlimitedUpdates;
    const planStatusLabel = isYearlyPlan
      ? (monthlyDaysLeft <= 0 ? 'Needs Renewal' : 'Yearly Plan Active')
      : null;
    const planStatusClass = monthlyDaysLeft <= 0 ? 'text-red-600' : 'text-purple-600';
  
    return (
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-lg overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-red-500 to-purple-500"></div>
        
        <div className="flex p-6">
          {/* Left Section - All Details */}
          <div className="flex-1 pr-8">
            <div className="flex flex-col gap-6">
              {/* Header with Icon */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 w-12 h-12 bg-orange-100 rounded-lg rotate-6"></div>
                  <div className="absolute -top-1 -left-1 w-12 h-12 bg-red-100 rounded-lg -rotate-3"></div>
                  <div className="relative w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center border border-gray-100">
                    <FileText className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {order.productId?.serviceName}
                    </h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      #{order._id.slice(-6)}
                    </span>
                  </div>
                  <p className="text-gray-600">{order.productId?.category?.split('_').join(' ')}</p>
                </div>
              </div>
              
              {/* Progress Section */}
              {isUpdate ? (
                isYearlyPlan ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Yearly Update Plan</span>
                      <span className={`text-sm font-semibold ${planStatusClass}`}>
                        {planStatusLabel}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Current Month Cycle</span>
                        <span>{monthlyDaysLeft > 0 ? `${monthlyDaysLeft} days left` : 'Expired'}</span>
                      </div>
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${monthlyDaysLeft <= 3 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                          style={{ width: `${Math.max(5, Math.min(100, (monthlyDaysLeft / 30) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Total Year Access</span>
                      <span className="font-semibold text-purple-600">{yearlyDaysLeft} days left</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Updates Progress</span>
                      <span className="text-sm font-medium text-orange-600">{usedUpdates} of {totalUpdates}</span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 opacity-20"></div>
                      <div className="relative flex gap-1">
                        {Array.from({ length: totalUpdates }).map((_, index) => (
                          <div
                            key={index}
                            className={`flex-1 h-2 border-r-2 border-white last:border-r-0 ${
                              index < usedUpdates ? 'bg-gradient-to-r from-orange-400 via-red-500 to-purple-500' : ''
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Project Progress</span>
                    <span className="text-sm font-medium text-orange-600">{projectProgress}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 opacity-20"></div>
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${projectProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Status and Time Section */}
              {isUpdate ? (
                isYearlyPlan ? (
                  <div className="flex gap-8 py-4 border-y border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Year Access Left</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-purple-600">{yearlyDaysLeft}</span>
                        <span className="text-sm text-gray-500">days</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Current Month Updates</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-green-600">{currentMonthUpdatesUsed}</span>
                        <span className="text-sm text-gray-500">
                          {isUnlimitedUpdates ? 'used (Unlimited)' : `of ${(order.productId?.updateCount || 0)} used`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-8 py-4 border-y border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Plan Expires In</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-orange-600">{remainingDays}</span>
                        <span className="text-sm text-gray-500">days</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Updates Remaining</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-green-600">{totalUpdates - usedUpdates}</span>
                        <span className="text-sm text-gray-500">updates</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
              // Regular website project time display
              <div className="flex gap-8 py-4 border-y border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Time Left</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-orange-600">{remainingDays}</span>
                    <span className="text-sm text-gray-500">days</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Current Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">{order.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            )}
              
              {/* Footer Section */}
              <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  {isUpdate ? 'Plan Activated' : 'Started'}: {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                {/* <button 
                  className="relative flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:text-gray-900 transition-colors"
                  onClick={() => handleOrderClick(order._id)}
                >
                  <span>{isUpdate ? 'View Update Plan' : 'View Project'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button> */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="w-1/2 flex justify-end">
          <div className="w-[550px] h-[300px]">
            <img 
              src={guestSlide}
              alt="Preview" 
              className="w-full h-full object-cover rounded-3xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

  // Orders Mobile View - Keep the existing design
  const OrdersMobileView = ({ order }) => {
    const isUpdate = isUpdatePlan(order.productId?.category);
    const isYearlyPlan = isYearlyRenewablePlan(order);
    const remainingDays = calculatePlanRemainingDays(order);
    const yearlyDaysLeft = isYearlyPlan ? calculateYearlyRemainingDays(order) : 0;
    const monthlyDaysLeft = remainingDays;
    const isUnlimitedUpdates = !!order.productId?.isUnlimitedUpdates;
    const currentMonthUpdatesUsed = isYearlyPlan ? (order.currentMonthUpdatesUsed || 0) : 0;
    const totalUpdates = isUpdate && !isYearlyPlan ? (order.productId?.updateCount || 0) : 0;
    const usedUpdates = isUpdate && !isYearlyPlan ? (order.updatesUsed || 0) : 0;

    return (
       <div className="px-4 mt-4">
      <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-teal-500 mr-2" />
                <h2 className="text-base font-bold text-gray-800">
                  {order.productId?.serviceName}
                </h2>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 ml-7">
                {order.productId?.category?.split('_').join(' ')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md px-2 py-0.5 border border-gray-200">
              <span className="text-xs text-gray-500">#{order._id.slice(-6)}</span>
            </div>
          </div>
          
          {isUpdate ? (
            <div className="mt-5 space-y-4">
              {isYearlyPlan ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Yearly Update Plan</span>
                    <span className={`text-xs font-semibold ${monthlyDaysLeft <= 0 ? 'text-red-600' : 'text-purple-600'}`}>
                      {monthlyDaysLeft <= 0 ? 'Needs Renewal' : `${yearlyDaysLeft}d left`}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Current Month</span>
                      <span>{monthlyDaysLeft > 0 ? `${monthlyDaysLeft} days left` : 'Renew now'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${monthlyDaysLeft <= 3 ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                        style={{ width: `${Math.max(5, Math.min(100, (monthlyDaysLeft / 30) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 border border-purple-100 rounded-md p-3">
                      <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">Year Access</p>
                      <p className="text-base font-semibold text-purple-700">{yearlyDaysLeft} days</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                      <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Monthly Updates</p>
                      <p className="text-base font-semibold text-blue-700">
                        {currentMonthUpdatesUsed}
                        <span className="text-xs text-gray-500 ml-1">
                          {isUnlimitedUpdates ? 'used (Unlimited)' : `of ${(order.productId?.updateCount || 0)}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Validity</span>
                      <span className="text-sm font-bold text-teal-600">
                        {remainingDays}d left
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${totalUpdates ? ((totalUpdates - usedUpdates) / totalUpdates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updates</span>
                      <span className="text-sm font-bold text-teal-600">
                        {`${usedUpdates}/${totalUpdates}`}
                      </span>
                    </div>
                    <div className="flex items-end h-6 space-x-1">
                      {Array.from({ length: totalUpdates }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1 rounded-t ${i < usedUpdates ? 'bg-teal-500' : 'bg-gray-200'}`}
                          style={{ height: `${((i + 1) / (totalUpdates || 1)) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-bold text-teal-600">
                        {order.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <div 
                        className={`w-full py-1 px-2 text-xs text-center rounded ${
                          order.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.isActive ? 'Plan Active' : 'Plan Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Regular website project mobile view - your existing code
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-bold text-teal-600">{order.projectProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${order.projectProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks</span>
                  <span className="text-sm font-bold text-teal-600">
                    {order.checkpoints ? 
                      `${order.checkpoints.filter(cp => cp.completed).length}/${order.checkpoints.length}` : 
                      "0/0"}
                  </span>
                </div>
                <div className="flex items-end h-6 space-x-1">
                  {[15, 25, 40, 30, 42, 35, 50, 45, 60].map((height, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-teal-500 rounded-t"
                      style={{height: `${height}%`}}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time</span>
                  <span className="text-sm font-bold text-teal-600">8d left</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <div className="h-1 w-full bg-gray-200 rounded"></div>
                  <div className="absolute h-1 w-2/3 bg-teal-500 rounded" />
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5 text-teal-500" />
                <span>{isUpdate ? 'Activated' : 'Started'}: {formatDate(order.createdAt)}</span>
              </div>
              <button 
                className="flex items-center text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
                onClick={() => handleOrderClick(order._id)}
              >
                <span>View Details</span>
                <ExternalLink className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Welcome Desktop View - Similar to GuestSlidesDesktop
  const WelcomeDesktopView = ({ welcome }) => {
    // Process welcome data
    const title = welcome.title.replace('{username}', user?.name || 'User');
    const description = stripHtmlTags(welcome.description);

    return (
      <div className="bg-gradient-to-r from-blue-50 to-red-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="w-1/2">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                {title}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {description}
              </p>
              <div className="flex gap-4">
                <Link to={welcome.cta.link}>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-14 py-3 rounded-lg text-lg transition-colors flex items-center"
                  >
                    {welcome.cta.text}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
            <div className="w-1/2 flex justify-end">
              <div className="w-[550px] h-[300px]">
                <img 
                  src={guestSlide} 
                  alt="Hero" 
                  className="w-full h-full object-cover rounded-3xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Welcome Mobile View - Similar to GuestSlidesMobile
  const WelcomeMobileView = ({ welcome }) => {
    // Process welcome data
    const title = welcome.title.replace('{username}', user?.name || 'User');
    const description = stripHtmlTags(welcome.description);
    
    return (
      <div className='rounded-xl shadow-md border mt-4'>
        <div className="bg-gradient-to-r rounded-xl from-blue-50 to-red-50 px-4 py-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2 text-left">
              {title}
            </h1>
            <p className="text-sm text-gray-600 mb-3 text-left">
              {description}
            </p>
            <div className="flex flex-col gap-3">
              <Link to={welcome.cta.link} className="w-full flex justify-center">
                <button 
                  className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center text-center justify-center"
                >
                  {welcome.cta.text}
                  <ArrowRight className="ml-2 mt-1 w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Guest Slides Desktop View
  const GuestSlidesDesktop = ({ slide }) => (
    <section className="bg-gradient-to-r from-blue-50 to-red-50 text-white  w-full">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
            {slide.title}
          </h1>
          <p className=" text-lg mb-6 text-gray-600">
            {slide.description}
          </p>
          {slide.ctaButtons?.length > 0 && (
            <a href={slide.ctaButtons[0].link}>
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center hover:border hover:border-blue-600 hover:text-blue-600"
              >
                {slide.ctaButtons[0].text} <ArrowRight size={16} className="ml-2" />
              </button>
            </a>
          )}
        </div>
        <div className="flex items-center justify-center">
          <img
            src={guestSlide || "/api/placeholder/600/300"}
            alt="Services Banner"
            className="  w-auto h-[350px]"
          />
        </div>
      </div>
    </div>
  </section>
);


  // Guest Slides Mobile View
  const GuestSlidesMobile = ({ slide }) => (
    <div className='px-4 rounded-xl shadow-sm mt-4'>
      <div className="bg-gradient-to-r rounded-xl from-blue-50 to-red-50 px-4 py-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2 text-left">
            {slide.title}
          </h1>
          <p className="text-sm text-gray-600 mb-3 text-left">
            {slide.description}
          </p>
          <div className="flex flex-col gap-3">
            {slide.ctaButtons?.map((button, btnIndex) => (
              <a key={btnIndex} href={button.link} className="w-full flex justify-center">
                <button 
                  className={`${
                    button.type === 'primary' 
                      ? 'bg-blue-500 hover:bg-blue-700 text-white' 
                      : 'border bg-blue-500 hover:bg-red-50'
                  } px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center text-center justify-center`}
                >
                  {button.text}
                  {button.type === 'primary' && <ArrowRight className="ml-2 mt-1 w-3 h-3" />}
                </button>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Check if system isn't initialized yet
  if (!isInitialized || !initialized) {
    return (
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl py-6 px-2 shadow-lg max-w-xl mx-auto overflow-hidden">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have guest slides, show them immediately (even if other data is still loading)
  // Filter guestSlides to only active ones
  const activeGuestSlides = guestSlides ? guestSlides.filter(slide => slide.isActive) : [];

  if (!user?._id && activeGuestSlides.length > 0) {
    console.log("Rendering active slides:", activeGuestSlides.length);
    console.log("Current slide index:", currentSlide);

    return (
      <div className="relative"> {/* Add this wrapper div with relative positioning */}
      <div className="overflow-hidden">
        <div
          className="transition-all duration-500 ease-in-out flex w-full overflow-hidden"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {isMobile ? (
            <GuestSlidesMobile slide={activeGuestSlides[currentSlide]} />
          ) : (
            <GuestSlidesDesktop slide={activeGuestSlides[currentSlide]} />
          )}
        </div>
        </div>
        
        {/* Navigation Arrows - Only show on desktop */} 
        {!isMobile && activeGuestSlides.length > 1 && (
          <>
            <button 
              onClick={() => currentSlide > 0 && setCurrentSlide(prev => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button 
              onClick={() => currentSlide < activeGuestSlides.length - 1 && setCurrentSlide(prev => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </>
        )}
    
        {/* Slide Indicators */}
        {activeGuestSlides.length > 1 && (
          <div className="flex justify-center mt-3 gap-2">
            {activeGuestSlides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-blue-500 w-4' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Only show loading if we're still loading AND have no data
  if (isLoading && !dataInitialized) {
    return (
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl py-6 px-2 shadow-lg max-w-xl mx-auto overflow-hidden">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For user with orders, render different views based on mobile/desktop
  if (user?._id && dataInitialized && orders?.length > 0) {
    if (isMobile) {
      return <OrdersMobileView order={orders[0]} />;
    } else {
      return (
        <div className="container mx-auto w-full md:px-14">
          <OrdersDesktopView order={orders[0]} />
        </div>
      );
    }
  }

  // User Welcome View - Show when user is logged in but has no orders
  // Check if userWelcome is active before rendering
  if (user?._id && dataInitialized && orders?.length === 0 && userWelcome && userWelcome.isActive) {
    return (
      <div className="container mx-auto md:px-14 px-4">
        {isMobile ? (
          <WelcomeMobileView welcome={userWelcome} />
        ) : (
          <WelcomeDesktopView welcome={userWelcome} />
        )}
      </div>
    );
  }

  // Empty state - if we're initialized but have no content to show
  return (
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-xl py-5 max-w-xl mx-auto overflow-hidden">
        <div className="px-4 py-6 text-center">
          <p className="text-gray-500">No content available</p>
        </div>
      </div>
    </div>
  );
};

export default AppConvertingBanner;
