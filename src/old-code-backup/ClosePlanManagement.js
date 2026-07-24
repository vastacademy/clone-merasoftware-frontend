import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import SummaryApi from '../common';
import { toast } from 'sonner';
import displayINRCurrency from '../helpers/displayCurrency';

const ClosePlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'
  const [statusFilter, setStatusFilter] = useState('all'); // 'active', 'closed', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [closureReason, setClosureReason] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const reasonOptions = [
    { value: 'customer_requested', label: 'Customer Requested' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'service_issues', label: 'Service Issues' },
    { value: 'no_longer_needed', label: 'No Longer Needed' },
    { value: 'other', label: 'Other (Please specify below)' }
  ];

  // Fetch all update plans
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getUpdatePlans.url, {
        method: SummaryApi.getUpdatePlans.method,
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setPlans(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error fetching plans');
    } finally {
      setLoading(false);
    }
  };

  // Filter and display plans based on tab and filters
  useEffect(() => {
    let result = plans;

    // Tab filter
    if (activeTab === 'active') {
      result = result.filter(plan => plan.planStatus !== 'closed');
    } else if (activeTab === 'closed') {
      result = result.filter(plan => plan.planStatus === 'closed');
    }

    // Status filter (all, active, closed)
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(plan => plan.planStatus !== 'closed');
      } else if (statusFilter === 'closed') {
        result = result.filter(plan => plan.planStatus === 'closed');
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(plan =>
        plan.userId?.name?.toLowerCase().includes(searchLower) ||
        plan.productId?.serviceName?.toLowerCase().includes(searchLower) ||
        plan.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPlans(result);
  }, [plans, activeTab, statusFilter, searchTerm]);

  // Handle close plan modal open
  const handleOpenCloseModal = (plan) => {
    setSelectedPlan(plan);
    setClosureReason('');
    setShowCloseModal(true);
  };

  // Handle close plan submission
  const handleSubmitClosePlan = async () => {
    if (!closureReason.trim()) {
      toast.error('Please select or enter a closure reason');
      return;
    }

    try {
      setIsClosing(true);
      const response = await fetch(SummaryApi.closePlan.url, {
        method: SummaryApi.closePlan.method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedPlan._id,
          closureReason: closureReason
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Plan closed successfully');
        setShowCloseModal(false);
        setSelectedPlan(null);
        fetchPlans(); // Refresh plans
      } else {
        toast.error(data.message || 'Failed to close plan');
      }
    } catch (error) {
      console.error('Error closing plan:', error);
      toast.error('Error closing plan');
    } finally {
      setIsClosing(false);
    }
  };

  // Plan Card Component
  const PlanCard = ({ plan }) => {
    const isPlanClosed = plan.planStatus === 'closed';
    const planType = plan.productId?.isMonthlyLimitedPlan
      ? 'Monthly Limited Plan'
      : plan.productId?.isMonthlyRenewablePlan
        ? 'Yearly Renewable Plan'
        : 'Regular Update Plan';

    return (
      <div className={`rounded-lg p-4 border-2 ${
        isPlanClosed
          ? 'bg-red-50 border-red-300'
          : 'bg-white border-blue-300 hover:shadow-lg transition-shadow'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{plan.productId?.serviceName}</h3>
            <p className="text-sm text-gray-600">
              {plan.userId?.name} ({plan.userId?.email})
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isPlanClosed
              ? 'bg-red-200 text-red-800'
              : 'bg-blue-200 text-blue-800'
          }`}>
            {isPlanClosed ? '⛔ Closed' : '✓ Active'}
          </div>
        </div>

        {/* Plan Info */}
        <div className="text-sm text-gray-700 mb-3 space-y-1">
          <p><strong>Type:</strong> {planType}</p>
          <p><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString('en-GB')}</p>
          <p><strong>Updates:</strong> {plan.updatesUsed || 0}/{plan.productId?.updateCount || 'N/A'}</p>
        </div>

        {/* Closure Reason (if closed) */}
        {isPlanClosed && plan.closureReason && (
          <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-3 rounded">
            <p className="text-sm text-red-800">
              <strong>Closure Reason:</strong> {plan.closureReason}
            </p>
            {plan.closedAt && (
              <p className="text-xs text-red-700 mt-1">
                Closed on: {new Date(plan.closedAt).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isPlanClosed && (
            <button
              onClick={() => handleOpenCloseModal(plan)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded transition"
            >
              Close Plan
            </button>
          )}
          <button
            onClick={() => alert(`Viewing details for ${plan.productId?.serviceName}`)}
            className={`flex-1 ${
              isPlanClosed
                ? 'bg-gray-500 hover:bg-gray-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-semibold py-2 px-3 rounded transition`}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Plan Closure Management</h1>
          <p className="text-gray-600">Manage and close website update plans</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by customer name, email, or plan name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="active">Active Plans Only</option>
              <option value="closed">Closed Plans Only</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            Active Plans
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'closed'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-red-500'
            }`}
          >
            Closed Plans
          </button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No {activeTab} plans found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map(plan => (
              <PlanCard key={plan._id} plan={plan} />
            ))}
          </div>
        )}
      </div>

      {/* Close Plan Modal */}
      {showCloseModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Close Plan</h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Plan Information */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Plan Information</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Plan:</strong> {selectedPlan.productId?.serviceName}</p>
                <p><strong>Customer:</strong> {selectedPlan.userId?.name}</p>
                <p><strong>Type:</strong> {
                  selectedPlan.productId?.isMonthlyLimitedPlan
                    ? 'Monthly Limited'
                    : selectedPlan.productId?.isMonthlyRenewablePlan
                      ? 'Yearly Renewable'
                      : 'Regular'
                }</p>
                <p><strong>Updates Used:</strong> {selectedPlan.updatesUsed || 0}/{selectedPlan.productId?.updateCount}</p>
              </div>
            </div>

            {/* Closure Reason Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Closure Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason...</option>
                {reasonOptions.map(option => (
                  <option key={option.value} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason (if Other selected) */}
            {closureReason === 'Other (Please specify below)' && (
              <div className="mb-4">
                <textarea
                  placeholder="Please enter the closure reason..."
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              </div>
            )}

            {/* Email Preview */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">📧 Email Preview:</p>
              <p>Emails will be sent to:</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>✓ <strong>Customer:</strong> {selectedPlan.userId?.email}</li>
                <li>✓ <strong>Admin:</strong> vacomputers.com@gmail.com, syncvap@gmail.com</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
                disabled={isClosing}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClosePlan}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                disabled={isClosing || !closureReason.trim()}
              >
                {isClosing ? 'Closing...' : 'Close Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosePlanManagement;
