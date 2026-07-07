import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { isOrderApproved } from '../helpers/orderVisibility';

// Status Badge Component with icons
const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    'In Progress': { 
      color: 'bg-blue-500 text-white', 
      icon: <RefreshCw size={14} className="mr-1" /> 
    },
    'Rejected': { 
      color: 'bg-red-500 text-white', 
      icon: <AlertCircle size={14} className="mr-1" /> 
    },
    'Processing': { 
      color: 'bg-gray-500 text-white', 
      icon: <Clock size={14} className="mr-1" /> 
    },
    'Completed': { 
      color: 'bg-green-500 text-white', 
      icon: <CheckCircle size={14} className="mr-1" /> 
    }
  };

  const config = statusConfig[status] || statusConfig['Processing'];

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};

// Order Item Component
const OrderItem = ({ order, navigate, formatDate }) => {
  const handleClick = () => {
    navigate(`/order-detail/${order._id}`);
  };

  // Get status text and class
  const getOrderStatus = (order) => {
    if (!order) return 'Processing';
    
    // Check for rejected status first
    if (order.orderVisibility === 'payment-rejected') {
      return 'Rejected';
    }
    
    // Check for pending approval
    if (order.orderVisibility === 'pending-approval') {
      return 'Processing';
    }
    
    // Check for completed
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return 'Completed';
    }
    
    // If approved or visible, it's in progress
    if (isOrderApproved(order)) {
      return 'In Progress';
    }
    
    // Fallback
    return 'Processing';
  };

  const status = getOrderStatus(order);

  return (
    <button 
      onClick={handleClick}
      className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-gray-900">{order.productId?.serviceName || "Service"}</h3>
            <p className="text-sm text-gray-500">{order.productId?.category?.split('_').join(' ')}</p>
          </div>
          <OrderStatusBadge status={status} />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar size={16} className="mr-2" />
            {formatDate(order.createdAt)}
          </div>
          
          <div className="flex items-center text-sm text-blue-600">
            <Eye size={16} className="mr-1" />
            View Details
          </div>
        </div>
      </div>
    </button>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [walletBalance, setWalletBalance] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [activeProject, setActiveProject] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const navigate = useNavigate();

  // Handle window resize for responsive grid
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Get user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        // Sort by creation date (newest first)
        const allOrders = data.data || [];
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(allOrders);

        // Find active (in-progress) project
      const activeProj = allOrders.find(order => {
        const category = order.productId?.category?.toLowerCase();
        if (!category) return false;
        
        // Only consider website projects, not update plans
        if (['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category)) {
          if (order.orderVisibility === 'pending-approval' || order.orderVisibility === 'payment-rejected') {
            return false; // Don't show as active if pending approval or rejected
          }

          return order.projectProgress < 100 || order.currentPhase !== 'completed';
        }
        return false;
      });
      
      setActiveProject(activeProj || null);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    
    return orders.filter(order => {
      // Determine order status
      const isCompleted = order.projectProgress >= 100 || order.currentPhase === 'completed';
      
      if (activeTab === 'completed') {
        return isCompleted;
      } else if (activeTab === 'active') {
        return !isCompleted;
      }
      
      return true;
    });
  };

  const filteredOrders = getFilteredOrders();
      
  // Determine grid columns based on screen width
  // Keep three columns but increase card sizes
  let gridColsClass = "grid-cols-1";
  
  if (windowWidth >= 640 && windowWidth < 1024) {
    gridColsClass = "grid-cols-2";
  } else if (windowWidth >= 1024) {
    gridColsClass = "grid-cols-3";
  }

  if (loading) {
    return (
      <DashboardLayout user={user}
      walletBalance={walletBalance}
    cartCount={cartCount}
    activeProject={activeProject}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}
    walletBalance={walletBalance}
    cartCount={cartCount}
    activeProject={activeProject}>
      
      <div className="bg-gray-50 min-h-full">
        <header className="bg-blue-600 text-white py-4 sm:py-6 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto"> {/* Increased from 6xl to 7xl for wider content */}
            <h1 className="text-xl sm:text-2xl font-bold">My Orders</h1>
            <p className="text-blue-100 text-sm sm:text-base mt-1">Manage and track your website development orders</p>
          </div>
        </header>
        
        <main className="max-w-8xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-8"> {/* Increased from 6xl to 7xl for wider content */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 overflow-x-auto">
            <div className="flex min-w-max space-x-1 md:space-x-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base rounded-md transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Orders
              </button>
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base rounded-md transition-colors ${
                  activeTab === 'active' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base rounded-md transition-colors ${
                  activeTab === 'completed' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
          
          <h2 className="text-lg sm:text-xl font-medium text-gray-800 mb-3 sm:mb-4">
            {activeTab === 'all' ? 'Recent Orders' : 
             activeTab === 'active' ? 'Active Orders' : 'Completed Orders'}
          </h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any orders in this category yet.</p>
              <button
                onClick={() => navigate('/start-new-project')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className={`grid ${gridColsClass} gap-5`}> {/* Increased gap between cards */}
              {filteredOrders.map(order => (
                <OrderItem 
                  key={order._id} 
                  order={order} 
                  navigate={navigate}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
