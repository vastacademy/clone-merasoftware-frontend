// FileName: MultipleFiles/KYCVerification.js
import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Clock, AlertTriangle, User, FileText, MapPin, Camera, Info } from 'lucide-react';
import SummaryApi from '../common'; // Assuming SummaryApi is accessible
import { toast } from 'sonner';
import moment from 'moment'; // For date formatting

const KYCVerification = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectReason, setRejectReason] = useState({
    documentFront: false,
    documentBack: false,
    selfie: false,
    customReason: ''
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [users, setUsers] = useState([]); // This will hold data fetched from API
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false); // For approve/reject buttons

  // Helper functions for status display
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM DD, YYYY hh:mm A');
  };

  // Fetch KYC Submissions
  const fetchKycSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.getAllKycSubmissions.url, {
        method: SummaryApi.getAllKycSubmissions.method,
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.message || "Failed to fetch KYC submissions.");
      }
    } catch (error) {
      console.error("Error fetching KYC submissions:", error);
      toast.error("An error occurred while fetching KYC submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycSubmissions();
  }, []);

  // Filtered users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.userDetails.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show approval confirmation modal
  const handleApproveClick = (userId) => {
    setUserToApprove(userId);
    setShowApprovalModal(true);
  };

  // Handle Approve KYC
  const handleApprove = async () => {
    setSubmittingAction(true);
    try {
      const response = await fetch(SummaryApi.approveKyc.url, {
        method: SummaryApi.approveKyc.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userToApprove })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchKycSubmissions(); // Re-fetch data to update list
        setSelectedUser(null); // Close detail view
        setShowApprovalModal(false);
        setUserToApprove(null);
      } else {
        toast.error(data.message || "Failed to approve KYC.");
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      toast.error("An error occurred while approving KYC.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reject KYC
  const handleReject = async () => {
    const reasons = [];
    if (rejectReason.documentFront) reasons.push('ID Document Front Page Issue');
    if (rejectReason.documentBack) reasons.push('ID Document Back Page Issue');
    if (rejectReason.selfie) reasons.push('Selfie Issue');
    if (rejectReason.customReason) reasons.push(rejectReason.customReason);

    if (reasons.length === 0) {
      toast.error("Please select at least one rejection reason or provide a custom reason.");
      return;
    }

    if (window.confirm("Are you sure you want to reject this user's KYC and request resubmission?")) {
      setSubmittingAction(true);
      try {
        const response = await fetch(SummaryApi.rejectKyc.url, {
          method: SummaryApi.rejectKyc.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: selectedUser._id, reasons, adminNotes: rejectReason.customReason })
        });
        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
          fetchKycSubmissions(); // Re-fetch data to update list
          setShowRejectModal(false);
          setSelectedUser(null); // Close detail view
          setRejectReason({ documentFront: false, documentBack: false, selfie: false, customReason: '' }); // Reset form
        } else {
          toast.error(data.message || "Failed to reject KYC.");
        }
      } catch (error) {
        console.error("Error rejecting KYC:", error);
        toast.error("An error occurred while rejecting KYC.");
      } finally {
        setSubmittingAction(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">KYC Admin Panel</h1>
            <p className="text-gray-600">Review and manage user KYC submissions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* User List Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Submissions</h2>

                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading KYC submissions...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No KYC submissions found.</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedUser?._id === user._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Submitted: {formatDate(user.createdAt)}</p>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.userDetails.kycStatus)}`}>
                          {getStatusIcon(user.userDetails.kycStatus)}
                          <span className="ml-1 capitalize">{user.userDetails.kycStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h2>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500">Phone: {selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedUser.userDetails.kycStatus)}`}>
                      {getStatusIcon(selectedUser.userDetails.kycStatus)}
                      <span className="ml-2 capitalize">{selectedUser.userDetails.kycStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Details & Documents</h3>

                  {/* Address Details */}
                  {selectedUser.userDetails.address && (
                    <div className="border rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Address Details</h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        {selectedUser.userDetails.address.streetAddress}, {selectedUser.userDetails.address.city}, {selectedUser.userDetails.address.state} - {selectedUser.userDetails.address.pinCode}
                      </p>
                      {selectedUser.userDetails.address.landmark && <p className="text-sm text-gray-600">Landmark: {selectedUser.userDetails.address.landmark}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Document Front */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">
                          {selectedUser.userDetails.kycDocuments?.documentType === 'aadhar' ? 'Aadhaar Front' : 'Driving License Front'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Type: {selectedUser.userDetails.kycDocuments?.documentType || 'N/A'}</p>
                      <div className="bg-gray-100 rounded-md p-3 mb-3 flex justify-center items-center min-h-[128px]">
                        {selectedUser.userDetails.kycDocuments?.documentFrontPhoto ? (
                          <img
                            src={selectedUser.userDetails.kycDocuments.documentFrontPhoto}
                            alt="ID Document Front"
                            className="w-full h-32 object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No photo uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* ID Document Back (Conditional for Aadhaar) */}
                    {selectedUser.userDetails.kycDocuments?.documentType === 'aadhar' && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <FileText className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-medium text-gray-900">Aadhaar Back</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Type: Aadhaar Card</p>
                        <div className="bg-gray-100 rounded-md p-3 mb-3 flex justify-center items-center min-h-[128px]">
                          {selectedUser.userDetails.kycDocuments?.documentBackPhoto ? (
                            <img
                              src={selectedUser.userDetails.kycDocuments.documentBackPhoto}
                              alt="ID Document Back"
                              className="w-full h-32 object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">No photo uploaded</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selfie */}
                    <div className={`border rounded-lg p-4 ${selectedUser.userDetails.kycDocuments?.documentType !== 'aadhar' ? 'md:col-span-2' : ''}`}>
                      <div className="flex items-center mb-2">
                        <Camera className="w-5 h-5 text-purple-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Selfie Verification</h4>
                      </div>
                      <div className="flex justify-center mb-3">
                        <div className="bg-gray-100 rounded-md p-3 flex justify-center items-center min-h-[160px] min-w-[128px]">
                          {selectedUser.userDetails.kycDocuments?.selfiePhoto ? (
                            <img
                              src={selectedUser.userDetails.kycDocuments.selfiePhoto}
                              alt="User Selfie"
                              className="w-32 h-40 object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">No photo uploaded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reasons */}
                  {selectedUser.userDetails.kycStatus === 'rejected' && selectedUser.userDetails.kycRejectionReasons && selectedUser.userDetails.kycRejectionReasons.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2 flex items-center"><Info className="w-4 h-4 mr-2" /> Rejection Reasons:</h4>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {selectedUser.userDetails.kycRejectionReasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedUser.userDetails.kycStatus === 'pending' && (
                    <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => handleApproveClick(selectedUser._id)}
                        disabled={submittingAction}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 inline mr-2" />
                        {submittingAction ? 'Approving...' : 'Approve KYC'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={submittingAction}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        {submittingAction ? 'Processing...' : 'Reject & Request Resubmission'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4" />
                  <p>Select a user from the left panel to review their KYC submission</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specify Rejection Reasons</h3>

            <div className="space-y-3 mb-4">
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={rejectReason.documentFront}
                  onChange={(e) => setRejectReason({...rejectReason, documentFront: e.target.checked})}
                  className="mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
                ID Document Front Page Issue
              </label>
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={rejectReason.documentBack}
                  onChange={(e) => setRejectReason({...rejectReason, documentBack: e.target.checked})}
                  className="mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
                ID Document Back Page Issue
              </label>
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={rejectReason.selfie}
                  onChange={(e) => setRejectReason({...rejectReason, selfie: e.target.checked})}
                  className="mr-3 h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
                Selfie Issue
              </label>
            </div>

            <textarea
              placeholder="Additional comments (optional)"
              value={rejectReason.customReason}
              onChange={(e) => setRejectReason({...rejectReason, customReason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={3}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason({ documentFront: false, documentBack: false, selfie: false, customReason: '' }); // Reset form
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submittingAction || (!rejectReason.documentFront && !rejectReason.documentBack && !rejectReason.selfie && !rejectReason.customReason)}
              >
                {submittingAction ? 'Sending...' : 'Send Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border-0">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Approve KYC Documents?
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                Are you sure you want to approve this user's KYC submission? This action will verify their identity and grant them full account access.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setUserToApprove(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  disabled={submittingAction}
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingAction}
                >
                  {submittingAction ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Approving...
                    </div>
                  ) : (
                    'Yes, Approve'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;