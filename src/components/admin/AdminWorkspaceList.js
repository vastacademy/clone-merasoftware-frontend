import React, { useEffect, useRef } from "react";

/**
 * Renders each row via `renderRow(item, index)` and adds shared row-to-row
 * keyboard navigation on top: ArrowUp/ArrowDown moves focus between rows,
 * and the first row is auto-focused once, right after the initial load
 * finishes (not on every re-render, so typing in a live-filtering search
 * box above the list never gets its focus stolen).
 *
 * Enter-to-open and Delete-to-delete stay in each page's own row
 * `onKeyDown` — only the page knows which action applies to which row
 * (e.g. a converted lead has no Delete). This component only owns moving
 * focus between rows, nothing about what a row does.
 */
const AdminWorkspaceList = ({ columns, loading, emptyText, items, renderRow, footer }) => {
  const rowRefs = useRef([]);
  const hasAutoFocused = useRef(false);

  useEffect(() => {
    if (loading) {
      hasAutoFocused.current = false;
      return;
    }
    if (hasAutoFocused.current) return;
    if (items.length === 0) return;
    hasAutoFocused.current = true;
    rowRefs.current[0]?.focus();
  }, [loading, items]);

  const handleContainerKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const currentIndex = rowRefs.current.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
    const nextRow = rowRefs.current[nextIndex];
    // At the first/last row there's nothing left to move to inside this list —
    // don't swallow the key, let it bubble so an ancestor (e.g. a tab's content
    // container) can decide what "off the edge of this list" means.
    if (!nextRow) return;
    event.preventDefault();
    nextRow.focus();
  };

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
        <div className="divide-y divide-slate-200 bg-white" onKeyDown={handleContainerKeyDown}>
          {(() => {
            rowRefs.current = [];
            let navigableIndex = -1;
            return items.map((item, index) => {
              const row = renderRow(item, index);
              // Non-row entries (e.g. a group-header divider) aren't focusable
              // targets — skip them so arrow-navigation only visits real rows.
              const isNavigable = row.props.tabIndex === 0 || row.type === "button";
              if (!isNavigable) return row;
              navigableIndex += 1;
              const refIndex = navigableIndex;
              return React.cloneElement(row, {
                ref: (el) => {
                  rowRefs.current[refIndex] = el;
                },
              });
            });
          })()}
        </div>
      )}

      {footer ? <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500 sm:px-6">{footer}</div> : null}
    </div>
  );
};

export default AdminWorkspaceList;
