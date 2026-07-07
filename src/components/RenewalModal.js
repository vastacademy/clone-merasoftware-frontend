import React, { useState, useContext } from 'react';
import { X, Wallet, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SummaryApi from '../common';
import Context from '../context';
import displayINRCurrency from '../helpers/displayCurrency';
import { toast } from 'sonner';

const RenewalModal = ({ plan, onClose, onRenewalSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // User's choice
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(0);

  const context = useContext(Context);

  const renewalCost = plan.productId?.monthlyRenewalCost || plan.renewalStatus?.monthlyRenewalCost || 8000;
  const walletBalance = context.walletBalance || 0;

  // Generate transaction ID
  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `RENEWAL${timestamp}${random}`;
  };

  // Main renewal handler based on user's selected payment method
  const handleRenewal = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');

      // USER CHOSE WALLET
      if (paymentMethod === 'wallet') {
        // Check if wallet has sufficient balance
        if (walletBalance < renewalCost) {
          setError(`Insufficient wallet balance. Required: ${displayINRCurrency(renewalCost)}, Available: ${displayINRCurrency(walletBalance)}`);
          setIsProcessing(false);
          return;
        }

        console.log("User chose wallet payment. Creating renewal request for admin approval.");

        await createRenewalRequest('wallet', renewalCost, 0, '');

        setSuccess('Renewal request submitted for admin approval. Your plan will be activated once approved (1-4 hours).');
        toast.success('Renewal submitted! You will be notified once approved.');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          if (onRenewalSuccess) {
            onRenewalSuccess({ pendingApproval: true });
          }
          onClose();
        }, 3000);
      }
      // USER CHOSE QR/UPI
      else if (paymentMethod === 'qr') {
        console.log("User chose QR payment. Generating QR code.");

        // Check if need to use wallet + QR (combined)
        if (walletBalance > 0 && walletBalance < renewalCost) {
          // Combined payment
          const remaining = renewalCost - walletBalance;
          setRemainingAmount(remaining);

          const txnId = generateTransactionId();
          setTransactionId(txnId);

          const upiId = 'vacomputers.com@okhdfcbank';
          const payeeName = 'VA Computer';
          const upi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${remaining}&cu=INR&tn=${encodeURIComponent(`Plan Renewal - ${txnId}`)}&tr=${txnId}`;

          setUpiLink(upi);
          setShowQR(true);
        } else {
          // Full QR payment (no wallet or user has wallet but chose QR only)
          const txnId = generateTransactionId();
          setTransactionId(txnId);

          const upiId = 'vacomputers.com@okhdfcbank';
          const payeeName = 'VA Computer';
          const upi = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${renewalCost}&cu=INR&tn=${encodeURIComponent(`Plan Renewal - ${txnId}`)}&tr=${txnId}`;

          setUpiLink(upi);
          setShowQR(true);
          setRemainingAmount(renewalCost);
        }
      }
    } catch (error) {
      console.error('Error processing renewal:', error);
      setError('Failed to process renewal request. Please try again.');
      toast.error('Renewal request failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create renewal request API call
  const createRenewalRequest = async (method, walletAmt = 0, upiAmt = 0, upiTxnId = '') => {
    try {
      const requestBody = {
        planId: plan._id,
        paymentMethod: method,
        upiTransactionId: upiTxnId,
        walletAmount: walletAmt,
        upiAmount: upiAmt
      };

      const response = await fetch(SummaryApi.createRenewalOrder.url, {
        method: SummaryApi.createRenewalOrder.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create renewal request');
      }

      return data;
    } catch (error) {
      console.error('Error creating renewal request:', error);
      throw error;
    }
  };

  // Verify QR payment
  const verifyRenewalPayment = async () => {
    if (!upiTransactionId || !upiTransactionId.trim()) {
      setError('Please enter your UPI transaction ID');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Check if combined payment (wallet + UPI)
      if (walletBalance > 0 && remainingAmount > 0 && remainingAmount < renewalCost) {
        // Combined payment
        await createRenewalRequest('combined', walletBalance, remainingAmount, upiTransactionId);
      } else {
        // Pure UPI payment
        await createRenewalRequest('upi', 0, renewalCost, upiTransactionId);
      }

      setSuccess('Payment verification submitted! Your renewal will be activated after admin approval (1-4 hours).');
      toast.success('Payment submitted successfully!');

      // Redirect after 3 seconds
      setTimeout(() => {
        if (onRenewalSuccess) {
          onRenewalSuccess({ pendingApproval: true });
        }
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error verifying renewal payment:', error);
      setError(error.message || 'Payment verification failed. Please contact support.');
      toast.error('Payment verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Renew Monthly Plan</h2>
            <p className="text-sm text-gray-600 mt-1">{plan.productId?.serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showQR ? (
            <>
              {/* Plan Status */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 mb-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-blue-900">Plan Status</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Yearly Days Left</span>
                    <span className="font-bold text-blue-700">
                      {plan.totalYearlyDaysRemaining || 0} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Updates Used This Month</span>
                    <span className="font-bold text-blue-700">
                      {plan.currentMonthUpdatesUsed || 0} / Unlimited
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewal Cost */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-800">Renewal Cost</h3>
                    <p className="text-sm text-green-600">For 30 days unlimited updates</p>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {displayINRCurrency(renewalCost)}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Select Payment Method</h3>

                <div className="space-y-3">
                  {/* Wallet Payment Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'wallet' && walletBalance < renewalCost
                        ? 'border-red-400 bg-red-50'
                        : paymentMethod === 'wallet'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="wallet"
                        checked={paymentMethod === 'wallet'}
                        onChange={() => setPaymentMethod('wallet')}
                        className="mr-3"
                      />
                      <Wallet className="w-5 h-5 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">Wallet Balance</span>
                          <span className="text-lg font-bold text-blue-600 ml-4">
                            {displayINRCurrency(walletBalance)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Available for instant payment
                        </p>
                      </div>
                      {paymentMethod === 'wallet' && walletBalance < renewalCost && (
                        <div className="ml-3">
                          <AlertCircle size={20} className="text-red-500" />
                        </div>
                      )}
                    </div>

                    {paymentMethod === 'wallet' && walletBalance < renewalCost && (
                      <div className="mt-3 p-2 bg-red-100 border-l-4 border-red-500 rounded">
                        <p className="text-xs font-medium text-red-800">
                          ⚠️ Insufficient Balance
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          You need {displayINRCurrency(renewalCost - walletBalance)} more. Please recharge your wallet or select QR payment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* QR Code Payment Option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'qr'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('qr')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr"
                        checked={paymentMethod === 'qr'}
                        onChange={() => setPaymentMethod('qr')}
                        className="mr-3"
                      />
                      <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <span className="font-medium">QR Code / UPI</span>
                        <p className="text-sm text-gray-600">
                          Pay via UPI, PhonePe, GPay, etc.
                        </p>
                      </div>
                    </div>

                    {/* Show info if wallet balance exists and QR selected */}
                    {paymentMethod === 'qr' && walletBalance > 0 && walletBalance < renewalCost && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        <div className="flex items-center mb-1">
                          <AlertCircle size={14} className="mr-1" />
                          <span className="font-medium">Combined Payment</span>
                        </div>
                        <div className="ml-5 text-xs">
                          • Wallet: {displayINRCurrency(walletBalance)}<br/>
                          • QR Payment: {displayINRCurrency(renewalCost - walletBalance)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <CheckCircle size={16} className="mr-2" />
                    <span className="text-sm">{success}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleRenewal}
                  disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance < renewalCost)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {isProcessing ? 'Processing...' : `Renew for ${displayINRCurrency(renewalCost)}`}
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>Your renewal request will be verified by admin (1-4 hours).</p>
                <p>Yearly plan days will be reduced by 30 days after approval.</p>
              </div>
            </>
          ) : (
            /* QR Code Payment Section */
            <div className="flex flex-col items-center">
              <h3 className="text-center text-lg font-medium mb-3">
                Scan QR Code to Pay {walletBalance > 0 && remainingAmount < renewalCost ? 'Remaining Amount' : ''}
              </h3>

              <div className="bg-white p-4 rounded-lg shadow-inner mb-4 inline-block">
                <QRCodeSVG value={upiLink} size={200} />
              </div>

              <p className="text-center mb-2 font-medium text-lg">
                Amount: {displayINRCurrency(remainingAmount)}
              </p>

              {/* Show breakdown if combined payment */}
              {walletBalance > 0 && remainingAmount < renewalCost && (
                <div className="w-full mb-3 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 mb-1">Payment Breakdown:</p>
                  <div className="flex justify-between text-gray-700">
                    <span>Wallet:</span>
                    <span>{displayINRCurrency(walletBalance)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>QR Payment:</span>
                    <span>{displayINRCurrency(remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-800 mt-1 pt-1 border-t border-blue-200">
                    <span>Total:</span>
                    <span>{displayINRCurrency(renewalCost)}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mb-4 text-center">
                Transaction ID: {transactionId}
              </p>

              <div className="w-full mb-4">
                <label htmlFor="upiTransactionId" className="block text-sm font-medium mb-2">
                  UPI Transaction ID: *
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

              {/* Error/Success Messages */}
              {error && (
                <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <CheckCircle size={16} className="mr-2" />
                    <span className="text-sm">{success}</span>
                  </div>
                </div>
              )}

              <button
                onClick={verifyRenewalPayment}
                disabled={isProcessing || !upiTransactionId.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors w-full disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Submit for Verification'}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>After verification (1-4 hours), your plan will be renewed for 30 days.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewalModal;
