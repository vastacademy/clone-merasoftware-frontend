import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check, ChevronDown, Info, X } from 'lucide-react';
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
const MultiSelectDropdown = ({ selectedIds, options, loading, onToggle, onRemove }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = options.filter((o) => selectedIds.includes(o._id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading || options.length === 0}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-base text-white outline-none transition hover:border-white/35 focus-visible:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected.length ? 'text-white' : 'text-slate-400'}>
          {loading
            ? 'Loading capabilities…'
            : options.length === 0
            ? 'No capabilities available for this project'
            : selected.length
            ? `${selected.length} selected`
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

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((option) => (
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

  // Estimate total = sum of selected feature selling prices (UI-only, not a final price).
  const estimateTotal = useMemo(
    () =>
      allFeatures
        .filter((f) => selectedFeatureIds.includes(f._id))
        .reduce((sum, f) => sum + (Number(f.sellingPrice) || 0), 0),
    [allFeatures, selectedFeatureIds]
  );

  const projectLabel = labelOf(PROJECT_OPTIONS, projectCategory) || 'Your Project';
  const selectedCount = selectedFeatureIds.length;

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
                    onClick={() => {}}
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
    </DashboardLayout>
  );
};

export default StartNewWebsiteCustomize;
