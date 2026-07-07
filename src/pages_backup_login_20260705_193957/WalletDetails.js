import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, CreditCard, ShoppingCart } from 'lucide-react';
import Context from '../context';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { isOrderApproved } from '../helpers/orderVisibility';

const WalletDetails = () => {
  const [walletHistory, setWalletHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const user = useSelector(state => state?.user?.user);
  const context = useContext(Context);
  
  // Calculate total spending for today
  const getTotalSpending = () => {
    return walletHistory
      .filter(transaction => 
        // Include all spending transactions regardless of date
        transaction.type === 'payment' || 
        transaction.type === 'service' || 
        (transaction.amount < 0 && transaction.type !== 'deposit')
      )
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  };
  
  // Count today's transactions
  const getTodayTransactionCount = () => {
    const today = new Date().toLocaleDateString();
    
    return walletHistory.filter(transaction => {
      const transactionDate = new Date(transaction.date).toLocaleDateString();
      return transactionDate === today;
    }).length;
  };
  
  // Fetch wallet history
  const fetchWalletHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.wallet.history.url, {
        method: SummaryApi.wallet.history.method,
        credentials: 'include',
        headers: {
          "content-type": 'application/json'
        }
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        setWalletHistory(responseData.data);
      }
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      toast.error('Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProject = async () => {
    try {
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        // Find active (in-progress) project
        const allOrders = data.data || [];
        const activeProj = allOrders.find(order => {
          const category = order.productId?.category?.toLowerCase();
          if (!category) return false;
          
          // Only consider website projects, not update plans
          if (['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category)) {
            if (!isOrderApproved(order) || order.orderVisibility === 'payment-rejected') {
              return false; // Don't show as active if pending approval or rejected
            }

            return order.projectProgress < 100 || order.currentPhase !== 'completed';
          }
          return false;
        });
        
        setActiveProject(activeProj || null);
      }
    } catch (error) {
      console.error("Error fetching active project:", error);
    }
  };
  
  useEffect(() => {
    fetchWalletHistory();
    fetchActiveProject(); 
    // Refresh wallet balance
    if (context?.fetchWalletBalance) {
      context.fetchWalletBalance();
    }
  }, []);

  // Helper to determine transaction display properties
  const getTransactionDisplay = (transaction) => {
    if (transaction.type === 'refund') {
      return {
        sign: '+',
        color: 'text-green-600',
        title: transaction.description || 'Refund',
        icon: <RefreshCw size={18} className="text-green-600" />,
        iconBg: 'bg-green-100'
      };
    } else if (transaction.type === 'deposit') {
      return {
        sign: '+',
        color: 'text-green-600',
        title: 'Wallet Deposit',
        icon: <CreditCard size={18} className="text-blue-600" />,
        iconBg: 'bg-blue-100',
        status: transaction.status
      };
    } else {
      return {
        sign: '-',
        color: 'text-red-600',
        title: transaction.productId?.serviceName || 'Payment',
        icon: <ShoppingCart size={18} className="text-gray-600" />,
        iconBg: 'bg-gray-100'
      };
    }
  };

  // Get status badge for deposit transactions
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    switch(status) {
      case 'completed':
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Generate transaction ID
  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  };

  // Handle amount submission
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Generate a transaction ID
    const txnId = generateTransactionId();
    setTransactionId(txnId);

    // Create UPI payment link
    // Replace with your UPI ID
    const upiId = 'vacomputers.com@okhdfcbank';
    const payeeName = 'VA Computer';
    const upi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Wallet Recharge - ${txnId}`)}&tr=${txnId}`;
    
    setUpiLink(upi);
    setShowQR(true);
  };

  // Verify transaction
  const verifyTransaction = async (e) => {
    e.preventDefault();
    
    // Validate UPI transaction ID
    if (!upiTransactionId || upiTransactionId.length < 10 || upiTransactionId.length > 12) {
      setVerificationStatus('Please enter a valid UPI transaction ID');
      return;
    }
    
    setLoading(true);
    setVerificationStatus('Verifying your payment...');
  
    try {
      // Send request with UPI transaction ID
      const response = await fetch(SummaryApi.wallet.verifyPayment.url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({
          transactionId: transactionId,
          amount: Number(amount),
          upiTransactionId: upiTransactionId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus('Your payment verification request has been submitted. The amount will be added to your wallet after admin verification.');
        setVerificationSubmitted(true);
      } else {
        setVerificationStatus(data.message || 'Verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('Error verifying payment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  

  // Set quick amount
  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  return (
    <DashboardLayout user={user}
    activeProject={activeProject}>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with User Info and Balance */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 capitalize">
                  {getGreeting()}, {user?.name || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">Welcome back to your wallet dashboard</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-blue-600">
                      {displayINRCurrency(context?.walletBalance || 0)}
                    </p>
                    <button 
                      onClick={() => {
                        fetchWalletHistory();
                        if (context?.fetchWalletBalance) {
                          context.fetchWalletBalance();
                        }
                      }}
                      className="ml-4 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <RefreshCw className="mr-1" size={16} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recharge Wallet Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Recharge Your Wallet</h2>
              
              {!showQR ? (
                <div>
                  <label htmlFor="amount" className="block text-gray-600 mb-2">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Enter amount to recharge"
                      min="1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {[500, 1000, 2000, 5000].map(quickAmount => (
                      <button
                        key={quickAmount}
                        onClick={() => handleQuickAmount(quickAmount)}
                        className="py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
                      >
                        ₹{quickAmount}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h3>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-500">Amount</span>
                        <span className="text-sm">₹{amount || '0'}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-500">Fee</span>
                        <span className="text-sm">₹0.00</span>
                      </div>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>₹{amount || '0'}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center"
                    >
                      <CreditCard className="mr-2" size={18} />
                      Proceed to Payment
                    </button>
                  </div>
                </div>
              ) : !verificationSubmitted ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 text-center">
                    <p className="text-center mb-2">Scan QR code to pay ₹{amount}</p>
                    <p className="text-xs text-gray-500 mb-4 text-center">Transaction ID: {transactionId}</p>
                    
                    <div className="bg-white p-4 rounded-lg shadow-inner mb-4 inline-block">
                      <QRCodeSVG value={upiLink} size={200} />
                    </div>
                    
                    <p className="text-sm text-center mb-4">
                      Scan with any UPI app (Google Pay, PhonePe, Paytm, etc.) to make payment
                    </p>
                  </div>
                  
                  <form onSubmit={verifyTransaction} className="w-full">
                    <div className="mb-4">
                      <label htmlFor="upiTransactionId" className="block text-sm font-medium mb-1">
                        UPI Transaction ID:
                      </label>
                      <input
                        type="text"
                        id="upiTransactionId"
                        value={upiTransactionId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 12) {
                            setUpiTransactionId(value);
                          }
                        }}
                        className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Enter the UPI transaction ID after payment"
                        minLength={10}
                        maxLength={12}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the transaction ID you received from your UPI app after payment
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 font-medium"
                      disabled={loading || !upiTransactionId}
                    >
                      {loading ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                    
                    {verificationStatus && (
                      <p className="mt-2 text-center text-sm">
                        {verificationStatus}
                      </p>
                    )}
                  </form>
                  
                  <button
                    onClick={() => setShowQR(false)}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Cancel and go back
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-medium mb-2">Verification request submitted</h3>
                  <p className="text-gray-600 mb-4">
                    Your request for ₹{amount} is pending admin approval.
                  </p>
                  <button
                    onClick={() => {
                      setShowQR(false);
                      setVerificationSubmitted(false);
                      setAmount('');
                      setTransactionId('');
                      setUpiLink('');
                      setVerificationStatus('');
                      setUpiTransactionId('');
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                  >
                    Make Another Recharge
                  </button>
                </div>
              )}
            </div>
            
            {/* Activity Summary for Desktop */}
            <div className="hidden lg:block bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Activity Summary</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">User's Activity</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Total Spending</span>
                    <span className="font-medium">{displayINRCurrency(getTotalSpending())}</span>
                  </div>
                  {/* <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Number of Transactions</span>
                    <span className="font-medium">{getTodayTransactionCount()}</span>
                  </div> */}
                  {/* <div className="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ 
                        width: `${Math.min(getTodayTransactionCount() * 10, 100)}%` 
                      }}
                    ></div>
                  </div> */}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Previous Transactions</h3>
                  <div className="space-y-5">
                    {walletHistory.slice(0, 3).map((transaction, index) => {
                      const display = getTransactionDisplay(transaction);
                      return (
                        <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`${display.iconBg} p-2 rounded-md mr-3`}>
                              {display.icon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{display.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                          <p className={`font-medium ${display.color}`}>
                            {display.sign}{displayINRCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      );
                    })}

                    {walletHistory.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No transactions yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transaction History - Full Width */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
              <button 
                onClick={fetchWalletHistory}
                className="text-blue-500 hover:text-blue-700 flex items-center text-sm mt-2 md:mt-0"
              >
                <RefreshCw className="mr-1" size={16} />
                Refresh
              </button>
            </div>
            
            {/* Transaction Table for Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {walletHistory.map((transaction, index) => {
                    const display = getTransactionDisplay(transaction);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`${display.iconBg} p-2 rounded-md mr-3`}>
                              {display.icon}
                            </div>
                            <span className="font-medium text-gray-800">
                              {display.title}
                              {transaction.type === 'deposit' && getStatusBadge(transaction.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'refund' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.type === 'deposit'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.type?.toUpperCase() || 'PAYMENT'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.upiTransactionId && <div>UPI ID: {transaction.upiTransactionId}</div>}
                          {transaction.quantity && <div>Quantity: {transaction.quantity}</div>}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${display.color}`}>
                          {display.sign}{displayINRCurrency(Math.abs(transaction.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Transaction List */}
            <div className="lg:hidden mt-4 space-y-4">
              {walletHistory.map((transaction, index) => {
                const display = getTransactionDisplay(transaction);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className={`${display.iconBg} p-2 rounded-md mr-3`}>
                          {display.icon}
                        </div>
                        <span className="font-medium text-gray-800">
                          {display.title}
                          {transaction.type === 'deposit' && getStatusBadge(transaction.status)}
                        </span>
                      </div>
                      <span className={`font-medium ${display.color}`}>
                        {display.sign}{displayINRCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                    <div className="ml-11 text-sm text-gray-500">
                      <p>{new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'refund' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.type === 'deposit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.type?.toUpperCase() || 'PAYMENT'}
                        </span>
                      </p>
                      {transaction.upiTransactionId && (
                        <p className="mt-1">UPI ID: {transaction.upiTransactionId}</p>
                      )}
                      {transaction.quantity && (
                        <p className="mt-1">Quantity: {transaction.quantity}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {walletHistory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No transactions found
              </div>
            )}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WalletDetails;
