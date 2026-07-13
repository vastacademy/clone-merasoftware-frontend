import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import Context from '../context';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
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
  const [showRechargePanel, setShowRechargePanel] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const user = useSelector(state => state?.user?.user);
  const context = useContext(Context);

  const getTotalSpending = () => walletHistory
    .filter(transaction => transaction.type === 'payment' || transaction.type === 'service' || (transaction.amount < 0 && transaction.type !== 'deposit'))
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount) || 0), 0);

  const getTotalAdded = () => walletHistory
    .filter(transaction => transaction.type === 'deposit' || transaction.type === 'refund')
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount) || 0), 0);

  const getPendingAmount = () => walletHistory
    .filter(transaction => transaction.status === 'pending')
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount) || 0), 0);

  const fetchWalletHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.wallet.history.url, {
        method: SummaryApi.wallet.history.method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
      });
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error(`Wallet history returned an invalid response (${response.status})`);
      }
      if (!response.ok) throw new Error(responseData?.message || `Wallet history request failed (${response.status})`);
      if (responseData.success) setWalletHistory(Array.isArray(responseData.data) ? responseData.data : []);
      else throw new Error(responseData.message || 'Wallet history request failed');
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
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const activeProj = (data.data || []).find(order => {
          const category = order.productId?.category?.toLowerCase();
          const supportedCategory = ['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category);
          return supportedCategory && isOrderApproved(order) && order.orderVisibility !== 'payment-rejected' && (order.projectProgress < 100 || order.currentPhase !== 'completed');
        });
        setActiveProject(activeProj || null);
      }
    } catch (error) {
      console.error('Error fetching active project:', error);
    }
  };

  useEffect(() => {
    fetchWalletHistory();
    fetchActiveProject();
    if (context?.fetchWalletBalance) context.fetchWalletBalance();
  }, [context]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTransactionDisplay = transaction => {
    const serviceName = transaction.productId?.serviceName || transaction.orderId?.productId?.serviceName;
    if (transaction.type === 'refund') {
      return { sign: '+', color: 'text-emerald-600', title: 'Refund received', icon: <ArrowDownLeft size={17} />, iconBg: 'bg-emerald-100 text-emerald-700' };
    }
    if (transaction.type === 'deposit') {
      return { sign: '+', color: 'text-emerald-600', title: 'Wallet recharge', icon: <CreditCard size={17} />, iconBg: 'bg-emerald-100 text-emerald-700' };
    }
    if (transaction.type === 'renewal') {
      return { sign: '-', color: 'text-rose-600', title: serviceName ? `Plan renewal · ${serviceName}` : (transaction.description || 'Plan renewal'), icon: <ShoppingCart size={17} />, iconBg: 'bg-slate-100 text-slate-600' };
    }
    return { sign: '-', color: 'text-rose-600', title: serviceName ? `Payment for ${serviceName}` : (transaction.description || 'Service payment'), icon: <ShoppingCart size={17} />, iconBg: 'bg-slate-100 text-slate-600' };
  };

  const getStatus = status => {
    if (status === 'completed') return { label: 'Approved', className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={13} /> };
    if (status === 'pending') return { label: 'Pending', className: 'bg-amber-50 text-amber-700', icon: <Clock3 size={13} /> };
    if (status === 'failed' || status === 'rejected') return { label: 'Rejected', className: 'bg-red-50 text-red-700', icon: <AlertCircle size={13} /> };
    if (status === 'refunded') return { label: 'Refunded', className: 'bg-sky-50 text-sky-700', icon: <ArrowDownLeft size={13} /> };
    return null;
  };

  const getPaymentModeLabel = paymentMethod => ({
    wallet: 'Wallet',
    upi: 'UPI',
    combined: 'Wallet + UPI',
  }[paymentMethod] || 'UPI');

  const filteredHistory = walletHistory.filter(transaction => {
    const isCredit = transaction.type === 'deposit' || transaction.type === 'refund';
    const matchesFilter = historyFilter === 'all' || (historyFilter === 'credit' && isCredit) || (historyFilter === 'debit' && !isCredit) || (historyFilter === 'pending' && transaction.status === 'pending');
    const searchText = historySearch.trim().toLowerCase();
    const searchableText = [getTransactionDisplay(transaction).title, transaction.type, transaction.status, transaction.description, transaction.productId?.serviceName].filter(Boolean).join(' ').toLowerCase();
    return matchesFilter && (!searchText || searchableText.includes(searchText));
  });
  const visibleHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

  const resetRecharge = () => {
    setShowQR(false);
    setVerificationSubmitted(false);
    setAmount('');
    setTransactionId('');
    setUpiLink('');
    setVerificationStatus('');
    setUpiTransactionId('');
    setShowRechargePanel(false);
  };

  const handleProceedToPayment = event => {
    event.preventDefault();
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setTransactionId(txnId);
    const upi = `upi://pay?pa=vacomputers.com@okhdfcbank&pn=VA%20Computer&am=${amount}&cu=INR&tn=${encodeURIComponent(`Wallet Recharge - ${txnId}`)}&tr=${txnId}`;
    setUpiLink(upi);
    setShowQR(true);
  };

  const verifyTransaction = async event => {
    event.preventDefault();
    if (!upiTransactionId || upiTransactionId.length < 10 || upiTransactionId.length > 12) {
      setVerificationStatus('Please enter a valid UPI transaction ID');
      return;
    }
    setLoading(true);
    setVerificationStatus('Verifying your payment...');
    try {
      const response = await fetch(SummaryApi.wallet.verifyPayment.url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, amount: Number(amount), upiTransactionId }),
      });
      const data = await response.json();
      if (data.success) {
        setVerificationStatus('Your payment verification request has been submitted.');
        setVerificationSubmitted(true);
      } else setVerificationStatus(data.message || 'Verification failed. Please contact support.');
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('Error verifying payment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshWallet = () => {
    fetchWalletHistory();
    if (context?.fetchWalletBalance) context.fetchWalletBalance();
  };

  const renderRechargePanel = () => {
    if (!showRechargePanel) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={resetRecharge}>
        <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-7" onClick={event => event.stopPropagation()}>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Wallet recharge</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Add money securely</h2>
            </div>
            <button onClick={resetRecharge} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close add money panel"><X size={18} /></button>
          </div>
          {!showQR ? (
            <form onSubmit={handleProceedToPayment}>
              <label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</label>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50">
                <span className="text-lg font-bold text-slate-400">₹</span>
                <input id="amount" type="number" value={amount} onChange={event => setAmount(event.target.value)} className="w-full bg-transparent px-3 py-4 text-lg font-bold text-slate-950 outline-none" placeholder="0" min="1" />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-500"><span>Recharge amount</span><span className="font-semibold text-slate-900">₹{amount || '0'}</span></div>
                <div className="mt-2 flex justify-between text-slate-500"><span>Processing fee</span><span className="font-semibold text-emerald-600">₹0</span></div>
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-950"><span>Total</span><span>₹{amount || '0'}</span></div>
              </div>
              <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"><CreditCard size={17} /> Continue to payment</button>
            </form>
          ) : !verificationSubmitted ? (
            <div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-950">Scan to pay {displayINRCurrency(amount)}</p>
                <p className="mt-1 text-xs text-slate-500">Transaction ID: {transactionId}</p>
                <div className="mx-auto my-5 w-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><QRCodeSVG value={upiLink} size={184} /></div>
                <p className="text-xs leading-5 text-slate-500">Use Google Pay, PhonePe, Paytm or any UPI app.</p>
              </div>
              <form onSubmit={verifyTransaction} className="mt-6">
                <label htmlFor="upiTransactionId" className="text-xs font-bold uppercase tracking-wider text-slate-500">UPI transaction ID</label>
                <input id="upiTransactionId" type="text" value={upiTransactionId} onChange={event => setUpiTransactionId(event.target.value.replace(/[^0-9]/g, '').slice(0, 12))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" placeholder="Enter 10-12 digit ID" minLength={10} maxLength={12} required />
                <p className="mt-2 text-xs text-slate-400">You can find this ID in your UPI payment receipt.</p>
                <button type="submit" disabled={loading || !upiTransactionId} className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">{loading ? 'Submitting...' : 'Submit for approval'}</button>
                {verificationStatus && <p className="mt-3 text-center text-xs text-slate-500">{verificationStatus}</p>}
              </form>
              <button onClick={() => { setShowQR(false); setUpiTransactionId(''); setVerificationStatus(''); }} className="mt-4 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-950">Go back</button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={28} /></div>
              <h3 className="mt-4 text-lg font-black text-slate-950">Request submitted</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">Your recharge is waiting for admin approval. The balance will update after verification.</p>
              <button onClick={resetRecharge} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Close</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const transactionRow = transaction => {
    const display = getTransactionDisplay(transaction);
    const status = getStatus(transaction.status);
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const upiReference = transaction.upiTransactionId ? ` · UPI ref: ${transaction.upiTransactionId.slice(-4)}` : '';
    return (
      <div key={transaction._id || transaction.id || `${transaction.date}-${transaction.amount}`} className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[5.25rem_minmax(0,1fr)_7.5rem_5.5rem] sm:px-5">
        <p className={`w-[5.25rem] shrink-0 text-xs font-black ${display.color}`}>{display.sign}{displayINRCurrency(Math.abs(Number(transaction.amount) || 0))}</p>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${display.iconBg}`}>{React.cloneElement(display.icon, { size: 15 })}</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{display.title}</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{formattedDate} · {formattedTime}{upiReference}</p>
          </div>
        </div>
        <div className="col-start-2 flex items-center justify-between gap-2 sm:contents">
          <div className="text-left sm:text-right"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Payment mode</p><p className="text-[10px] font-bold text-slate-600">{getPaymentModeLabel(transaction.paymentMethod)}</p></div>
          {status ? <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${status.className}`}>{status.icon}{status.label}</span> : <span className="text-[10px] text-slate-400">-</span>}
        </div>
      </div>
    );
  };

  const pendingCount = walletHistory.filter(transaction => transaction.status === 'pending').length;

  return (
    <DashboardLayout user={user} activeProject={activeProject}>
      <div className="min-h-full bg-[#f7f8fa] px-3 py-4 sm:px-5 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-3 text-white shadow-xl shadow-slate-900/10 sm:p-4">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" /><div className="absolute bottom-0 right-20 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{getGreeting()}, {user?.name || 'User'}</p><h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Your wallet</h1><p className="mt-1 text-sm text-slate-400">Keep your balance ready for your next project.</p><div className="mt-6 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Available balance</span><WalletIcon /></div><p className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{displayINRCurrency(context?.walletBalance || 0)}</p><p className="mt-2 max-w-sm text-xs text-slate-400">Use your wallet balance for approved services and payments.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setShowRechargePanel(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-50"><Plus size={15} /> Recharge wallet</button><button onClick={refreshWallet} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10"><RefreshCw size={14} /> Refresh</button></div></div>
              <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
                <DarkMetricCard label="Total added" value={displayINRCurrency(getTotalAdded())} tone="emerald" />
                <DarkMetricCard label="Total spent" value={displayINRCurrency(getTotalSpending())} tone="slate" />
                <DarkMetricCard label="Pending approval" value={pendingCount} tone="amber" helper={getPendingAmount() > 0 ? displayINRCurrency(getPendingAmount()) : 'No pending amount'} />
              </div>
            </div>
          </section>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm lg:order-2">
            <div className="border-b border-slate-100 p-5 sm:px-6"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /><h2 className="text-base font-black text-slate-950">Payment approval</h2></div><p className="mt-1 text-xs text-slate-500">Recharge requests are credited after admin verification.</p><span className="mt-3 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">{pendingCount ? `${pendingCount} pending` : 'All clear'}</span></div>
            <div className="grid gap-3 p-4 sm:p-5"><ApprovalItem icon={<CheckCircle2 size={17} />} label="Approved" value={walletHistory.filter(transaction => transaction.status === 'completed').length} tone="emerald" /><ApprovalItem icon={<Clock3 size={17} />} label="Waiting" value={pendingCount} tone="amber" /><ApprovalItem icon={<AlertCircle size={17} />} label="Rejected" value={walletHistory.filter(transaction => transaction.status === 'failed').length} tone="red" /></div>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm lg:order-1">
            <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-base font-black text-slate-950">Transaction history</h2><p className="mt-1 text-xs text-slate-500">Your deposits, payments and refunds in one place.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={historySearch} onChange={event => { setHistorySearch(event.target.value); setShowAllHistory(false); }} placeholder="Search history" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 sm:w-52" /></div><div className="flex rounded-xl bg-slate-100 p-1">{['all', 'credit', 'debit', 'pending'].map(filter => <button key={filter} onClick={() => { setHistoryFilter(filter); setShowAllHistory(false); }} className={`rounded-lg px-2.5 py-2 text-[11px] font-bold capitalize transition ${historyFilter === filter ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{filter}</button>)}</div></div></div></div>
            <div className="divide-y divide-slate-100">{visibleHistory.map(transactionRow)}{filteredHistory.length === 0 && <div className="px-5 py-14 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Search size={18} /></div><p className="mt-3 text-sm font-bold text-slate-700">No transactions found</p><p className="mt-1 text-xs text-slate-400">Try a different filter or search term.</p></div>}</div>
            {filteredHistory.length > 5 && !showAllHistory && <button type="button" onClick={() => setShowAllHistory(true)} className="w-full border-t border-slate-100 px-5 py-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700 sm:px-6">Show more transactions <span className="ml-1 text-slate-400">({filteredHistory.length - 5} more)</span></button>}
            {filteredHistory.length > 5 && showAllHistory && <button type="button" onClick={() => setShowAllHistory(false)} className="w-full border-t border-slate-100 px-5 py-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700 sm:px-6">Show less transactions</button>}
          </section>
          </div>
        </div>
      </div>
      {renderRechargePanel()}
      {loading && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/10"><div className="rounded-2xl bg-white/80 p-6 shadow-lg"><TriangleMazeLoader /></div></div>}
    </DashboardLayout>
  );
};

const WalletIcon = () => <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10"><CreditCard size={17} className="text-emerald-300" /></div>;

const DarkMetricCard = ({ label, value, tone, helper }) => {
  const toneStyles = { emerald: 'text-emerald-200', amber: 'text-amber-200', slate: 'text-slate-300' };
  return <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3.5 text-white"><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${toneStyles[tone]}`}>{label}</p><p className="mt-2 text-lg font-black tracking-tight text-white">{value}</p>{helper && <p className="mt-1 text-[10px] font-semibold text-slate-400">{helper}</p>}</div>;
};

const ApprovalItem = ({ icon, label, value, tone }) => {
  const toneStyles = { emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' };
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneStyles[tone]}`}>{icon}</div><div><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-lg font-black text-slate-950">{value}</p></div></div>;
};

export default WalletDetails;
