import React from 'react';
import { X, Calendar, RefreshCw, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const YearlyPlanDetailsModal = ({ plan, onClose }) => {
  // Calculate days from purchase date
  const calculateDaysFromPurchase = () => {
    const startDate = new Date(plan.createdAt);
    const today = new Date();
    const totalDays = 365;
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, totalDays - daysPassed);
    return daysLeft;
  };

  // Calculate current month days remaining
  const calculateCurrentMonthDays = () => {
    if (!plan.currentMonthExpiryDate) return 0;
    const today = new Date();
    const expiryDate = new Date(plan.currentMonthExpiryDate);
    const remainingDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, remainingDays);
  };

  // Calculate next renewal date
  const getNextRenewalDate = () => {
    if (!plan.currentMonthExpiryDate) return 'N/A';
    const expiryDate = new Date(plan.currentMonthExpiryDate);
    return expiryDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const yearlyDaysLeft = calculateDaysFromPurchase();
  const currentMonthDays = calculateCurrentMonthDays();
  const currentMonthUpdatesUsed = plan.currentMonthUpdatesUsed || 0;

  // Check if it's a monthly limited plan
  const isLimitedPlan = plan.productId?.isMonthlyLimitedPlan;
  const monthlyLimit = plan.productId?.monthlyUpdateLimit || 1;
  const monthlyPrice = isLimitedPlan
    ? (plan.productId?.monthlyRenewalPrice || 3000)
    : (plan.productId?.monthlyRenewalCost || 8000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${
          isLimitedPlan
            ? 'from-purple-600 to-pink-600'
            : 'from-blue-600 to-purple-600'
        } p-6 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-all"
          >
            <X size={24} />
          </button>

          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <div className="text-3xl font-bold">{isLimitedPlan ? monthlyLimit : '∞'}</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isLimitedPlan ? 'Monthly Limited Plan Details' : 'Yearly Plan Details'}
              </h2>
              <p className={`${isLimitedPlan ? 'text-purple-100' : 'text-blue-100'} text-sm`}>
                {plan.productId?.serviceName || 'Website Updates'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Overview Card */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-bold text-gray-800 text-lg">Plan Overview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Plan Name</p>
                <p className="font-semibold text-gray-800">{plan.productId?.serviceName || 'Website Updates'}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
                <p className="font-semibold text-gray-800">{formatDate(plan.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Current Month Status */}
          <div className={`bg-gradient-to-br ${
            isLimitedPlan
              ? 'from-purple-50 to-pink-50 border-purple-200'
              : 'from-green-50 to-emerald-50 border-green-200'
          } rounded-xl p-5 border`}>
            <div className="flex items-center mb-4">
              <Clock className={`w-5 h-5 ${isLimitedPlan ? 'text-purple-600' : 'text-green-600'} mr-2`} />
              <h3 className="font-bold text-gray-800 text-lg">Current Month Status</h3>
            </div>

            <div className="space-y-4">
              {/* Updates Used */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">
                    {isLimitedPlan ? 'Updates Used This Month' : 'Updates Used This Month'}
                  </p>
                  <div className="flex items-center">
                    <CheckCircle className={`w-4 h-4 ${isLimitedPlan ? 'text-purple-600' : 'text-green-600'} mr-1`} />
                    <span className={`font-bold ${isLimitedPlan ? 'text-purple-700' : 'text-green-700'}`}>
                      {currentMonthUpdatesUsed}
                      {isLimitedPlan && `/${monthlyLimit}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>
                    {isLimitedPlan
                      ? `${monthlyLimit - currentMonthUpdatesUsed} update${monthlyLimit - currentMonthUpdatesUsed !== 1 ? 's' : ''} remaining`
                      : 'Unlimited updates available'}
                  </span>
                </div>
              </div>

              {/* Days Remaining */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Days Left This Month</p>
                  <span className="font-bold text-lg text-blue-700">{currentMonthDays}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentMonthDays <= 3
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.max(5, (currentMonthDays / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Plan Status */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="font-bold text-gray-800 text-lg">Yearly Plan Status</h3>
            </div>

            <div className="space-y-4">
              {/* Yearly Days Remaining */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Total Days Remaining</p>
                  <span className="font-bold text-2xl text-purple-700">{yearlyDaysLeft}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                    style={{ width: `${Math.max(5, (yearlyDaysLeft / 365) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {365 - yearlyDaysLeft} days completed out of 365 days
                </p>
              </div>

              {/* Next Renewal */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Next Monthly Renewal</p>
                    <p className="text-xs text-gray-500">Auto-renews for next 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-purple-700">{getNextRenewalDate()}</p>
                    {currentMonthDays <= 3 && (
                      <p className="text-xs text-red-600 font-medium">Renew soon!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Benefits */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <h3 className="font-bold text-gray-800 text-lg mb-3">Plan Benefits</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {isLimitedPlan
                    ? `${monthlyLimit} update per month for 1 year`
                    : 'Unlimited updates every month for 1 year'}
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {isLimitedPlan
                    ? `Monthly billing at ₹${monthlyPrice.toLocaleString()}`
                    : `Monthly renewal at ₹${monthlyPrice.toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {isLimitedPlan
                    ? 'Automatic monthly renewal with invoice billing'
                    : 'Automatic monthly renewal'}
                </p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Priority support and quick turnaround</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Valid for {yearlyDaysLeft} more days</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 bg-gradient-to-r ${
              isLimitedPlan
                ? 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                : 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            } text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default YearlyPlanDetailsModal;
