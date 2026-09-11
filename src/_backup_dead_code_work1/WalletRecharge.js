import React, { useState, useContext } from 'react';
import Context from '../context';
import SummaryApi from '../common';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { QRCodeSVG } from 'qrcode.react'; // Updated import for newer versions of qrcode.react


const WalletRecharge = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [transactionVerified, setTransactionVerified] = useState(false);
  const context = useContext(Context);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  // Generate transaction ID
  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  };

  // Handle amount submission
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
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

  // Verify transaction (to be called when user submits UPI reference)
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
          upiTransactionId: upiTransactionId // Add this field
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus('Your payment verification request has been submitted. The amount will be added to your wallet after admin verification.');
        // Don't update wallet balance here - wait for admin approval
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

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Recharge Your Wallet</h2>
      
      {!showQR ? (
        <form onSubmit={handleProceedToPayment}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              min="1"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Proceed to Payment
          </button>
        </form>
      ) : !verificationSubmitted  ? (
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
            // Only allow numeric input with length restrictions
            const value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length <= 12) {
              setUpiTransactionId(value);
            }
          }}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Enter the UPI transaction ID after payment"
          minLength={10}
          maxLength={12}
          autoComplete="off"  // This disables browser autofill
          autoCorrect="off"   // Additional protection against suggestions
          spellCheck="false"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          This is the transaction ID you received from your UPI app after payment
        </p>
      </div>
      
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400"
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
              setTransactionVerified(false);
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
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRecharge;