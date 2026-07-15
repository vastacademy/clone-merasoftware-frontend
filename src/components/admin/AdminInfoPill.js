import React from "react";

const AdminInfoPill = ({ label, value, variant = "light" }) => {
  const isDark = variant === "dark";

  return (
    <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 px-4 py-3" : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"}>
      <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400" : "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"}>
        {label}
      </p>
      <p className={isDark ? "mt-1 truncate text-sm font-semibold text-white" : "mt-1 truncate text-sm font-semibold text-slate-900"}>
        {value}
      </p>
    </div>
  );
};

export default AdminInfoPill;
