import React, { useState } from 'react';
import { 
  FiHome, 
  FiShoppingCart, 
  FiFolder, 
  FiCreditCard, 
  FiHelpCircle, 
  FiLogOut,
  FiRefreshCcw,
  FiChevronRight,
  FiTrendingUp,
  FiCalendar,
  FiBell,
  FiDollarSign,
  FiGlobe,
  FiMessageSquare,
  FiExternalLink,
  FiClock,
  FiStar,
  FiUser,
  FiAlertTriangle,
  FiSettings,
  FiPackage,
  FiCode,
  FiTool,
  FiCheckCircle,
  FiActivity,
  FiX,
  FiMail,
  FiDatabase,
  FiHardDrive,
  FiInbox
} from 'react-icons/fi';

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      subject: "Security Update Completed",
      preview: "Your website security has been updated with latest patches...",
      fullMessage: "Dear Sandeep, We have successfully completed the security update for your website. All security patches have been applied and your website is now running on the latest secure version. No action required from your end.",
      time: "2h ago",
      isRead: false,
      priority: "high"
    },
    {
      id: 2,
      subject: "Monthly Backup Successful",
      preview: "Your monthly backup has been created successfully...",
      fullMessage: "Hello Sandeep, Your monthly website backup has been created and stored securely. The backup includes all your website files, database, and configurations. You can restore from this backup anytime if needed.",
      time: "1d ago",
      isRead: true,
      priority: "medium"
    },
    {
      id: 3,
      subject: "Performance Optimization",
      preview: "Website performance has been optimized for better speed...",
      fullMessage: "Hi Sandeep, We have optimized your website's performance by implementing caching, image compression, and database optimization. Your website should now load 40% faster than before.",
      time: "2d ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: 4,
      subject: "Payment Reminder",
      preview: "Monthly payment due on December 5, 2024...",
      fullMessage: "Dear Sandeep, This is a friendly reminder that your monthly payment of ₹8,000 for the Business Pro Plan is due on December 5, 2024. Please ensure timely payment to avoid any service interruption.",
      time: "3d ago",
      isRead: true,
      priority: "high"
    }
  ]);

  const markAsRead = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    markAsRead(message.id);
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Left Sidebar - Keeping as per requirement */}
      <aside className="w-64 bg-white shadow-xl">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-gray-800">MeraSoftware</span>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Main Menu
          </div>
          
          <a href="#" className="flex items-center px-3 py-3 mb-1 text-blue-600 bg-blue-50 rounded-lg transition-all">
            <FiHome className="w-5 h-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </a>
          
          <a href="#" className="flex items-center px-3 py-3 mb-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
            <FiShoppingCart className="w-5 h-5 mr-3" />
            <span>Your Orders</span>
          </a>
          
          <a href="#" className="flex items-center px-3 py-3 mb-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
            <FiFolder className="w-5 h-5 mr-3" />
            <span>Your Project</span>
          </a>
          
          <a href="#" className="flex items-center px-3 py-3 mb-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
            <FiCreditCard className="w-5 h-5 mr-3" />
            <span>Wallet</span>
          </a>
          
          <div className="border-t my-4"></div>
          
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Help & Support
          </div>
          
          <a href="#" className="flex items-center px-3 py-3 mb-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
            <FiHelpCircle className="w-5 h-5 mr-3" />
            <span>Contact Support</span>
          </a>
          
          <a href="#" className="flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <FiLogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header with Wallet Balance */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome back, Sandeep!</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your projects and monitor your account</p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Wallet Balance - Small Element */}
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <FiDollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">₹12,450</span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-all relative">
                  <FiBell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
              
              {/* Profile */}
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-all">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">SS</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-700">Sandeep Singh</p>
                  <p className="text-xs text-gray-500">Premium User</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Payment Due Reminder - Thin Top Bar */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 rounded-lg px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiAlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Monthly payment of ₹8,000 due on <span className="font-bold">December 5, 2024</span>
                </span>
              </div>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-all text-sm font-medium">
                Pay Now
              </button>
            </div>
          </div>

          {/* Go to Website - 4 Cards Grid at Top */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Homepage</h3>
                  <p className="text-sm text-blue-600 group-hover:text-blue-700">Visit now</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-all">
                  <FiGlobe className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Website Plans</h3>
                  <p className="text-sm text-green-600 group-hover:text-green-700">View plans</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-all">
                  <FiPackage className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Software Plans</h3>
                  <p className="text-sm text-purple-600 group-hover:text-purple-700">Explore options</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-all">
                  <FiCode className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Maintenance Plans</h3>
                  <p className="text-sm text-orange-600 group-hover:text-orange-700">Learn more</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-all">
                  <FiTool className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - 3 Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 1st Card - Website Usage & Updates */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Website Updates</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Limited Plan</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">9 Updates Left</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiRefreshCcw className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {/* Last Activity - Compact */}
              <div className="mb-5">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-gray-800">Security Update</p>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-xs text-gray-600">47 files updated • 2.3 MB transferred</p>
                </div>
              </div>

              {/* Updates Circle (Line Style) and Stats */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative w-16 h-16 flex-shrink-0">
                  {/* Circle Progress */}
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    {/* Background circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="175.93"
                      strokeDashoffset="43.98"
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-lg font-bold text-blue-600">9</span>
                      <p className="text-xs text-gray-500 -mt-1">left</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Updates Used</span>
                    <span className="font-semibold text-blue-600 text-sm">3 / 12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Plan Usage</span>
                    <span className="font-semibold text-orange-600 text-sm">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Data Used</span>
                    <span className="font-semibold text-gray-600 text-sm">156.7 MB</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={false}
                >
                  Update Now
                </button>
                <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm">
                  History
                </button>
              </div>
            </div>

            {/* 2nd Card - Plan Information Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center justify-center">
                  Current Plan
                  <FiHelpCircle className="w-4 h-4 ml-2 text-gray-400" />
                </h3>
                
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTrendingUp className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">Business Pro Plan</h2>
                <p className="text-gray-600 text-sm">₹8,000/month package</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Plan Value</span>
                  <span className="text-sm text-gray-900 font-semibold">₹8,000</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Activated On</span>
                  <span className="text-sm text-gray-900 font-semibold">Nov 23, 2024</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Next Billing</span>
                  <span className="text-sm text-gray-900 font-semibold">Dec 5, 2024</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium">
                Manage Plan
              </button>
            </div>

            {/* Messages from MeraSoftware Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FiMessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">MeraSoftware Messages</h2>
                    <p className="text-sm text-purple-600">
                      {unreadCount > 0 ? `${unreadCount} unread messages` : 'All messages read'}
                    </p>
                  </div>
                </div>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {messages.slice(0, 3).map((message) => (
                  <div 
                    key={message.id}
                    onClick={() => openMessage(message)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm border ${
                      message.isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {!message.isRead ? (
                          <FiMail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <FiInbox className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <h4 className={`text-sm font-semibold ${
                          message.isRead ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {message.subject}
                        </h4>
                      </div>
                      <span className={`text-xs ${
                        message.isRead ? 'text-gray-500' : 'text-blue-600'
                      }`}>
                        {message.time}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      message.isRead ? 'text-gray-600' : 'text-blue-700'
                    } line-clamp-2`}>
                      {message.preview}
                    </p>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiMessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">MeraSoftware</h3>
                    <p className="text-sm text-gray-500">{selectedMessage.time}</p>
                  </div>
                </div>
                <button 
                  onClick={closeMessage}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedMessage.subject}
                </h2>
                <div className="text-gray-700 leading-relaxed">
                  {selectedMessage.fullMessage}
                </div>
              </div>
              
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedMessage.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedMessage.priority === 'high' ? 'High Priority' : 'Normal Priority'}
                  </span>
                  <button 
                    onClick={closeMessage}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;