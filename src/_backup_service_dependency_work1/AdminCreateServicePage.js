import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import RichTextEditor from "../helpers/richTextEditor";
import SummaryApi from "../common";
import { goToAdminReturn } from "../helpers/adminReturnNavigation";

const SERVICE_TYPES = [["website_updates", "Website Update"], ["digital_marketing", "Digital Marketing"], ["google_business_setup", "Google Business Setup"], ["social_media_marketing", "Social Media Marketing"], ["other", "Other"]];
const TIMINGS = [["during", "During Project"], ["during_and_after", "During + After Project"], ["after", "After Project"]];
const DEPENDENCIES = [["project_required", "Project Required"], ["standalone_or_project", "Standalone + Project"], ["standalone_only", "Standalone Only"]];
const ACCESS_SCOPES = [["per_day", "Per Day"], ["per_week", "Per Week"], ["per_month", "Per Month"], ["per_quarter", "Per Quarter"], ["per_6_month", "Per 6 Months"], ["per_year", "Per Year"], ["per_plan", "For Entire Service"], ["unlimited", "Unlimited"]];
const CAPABILITIES = [["", "Select service capability"], ["upload", "Upload Data"], ["reminders", "Send Reminders"]];
const BILLING_OPTIONS = [
  { id: "monthly", label: "Monthly", months: 1 }, { id: "quarterly", label: "Quarterly", months: 3 },
  { id: "half_yearly", label: "Every 6 Months", months: 6 }, { id: "yearly", label: "Yearly", months: 12 },
  { id: "every_2_years", label: "Every 2 Years", months: 24 }, { id: "every_3_years", label: "Every 3 Years", months: 36 },
  { id: "every_4_years", label: "Every 4 Years", months: 48 }, { id: "every_5_years", label: "Every 5 Years", months: 60 },
];
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
const sectionClass = "mt-5 border-t border-slate-200 pt-4";

const AdminCreateServicePage = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Back, Cancel and a completed save all leave this form the same way: back to the plans
  // list, replacing the form's entry so it cannot be re-entered with Back (and, after a
  // save, so Back does not land on a form whose service already exists).
  const leaveForm = () => goToAdminReturn(navigate, location, "/admin-panel/website-management/plans", { replace: true });
  const descriptionRef = useRef("");
  const [form, setForm] = useState({
    serviceName: "", serviceType: "", timing: "", dependency: "", visibility: "visible",
    controlsUpload: false, sendsReminders: false, accessScope: "", uploadAttempts: "", filesPerUpload: "",
    purchaseType: "recurring", monthlyReferencePrice: "", oneTimePrice: "",
    billing: Object.fromEntries(BILLING_OPTIONS.map((option) => [option.id, { enabled: false, discount: "0" }])),
  });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateBilling = (id, patch) => setForm((current) => ({ ...current, billing: { ...current.billing, [id]: { ...current.billing[id], ...patch } } }));
  const capability = form.controlsUpload ? "upload" : (form.sendsReminders ? "reminders" : "");
  const updateCapability = (value) => setForm((current) => ({
    ...current,
    controlsUpload: value === "upload",
    sendsReminders: value === "reminders",
  }));
  const isOneTimeService = form.purchaseType === "one_time";
  const enabledBillingOptions = useMemo(() => BILLING_OPTIONS.filter((option) => form.billing[option.id]?.enabled), [form.billing]);
  const getOptionPrice = (option) => {
    const referencePrice = Number(form.monthlyReferencePrice || 0);
    const discount = Math.min(100, Math.max(0, Number(form.billing[option.id]?.discount || 0)));
    return referencePrice * option.months * (1 - discount / 100);
  };
  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
  const handleDescriptionChange = useCallback((content) => { descriptionRef.current = content; }, []);
  const [isSaving, setIsSaving] = useState(false);
  const handlePreviewSubmit = async (event) => {
    event.preventDefault();
    if (!form.serviceName.trim() || !form.serviceType || !form.dependency || !capability) return toast.error("Complete all required service details.");
    if (form.dependency !== "standalone_only" && !form.timing) return toast.error("Select when this project-linked service can work.");
    if (form.controlsUpload && (!form.accessScope || !form.filesPerUpload || (form.accessScope !== "unlimited" && !form.uploadAttempts))) return toast.error("Complete the upload limits.");
    if (isOneTimeService) {
      if (!(Number(form.oneTimePrice) > 0)) return toast.error("Enter a one-time price greater than zero.");
    } else {
      if (Number(form.monthlyReferencePrice) < 0 || form.monthlyReferencePrice === "") return toast.error("Enter a valid monthly reference price.");
      if (!enabledBillingOptions.length) return toast.error("Enable at least one customer billing option.");
    }
    try {
      setIsSaving(true);
      const response = await fetch(SummaryApi.createService.url, {
        method: SummaryApi.createService.method,
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceName: form.serviceName, planType: form.serviceType, timing: form.dependency === "standalone_only" ? undefined : form.timing,
          dependency: form.dependency, capability: form.controlsUpload ? "upload_data" : "send_reminders", visibility: form.visibility,
          purchaseType: form.purchaseType,
          limitScope: form.controlsUpload ? form.accessScope : undefined,
          portalAccessCount: form.controlsUpload && form.accessScope !== "unlimited" ? Number(form.uploadAttempts) : undefined,
          filesLimit: form.controlsUpload ? Number(form.filesPerUpload) : undefined,
          oneTimePrice: isOneTimeService ? Number(form.oneTimePrice) : undefined,
          monthlyReferencePrice: isOneTimeService ? undefined : Number(form.monthlyReferencePrice),
          billingOptions: isOneTimeService ? [] : enabledBillingOptions.map((option) => ({ billingCycle: option.id, discountPercent: Number(form.billing[option.id].discount || 0) })),
          description: descriptionRef.current,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Service could not be created.");
      toast.success("Service added to the catalogue.");
      leaveForm();
    } catch (error) { toast.error(error.message || "Service could not be created."); } finally { setIsSaving(false); }
  };

  return (
    <AdminLayout user={user}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader title="Add Service" subtitle="Define how customers can buy and use a catalogue service." leadingAction={<button type="button" onClick={leaveForm} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10" aria-label="Go back"><ArrowLeft size={18} /></button>} />
        <div className="p-3 sm:p-4">
          <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5" onSubmit={handlePreviewSubmit}>
            <section>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">1. Service basics</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label><span className={labelClass}>Service Name</span><input className={inputClass} value={form.serviceName} onChange={(event) => update("serviceName", event.target.value)} placeholder="e.g. Website Care" /></label>
                <label><span className={labelClass}>Service Type</span><select className={inputClass} value={form.serviceType} onChange={(event) => update("serviceType", event.target.value)}><option value="">Select type</option>{SERVICE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label><span className={labelClass}>Catalogue Status</span><select className={inputClass} value={form.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="visible">Active</option><option value="hidden">Disabled</option></select></label>
              </div>
            </section>

            <section className={sectionClass}>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">2. Availability</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label><span className={labelClass}>When can it work?</span><select className={inputClass} disabled={form.dependency === "standalone_only"} value={form.dependency === "standalone_only" ? "" : form.timing} onChange={(event) => update("timing", event.target.value)}><option value="">{form.dependency === "standalone_only" ? "Not applicable for standalone service" : "Select timing"}</option>{TIMINGS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label><span className={labelClass}>Project dependency</span><select className={inputClass} value={form.dependency} onChange={(event) => update("dependency", event.target.value)}><option value="">Select dependency</option>{DEPENDENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              </div>
            </section>

            <section className={sectionClass}>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">3. What this service provides</p>
              <div className="mt-3 max-w-xl"><label><span className={labelClass}>Service Capability</span><select className={inputClass} value={capability} onChange={(event) => updateCapability(event.target.value)}>{CAPABILITIES.map(([value, label]) => <option key={value || "placeholder"} value={value}>{label}</option>)}</select></label></div>
              {form.controlsUpload && <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3"><label><span className={labelClass}>Access Limit</span><select className={inputClass} value={form.accessScope} onChange={(event) => update("accessScope", event.target.value)}><option value="">Select limit</option>{ACCESS_SCOPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{form.accessScope !== "unlimited" && <label><span className={labelClass}>Upload Attempts</span><input className={inputClass} type="number" min="1" value={form.uploadAttempts} onChange={(event) => update("uploadAttempts", event.target.value)} placeholder="e.g. 5" /></label>}<label><span className={labelClass}>Files per Upload</span><input className={inputClass} type="number" min="1" value={form.filesPerUpload} onChange={(event) => update("filesPerUpload", event.target.value)} placeholder="e.g. 10" /></label></div>}
            </section>

            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">4. Purchase and billing</p><span className="text-xs text-slate-500">Choose how often a customer can be charged.</span></div>
              <div className="mt-3 grid gap-3 md:grid-cols-2"><label><span className={labelClass}>Purchase type</span><select className={inputClass} value={form.purchaseType} onChange={(event) => update("purchaseType", event.target.value)}><option value="recurring">Recurring service</option><option value="one_time">One-time service</option></select></label>{isOneTimeService ? <label><span className={labelClass}>One-time price</span><input className={inputClass} type="number" min="1" value={form.oneTimePrice} onChange={(event) => update("oneTimePrice", event.target.value)} placeholder="e.g. 2500" /></label> : <><label><span className={labelClass}>Monthly Reference Price</span><input className={inputClass} type="number" min="0" value={form.monthlyReferencePrice} onChange={(event) => update("monthlyReferencePrice", event.target.value)} placeholder="e.g. 1000" /></label><div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900"><Calculator className="mr-1 inline h-3.5 w-3.5" />Final price = monthly reference price × months − admin discount.</div></>}</div>
              {isOneTimeService ? <p className="mt-3 text-sm text-slate-500">Customer pays this price once. No billing period, renewal, or future invoice is created.</p> : <div className="mt-3 grid gap-2 xl:grid-cols-2">
                {BILLING_OPTIONS.map((option) => {
                  const isEnabled = form.billing[option.id].enabled;
                  return (
                    <div key={option.id} className={`grid grid-cols-2 gap-3 rounded-xl border p-3 transition sm:grid-cols-[minmax(0,1fr)_72px_105px_120px] sm:items-center ${isEnabled ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                      <p className="text-sm font-bold text-slate-950">{option.label}</p>
                      <label className="flex items-center justify-end gap-1.5 text-sm font-semibold text-slate-700 md:justify-start"><input type="checkbox" checked={isEnabled} onChange={(event) => updateBilling(option.id, { enabled: event.target.checked })} />Enable</label>
                      <label><span className="mb-1 block text-xs font-semibold text-slate-500">Discount %</span><input className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-950 outline-none focus:border-emerald-400 disabled:bg-slate-100" type="number" min="0" max="100" disabled={!isEnabled} value={form.billing[option.id].discount} onChange={(event) => updateBilling(option.id, { discount: event.target.value })} /></label>
                      <div><span className="mb-1 block text-xs font-semibold text-slate-500">Final Price</span><p className="rounded-lg bg-white/70 px-2.5 py-2 text-sm font-bold text-emerald-700">{formatPrice(getOptionPrice(option))}</p></div>
                    </div>
                  );
                })}
              </div>}
              {!isOneTimeService && <p className="mt-2 text-xs text-slate-500">Enabled: {enabledBillingOptions.length || "none"}. Customer duration and advance-payment selection will use these options in the next wiring phase.</p>}
            </section>

            <section className={sectionClass}><span className={labelClass}>Description / Specifications</span><RichTextEditor onChange={handleDescriptionChange} placeholder="Describe what this service includes" wrapperClassName="bg-white" /></section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><p className="text-sm text-slate-500">Only enabled billing options will be available to customers.</p><div className="flex gap-3"><button type="button" onClick={leaveForm} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button><button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300"><Save size={16} />{isSaving ? "Saving..." : "Add Service"}</button></div></div>
          </form>
        </div>
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminCreateServicePage;
