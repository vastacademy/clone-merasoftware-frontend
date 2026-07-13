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
      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error(`Wallet history returned an invalid response (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(responseData?.message || `Wallet history request failed (${response.status})`);
      }
      
      if (responseData.success) {
        setWalletHistory(Array.isArray(responseData.data) ? responseData.data : []);
      } else {
        throw new Error(responseData.message || 'Wallet history request failed');
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
        color: 'text-emerald-600',
        title: transaction.description || 'Refund',
        icon: <RefreshCw size={18} className="text-emerald-600" />,
        iconBg: 'bg-emerald-100'
      };
    } else if (transaction.type === 'deposit') {
      return {
        sign: '+',
        color: 'text-emerald-600',
        title: 'Wallet Deposit',
        icon: <CreditCard size={18} className="text-emerald-600" />,
        iconBg: 'bg-emerald-100',
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
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          {/* Header with User Info and Balance */}
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 capitalize sm:text-3xl">
                  {getGreeting()}, {user?.name || 'User'}!
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Welcome back to your wallet dashboard</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Current Balance</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-black text-emerald-700">
                      {displayINRCurrency(context?.walletBalance || 0)}
                    </p>
                    <button 
                      onClick={() => {
                        fetchWalletHistory();
                        if (context?.fetchWalletBalance) {
                          context.fetchWalletBalance();
                        }
                      }}
                      className="ml-4 inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
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
          <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {/* Recharge Wallet Section */}
            <div className="p-5 sm:p-6">
              <h2 className="mb-6 text-xl font-bold text-slate-950">Recharge Your Wallet</h2>
              
              {!showQR ? (
                <div>
                    <label htmlFor="amount" className="mb-2 block text-sm font-semibold text-slate-700">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 py-3 pl-8 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Enter amount to recharge"
                      min="1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {[500, 1000, 2000, 5000].map(quickAmount => (
                      <button
                        key={quickAmount}
                        onClick={() => handleQuickAmount(quickAmount)}
                        className="rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        ₹{quickAmount}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Payment Summary</h3>
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm text-slate-500">Amount</span>
                        <span className="text-sm">₹{amount || '0'}</span>
                      </div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm text-slate-500">Fee</span>
                        <span className="text-sm">₹0.00</span>
                      </div>
                      <div className="my-2 border-t border-slate-200"></div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>₹{amount || '0'}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleProceedToPayment}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800"
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
                    
                    <div className="mb-4 inline-block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                        className="w-full rounded-2xl border border-slate-200 py-3 pl-4 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
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
                    className="mt-4 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                  >
                    Cancel and go back
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4 text-6xl text-emerald-600">✓</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-950">Verification request submitted</h3>
                  <p className="mb-4 text-slate-600">
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
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Make Another Recharge
                  </button>
                </div>
              )}
            </div>
            
            {/* Activity Summary for Desktop */}
            <div className="block p-5 sm:p-6">
              <h2 className="mb-6 text-xl font-bold text-slate-950">Activity Summary</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-500">User's Activity</h3>
                  <div className="mb-2 flex justify-between">
                    <span className="text-slate-700">Total Spending</span>
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
                  <h3 className="mb-3 text-sm font-semibold text-slate-500">Previous Transactions</h3>
                  <div className="space-y-5">
                    {walletHistory.slice(0, 3).map((transaction, index) => {
                      const display = getTransactionDisplay(transaction);
                      return (
                        <div key={index} className="flex justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center">
                            <div className={`${display.iconBg} mr-3 rounded-xl p-2`}>
                              {display.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{display.title}</p>
                              <p className="text-xs text-slate-500">
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
          <div className="border-t border-slate-200 p-5 sm:p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-950">Transaction History</h2>
              <button 
                onClick={fetchWalletHistory}
                className="mt-2 inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 md:mt-0"
              >
                <RefreshCw className="mr-1" size={16} />
                Refresh
              </button>
            </div>
            
            {/* Transaction Table for Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {walletHistory.map((transaction, index) => {
                    const display = getTransactionDisplay(transaction);
                    
                    return (
                      <tr key={index} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`${display.iconBg} mr-3 rounded-xl p-2`}>
                              {display.icon}
                            </div>
                            <span className="font-semibold text-slate-800">
                              {display.title}
                              {transaction.type === 'deposit' && getStatusBadge(transaction.status)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'refund' 
                                ? 'bg-emerald-100 text-emerald-800' 
                              : transaction.type === 'deposit'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}>
                            {transaction.type?.toUpperCase() || 'PAYMENT'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {transaction.upiTransactionId && <div>UPI ID: {transaction.upiTransactionId}</div>}
                          {transaction.quantity && <div>Quantity: {transaction.quantity}</div>}
                        </td>
                      <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${display.color}`}>
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
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className={`${display.iconBg} mr-3 rounded-xl p-2`}>
                          {display.icon}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {display.title}
                          {transaction.type === 'deposit' && getStatusBadge(transaction.status)}
                        </span>
                      </div>
                      <span className={`font-semibold ${display.color}`}>
                        {display.sign}{displayINRCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                    <div className="ml-11 text-sm text-slate-500">
                      <p>{new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}</p>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'refund' 
                              ? 'bg-emerald-100 text-emerald-800' 
                            : transaction.type === 'deposit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
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
        </section>
      </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-2xl p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WalletDetails;
