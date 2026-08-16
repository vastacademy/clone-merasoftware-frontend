import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, X } from 'lucide-react';
import SummaryApi from '../common';

// Add-on service picker, opened from a project's detail page.
//
// Deliberately a modal, not a page: the customer stays on their project (it is
// still visible behind the overlay), so no "which project am I buying for?"
// banner or back-navigation context needs to be carried anywhere.
//
// Payment here is WALLET ONLY, by design. The approval engine settles exactly one
// order per transaction, so a UPI payment covering several new orders would leave
// all but one pending forever. Wallet money needs no approval, so each selected
// service gets its own order/invoice/transaction and activates instantly. A
// customer whose wallet can't cover the total is told to recharge — the
// single-service page still accepts UPI and combined payments.

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
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [purchasedSummary, setPurchasedSummary] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset per-open so a previous session's selection never carries over.
    setSelectedIds([]);
    setPurchasedSummary(null);
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
            getPriceOf(product) > 0
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

  const total = useMemo(
    () => selectedPlans.reduce((sum, plan) => sum + getPriceOf(plan), 0),
    [selectedPlans]
  );

  const shortfall = Math.max(0, total - Number(walletBalance || 0));
  const canPay = selectedPlans.length > 0 && shortfall === 0;

  const toggleSelection = (planId) => {
    setSelectedIds((current) =>
      current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]
    );
  };

  const handlePay = async () => {
    if (!canPay || submitting) return;
    try {
      setSubmitting(true);
      const response = await fetch(SummaryApi.createServicePlanOrdersBulk.url, {
        method: SummaryApi.createServicePlanOrdersBulk.method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          planIds: selectedIds,
          linkedProjectOrderId: projectOrderId,
          addedDuringProjectPhase: isProjectFinished ? 'after_completion' : 'in_progress',
          transactionId: `SVCB${Date.now()}${Math.floor(Math.random() * 10000)}`,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Could not add the services');
      }

      setPurchasedSummary(result.data);
      onPurchased?.();
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
                ? 'Services added'
                : isProjectFinished
                ? 'Ongoing servicing'
                : 'Add a service'}
            </h2>
            <p className="mt-1 text-sm text-white/70">
              {purchasedSummary ? 'Your services are active now.' : `For ${projectName}`}
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
            <ul className="space-y-2">
              {purchasedSummary.orders.map((item) => (
                <li
                  key={item.orderId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-white">
                    <Check className="h-4 w-4 text-emerald-300" />
                    {item.name}
                  </span>
                  <span className="text-base text-white/80">{formatPrice(item.amount)}</span>
                </li>
              ))}
            </ul>
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

                return (
                  <li key={plan._id}>
                    <button
                      type="button"
                      onClick={() => toggleSelection(plan._id)}
                      className={[
                        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                        isSelected
                          ? 'border-emerald-400/50 bg-emerald-500/15'
                          : 'border-white/15 bg-white/5 hover:bg-white/10',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500 text-white'
                            : 'border-white/30 bg-transparent',
                        ].join(' ')}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-base font-semibold text-white">{plan.serviceName}</span>
                          <span className="text-base font-semibold text-white">
                            {formatPrice(getPriceOf(plan))}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-white/60">
                          {PLAN_TYPE_LABELS[servicePlan.planType] || 'Service'}
                          {accessLine ? ` · ${accessLine}` : ''}
                        </span>
                        {validityLine && (
                          <span className="mt-0.5 block text-sm text-white/60">{validityLine}</span>
                        )}
                      </span>
                    </button>
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

              {shortfall > 0 && (
                <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  Add {formatPrice(shortfall)} to your wallet to buy these together, or open a service
                  on its own to pay by UPI.
                </p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={!canPay || submitting}
                className="mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/50"
              >
                {submitting ? 'Processing…' : `Pay ${formatPrice(total)} from Wallet`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;
