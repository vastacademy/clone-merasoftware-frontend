import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import RichTextEditor from "../helpers/richTextEditor";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";

const PROJECT_CATEGORIES = [
  { value: "standard_websites", label: "Standard Website" },
  { value: "dynamic_websites", label: "Dynamic Website" },
  { value: "cloud_software_development", label: "Cloud Software" },
  { value: "app_development", label: "App Development" },
];

const websiteCategories = ["standard_websites", "dynamic_websites"];
const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const labelClassName = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700";

const MultiLineCrossField = ({ label, placeholder, value, onChange }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const lines = value.split("\n");

  const removeLine = (lineIndex) => {
    const nextLines = lines.filter((_, index) => index !== lineIndex);
    onChange(nextLines.length > 0 ? nextLines.join("\n") : "");
  };

  const lineSeparatorStops = ["#ffffff 0px"];
  for (let index = 1; index < lines.length; index += 1) {
    const separatorTop = index * 24;
    lineSeparatorStops.push(
      `#f1f5f9 ${separatorTop}px`,
      `#f1f5f9 ${separatorTop + 1}px`,
      `#ffffff ${separatorTop + 1}px`,
    );
  }

  return (
    <div>
      <span className={labelClassName}>{label}</span>
      <div className="relative">
        <textarea
          className={`${inputClassName} min-h-16 max-h-28 resize-y overflow-y-auto pr-8 leading-6`}
          placeholder={placeholder}
          value={value}
          rows="3"
          style={{
            backgroundImage: lines.length > 1
              ? `linear-gradient(to bottom, ${lineSeparatorStops.join(", ")})`
              : "none",
          }}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0">
          {lines.map((_, index) => (
            <button
              key={`${label}-line-${index}`}
              type="button"
              onClick={() => removeLine(index)}
              className="pointer-events-auto absolute right-2 text-base leading-6 text-slate-400 transition hover:text-red-500"
              style={{ top: `${7 + (index * 24) - scrollTop}px` }}
              aria-label={`Remove line ${index + 1} from ${label}`}
            >
              ×
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        Press Enter to add a new line. Use × to remove a line.
      </p>
    </div>
  );
};

const AdminCreateProjectPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("visible");
  const [whoIsItFor, setWhoIsItFor] = useState("");
  const [whatsIncluded, setWhatsIncluded] = useState("");
  const descriptionRef = useRef("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isWebsiteCategory = websiteCategories.includes(category);
  const handleDescriptionChange = useCallback((content) => {
    descriptionRef.current = content;
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) toast.success(result.message);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      CookieManager.clearAll();
      StorageService.clearUserData();
      dispatch(logout());
      navigate("/");
    }
  };

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className={`min-h-screen transition-all duration-500 ease-out ${isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}>
        <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          title="Add Project"
          subtitle="Create reusable project product"
          leadingAction={
            <button
              type="button"
              onClick={() => navigate("/admin-panel/website-management/projects")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          }
        />

        <div className="p-3 sm:p-4">
          <form className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className={labelClassName}>Project Name</span>
                <input className={inputClassName} type="text" placeholder="Enter project name" />
              </label>

              <label>
                <span className={labelClassName}>Category</span>
                <select className={inputClassName} value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">Select category</option>
                  {PROJECT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClassName}>Starting Node Title <span className="text-red-500">*</span></span>
                <input className={inputClassName} type="text" placeholder="Project Initiation" />
              </label>

              {isWebsiteCategory && (
                <label>
                  <span className={labelClassName}>Total Pages</span>
                  <input className={inputClassName} type="number" min="4" max="50" placeholder="4–50" />
                </label>
              )}

              <label>
                <span className={labelClassName}>Base Price</span>
                <input className={inputClassName} type="number" min="0" placeholder="Enter base price" />
              </label>

              <label>
                <span className={labelClassName}>Selling Price</span>
                <input className={inputClassName} type="number" min="0" placeholder="Enter selling price" />
              </label>

              <div>
                <span className={labelClassName}>Project Image <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span></span>
                <label className="flex h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 transition hover:border-emerald-400 hover:bg-emerald-50">
                  <UploadCloud className="text-slate-400" size={22} />
                  <span className="text-xs font-semibold text-slate-600">Upload image</span>
                  <input type="file" multiple className="hidden" />
                </label>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <span className={labelClassName}>Description / Specifications</span>
                <RichTextEditor
                  onChange={handleDescriptionChange}
                  placeholder="Describe the project"
                  wrapperClassName="bg-white"
                />
              </div>

              <MultiLineCrossField
                label="Who is it for?"
                placeholder="Ideal customer or business"
                value={whoIsItFor}
                onChange={setWhoIsItFor}
              />

              <MultiLineCrossField
                label="What's Included"
                placeholder="Add included items"
                value={whatsIncluded}
                onChange={setWhatsIncluded}
              />

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
                onClick={() => navigate("/admin-panel/website-management/projects")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <Save size={16} />
                Save Project
              </button>
            </div>
          </form>
        </div>
        </AdminWorkspaceShell>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateProjectPage;
