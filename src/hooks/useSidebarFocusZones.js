import { useEffect, useRef } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
};

/**
 * Ctrl+Left / Ctrl+Right focus-zone switching for `AdminLayout.js`.
 *
 * Ctrl+Left focuses the sidebar (the currently active route's link, or the
 * first navigable link), Ctrl+Right focuses back into the main content area.
 * Desktop-only (`lg`, matching the sidebar's own `lg:flex` breakpoint) — on
 * narrower screens the sidebar is hidden, so the shortcut is a no-op there.
 *
 * Skipped while typing in a field or while a Modal (`role="dialog"`) is open,
 * so it never fights native cursor movement or steals focus out of a dialog.
 *
 * Returns `{ sidebarRef, mainRef, navRefs }` — the caller attaches
 * `sidebarRef`/`mainRef` to the `<aside>`/`<main>` elements and pushes each
 * navigable sidebar link's ref into `navRefs.current`.
 */
const useSidebarFocusZones = () => {
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const navRefs = useRef([]);

  // `sidebarContent` is shared markup rendered into both the desktop <aside>
  // and the mobile drawer, so navRefs can briefly hold both copies' elements
  // when the drawer is open. Only elements the browser actually considers
  // focusable (i.e. not the closed/off-screen copy) should ever be targeted.
  const visibleNavRefs = () => navRefs.current.filter((el) => el && el.offsetParent !== null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!event.ctrlKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      if (!window.matchMedia(DESKTOP_QUERY).matches) return;
      if (isTypingTarget(document.activeElement)) return;
      if (document.querySelector('[role="dialog"]')) return;

      if (event.key === "ArrowLeft") {
        const visible = visibleNavRefs();
        const activeLink = visible.find((el) => el.getAttribute("aria-current") === "page");
        const target = activeLink || visible[0];
        if (!target) return;
        event.preventDefault();
        target.focus();
      } else {
        if (!mainRef.current) return;
        event.preventDefault();
        mainRef.current.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSidebarKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const visible = visibleNavRefs();
    const currentIndex = visible.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
    visible[nextIndex]?.focus();
  };

  return { sidebarRef, mainRef, navRefs, handleSidebarKeyDown };
};

export default useSidebarFocusZones;
