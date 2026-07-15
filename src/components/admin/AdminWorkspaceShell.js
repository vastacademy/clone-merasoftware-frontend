import React from "react";

const AdminWorkspaceShell = ({ children }) => {
  return (
    <div className="mx-auto max-w-[90rem] px-4 pb-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
        {children}
      </section>
    </div>
  );
};

export const AdminWorkspaceHeader = ({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  leadingAction,
  meta,
  actions,
  loadingText,
}) => {
  return (
    <div className="border-b border-slate-800 bg-slate-950 p-5 text-white sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {leadingAction}

          {Icon ? (
            <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300 ring-1 ring-emerald-400/20">
              <Icon size={22} />
            </div>
          ) : null}

          <div className="min-w-0">
            {eyebrow ? (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {eyebrow}
              </div>
            ) : null}
            <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
        </div>

        {meta ? <div className="grid gap-3 sm:grid-cols-3">{meta}</div> : null}
        {actions ? <div className="w-full lg:w-auto">{actions}</div> : null}
      </div>

      {loadingText ? (
        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          {loadingText}
        </div>
      ) : null}
    </div>
  );
};

export default AdminWorkspaceShell;
