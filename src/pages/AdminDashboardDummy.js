import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaSignOutAlt, FaHome, FaUsers, FaBox, FaShoppingCart, FaChartBar } from 'react-icons/fa';

const AdminDashboardDummy = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state?.user?.user);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Set dummy stats
    setStats({
      totalUsers: 156,
      totalProducts: 42,
      totalOrders: 328,
      totalRevenue: '₹2,45,000'
    });
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/userLogout`, {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Users</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <FaUsers className="text-5xl text-blue-200" />
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Products</p>
                <p className="text-4xl font-bold text-green-600">{stats.totalProducts}</p>
              </div>
              <FaBox className="text-5xl text-green-200" />
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                <p className="text-4xl font-bold text-orange-600">{stats.totalOrders}</p>
              </div>
              <FaShoppingCart className="text-5xl text-orange-200" />
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
                <p className="text-4xl font-bold text-purple-600">{stats.totalRevenue}</p>
              </div>
              <FaChartBar className="text-5xl text-purple-200" />
            </div>
          </div>
        </div>

        {/* Admin Panel Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <FaUsers className="text-4xl text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">User Management</h3>
                <p className="text-gray-600 text-sm">Manage all users and roles</p>
              </div>
            </div>
          </div>

          {/* Products Management */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <FaBox className="text-4xl text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Product Management</h3>
                <p className="text-gray-600 text-sm">Add, edit, or delete products</p>
              </div>
            </div>
          </div>

          {/* Orders Management */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <FaShoppingCart className="text-4xl text-orange-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Order Management</h3>
                <p className="text-gray-600 text-sm">View and manage all orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Admin Portal</h3>
          <p className="text-blue-800">
            This is a dummy admin dashboard. Full admin features including user management,
            product management, order processing, and analytics will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardDummy;
