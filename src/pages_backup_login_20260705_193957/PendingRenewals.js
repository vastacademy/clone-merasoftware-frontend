import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';

const PendingRenewals = () => {
  const [pendingRenewals, setPendingRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Fetch pending renewals
  const fetchPendingRenewals = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getPendingRenewals.url, {
        method: SummaryApi.getPendingRenewals.method,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setPendingRenewals(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch pending renewals');
      }
    } catch (error) {
      console.error('Error fetching pending renewals:', error);
      toast.error('Failed to load pending renewals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRenewals();
  }, []);

  // Approve renewal
  const handleApprove = async (transactionId, renewalType) => {
    if (!window.confirm('Are you sure you want to approve this renewal?')) {
      return;
    }

    try {
      setProcessing(transactionId);

      const url = renewalType === 'combined'
        ? `${SummaryApi.approveRenewal.url}/${transactionId}` // Use first transaction ID from combined
        : `${SummaryApi.approveRenewal.url}/${transactionId}`;

      const response = await fetch(url, {
        method: SummaryApi.approveRenewal.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Renewal approved successfully!');
        // Notify dashboard
        localStorage.setItem('dashboardUpdate', JSON.stringify({ type: 'renewal', timestamp: Date.now() }));
        fetchPendingRenewals(); // Refresh list
      } else {
        toast.error(data.message || 'Failed to approve renewal');
      }
    } catch (error) {
      console.error('Error approving renewal:', error);
      toast.error('Failed to approve renewal');
    } finally {
      setProcessing(null);
    }
  };

  // Reject renewal
  const handleReject = async (transactionId, renewalType) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setProcessing(transactionId);

      const url = renewalType === 'combined'
        ? `${SummaryApi.rejectRenewal.url}/${transactionId}`
        : `${SummaryApi.rejectRenewal.url}/${transactionId}`;

      const response = await fetch(url, {
        method: SummaryApi.rejectRenewal.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Renewal rejected');
        // Notify dashboard
        localStorage.setItem('dashboardUpdate', JSON.stringify({ type: 'renewal', timestamp: Date.now() }));
        fetchPendingRenewals(); // Refresh list
      } else {
        toast.error(data.message || 'Failed to reject renewal');
      }
    } catch (error) {
      console.error('Error rejecting renewal:', error);
      toast.error('Failed to reject renewal');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Renewals</h1>
          <p className="text-gray-600 mt-1">Review and approve plan renewal requests</p>
        </div>
        <button
          onClick={fetchPendingRenewals}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </button>
      </div>

      {pendingRenewals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Pending Renewals</h3>
          <p className="text-gray-600">All renewal requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRenewals.map((renewal) => (
            <div
              key={renewal._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {renewal.planDetails?.planName || 'Plan Renewal'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Renewal #{renewal.renewalNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    renewal.type === 'combined'
                      ? 'bg-purple-100 text-purple-800'
                      : renewal.type === 'single' && renewal.paymentMethod === 'wallet'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {renewal.type === 'combined'
                      ? 'Combined Payment'
                      : renewal.paymentMethod === 'wallet'
                      ? 'Wallet'
                      : 'QR/UPI'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* User Info */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <User size={16} />
                  <div>
                    <span className="text-sm text-gray-600">User:</span>
                    <p className="font-medium">{renewal.user?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{renewal.user?.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <DollarSign size={16} />
                  <div>
                    <span className="text-sm text-gray-600">Amount:</span>
                    <p className="font-medium text-green-600">
                      {displayINRCurrency(renewal.type === 'combined' ? renewal.totalAmount : renewal.amount)}
                    </p>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <Calendar size={16} />
                  <div>
                    <span className="text-sm text-gray-600">Plan:</span>
                    <p className="font-medium">{renewal.planDetails?.planName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">
                      Yearly Days Left: {renewal.planDetails?.totalYearlyDaysRemaining || 0}
                    </p>
                  </div>
                </div>

                {/* Submission Date */}
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock size={16} />
                  <div>
                    <span className="text-sm text-gray-600">Submitted:</span>
                    <p className="font-medium">
                      {new Date(renewal.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(renewal.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              {renewal.type === 'combined' && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Payment Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-medium">{displayINRCurrency(renewal.walletAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">UPI:</span>
                      <span className="font-medium">{displayINRCurrency(renewal.upiAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-200">
                      <span className="font-semibold text-gray-800">Total:</span>
                      <span className="font-semibold text-green-600">
                        {displayINRCurrency(renewal.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              {renewal.upiTransactionId && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600">UPI Transaction ID:</p>
                  <p className="text-sm font-mono font-medium text-gray-800 break-all">
                    {renewal.upiTransactionId}
                  </p>
                </div>
              )}

              {/* Renewal Period */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <AlertCircle size={14} />
                <span>
                  This renewal will extend the plan for 30 days (from {new Date(renewal.renewalPeriod?.start).toLocaleDateString()} to {new Date(renewal.renewalPeriod?.end).toLocaleDateString()})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(
                    renewal.type === 'combined' ? renewal.transactions[0].transactionId : renewal.transactionId,
                    renewal.type
                  )}
                  disabled={processing !== null}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing === (renewal.type === 'combined' ? renewal.transactions[0].transactionId : renewal.transactionId) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Approve
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleReject(
                    renewal.type === 'combined' ? renewal.transactions[0].transactionId : renewal.transactionId,
                    renewal.type
                  )}
                  disabled={processing !== null}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRenewals;
