import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import Context from '../context';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import displayINRCurrency from '../helpers/displayCurrency';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import { goToCustomerReturn } from '../helpers/customerReturnNavigation';
import { getOrderDisplayName } from '../helpers/orderPresentation';
import { getInstallmentPaymentEligibility } from '../helpers/installmentPaymentEligibility';

const InstallmentPayment = () => {
  const { orderId, installmentNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const context = useContext(Context);
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [installment, setInstallment] = useState(null);
  // Payment is confirmed in a popup (the portal's pattern) rather than inline on the page:
  // showPayment opens it, showQR switches it from the wallet step to the UPI-QR step.
  const [showPayment, setShowPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [upiLink, setUpiLink] = useState('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  const returnToParent = () => goToCustomerReturn(
    navigate,
    location,
    `/project-details/${orderId}`
  );
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
          
          const eligibility = getInstallmentPaymentEligibility(
            orderData,
            installmentNumber
          );

          if (currentInstallment && eligibility.canPay) {
            setInstallment(currentInstallment);
            
            // Check if wallet balance is sufficient
            if (context.walletBalance < currentInstallment.amount) {
              setRemainingAmount(currentInstallment.amount - context.walletBalance);
            }
          } else {
            toast.error(eligibility.reason);
            returnToParent();
          }
        } else {
          toast.error('No installment information found');
          returnToParent();
        }
      } else {
        toast.error('Failed to load order details');
        returnToParent();
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

      // Full wallet cover → instant payment, no admin approval (wallet is the customer's own,
      // already-approved money). The single /wallet/pay-instant call atomically debits the wallet
      // and settles the installment + approves the order server-side.
      if (context.walletBalance >= installment.amount) {
        const response = await fetch(SummaryApi.wallet.payInstant.url, {
          method: SummaryApi.wallet.payInstant.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: installment.amount,
            installmentNumber: parseInt(installmentNumber),
          }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.message || 'Payment failed');
          setLoading(false);
          return;
        }

        // Refresh the just-debited wallet balance and take the customer back to the project.
        context.fetchWalletBalance();
        toast.success('Payment successful! Your project will continue now.');
        returnToParent();
      } else {
        // Partial: the wallet doesn't cover the whole installment. The wallet part is debited only
        // when the UPI remainder is verified (see verifyPayment) so a half-paid state can't be left
        // behind if the customer abandons the QR screen. Here we only open the QR for the remainder.
        const txnId = generateTransactionId();
        setTransactionId(txnId);

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

      // Combined payment: the wallet part (installment total minus the UPI remainder) is the
      // customer's own money, so it is debited instantly now — linked to this UPI transaction via
      // parentTransactionId so that if the admin later REJECTS the UPI part, the wallet part is
      // auto-refunded (transactionApprovalController). It advances paidAmount but does NOT mark the
      // installment paid; the UPI approval finishes that.
      const walletPart = Math.max(0, installment.amount - remainingAmount);
      if (walletPart > 0) {
        const walletRes = await fetch(SummaryApi.wallet.payInstant.url, {
          method: SummaryApi.wallet.payInstant.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: walletPart,
            installmentNumber: parseInt(installmentNumber),
            parentTransactionId: transactionId,
          }),
        });
        const walletData = await walletRes.json();
        if (!walletData.success) {
          setVerificationStatus(walletData.message || 'Wallet payment failed');
          setLoading(false);
          return;
        }
        context.fetchWalletBalance();
      }

      // Then record the UPI remainder as a pending transaction for admin approval.
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
        returnToParent();
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


  if (loading && !order) {
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
        <div
          className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/20 bg-white/10 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
            <h2 className="mb-2 text-lg font-semibold text-red-400">Payment Error</h2>
            <p className="mb-4 text-base text-slate-300">This installment is not available or has already been paid.</p>
            <button
              onClick={returnToParent}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-base font-semibold text-white hover:bg-emerald-700"
            >
              Back to Project
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const walletCoversAll = remainingAmount <= 0;
  const walletPart = Math.max(0, installment.amount - remainingAmount);

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-4">
          {/* Detail-page header: back button absolute-left, heading truly centred. */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={returnToParent}
              className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {getInstallmentName(installmentNumber)}
              </h1>
              <p className="mt-1 text-base text-slate-300">
                {getOrderDisplayName(order, 'Project')}
              </p>
            </div>
          </div>

          {/* One dark-glass card with internal dividers, not a stack of sub-cards. */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            <div className="relative">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">Amount due</p>
                  <p className="mt-1 text-3xl font-bold text-white">{displayINRCurrency(installment.amount)}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Due
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {getProgressText(installmentNumber)} Project progress is {Math.round(order.projectProgress)}%.
              </p>

              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-slate-300">Wallet balance</span>
                  <span className="text-sm font-semibold text-emerald-300">{displayINRCurrency(context.walletBalance)}</span>
                </div>

                {/* The split only means something when the wallet cannot cover the whole amount. */}
                {!walletCoversAll && (
                  <div className="mt-3 divide-y divide-white/10 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] px-4 py-2">
                    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
                      <span className="text-slate-300">Paid from wallet (instant)</span>
                      <span className="font-medium text-emerald-300">{displayINRCurrency(walletPart)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
                      <span className="text-slate-300">To pay via UPI</span>
                      <span className="font-medium text-white">{displayINRCurrency(remainingAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => { setShowPayment(true); setShowQR(false); }}
                  disabled={loading || paymentProcessed}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-base font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  Pay Now
                </button>
              </div>

              <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm text-slate-300">
                <p>Wallet money is your own already-approved balance, so it is paid instantly.</p>
                <p>A UPI payment is verified by our team, usually within a few hours.</p>
                <p>Project development continues as soon as the payment is confirmed.</p>
                <p>For any payment issue, contact support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment popup — the same two-step wallet then UPI-QR flow InvoiceDetailPage uses, so
          paying an installment looks and behaves identically wherever it is started from. */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/15 bg-slate-900/95 p-6 text-white shadow-2xl backdrop-blur-2xl">
            {!showQR ? (
              <>
                <h3 className="text-lg font-bold">{getInstallmentName(installmentNumber)}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Amount due</span>
                    <span className="font-semibold text-white">{displayINRCurrency(installment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Wallet balance</span>
                    <span className="font-semibold text-emerald-300">{displayINRCurrency(context.walletBalance)}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {walletCoversAll
                    ? 'Your wallet covers this amount. It will be deducted instantly.'
                    : `Wallet covers ${displayINRCurrency(walletPart)} — the remaining ${displayINRCurrency(remainingAmount)} is paid by UPI QR next.`}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setShowPayment(false)}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWalletPayment}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loading ? 'Processing...' : walletCoversAll ? 'Pay from Wallet' : 'Continue to UPI'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">Scan &amp; Pay {displayINRCurrency(remainingAmount)}</h3>
                <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
                  <QRCodeSVG value={upiLink} size={190} />
                </div>
                <p className="mt-3 text-center text-xs text-slate-400">Transaction ID: {transactionId}</p>
                <label className="mt-4 block text-sm font-medium text-slate-200">
                  UPI Transaction ID
                </label>
                <input
                  type="text"
                  value={upiTransactionId}
                  onChange={(event) => setUpiTransactionId(event.target.value)}
                  placeholder="Enter the UPI reference after paying"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Find this in your UPI app payment history. It is required for verification.
                </p>
                {verificationStatus && (
                  <p className="mt-3 text-sm text-amber-300">{verificationStatus}</p>
                )}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setShowQR(false)}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyPayment}
                    disabled={loading || !upiTransactionId.trim()}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loading ? 'Verifying...' : 'Submit for Verification'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <TriangleMazeLoader />
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstallmentPayment;
