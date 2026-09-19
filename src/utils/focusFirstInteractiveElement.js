const INTERACTIVE_SELECTOR = [
  "button:not(:disabled)",
  "[href]",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Focuses the first interactive element inside `container` — the generic
 * "jump into this content" target used when a tab (or any other focus zone)
 * hands off to whatever it's showing, without needing to know its shape.
 */
const focusFirstInteractiveElement = (container) => {
  if (!container) return;
  const target = container.querySelector(INTERACTIVE_SELECTOR);
  target?.focus();
};

export default focusFirstInteractiveElement;
