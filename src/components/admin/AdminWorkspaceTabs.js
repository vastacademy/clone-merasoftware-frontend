import React, { useRef } from "react";

/**
 * Shared workspace tab strip (ARIA Tabs pattern) with roving-tabindex keyboard
 * navigation:
 *
 * - ArrowRight/ArrowLeft move focus + selection between tabs, wrapping at the
 *   ends — "automatic activation", matching this component's own onClick
 *   behavior (arrowing to a tab switches to it immediately, it doesn't just
 *   preview it).
 * - ArrowDown/Enter on a focused tab hands off to `onEnterContent` (if given)
 *   so the caller can move focus into that tab's own content — e.g. its
 *   first field or list row. Optional: callers that don't pass it just don't
 *   get that handoff, tab switching still works.
 *
 * Forwards the active tab's trigger `<button>` via `ref` (same convention as
 * `KeyboardSelect`) — a caller can `.focus()` it to jump back up into the
 * tab strip, e.g. on ArrowUp from the top of the tab's content.
 */
const AdminWorkspaceTabs = React.forwardRef(({ tabs, activeTab, onChange, onEnterContent, ariaLabel = "Workspace sections" }, ref) => {
  const tabRefs = useRef([]);
  tabRefs.current = [];
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const registerTabRef = (el) => {
    if (el) tabRefs.current.push(el);
  };

  React.useImperativeHandle(ref, () => tabRefs.current[activeIndex] || null);

  const handleKeyDown = (event) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex === -1) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const nextIndex = event.key === "ArrowRight"
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
      onChange(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter") {
      if (!onEnterContent) return;
      event.preventDefault();
      onEnterContent();
    }
  };

  return (
    <div className="border-b border-slate-200 px-5 sm:px-6">
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="flex gap-6 overflow-x-auto"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={registerTabRef}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={[
                "relative -mb-px inline-flex shrink-0 cursor-pointer items-center justify-center border-b-2 px-1 py-4 text-sm font-semibold outline-none transition",
                "focus-visible:rounded-t-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                isActive
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900",
              ].join(" ")}
              onClick={() => {
                onChange(tab.id);
                tabRefs.current[index]?.focus();
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default AdminWorkspaceTabs;
