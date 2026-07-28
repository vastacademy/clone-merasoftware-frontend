import React, { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import RichTextEditor from "../helpers/richTextEditor";

const PLAN_TYPES = [
  { value: "simple", label: "Simple" },
  { value: "monthlyRenewable", label: "Monthly Renewable" },
  { value: "monthlyLimited", label: "Monthly Limited" },
];

const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const labelClassName = "mb-1.5 block text-base font-semibold text-slate-700";

const AdminCreatePlanPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();

  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [planImage, setPlanImage] = useState([]);
  const [visibility, setVisibility] = useState("visible");
  const [planType, setPlanType] = useState("");

  const [validityPeriod, setValidityPeriod] = useState("");
  const [updateCount, setUpdateCount] = useState("");
  const [yearlyPlanDuration, setYearlyPlanDuration] = useState("");
  const [monthlyRenewalCost, setMonthlyRenewalCost] = useState("");
  const [monthlyUpdateLimit, setMonthlyUpdateLimit] = useState("");
  const [monthlyRenewalPrice, setMonthlyRenewalPrice] = useState("");

  const descriptionRef = useRef("");

  const handleDescriptionChange = useCallback((content) => {
    descriptionRef.current = content;
  }, []);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setPlanImage((current) => [...current, ...files.map((file) => file.name)]);
  };

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

              {planType === "simple" && (
                <>
                  <label>
                    <span className={labelClassName}>Validity Period (days)</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      max="365"
                      placeholder="e.g. 7"
                      value={validityPeriod}
                      onChange={(event) => setValidityPeriod(event.target.value)}
                    />
                  </label>

                  <label>
                    <span className={labelClassName}>Update Count</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={updateCount}
                      onChange={(event) => setUpdateCount(event.target.value)}
                    />
                  </label>
                </>
              )}

              {planType === "monthlyRenewable" && (
                <>
                  <label>
                    <span className={labelClassName}>Yearly Plan Duration (days)</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      max="365"
                      placeholder="e.g. 365"
                      value={yearlyPlanDuration}
                      onChange={(event) => setYearlyPlanDuration(event.target.value)}
                    />
                  </label>

                  <label>
                    <span className={labelClassName}>Monthly Renewal Cost</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      placeholder="e.g. 8000"
                      value={monthlyRenewalCost}
                      onChange={(event) => setMonthlyRenewalCost(event.target.value)}
                    />
                  </label>
                </>
              )}

              {planType === "monthlyLimited" && (
                <>
                  <label>
                    <span className={labelClassName}>Yearly Plan Duration (days)</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      max="365"
                      placeholder="e.g. 365"
                      value={yearlyPlanDuration}
                      onChange={(event) => setYearlyPlanDuration(event.target.value)}
                    />
                  </label>

                  <label>
                    <span className={labelClassName}>Monthly Update Limit</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      placeholder="e.g. 2"
                      value={monthlyUpdateLimit}
                      onChange={(event) => setMonthlyUpdateLimit(event.target.value)}
                    />
                  </label>

                  <label>
                    <span className={labelClassName}>Monthly Renewal Price</span>
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      placeholder="e.g. 3000"
                      value={monthlyRenewalPrice}
                      onChange={(event) => setMonthlyRenewalPrice(event.target.value)}
                    />
                  </label>
                </>
              )}

              <div className="md:col-span-2">
                <span className={labelClassName}>Description / Specifications</span>
                <RichTextEditor
                  onChange={handleDescriptionChange}
                  placeholder="Describe the plan"
                  wrapperClassName="bg-white"
                />
              </div>

              <div>
                <span className={labelClassName}>Plan Image <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span></span>
                <label className="flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 transition hover:border-emerald-400 hover:bg-emerald-50">
                  <UploadCloud className="text-slate-400" size={22} />
                  <span className="text-base font-semibold text-black">
                    {planImage.length > 0 ? `${planImage.length} file(s) selected` : "Upload image"}
                  </span>
                  <input type="file" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>

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
