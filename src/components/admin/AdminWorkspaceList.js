import React from "react";

const AdminWorkspaceList = ({ columns, loading, emptyText, items, renderRow, footer }) => {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
      <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:px-6">
        {columns.map((column) => (
          <div key={column.label} className={column.className}>
            {column.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">Loading...</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">{emptyText}</div>
      ) : (
        <div className="divide-y divide-slate-200 bg-white">
          {items.map((item, index) => renderRow(item, index))}
        </div>
      )}

      {footer ? <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500 sm:px-6">{footer}</div> : null}
    </div>
  );
};

export default AdminWorkspaceList;
