const INTERACTIVE_SELECTOR = [
  "button:not(:disabled)",
  "[href]",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/** The first interactive element inside `container`, or null. */
export const getFirstInteractiveElement = (container) => {
  if (!container) return null;
  return container.querySelector(INTERACTIVE_SELECTOR);
};

/**
 * Every interactive element inside `container`, in DOM order — the flat
 * sequence a single ArrowUp/ArrowDown step moves through (e.g. a tab's
 * header button, then each row of a list it contains, treating a whole list
 * widget's own rows as part of the same sequence at this container's level).
 */
export const getInteractiveElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(INTERACTIVE_SELECTOR));
};

/**
 * Focuses the first interactive element inside `container` — the generic
 * "jump into this content" target used when a tab (or any other focus zone)
 * hands off to whatever it's showing, without needing to know its shape.
 */
const focusFirstInteractiveElement = (container) => {
  getFirstInteractiveElement(container)?.focus();
};

export default focusFirstInteractiveElement;
