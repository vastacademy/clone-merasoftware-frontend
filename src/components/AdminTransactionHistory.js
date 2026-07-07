import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calendar, Filter, RefreshCw, Trash2, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';

const AdminTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'failed'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'deposit', 'payment'
  const [showDetails, setShowDetails] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // For confirmation popup
  
  // New states for bulk delete
  const [selectedTransactions, setSelectedTransactions] = useState([]); // For bulk selection
  const [selectAll, setSelectAll] = useState(false); // For select all checkbox
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false); // For bulk delete confirmation

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.wallet.adminTransactionHistory.url, {
        method: SummaryApi.wallet.adminTransactionHistory.method,
        credentials: 'include',
        headers: {
          "Content-Type": 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // console.log("Received transactions:", data.data);
        // Check if there are any installment payments
        const installmentPayments = data.data.filter(t => 
          t.isInstallmentPayment === true || t.type === 'payment'
        );
        // console.log("Installment payments:", installmentPayments);
        
        setTransactions(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Individual delete function
  const handleDeleteTransaction = async (transactionId) => {
    try {
        const response = await fetch(`${SummaryApi.wallet.deleteTransaction.url}/${transactionId}`, {
            method: SummaryApi.wallet.deleteTransaction.method,
            credentials: 'include',
            headers: {
                "Content-Type": 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            toast.success('Transaction deleted successfully');
            fetchTransactionHistory(); // Refresh the list
            setDeleteConfirm(null);
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Failed to delete transaction');
    }
  };

  // Handle individual checkbox selection
  const handleTransactionSelect = (transactionId) => {
    if (selectedTransactions.includes(transactionId)) {
        setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    } else {
        setSelectedTransactions([...selectedTransactions, transactionId]);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
        setSelectedTransactions([]);
        setSelectAll(false);
    } else {
        setSelectedTransactions(filteredTransactions.map(t => t._id));
        setSelectAll(true);
    }
  };

  // Clear selections after operations
  const clearSelections = () => {
    setSelectedTransactions([]);
    setSelectAll(false);
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    try {
        // Delete all selected transactions one by one
        const deletePromises = selectedTransactions.map(transactionId => 
            fetch(`${SummaryApi.wallet.deleteTransaction.url}/${transactionId}`, {
                method: SummaryApi.wallet.deleteTransaction.method,
                credentials: 'include',
                headers: {
                    "Content-Type": 'application/json'
                }
            })
        );
        
        const responses = await Promise.all(deletePromises);
        const results = await Promise.all(responses.map(res => res.json()));
        
        const successCount = results.filter(result => result.success).length;
        const failCount = results.length - successCount;
        
        if (successCount > 0) {
            toast.success(`${successCount} transaction(s) deleted successfully`);
        }
        if (failCount > 0) {
            toast.error(`${failCount} transaction(s) failed to delete`);
        }
        
        fetchTransactionHistory(); // Refresh the list
        clearSelections();
        setBulkDeleteConfirm(false);
        
    } catch (error) {
        console.error('Error in bulk delete:', error);
        toast.error('Failed to delete selected transactions');
    }
  };

  // Filter transactions based on selected status and type
  const filteredTransactions = transactions
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => {
      if (typeFilter === 'all') return true;
      if (typeFilter === 'payment') {
        // Only show actual installment payments
        return (t.type === 'payment' && (t.isInstallmentPayment === true || t.orderId));
      }
      if (typeFilter === 'deposit') {
        // Only show actual wallet deposits
        return t.type === 'deposit' && !t.isInstallmentPayment && !t.orderId;
      }
      return t.type === typeFilter;
    });

  // Function to get status badge color
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center justify-center">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center justify-center">
            <XCircle size={12} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Function to get transaction type badge
  const getTypeBadge = (transaction) => {
    // More explicit check for installment payments
    if (transaction.isInstallmentPayment === true && 
        transaction.type === 'payment' && 
        (transaction.orderId || transaction.installmentNumber)) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          Installment Payment
        </span>
      );
    } else if (transaction.type === 'deposit' && !transaction.isInstallmentPayment) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          Wallet Deposit
        </span>
      );
    } else {
      // Fallback for any other transaction types
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          {transaction.type || "Unknown"}
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Toggle transaction details view
  const toggleDetails = (id) => {
    if (showDetails === id) {
      setShowDetails(null);
    } else {
      setShowDetails(id);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Calendar className="mr-2 text-gray-500" size={24} />
          Transaction History
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* Bulk Delete Button - Show only when selections exist */}
          {selectedTransactions.length > 0 && (
            <button 
              onClick={() => setBulkDeleteConfirm(true)}
              className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 text-sm flex items-center shadow-sm"
            >
              <Trash2 size={14} className="mr-1" />
              Delete Selected ({selectedTransactions.length})
            </button>
          )}

          {/* Status Filter */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              All Status
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-sm ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Approved
            </button>
            <button 
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-sm ${filter === 'failed' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Rejected
            </button>
          </div>
          
          {/* Type Filter */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <button 
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-sm ${typeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              All Types
            </button>
            <button 
              onClick={() => setTypeFilter('deposit')}
              className={`px-3 py-1 text-sm ${typeFilter === 'deposit' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Wallet
            </button>
            <button 
              onClick={() => setTypeFilter('payment')}
              className={`px-3 py-1 text-sm ${typeFilter === 'payment' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Installment
            </button>
          </div>

          <button 
            onClick={fetchTransactionHistory}
            className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 text-sm flex items-center shadow-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Transactions</h3>
          <div className="text-2xl font-bold text-blue-900">{transactions.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <h3 className="text-sm font-medium text-green-800 mb-1">Total Amount</h3>
          <div className="text-2xl font-bold text-green-900">
            {displayINRCurrency(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800 mb-1">Installment Payments</h3>
          <div className="text-2xl font-bold text-purple-900">
            {transactions.filter(t => t.isInstallmentPayment || t.type === 'payment').length}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4"><Filter /></div>
          <h3 className="text-lg font-medium text-gray-600">No transaction history found</h3>
          <p className="text-gray-500 mt-1">Try changing your filters or refresh the page</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                {/* Checkbox Column */}
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <React.Fragment key={transaction._id}>
                  <tr className='hover:bg-gray-50'>
                    {/* Checkbox Column */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => handleTransactionSelect(transaction._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm truncate max-w-[150px]">{transaction.transactionId}</div>
                      {transaction.upiTransactionId && (
                        <div className="text-xs text-green-600 mt-1">
                          UPI: {transaction.upiTransactionId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.userId && typeof transaction.userId === 'object' ? (
                        <>
                          <div className="font-medium">{transaction.userId.name}</div>
                          <div className="text-xs text-gray-500">{transaction.userId.email}</div>
                        </>
                      ) : (
                        <span className="text-gray-500">User ID: {transaction.userId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{formatDate(transaction.date)}</div>
                      <div className="text-xs text-gray-500">{formatTime(transaction.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getTypeBadge(transaction)}
                      {transaction.orderId && (
                        <div className="text-xs text-gray-500 mt-1">
                          Order: {typeof transaction.orderId === 'object' ? 
                            transaction.orderId._id : 
                            transaction.orderId.substring(0, 8) + '...'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {displayINRCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(transaction.status)}
                      {transaction.verifiedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          by: {transaction.verifiedBy.name || 
                            (typeof transaction.verifiedBy === 'string' ? 
                              transaction.verifiedBy.substring(0, 6) + '...' : 'Admin')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(transaction._id);
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm flex items-center mx-auto"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row - COMMENTED OUT */}
                  {/* 
                  {showDetails === transaction._id && (
                    <tr>
                      <td colSpan="8" className="bg-gray-50 border-t border-b border-gray-200">
                        <div className="p-4">
                          <h3 className="font-medium mb-2">Transaction Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded-md border border-gray-200">
                              <div className="text-xs text-gray-500">Transaction ID</div>
                              <div className="font-mono text-sm break-all">{transaction.transactionId}</div>
                            </div>
                            
                            {transaction.upiTransactionId && (
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-xs text-gray-500">UPI Reference</div>
                                <div className="font-mono text-sm break-all">{transaction.upiTransactionId}</div>
                              </div>
                            )}
                            
                            {transaction.orderId && (
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-xs text-gray-500">Order ID</div>
                                <div className="font-mono text-sm break-all">
                                  {typeof transaction.orderId === 'object' ? 
                                    transaction.orderId._id : transaction.orderId}
                                </div>
                              </div>
                            )}
                            
                            {transaction.installmentNumber && (
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <div className="text-xs text-gray-500">Installment</div>
                                <div className="text-sm">{transaction.installmentNumber}</div>
                              </div>
                            )}
                            
                            <div className="bg-white p-3 rounded-md border border-gray-200">
                              <div className="text-xs text-gray-500">Created At</div>
                              <div className="text-sm">{new Date(transaction.date).toLocaleString()}</div>
                            </div>
                            
                            {transaction.description && (
                              <div className="bg-white p-3 rounded-md border border-gray-200 sm:col-span-2">
                                <div className="text-xs text-gray-500">Description</div>
                                <div className="text-sm">{transaction.description}</div>
                              </div>
                            )}
                          </div>
                          
                          {transaction.orderId && (
                            <button 
                              className="mt-4 px-3 py-1 text-sm bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/project-details/${typeof transaction.orderId === 'object' ? 
                                  transaction.orderId._id : transaction.orderId}`, '_blank');
                              }}
                            >
                              <ExternalLink size={14} className="mr-1" />
                              View Order Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  */}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Individual Delete Confirmation Popup */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No
              </button>
              <button 
                onClick={() => handleDeleteTransaction(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Popup */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Bulk Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedTransactions.length} selected transaction(s)? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionHistory;