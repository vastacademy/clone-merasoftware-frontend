import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Info, Minus, Plus, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SummaryApi from '../common';
import backgroundImage from '../assets/BG.png';

// Primary project categories the customize form supports.
const PROJECT_OPTIONS = [
  { value: 'standard_websites', label: 'Static Website' },
  { value: 'dynamic_websites', label: 'Dynamic Website' },
  { value: 'cloud_software_development', label: 'Cloud Software' },
  { value: 'app_development', label: 'Mobile App' },
];

const BUDGET_OPTIONS = [
  { value: 'range_5k_30k', label: '5,000 - 30,000' },
  { value: 'range_30k_plus', label: '30,000 and above' },
];

const OWNERSHIP_OPTIONS = [
  { value: 'self_managed', label: "I'll manage content myself" },
  { value: 'we_maintain', label: 'MeraSoftware will maintain it' },
];

const PAYMENT_OPTIONS = [
  { value: 'full', label: 'Full payment' },
  { value: 'partial', label: 'Partial payment' },
  { value: 'decide_later', label: 'Decide payment later' },
];

const labelOf = (options, value) => options.find((o) => o.value === value)?.label || '';

// Website "pages" are represented by the existing "Add New Page" feature product. It gets a
// +/- counter instead of a checkbox, and is always counted in the estimate (min pages included).
const MIN_PAGES = 4;
const MAX_PAGES = 99;
const isPagesFeature = (feature) =>
  (feature?.serviceName || '').toLowerCase().includes('add new page');

const SectionLabel = ({ children }) => (
  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300/90">{children}</p>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-base font-medium text-white">{label}</span>
    {children}
  </label>
);

// Single-select glass dropdown.
const SelectDropdown = ({ value, options, placeholder = 'Select…', onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectedLabel = labelOf(options, value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-base text-white outline-none transition hover:border-white/35 focus-visible:border-emerald-400"
      >
        <span className={selectedLabel ? 'text-white' : 'text-slate-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900/95 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-base transition-colors ${
                  isActive ? 'bg-emerald-500/15 text-white' : 'text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                {option.label}
                {isActive && <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Multi-select glass dropdown for capabilities (chips + checkbox list).
const MultiSelectDropdown = ({
  selectedIds,
  options,
  loading,
  onToggle,
  onRemove,
  pageCount,
  onPageCountChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Regular (checkbox) features vs the pages feature (always-on +/- counter).
  const regularSelected = options.filter(
    (o) => !isPagesFeature(o) && selectedIds.includes(o._id)
  );
  const hasPagesFeature = options.some(isPagesFeature);
  // Summary count in the trigger includes pages (always active) + selected regular features.
  const summaryCount = regularSelected.length + (hasPagesFeature ? 1 : 0);

  const stepPages = (delta) => (e) => {
    e.stopPropagation();
    const next = Math.min(MAX_PAGES, Math.max(MIN_PAGES, (pageCount || MIN_PAGES) + delta));
    onPageCountChange(next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading || options.length === 0}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-base text-white outline-none transition hover:border-white/35 focus-visible:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={summaryCount ? 'text-white' : 'text-slate-400'}>
          {loading
            ? 'Loading capabilities…'
            : options.length === 0
            ? 'No capabilities available for this project'
            : summaryCount
            ? `${summaryCount} selected`
            : 'Choose capabilities'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && options.length > 0 && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/15 bg-slate-900/95 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {options.map((option) => {
            // Pages feature — always-on +/- counter row instead of a checkbox.
            if (isPagesFeature(option)) {
              return (
                <div
                  key={option._id}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-base"
                >
                  <span className="font-medium text-white">Website Pages</span>
                  <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5">
                    <button
                      type="button"
                      onClick={stepPages(-1)}
                      disabled={pageCount <= MIN_PAGES}
                      className="flex h-8 w-8 items-center justify-center rounded-l-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-base font-semibold text-white">
                      {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={stepPages(1)}
                      disabled={pageCount >= MAX_PAGES}
                      className="flex h-8 w-8 items-center justify-center rounded-r-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            }

            const isSelected = selectedIds.includes(option._id);
            return (
              <button
                key={option._id}
                type="button"
                onClick={() => onToggle(option._id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-base text-slate-200 transition-colors hover:bg-white/[0.06]"
              >
                <span className={isSelected ? 'font-medium text-white' : ''}>
                  {option.serviceName?.trim()}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500 text-white'
                      : 'border-white/30 text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected chips — pages chip (always) + selected regular features */}
      {(hasPagesFeature || regularSelected.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hasPagesFeature && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-sm text-white">
              {pageCount} Pages
            </span>
          )}
          {regularSelected.map((option) => (
            <span
              key={option._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 py-1 pl-3 pr-1.5 text-sm text-white"
            >
              {option.serviceName?.trim()}
              <button
                type="button"
                onClick={() => onRemove(option._id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-100 transition hover:bg-white/15"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const StartNewWebsiteCustomize = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state?.user?.user);

  const state = location.state || {};

  // Editable form state (prefilled from the flow, but the user can change anything here).
  const [projectCategory, setProjectCategory] = useState(state.projectCategory || 'dynamic_websites');
  const [budget, setBudget] = useState(state.budget || '');
  const [ownership, setOwnership] = useState(state.ownership || '');
  const [paymentOption, setPaymentOption] = useState('full');
  const [couponCode, setCouponCode] = useState('');

  const [allFeatures, setAllFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
  const [pageCount, setPageCount] = useState(MIN_PAGES);

  // Fetch features whenever the primary project changes. Old selection is cleared on change.
  useEffect(() => {
    let active = true;
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        const response = await fetch(SummaryApi.allProduct.url);
        const dataResponse = await response.json();
        const products = dataResponse?.data || [];
        const features = products.filter(
          (p) =>
            p.category === 'feature_upgrades' &&
            !p.isHidden &&
            Array.isArray(p.compatibleWith) &&
            p.compatibleWith.includes(projectCategory)
        );
        if (active) {
          setAllFeatures(features);
          setSelectedFeatureIds([]); // reset selection for the new project type
          setPageCount(MIN_PAGES); // reset pages counter for the new project type
        }
      } catch (error) {
        console.error('Error loading features:', error);
        if (active) {
          setAllFeatures([]);
          setSelectedFeatureIds([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFeatures();
    return () => {
      active = false;
    };
  }, [projectCategory]);

  const toggleFeature = (featureId) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  const removeFeature = (featureId) => {
    setSelectedFeatureIds((prev) => prev.filter((id) => id !== featureId));
  };

  // Estimate total (UI-only, not a final price):
  //  - the pages feature is always counted as sellingPrice × pageCount
  //  - regular features are counted once each when checkbox-selected
  const estimateTotal = useMemo(
    () =>
      allFeatures.reduce((sum, f) => {
        const price = Number(f.sellingPrice) || 0;
        if (isPagesFeature(f)) {
          return sum + price * pageCount;
        }
        return selectedFeatureIds.includes(f._id) ? sum + price : sum;
      }, 0),
    [allFeatures, selectedFeatureIds, pageCount]
  );

  const projectLabel = labelOf(PROJECT_OPTIONS, projectCategory) || 'Your Project';
  // Capability count = selected regular features + the always-on pages feature (if available).
  const hasPagesFeature = allFeatures.some(isPagesFeature);
  const selectedCount = selectedFeatureIds.length + (hasPagesFeature ? 1 : 0);

  // Human-readable list of chosen capabilities (pages first, then selected features).
  const selectedCapabilityNames = useMemo(() => {
    const names = [];
    if (hasPagesFeature) names.push(`${pageCount} Website Pages`);
    allFeatures.forEach((f) => {
      if (!isPagesFeature(f) && selectedFeatureIds.includes(f._id)) {
        names.push(f.serviceName?.trim());
      }
    });
    return names;
  }, [allFeatures, selectedFeatureIds, pageCount, hasPagesFeature]);

  // --- Proceed / Create handling (UI-only; structure aligned with the existing backend) ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Build a payload in the same shape DirectPayment.js / createOrder expect, so wiring later
  // is a one-step change. NOTE: intentionally not sent anywhere yet (UI-only this phase).
  const buildPaymentData = () => ({
    projectCategory,
    budget,
    ownership,
    paymentOption,
    couponCode: couponCode || null,
    pageCount,
    // selectedFeatures mirrors the { id, name, sellingPrice, quantity } items createOrder reads.
    selectedFeatures: allFeatures
      .filter((f) => isPagesFeature(f) || selectedFeatureIds.includes(f._id))
      .map((f) => ({
        id: f._id,
        name: f.serviceName?.trim(),
        sellingPrice: Number(f.sellingPrice) || 0,
        quantity: isPagesFeature(f) ? pageCount : 1,
      })),
    estimateTotal,
  });

  const handleSubmit = () => {
    if (paymentOption === 'decide_later') {
      // No payment — the customer wants the project created and will settle payment later.
      setShowSuccess(true);
      return;
    }
    // Full / Partial — open the payment confirmation popup (UI-only for now).
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    // UI-only stub. Real wiring (navigate to /direct-payment or a new custom-project endpoint)
    // will consume buildPaymentData() here in a later phase.
    void buildPaymentData();
    setShowPaymentModal(false);
    setShowSuccess(true);
  };

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
          {/* Header — open, centered */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate('/start-new-project/build/new_website')}
              className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {projectLabel}
              </h1>
              <p className="mt-1 text-base text-slate-300 sm:text-lg">Customize your project</p>
            </div>
          </div>

          {/* Full-page glass sheet behind all content — soft, frameless-feeling, overflow-visible */}
          <div className="rounded-[2rem] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
            {/* LEFT: the requirement form */}
            <div className="flex flex-col gap-10">
              <section>
                <SectionLabel>Your requirement</SectionLabel>
                <p className="mt-2 text-base text-slate-300">
                  Prefilled from your answers — change anything you like.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Primary project">
                    <SelectDropdown
                      value={projectCategory}
                      options={PROJECT_OPTIONS}
                      onChange={setProjectCategory}
                    />
                  </Field>
                  <Field label="Budget range">
                    <SelectDropdown
                      value={budget}
                      options={BUDGET_OPTIONS}
                      placeholder="Select budget"
                      onChange={setBudget}
                    />
                  </Field>
                  <Field label="Content management">
                    <SelectDropdown
                      value={ownership}
                      options={OWNERSHIP_OPTIONS}
                      placeholder="Select option"
                      onChange={setOwnership}
                    />
                  </Field>
                  <Field label="Payment option">
                    <SelectDropdown
                      value={paymentOption}
                      options={PAYMENT_OPTIONS}
                      onChange={setPaymentOption}
                    />
                  </Field>
                </div>
              </section>

              <section className="border-t border-white/10 pt-10">
                <SectionLabel>Capabilities</SectionLabel>
                <h2 className="mt-2 text-xl font-bold text-white">Choose what your project needs</h2>
                <p className="mt-1 text-base text-slate-300">
                  Select everything you need, or just the parts that matter.
                </p>
                <div className="mt-5 max-w-xl">
                  <MultiSelectDropdown
                    selectedIds={selectedFeatureIds}
                    options={allFeatures}
                    loading={loading}
                    onToggle={toggleFeature}
                    onRemove={removeFeature}
                    pageCount={pageCount}
                    onPageCountChange={setPageCount}
                  />
                </div>
              </section>
            </div>

            {/* RIGHT: estimate + coupon + submit (sticky on desktop) */}
            <div className="lg:border-l lg:border-white/10 lg:pl-14">
              <div className="lg:sticky lg:top-6 flex flex-col gap-10">
                <section>
                  <SectionLabel>Estimated total</SectionLabel>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      {selectedCount} capabilit{selectedCount === 1 ? 'y' : 'ies'}
                    </span>
                    <span className="text-3xl font-bold text-white">
                      ₹{estimateTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-amber-200/90">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={2} />
                    This is an estimate. Your final pricing may differ based on your requirements or
                    offers available to you — not the final price.
                  </p>
                </section>

                <section className="border-t border-white/10 pt-10">
                  <SectionLabel>Coupon / promo code</SectionLabel>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-2.5 text-base text-white placeholder-slate-500 outline-none transition focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => {}}
                      className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-base font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-300/60 hover:bg-emerald-500/35"
                    >
                      Apply
                    </button>
                  </div>
                </section>

                <section className="border-t border-white/10 pt-10">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-8 py-3 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300/60 hover:bg-emerald-500/35"
                  >
                    {paymentOption === 'decide_later' ? 'Create Project' : 'Proceed to Payment'}
                  </button>
                </section>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Payment confirmation popup — Full/Partial only (UI-only) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative w-full max-w-md animate-[fadeSlideUp_0.3s_ease-out_both] overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-7 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />

            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 rounded-lg border border-white/20 bg-white/10 p-1.5 text-white transition-colors duration-200 hover:border-emerald-300/60 hover:bg-white/[0.16]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <h3 className="relative text-xl font-semibold text-white">Confirm your project</h3>
            <p className="relative mt-1 text-sm text-slate-300">
              Review your selection before you continue to payment.
            </p>

            <div className="relative mt-5 divide-y divide-white/10">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-sm text-slate-400">Project</span>
                <span className="text-right text-sm font-medium text-white">{projectLabel}</span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-slate-400">Capabilities</span>
                <span className="text-right text-sm font-medium text-white">
                  {selectedCapabilityNames.length
                    ? selectedCapabilityNames.join(', ')
                    : 'None selected'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-sm text-slate-400">Payment</span>
                <span className="text-right text-sm font-medium text-white">
                  {labelOf(PAYMENT_OPTIONS, paymentOption)}
                </span>
              </div>
              {couponCode && (
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="text-sm text-slate-400">Coupon</span>
                  <span className="text-right text-sm font-medium text-white">{couponCode}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-sm text-slate-400">Estimated total</span>
                <span className="text-right text-lg font-bold text-white">
                  ₹{estimateTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="relative mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-200/90">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" strokeWidth={2} />
              This is an estimate — your final pricing may differ. Not the final price.
            </p>

            <button
              type="button"
              onClick={handleConfirmPayment}
              className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300/60 hover:bg-emerald-500/35"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {/* Success confirmation — shown after Create Project / confirmed payment (UI-only) */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          />
          <div className="relative w-full max-w-sm animate-[fadeSlideUp_0.3s_ease-out_both] overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />

            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 backdrop-blur-md">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" strokeWidth={1.75} />
            </div>

            <h3 className="relative mt-5 text-xl font-semibold text-white">
              Project request submitted
            </h3>
            <p className="relative mt-2 text-base leading-relaxed text-slate-300">
              Our team will review your requirement and get in touch with you shortly.
            </p>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-6 py-2.5 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300/60 hover:bg-emerald-500/35"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StartNewWebsiteCustomize;
