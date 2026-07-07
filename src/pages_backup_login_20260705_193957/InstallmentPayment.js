import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import Context from '../context';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import displayINRCurrency from '../helpers/displayCurrency';
import DashboardLayout from '../components/DashboardLayout';

const InstallmentPayment = () => {
  const { orderId, installmentNumber } = useParams();
  const navigate = useNavigate();
  const context = useContext(Context);
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [installment, setInstallment] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [user, setUser] = useState(null);
  // const [isPartialPayment, setIsPartialPayment] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    // Get user from local storage or context
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [orderId, installmentNumber]);

  // Generate transaction ID
  const generateTransactionId = () => {
    // Use different prefixes to avoid collisions
    const prefix = 'INST';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}${timestamp}${random}`;
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SummaryApi.orderDetails.url}/${orderId}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const orderData = data.data;
        setOrder(orderData);
        
        // Find the specific installment
        if (orderData.installments && orderData.installments.length > 0) {
          const currentInstallment = orderData.installments.find(
            inst => inst.installmentNumber === parseInt(installmentNumber)
          );
          
          if (currentInstallment && !currentInstallment.paid) {
            setInstallment(currentInstallment);
            
            // Check if wallet balance is sufficient
            if (context.walletBalance < currentInstallment.amount) {
              setRemainingAmount(currentInstallment.amount - context.walletBalance);
            }
          } else {
            // Installment not found or already paid
            toast.error('This installment is not available or has already been paid');
            navigate(`/project-details/${orderId}`);
          }
        } else {
          toast.error('No installment information found');
          navigate(`/project-details/${orderId}`);
        }
      } else {
        toast.error('Failed to load order details');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!installment) return;
    
    try {
      setLoading(true);
      
      // Generate a transaction ID
      const txnId = generateTransactionId();
      
      // If wallet has sufficient balance for this installment
      if (context.walletBalance >= installment.amount) {
        // Process payment for current installment amount
        const response = await fetch(SummaryApi.wallet.deduct.url, {
          method: SummaryApi.wallet.deduct.method,
          credentials: 'include',
          headers: {
            "content-type": 'application/json'
          },
          body: JSON.stringify({
            amount: installment.amount,
            description: `Installment ${installmentNumber} payment for project`,
            isInstallmentPayment: true
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update the installment status to pending verification
          const updateResponse = await fetch(SummaryApi.payInstallment.url, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: orderId,
              installmentNumber: parseInt(installmentNumber),
              amount: installment.amount,
              isInstallmentPayment: true,
              transactionId: txnId,
              paymentStatus: 'pending-approval'
            })
          });
          
          const updateData = await updateResponse.json();
          
          if (!updateData.success) {
            toast.error(updateData.message || 'Failed to update payment status');
            setLoading(false);
            return;
          }
          
          // Update wallet balance
          context.fetchWalletBalance();
          
          // Redirect to project details with clear message
          toast.success('Payment submitted! Project will continue after admin approval (1-4 hours).');
          navigate(`/project-details/${orderId}`);
        } else {
          toast.error(data.message || 'Payment failed');
        }
      } else {
        // Partial payment from wallet (if wallet has some balance)
        if (context.walletBalance > 0) {
          const response = await fetch(SummaryApi.wallet.deduct.url, {
            method: SummaryApi.wallet.deduct.method,
            credentials: 'include',
            headers: {
              "content-type": 'application/json'
            },
            body: JSON.stringify({
              amount: context.walletBalance,
              description: `Partial wallet payment for installment ${installmentNumber}`,
              isInstallmentPayment: true
            })
          });
          
          const data = await response.json();
          
          if (!data.success) {
            toast.error(data.message || 'Wallet payment failed');
            setLoading(false);
            return;
          }
          
          // Update wallet balance
          context.fetchWalletBalance();
        }
        
        // Set transaction ID for QR payment
        setTransactionId(txnId);
        
        // Create UPI payment link
        const upiId = 'vacomputers.com@okhdfcbank'; // Replace with your UPI ID
        const payeeName = 'VA Computer';
        const upi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${remainingAmount}&cu=INR&tn=${encodeURIComponent(`Installment Payment - ${txnId}`)}&tr=${txnId}`;
        
        setUpiLink(upi);
        setShowQR(true);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyPayment = async () => {
    if (!transactionId || !upiTransactionId.trim()) {
      setVerificationStatus('Please enter your UPI transaction ID');
      return;
    }
    
    try {
      setLoading(true);
      setVerificationStatus('Submitting verification request...');
      
      console.log('Sending verification with data:', {
        transactionId,
        amount: remainingAmount,
        upiTransactionId,
        isInstallmentPayment: true,
        orderId,
        installmentNumber: parseInt(installmentNumber)
      });
      
      // First create a transaction record for the QR payment
      const verifyResponse = await fetch(SummaryApi.wallet.verifyPayment.url, {
        method: SummaryApi.wallet.verifyPayment.method,
        credentials: 'include',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify({
          transactionId: transactionId,
          amount: remainingAmount,
          upiTransactionId: upiTransactionId,
          isInstallmentPayment: true,
          orderId: orderId,
          installmentNumber: parseInt(installmentNumber)
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      // Modified logic to handle existing transactions
      if (!verifyData.success) {
        // Check if it failed because transaction already exists
        if (verifyData.message && verifyData.message.includes("already submitted")) {
          console.log("Transaction already exists, continuing with order update");
          // Continue to update the installment status
        } else {
          // For other errors, stop here
          setVerificationStatus(verifyData.message || 'Verification submission failed');
          setLoading(false);
          return;
        }
      }
      
      // Then update the installment status to pending approval
      const updateResponse = await fetch(SummaryApi.payInstallment.url, {
        method: SummaryApi.payInstallment.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          installmentNumber: parseInt(installmentNumber),
          amount: remainingAmount,
          isInstallmentPayment: true,
          transactionId: transactionId,
          upiTransactionId: upiTransactionId,
          paymentStatus: 'pending-approval',
          isPartialPaymentAfterWallet: remainingAmount < installment.amount
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateData.success) {
        console.error('Error updating installment status:', updateData);
        setVerificationStatus('Payment verification submitted, but there was an issue updating the project status. Support has been notified.');
        setLoading(false);
        return;
      }
      
      console.log('Payment verification and order update successful');
      
      // Clear verification status and show success message
      setVerificationStatus('');
      toast.success('Payment verification submitted successfully! Your project will continue after admin approval (typically 1-4 hours).');
      setPaymentProcessed(true);
      
      // Redirect to project details after a brief delay
      setTimeout(() => {
        navigate(`/project-details/${orderId}`);
      }, 3000);
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('Error submitting verification. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentName = (number) => {
    switch(parseInt(number)) {
      case 1: return 'First Installment (30%)';
      case 2: return 'Second Installment (30%)';
      case 3: return 'Final Installment (40%)';
      default: return `Installment #${number}`;
    }
  };
  
  const getProgressText = (number) => {
    switch(parseInt(number)) {
      case 2: return 'This payment will allow your project to progress from 50% to 90% completion.';
      case 3: return 'This payment will allow your project to be completed and delivered.';
      default: return 'This payment will start your project development.';
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-screen">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!order || !installment) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">This installment is not available or has already been paid.</p>
            <button
              onClick={() => navigate(`/project-details/${orderId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Back to Project
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <TriangleMazeLoader />
          </div>
        )}
        
        {/* Payment Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Installment Payment</h1>
            <div className="text-sm px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              {getInstallmentName(installmentNumber)}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Project: {order.productId?.serviceName}</p>
            <p className="mt-1">Progress: {Math.round(order.projectProgress)}%</p>
          </div>
        </div>
        
        {/* Info Card */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {getProgressText(installmentNumber)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Payment Amount Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
            <span className="text-gray-700">Installment Amount:</span>
            <span className="text-xl font-bold text-blue-600">{displayINRCurrency(installment.amount)}</span>
          </div>
          
          {/* Wallet Balance */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
            <div>
              <span className="font-medium">Wallet Balance</span>
              <p className="text-xs text-gray-500">Available balance in your account</p>
            </div>
            <span className="font-semibold">{displayINRCurrency(context.walletBalance)}</span>
          </div>
          
          {!showQR ? (
            <>
              {/* Payment Breakdown */}
              {remainingAmount > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-md font-medium mb-2">Payment Breakdown</h4>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">From Wallet</span>
                    <span>{displayINRCurrency(context.walletBalance)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Remaining Amount (via QR)</span>
                    <span>{displayINRCurrency(remainingAmount)}</span>
                  </div>
                </div>
              )}
              
              {/* Payment Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => navigate(`/project-details/${orderId}`)}
                  className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleWalletPayment}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {remainingAmount > 0 
                    ? 'Pay with Wallet & Continue' 
                    : 'Complete Payment'}
                </button>
              </div>
            </>
          ) : (
            /* QR Code Payment */
            <div className="flex flex-col items-center mt-4">
              <h3 className="text-center text-lg font-medium mb-3">
                Scan QR Code to Pay Remaining Amount
              </h3>
              
              <div className="bg-white p-4 rounded-lg shadow-inner mb-4 inline-block">
                <QRCodeSVG value={upiLink} size={200} />
              </div>
              
              <p className="text-xs text-gray-500 mb-4 text-center">Transaction ID: {transactionId}</p>
              
              <div className="w-full mb-4">
                <label htmlFor="upiTransactionId" className="block text-sm font-medium mb-2">
                  UPI Transaction ID:
                </label>
                <input
                  type="text"
                  id="upiTransactionId"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter the transaction ID from your UPI app"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is required for payment verification. You'll find it in your UPI app payment history.
                </p>
              </div>
              
              <button
                onClick={verifyPayment}
                disabled={loading || !upiTransactionId.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors w-full disabled:bg-gray-400"
              >
                {loading ? 'Verifying...' : 'Submit for Verification'}
              </button>
              
              {verificationStatus && (
                <p className="mt-3 text-center text-sm">
                  {verificationStatus}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Additional Information Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-3">Payment Information</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <p>• Partial payment model allows you to pay as your project progresses</p>
            <p>• Project development will continue immediately after payment confirmation</p>
            <p>• If you're paying via QR code, please allow up to 24 hours for verification</p>
            <p>• For any payment issues, please contact our support team</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstallmentPayment;