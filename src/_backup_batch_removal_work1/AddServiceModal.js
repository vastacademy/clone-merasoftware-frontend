import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Clock, ExternalLink, Loader2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SummaryApi from '../common';
// The admin's dependency rule. This modal buys services attached to a project,
// so it asks the same question the backend will ask when the purchase is made.
import {
  SURFACE,
  canBuyOnSurface,
  isRedirectableFromProject,
  startsAfterProjectCompletion,
} from '../helpers/serviceDependency';
// How long a service may be bought for — shared with the standalone page so the
// two surfaces can never offer different terms.
import { BILLING_CYCLE_MONTHS, buildTenureOptions } from '../helpers/serviceTenure';

// Add-on service picker, opened from a project's detail page.
//
// Deliberately a modal, not a page: the customer stays on their project (it is
// still visible behind the overlay), so no "which project am I buying for?"
// banner or back-navigation context needs to be carried anywhere.
//
// Payment is hybrid — wallet, UPI, or both — using the same two-step service purchase shape: if the wallet covers the
// total, pay instantly; otherwise show a QR for the REMAINDER only and collect the
// 12-digit UPI reference.
//
// The split shown here is only for display. The server re-derives it from the real
// balance and is the authority (a client-sent split was the original loophole,
// doc 51 Part B).
//
// A UPI payment covering several services becomes ONE parent transaction with one
// child per service, so the admin approves the batch once and every service in it
// activates together — see customerCreateServicePlanOrdersBulk.js.

const PLAN_TYPE_LABELS = {
  website_updates: 'Website Update',
  digital_marketing: 'Digital Marketing',
  google_business_setup: 'Google Business Setup',
  social_media_marketing: 'Social Media Marketing',
  other: 'Other',
};

const LIMIT_SCOPE_LABELS = {
  per_day: 'per day',
  per_week: 'per week',
  per_month: 'per month',
  per_quarter: 'per quarter',
  per_6_month: 'every 6 months',
  per_year: 'per year',
  per_plan: 'per plan',
  manual: 'per custom cycle',
};

const VALIDITY_UNIT_LABELS = { day: 'day', week: 'week', month: 'month', year: 'year' };

const BILLING_CYCLE_LABELS = {
  weekly: 'billed weekly',
  monthly: 'billed monthly',
  quarterly: 'billed quarterly',
  half_yearly: 'billed every 6 months',
  yearly: 'billed yearly',
  every_2_years: 'billed every 2 years',
  every_3_years: 'billed every 3 years',
  every_4_years: 'billed every 4 years',
  every_5_years: 'billed every 5 years',
};


const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getPriceOf = (plan) =>
  Number(plan.sellingPrice !== undefined && plan.sellingPrice !== null ? plan.sellingPrice : plan.price);

// One readable line describing what the service actually grants.
const getAccessLine = (servicePlan = {}) => {
  if (servicePlan.serviceBehavior === 'reminder_only') return 'Scheduled reminders';
  if (servicePlan.limitScope === 'unlimited') return 'Unlimited portal access';
  if (servicePlan.limitScope === 'manual') {
    return `${servicePlan.manualCount} use(s) per custom cycle`;
  }
  const scope = LIMIT_SCOPE_LABELS[servicePlan.limitScope];
  if (!servicePlan.portalAccessCount || !scope) return null;
  return `${servicePlan.portalAccessCount} use(s) ${scope}`;
};

const getValidityLine = (servicePlan = {}) => {
  if (!servicePlan.billingCycle && !servicePlan.totalBillingCycles && !servicePlan.validityInDays) {
    return 'No automatic expiry';
  }
  if (servicePlan.billingCycle && servicePlan.totalBillingCycles) {
    const billing = BILLING_CYCLE_LABELS[servicePlan.billingCycle] || 'billing';
    const cycles = Number(servicePlan.totalBillingCycles);
    return `${cycles} ${billing.toLowerCase()} cycle${cycles === 1 ? '' : 's'}`;
  }
  const unit = VALIDITY_UNIT_LABELS[servicePlan.validityUnit];
  if (!unit || !servicePlan.validityValue) return null;
  const plural = servicePlan.validityValue === 1 ? '' : 's';
  const billing = BILLING_CYCLE_LABELS[servicePlan.billingCycle];
  return `${servicePlan.validityValue} ${unit}${plural}${billing ? `, ${billing}` : ''}`;
};

const AddServiceModal = ({
  isOpen,
  onClose,
  projectOrderId,
  projectName,
  isProjectFinished,
  walletBalance = 0,
  onPurchased,
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  // A standalone-only service the customer tapped: it stays listed here, but is
  // bought elsewhere. Holding it in state lets the reason be shown and confirmed
  // before leaving the project, so the sale is redirected rather than refused.
  const [redirectPlan, setRedirectPlan] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [purchasedSummary, setPurchasedSummary] = useState(null);
  // UPI step (only reached when the wallet doesn't cover the total)
  const [showQR, setShowQR] = useState(false);
  const [upiLink, setUpiLink] = useState('');
  const [payTxnId, setPayTxnId] = useState('');
  const [upiReference, setUpiReference] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Reset per-open so a previous session's selection never carries over.
    setSelectedIds([]);
    setSelections({});
    setRedirectPlan(null);
    setPurchasedSummary(null);
    setShowQR(false);
    setUpiLink('');
    setPayTxnId('');
    setUpiReference('');
    setLoading(true);

    const fetchPlans = async () => {
      try {
        const response = await fetch(SummaryApi.allProduct.url);
        const dataResponse = await response.json();
        const servicePlans = (dataResponse?.data || []).filter(
          (product) =>
            product.category === 'service_plan' &&
            product.isServicePlan &&
            !product.isHidden &&
            // Retired plans are already excluded server-side; filtered here too so a
            // withdrawn plan can never be bought from a stale client payload.
            !product.retiredAt &&
            getPriceOf(product) > 0 &&
            // The admin's dependency rule. A standalone-only service is kept in the
            // list on purpose — tapping it explains where it is bought and takes the
            // customer there. Anything else that cannot be attached to a project is
            // not listed, because there is nowhere useful to send them.
            (canBuyOnSurface(product, SURFACE.PROJECT) || isRedirectableFromProject(product))
        );
        setPlans(servicePlans);
      } catch (error) {
        toast.error('Could not load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  const selectedPlans = useMemo(
    () => plans.filter((plan) => selectedIds.includes(plan._id)),
    [plans, selectedIds]
  );

  const getSelectedPrice = (plan) => {
    const cycle = selections[plan._id]?.selectedBillingCycle;
    const option = plan.servicePlan?.billingOptions?.find((item) => item.billingCycle === cycle);
    return Number(option?.pricePerCycle ?? getPriceOf(plan));
  };
  const hasCompleteSelection = selectedPlans.every((plan) => {
    const options = plan.servicePlan?.billingOptions || [];
    if (!options.length) return true;
    const choice = selections[plan._id] || {};
    const cycleMonths = BILLING_CYCLE_MONTHS[choice.selectedBillingCycle] || 0;
    return Boolean(cycleMonths) && Boolean(choice.tenureMonths) && Number.isInteger(Number(choice.tenureMonths)) && Number(choice.tenureMonths) >= cycleMonths && Number(choice.tenureMonths) % cycleMonths === 0;
  });
  const total = useMemo(() => selectedPlans.reduce((sum, plan) => sum + getSelectedPrice(plan), 0), [selectedPlans, selections]);

  // Display-only split. The server re-derives this from the real balance and is the
  // authority — the client never tells the backend what to charge where.
  const walletPart = Math.min(Number(walletBalance || 0), total);
  const upiPart = Math.max(0, total - walletPart);
  const canPay = selectedPlans.length > 0 && hasCompleteSelection && total > 0;

  // A standalone-only service is never added to the selection — tapping it opens
  // the explanation instead, so it can never reach the purchase call (which the
  // backend would refuse anyway).
  const toggleSelection = (planId) => {
    const plan = plans.find((item) => item._id === planId);
    if (plan && isRedirectableFromProject(plan)) {
      setRedirectPlan(plan);
      return;
    }
    setSelectedIds((current) =>
      current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]
    );
  };

  // Confirmed: leave the project and continue on the page that actually sells
  // this service. The purchase is not cancelled, only moved to where it belongs.
  const handleRedirectConfirm = () => {
    const planId = redirectPlan?._id;
    setRedirectPlan(null);
    onClose?.();
    if (planId) navigate(`/service-plan-detail/${planId}`);
  };

  // The single create call: orders + invoices + wallet debit + (if any) the pending
  // parent/child UPI transactions, all in one atomic server-side request.
  const createOrders = async ({ txnId, upiRef }) => {
    const response = await fetch(SummaryApi.createServicePlanOrdersBulk.url, {
      method: SummaryApi.createServicePlanOrdersBulk.method,
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planIds: selectedIds,
        selections: selectedPlans.map((plan) => ({ planId: plan._id, selectedBillingCycle: selections[plan._id]?.selectedBillingCycle, tenureMonths: selections[plan._id]?.tenureMonths === '' ? undefined : Number(selections[plan._id]?.tenureMonths) })),
        linkedProjectOrderId: projectOrderId,
        addedDuringProjectPhase: isProjectFinished ? 'after_completion' : 'in_progress',
        transactionId: txnId,
        upiTransactionId: upiRef || undefined,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Could not add the services');
    return result.data;
  };

  // Step 1 — wallet covers everything: pay instantly. Otherwise show a QR for the
  // remainder only, exactly as the project-start flow does.
  const handlePay = async () => {
    if (!canPay || submitting) return;

    const txnId = `SVCB${Date.now()}${Math.floor(Math.random() * 10000)}`;

    if (upiPart === 0) {
      try {
        setSubmitting(true);
        const data = await createOrders({ txnId });
        setPurchasedSummary(data);
        onPurchased?.();
        setTimeout(() => onClose?.(), 1800);
      } catch (error) {
        toast.error(error.message || 'Could not add the services');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setPayTxnId(txnId);
    const upiId = 'vacomputers.com@okhdfcbank';
    const payeeName = 'VA Computer';
    setUpiLink(
      `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${upiPart}&cu=INR&tn=${encodeURIComponent(
        `Service Payment - ${txnId}`
      )}&tr=${txnId}`
    );
    setShowQR(true);
  };

  // Step 2 (UPI path) — the customer paid the remainder and entered their reference.
  // A real UPI UTR is 12 digits, so anything shorter is rejected (doc 51 Bug 3).
  const handleVerifyUpi = async () => {
    if (submitting) return;
    if (!/^\d{12,}$/.test(upiReference.trim())) {
      toast.error('Enter the 12-digit UPI reference number');
      return;
    }
    try {
      setSubmitting(true);
      const data = await createOrders({ txnId: payTxnId, upiRef: upiReference.trim() });
      setShowQR(false);
      setPurchasedSummary(data);
      onPurchased?.();
      setTimeout(() => onClose?.(), 1800);
    } catch (error) {
      toast.error(error.message || 'Could not add the services');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              {purchasedSummary
                ? purchasedSummary.approved
                  ? 'Services added'
                  : 'Submitted for approval'
                : showQR
                ? 'Pay the remaining amount'
                : isProjectFinished
                ? 'Ongoing servicing'
                : 'Add a service'}
            </h2>
            <p className="mt-1 text-sm text-white/70">
              {purchasedSummary
                ? purchasedSummary.approved
                  ? 'Your services are active now.'
                  : 'Your services start as soon as this payment is approved.'
                : showQR
                ? `Scan and pay ${formatPrice(upiPart)}`
                : `For ${projectName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {purchasedSummary ? (
            <>
              <ul className="space-y-2">
                {purchasedSummary.orders.map((item) => (
                  <li
                    key={item.orderId}
                    className={[
                      'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3',
                      purchasedSummary.approved
                        ? 'border-emerald-400/30 bg-emerald-500/10'
                        : 'border-amber-400/30 bg-amber-500/10',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-2 text-base font-semibold text-white">
                      {purchasedSummary.approved ? (
                        <Check className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-300" />
                      )}
                      {item.name}
                    </span>
                    <span className="text-base text-white/80">{formatPrice(item.amount)}</span>
                  </li>
                ))}
              </ul>

              {!purchasedSummary.approved && (
                <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  We've received your payment reference. All {purchasedSummary.count} service
                  {purchasedSummary.count === 1 ? '' : 's'} activate together once our team confirms
                  it — you don't need to pay again.
                </p>
              )}
            </>
          ) : showQR ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG value={upiLink} size={190} />
              </div>

              <div className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>Paid from wallet</span>
                  <span className="text-white">{formatPrice(walletPart)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span className="text-white">Pay by UPI now</span>
                  <span className="text-white">{formatPrice(upiPart)}</span>
                </div>
              </div>

              <label className="w-full">
                <span className="mb-1 block text-sm font-semibold text-white/80">
                  UPI reference number
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={upiReference}
                  onChange={(event) => setUpiReference(event.target.value.replace(/\D/g, ''))}
                  placeholder="12-digit reference"
                  className="w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2.5 text-base text-white placeholder:text-white/40"
                />
                <span className="mt-1 block text-xs text-white/50">
                  Find this in your UPI app after paying.
                </span>
              </label>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading services…
            </div>
          ) : plans.length === 0 ? (
            <p className="py-10 text-center text-base text-white/70">
              No services are available right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {plans.map((plan) => {
                const isSelected = selectedIds.includes(plan._id);
                const servicePlan = plan.servicePlan || {};
                const accessLine = getAccessLine(servicePlan);
                const validityLine = getValidityLine(servicePlan);
                // Listed, but bought elsewhere — tapping explains and redirects.
                const isSeparatePurchase = isRedirectableFromProject(plan);
                // Bought here and linked here; it simply starts once the project is
                // done. Only worth saying while the project is still running.
                const startsLater = !isSeparatePurchase && !isProjectFinished && startsAfterProjectCompletion(plan);

                return (
                  <li key={plan._id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSelection(plan._id)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') toggleSelection(plan._id); }}
                      className={[
                        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                        isSeparatePurchase
                          ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                          : isSelected
                          ? 'border-emerald-400/50 bg-emerald-500/15'
                          : 'border-white/15 bg-white/5 hover:bg-white/10',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                          isSeparatePurchase
                            ? 'border-white/20 bg-transparent text-white/40'
                            : isSelected
                            ? 'border-emerald-400 bg-emerald-500 text-white'
                            : 'border-white/30 bg-transparent',
                        ].join(' ')}
                      >
                        {isSeparatePurchase ? (
                          <ExternalLink className="h-3 w-3" />
                        ) : (
                          isSelected && <Check className="h-3.5 w-3.5" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-base font-semibold text-white">{plan.serviceName}</span>
                          <span className="text-base font-semibold text-white">
                            {formatPrice(getSelectedPrice(plan))}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-white/60">
                          {PLAN_TYPE_LABELS[servicePlan.planType] || 'Service'}
                          {accessLine ? ` · ${accessLine}` : ''}
                        </span>
                        {validityLine && (
                          <span className="mt-0.5 block text-sm text-white/60">{validityLine}</span>
                        )}
                        {isSeparatePurchase && (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">
                            <ExternalLink className="h-3 w-3" />
                            Bought separately
                          </span>
                        )}
                        {startsLater && (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-100">
                            <Clock className="h-3 w-3" />
                            Starts when this project is completed
                          </span>
                        )}
                        {isSelected && servicePlan.billingOptions?.length > 0 && (
                          <span className="mt-3 grid gap-2 sm:grid-cols-2" onClick={(event) => event.stopPropagation()}>
                            <label><span className="mb-1 block text-xs font-semibold text-white/70">Billing period</span><select className="w-full rounded-lg border border-white/20 bg-slate-950 px-2.5 py-2 text-sm text-white" value={selections[plan._id]?.selectedBillingCycle || ''} onChange={(event) => setSelections((current) => ({ ...current, [plan._id]: { ...current[plan._id], selectedBillingCycle: event.target.value, tenureMonths: '' } }))}><option value="">Select period</option>{servicePlan.billingOptions.map((option) => <option key={option.billingCycle} value={option.billingCycle}>{BILLING_CYCLE_LABELS[option.billingCycle]} — {formatPrice(option.pricePerCycle)}</option>)}</select></label>
                            <label><span className="mb-1 block text-xs font-semibold text-white/70">Total tenure</span><select required className="w-full rounded-lg border border-white/20 bg-slate-950 px-2.5 py-2 text-sm text-white disabled:opacity-50" disabled={!selections[plan._id]?.selectedBillingCycle} value={selections[plan._id]?.tenureMonths || ''} onChange={(event) => setSelections((current) => ({ ...current, [plan._id]: { ...current[plan._id], tenureMonths: event.target.value } }))}><option value="">Select tenure</option>{buildTenureOptions(BILLING_CYCLE_MONTHS[selections[plan._id]?.selectedBillingCycle]).map((option) => <option key={option.months} value={option.months}>{option.label}</option>)}</select></label>
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-5">
          {purchasedSummary ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-400"
            >
              Done
            </button>
          ) : showQR ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowQR(false)}
                disabled={submitting}
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerifyUpi}
                disabled={submitting || upiReference.trim().length < 12}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/50"
              >
                {submitting ? 'Submitting…' : 'Submit Payment'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-base text-white">
                <span>
                  {selectedPlans.length > 0
                    ? `${selectedPlans.length} selected`
                    : 'Select one or more services'}
                </span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>

              <p className="mt-1 text-sm text-white/60">
                Wallet balance: {formatPrice(walletBalance)}
              </p>

              {!hasCompleteSelection && <p className="mt-2 text-sm text-amber-200">Select a valid billing period and tenure for every selected service.</p>}

              {/* Split breakdown — shown only when the payment actually is a split. */}
              {selectedPlans.length > 0 && upiPart > 0 && (
                <div className="mt-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between text-white/70">
                    <span>From wallet</span>
                    <span className="text-white">{formatPrice(walletPart)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-white/70">
                    <span>By UPI</span>
                    <span className="text-white">{formatPrice(upiPart)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={!canPay || submitting}
                className="mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/50"
              >
                {submitting
                  ? 'Processing…'
                  : upiPart > 0
                  ? `Pay ${formatPrice(total)}`
                  : `Pay ${formatPrice(total)} from Wallet`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Standalone-only service: explain where it is bought, then take them there.
          The purchase is redirected, never refused — the customer keeps the sale
          and lands on the page that can actually complete it. */}
      {redirectPlan && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setRedirectPlan(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">
              <ExternalLink className="h-3 w-3" />
              Bought separately
            </span>
            <h3 className="mt-3 text-lg font-semibold text-white">{redirectPlan.serviceName}</h3>
            <p className="mt-2 text-sm text-white/70">
              This service runs on its own and cannot be attached to
              {projectName ? ` ${projectName}` : ' this project'}. It is bought separately, and
              works the same either way.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Continue to buy it on its own page?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setRedirectPlan(null)}
                className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={handleRedirectConfirm}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddServiceModal;
