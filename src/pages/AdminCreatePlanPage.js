import React, { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import RichTextEditor from "../helpers/richTextEditor";

const PLAN_TYPES = [
  { value: "website_updates", label: "Website Update" },
  { value: "digital_marketing", label: "Digital Marketing" },
  { value: "google_business_setup", label: "Google Business Setup" },
  { value: "social_media_marketing", label: "Social Media Marketing" },
  { value: "other", label: "Other" },
];

const FILES_LIMIT_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25];

const LIMIT_SCOPES = [
  { value: "per_day", label: "Per Day" },
  { value: "per_week", label: "Per Week" },
  { value: "per_month", label: "Per Month" },
  { value: "per_plan", label: "Per Plan" },
  { value: "unlimited", label: "Unlimited" },
  { value: "manual", label: "Manual" },
];

const MANUAL_UNITS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const VALIDITY_UNITS = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
  { value: "year", label: "Years" },
];

const MANUAL_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const BILLING_CYCLES = [
  { value: "weekly", label: "Weekly", months: null },
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "quarterly", label: "Quarterly", months: 3 },
  { value: "half_yearly", label: "Every 6 Months", months: 6 },
  { value: "yearly", label: "Yearly", months: 12 },
];

const TOTAL_CYCLES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const VALIDITY_VALUE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const labelClassName = "mb-1.5 block text-base font-semibold text-slate-700";
const sectionTitleClassName = "text-sm font-bold uppercase tracking-wide text-slate-500";

const AdminCreatePlanPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();

  // Basic details
  const [serviceName, setServiceName] = useState("");
  const [planType, setPlanType] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [visibility, setVisibility] = useState("visible");

  // Plan validity — overall plan lifespan
  const [validityUnit, setValidityUnit] = useState("");
  const [validityValue, setValidityValue] = useState("");
  const [validityValueCustom, setValidityValueCustom] = useState("");
  const [billingCycle, setBillingCycle] = useState("");

  const resolvedValidityValue = validityValue === "manual" ? Number(validityValueCustom) : Number(validityValue);

  const validityInDays = validityUnit && resolvedValidityValue
    ? resolvedValidityValue * { day: 1, week: 7, month: 30, year: 365 }[validityUnit]
    : 0;
  // Month-based validity is compared in whole months so quarterly/half-yearly/yearly
  // only appear when they divide the plan's duration evenly (no partial cycle left over).
  const validityInMonths = validityUnit === "month" ? resolvedValidityValue
    : validityUnit === "year" ? resolvedValidityValue * 12
    : null;

  const availableBillingCycles = !validityUnit || !resolvedValidityValue
    ? []
    : BILLING_CYCLES.filter((option) => {
        if (option.value === "weekly") {
          return validityInDays >= 7;
        }
        return validityInMonths !== null && validityInMonths % option.months === 0;
      });

  // Portal access — how much/how often the customer can use the portal
  const [limitScope, setLimitScope] = useState("");
  const [totalCycles, setTotalCycles] = useState("");
  const [totalCyclesValue, setTotalCyclesValue] = useState("");

  // Manual scope — custom unit + count (with its own manual override)
  const [manualUnit, setManualUnit] = useState("");
  const [manualCount, setManualCount] = useState("");
  const [manualCountValue, setManualCountValue] = useState("");

  // Files limit — per-upload file count, independent of portal access
  const [filesLimitCount, setFilesLimitCount] = useState("");
  const [filesLimitCountValue, setFilesLimitCountValue] = useState("");

  const descriptionRef = useRef("");

  const handleDescriptionChange = useCallback((content) => {
    descriptionRef.current = content;
  }, []);

  const handleFormSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <AdminLayout user={user}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          title="Add Plan"
          subtitle="Create reusable plan product"
          leadingAction={
            <button
              type="button"
              onClick={() => navigate("/admin-panel/website-management/plans")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          }
        />

        <div className="p-3 sm:p-4">
          <form className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5" onSubmit={handleFormSubmit}>

            {/* Plan name & type */}
            <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
              <label>
                <span className={labelClassName}>Plan Name</span>
                <input
                  className={inputClassName}
                  type="text"
                  placeholder="Enter plan name"
                  value={serviceName}
                  onChange={(event) => setServiceName(event.target.value)}
                />
              </label>

              <label>
                <span className={labelClassName}>Plan Type</span>
                <select className={inputClassName} value={planType} onChange={(event) => setPlanType(event.target.value)}>
                  <option value="">Select plan type</option>
                  {PLAN_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Plan power */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <span className={sectionTitleClassName}>Plan Power</span>
              <div className="mt-3 grid gap-x-4 gap-y-4 md:grid-cols-2">
                <label>
                  <span className={labelClassName}>Limit Scope</span>
                  <select className={inputClassName} value={limitScope} onChange={(event) => setLimitScope(event.target.value)}>
                    <option value="">Select scope limit</option>
                    {LIMIT_SCOPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                {limitScope === "manual" && (
                  <>
                    <label>
                      <span className={labelClassName}>Manual Unit</span>
                      <select className={inputClassName} value={manualUnit} onChange={(event) => setManualUnit(event.target.value)}>
                        <option value="">Select unit</option>
                        {MANUAL_UNITS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className={labelClassName}>Manual Count</span>
                      <select className={inputClassName} value={manualCount} onChange={(event) => setManualCount(event.target.value)}>
                        <option value="">Select count</option>
                        {MANUAL_COUNT_OPTIONS.map((count) => (
                          <option key={count} value={count}>{count}</option>
                        ))}
                        <option value="manual">Manual</option>
                      </select>
                    </label>

                    {manualCount === "manual" && (
                      <label>
                        <span className={labelClassName}>Enter Count</span>
                        <input
                          className={inputClassName}
                          type="number"
                          min="1"
                          placeholder="e.g. 45"
                          value={manualCountValue}
                          onChange={(event) => setManualCountValue(event.target.value)}
                        />
                      </label>
                    )}
                  </>
                )}

                {limitScope && limitScope !== "unlimited" && (
                  <label>
                    <span className={labelClassName}>Portal Access</span>
                    <select className={inputClassName} value={totalCycles} onChange={(event) => setTotalCycles(event.target.value)}>
                      <option value="">Select portal access</option>
                      {TOTAL_CYCLES_OPTIONS.map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                      <option value="manual">Manual</option>
                    </select>
                  </label>
                )}

                {limitScope && limitScope !== "unlimited" && totalCycles === "manual" && (
                  <label>
                    <span className={labelClassName}>Enter Portal Access</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      placeholder="e.g. 15"
                      value={totalCyclesValue}
                      onChange={(event) => setTotalCyclesValue(event.target.value)}
                    />
                  </label>
                )}

                <label>
                  <span className={labelClassName}>Files Limit</span>
                  <select className={inputClassName} value={filesLimitCount} onChange={(event) => setFilesLimitCount(event.target.value)}>
                    <option value="">Select files limit count</option>
                    {FILES_LIMIT_OPTIONS.map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                    <option value="manual">Manual</option>
                  </select>
                </label>

                {filesLimitCount === "manual" && (
                  <label>
                    <span className={labelClassName}>Enter Files Limit</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      placeholder="e.g. 30"
                      value={filesLimitCountValue}
                      onChange={(event) => setFilesLimitCountValue(event.target.value)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Plan validity */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <span className={sectionTitleClassName}>Plan Validity</span>
              <div className="mt-3 grid gap-x-4 gap-y-4 md:grid-cols-2">
                <label>
                  <span className={labelClassName}>Validity Unit</span>
                  <select className={inputClassName} value={validityUnit} onChange={(event) => setValidityUnit(event.target.value)}>
                    <option value="">Select validity unit</option>
                    {VALIDITY_UNITS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelClassName}>Validity Value</span>
                  <select className={inputClassName} value={validityValue} onChange={(event) => setValidityValue(event.target.value)}>
                    <option value="">Select validity value</option>
                    {VALIDITY_VALUE_OPTIONS.map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                    <option value="manual">Manual</option>
                  </select>
                </label>

                {validityValue === "manual" && (
                  <label>
                    <span className={labelClassName}>Enter Validity Value</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      placeholder="e.g. 18"
                      value={validityValueCustom}
                      onChange={(event) => setValidityValueCustom(event.target.value)}
                    />
                  </label>
                )}

                {availableBillingCycles.length > 0 && (
                  <label>
                    <span className={labelClassName}>Billing Cycle</span>
                    <select className={inputClassName} value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}>
                      <option value="">Select billing cycle</option>
                      {availableBillingCycles.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            {/* Description, image, visibility */}
            <div className="mt-6 grid gap-x-4 gap-y-4 border-t border-slate-200 pt-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <span className={labelClassName}>Description / Specifications</span>
                <RichTextEditor
                  onChange={handleDescriptionChange}
                  placeholder="Describe the plan"
                  wrapperClassName="bg-white"
                />
              </div>

              <label>
                <span className={labelClassName}>Base Price</span>
                <input
                  className={inputClassName}
                  type="number"
                  min="0"
                  placeholder="Enter base price"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </label>

              <label>
                <span className={labelClassName}>Selling Price</span>
                <input
                  className={inputClassName}
                  type="number"
                  min="0"
                  placeholder="Enter selling price"
                  value={sellingPrice}
                  onChange={(event) => setSellingPrice(event.target.value)}
                />
              </label>

              <label>
                <span className={labelClassName}>Visibility</span>
                <select className={inputClassName} value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => navigate("/admin-panel/website-management/plans")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <Save size={16} />
                Save Plan
              </button>
            </div>
          </form>
        </div>
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminCreatePlanPage;
