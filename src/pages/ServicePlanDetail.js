import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SummaryApi from '../common';
import { useDraftOrders } from '../context/DraftOrdersContext';

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

const MANUAL_UNIT_LABELS = {
  day: 'day(s)',
  week: 'week(s)',
  month: 'month(s)',
};

const VALIDITY_UNIT_LABELS = {
  day: 'Day(s)',
  week: 'Week(s)',
  month: 'Month(s)',
  year: 'Year(s)',
};

const BILLING_CYCLE_LABELS = {
  weekly: 'Billed Weekly',
  monthly: 'Billed Monthly',
  quarterly: 'Billed Quarterly',
  half_yearly: 'Billed Every 6 Months',
  yearly: 'Billed Yearly',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const getPortalAccessLine = (servicePlan) => {
  if (!servicePlan) return null;

  if (servicePlan.limitScope === 'unlimited') {
    return 'Unlimited portal access';
  }

  if (servicePlan.limitScope === 'manual') {
    const unitLabel = MANUAL_UNIT_LABELS[servicePlan.manualUnit] || '';
    return `${servicePlan.manualCount} use(s) per ${servicePlan.manualCount === 1 ? unitLabel.replace('(s)', '') : unitLabel}`;
  }

  const scopeLabel = LIMIT_SCOPE_LABELS[servicePlan.limitScope] || '';
  return `${servicePlan.portalAccessCount} use(s) ${scopeLabel}`;
};

const getValidityLine = (servicePlan) => {
  if (!servicePlan) return null;
  const unitLabel = VALIDITY_UNIT_LABELS[servicePlan.validityUnit] || '';
  return `${servicePlan.validityValue} ${unitLabel}`;
};

const SectionHeading = ({ children }) => (
  <h2 className="border-b border-slate-200 pb-2 text-xl font-bold text-black">
    {children}
  </h2>
);

const ServicePlanDetail = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const { planId } = useParams();
  const { saveDraftOrder, openCartDrawer } = useDraftOrders();
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      const response = await fetch(SummaryApi.productDetails.url, {
        method: SummaryApi.productDetails.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: planId }),
      });
      const dataResponse = await response.json();
      setPlan(dataResponse?.data || null);
      setLoaded(true);
    };
    fetchPlan();
  }, [planId]);

  const handleBack = () => navigate('/start-new-project');

  const handleProceedToPayment = () => {
    const draftOrder = {
      draftOrderId: `service-plan-${plan._id}`,
      productId: plan._id,
      type: 'service_plan',
      typeLabel: PLAN_TYPE_LABELS[plan.servicePlan?.planType] || 'Service Plan',
      category: plan.category,
      name: plan.serviceName,
      basePrice: plan.sellingPrice,
      price: plan.sellingPrice,
      availableFeatures: [],
      selectedFeatureIds: [],
      sourceProduct: plan,
    };

    saveDraftOrder(draftOrder);
    openCartDrawer();
  };

  if (!loaded) return null;

  if (!plan) {
    return (
      <DashboardLayout user={user}>
        <div className="w-full bg-slate-50 px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
              <p className="text-base text-black">Plan not found.</p>
              <button
                type="button"
                onClick={handleBack}
                className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-base font-semibold text-white hover:bg-slate-800"
              >
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const servicePlan = plan.servicePlan || {};
  const description = plan.formattedDescriptions?.[0]?.content || '';
  const planTypeLabel = PLAN_TYPE_LABELS[servicePlan.planType] || 'Service Plan';
  const portalAccessLine = getPortalAccessLine(servicePlan);
  const validityLine = getValidityLine(servicePlan);
  const billingCycleLabel = BILLING_CYCLE_LABELS[servicePlan.billingCycle];
  const hasPrice = plan.price !== undefined && plan.price !== null;
  const hasSellingPrice = plan.sellingPrice !== undefined && plan.sellingPrice !== null;
  const showStrikethroughBasePrice = hasPrice && hasSellingPrice && Number(plan.price) !== Number(plan.sellingPrice);

  return (
    <DashboardLayout user={user}>
      <div className="w-full bg-slate-50 px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-base font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
                {plan.serviceName}
              </h1>
              <p className="mt-2 text-base font-medium text-white">{planTypeLabel}</p>
            </div>

            <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
              {/* 1. Description */}
              {description && (
                <section>
                  <SectionHeading>What is this plan?</SectionHeading>
                  <div
                    className="prose prose-lg mt-3 max-w-none text-base leading-7 text-black"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </section>
              )}

              {/* 2. What You Get */}
              <section>
                <SectionHeading>What You Get</SectionHeading>
                <ul className="mt-3 space-y-2">
                  {portalAccessLine && (
                    <li className="flex items-start gap-2.5 text-base text-black">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {portalAccessLine}
                    </li>
                  )}
                  {servicePlan.filesLimit && (
                    <li className="flex items-start gap-2.5 text-base text-black">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      Up to {servicePlan.filesLimit} file(s) per request
                    </li>
                  )}
                </ul>
              </section>

              {/* 3. Plan Validity */}
              <section>
                <SectionHeading>Plan Validity</SectionHeading>
                <ul className="mt-3 space-y-2">
                  {validityLine && (
                    <li className="flex items-start gap-2.5 text-base text-black">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      Valid for {validityLine}
                    </li>
                  )}
                  {billingCycleLabel && (
                    <li className="flex items-start gap-2.5 text-base text-black">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {billingCycleLabel}
                    </li>
                  )}
                </ul>
              </section>

              {/* 4. Price */}
              {hasSellingPrice && (
                <section>
                  <SectionHeading>Price</SectionHeading>
                  <div className="mt-3 flex items-baseline gap-3">
                    {showStrikethroughBasePrice && (
                      <span className="text-lg text-slate-400 line-through">{formatPrice(plan.price)}</span>
                    )}
                    <span className="text-2xl font-bold text-black">{formatPrice(plan.sellingPrice)}</span>
                  </div>
                </section>
              )}
            </div>

            {/* 5. Purchase action */}
            <div className="border-t border-slate-200 px-5 py-6 sm:px-8 sm:py-8">
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
              >
                Add to Cart
              </button>
            </div>
          </article>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServicePlanDetail;
