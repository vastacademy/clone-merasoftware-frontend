import React from 'react';
import { ShoppingCart, Plus, ChevronRight, Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const CompletedProjectDashboard = ({ project, walletBalance = 0, onStartNewProject, onViewReport }) => {
  const user = useSelector(state => state?.user?.user);
  const cartProductCount = useSelector(state => state?.cart?.cartProductCount) || 0;

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <Link to="/">
              <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                Explore
              </button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Wallet Balance */}
            <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
              <div>
                <p className="text-xs text-green-600">Wallet Balance</p>
                <p className="font-bold text-green-700">{formatCurrency(walletBalance)}</p>
              </div>
            </div>
            
            {/* Cart Button */}
            <Link to="/cart" className="relative bg-gray-100 p-2 rounded-full hover:bg-gray-200">
              <ShoppingCart size={22} />
              {cartProductCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartProductCount}
                </span>
              )}
            </Link>
            
            {/* Profile Menu */}
            <Link to="/profile" className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200">
              <img 
                src={user?.profilePic || "/api/placeholder/150/150"} 
                alt="Profile" 
                className="w-8 h-8 rounded-full" 
              />
              <span className="font-medium">{user?.name || "Profile"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="p-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Completed Project Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Completed Project</h2>
              <div className="flex items-center">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">All Projects</span>
                <button 
                  onClick={onViewReport}
                  className="text-blue-600 flex items-center text-sm hover:text-blue-800"
                >
                  View Details <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{project.productId?.serviceName}</h3>
                  <p className="text-green-100 mt-1">Completed: {
                    project.lastUpdated ? formatDate(project.lastUpdated) : 
                    formatDate(project.updatedAt || project.createdAt)
                  }</p>
                </div>
                <div className="bg-white rounded-full p-2">
                  <Check size={24} className="text-green-600" />
                </div>
              </div>
              
              <div className="mt-4 bg-green-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Project Rating</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-300 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={onViewReport}
                  className="w-full bg-white text-green-700 py-2 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  View Project Report
                </button>
              </div>
            </div>
          </div>

          {/* Start a New Project Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Start a New Project</h2>
            <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus size={30} className="text-blue-600" />
              </div>
              <p className="text-center text-gray-600 mb-6">
                Ready to begin your next project? Click the button below to get started.
              </p>
              <button 
                onClick={onStartNewProject}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Start New Project
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompletedProjectDashboard;