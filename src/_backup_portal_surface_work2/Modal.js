import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Surface from './Surface';

/**
 * The portal's dialog shell.
 *
 * WHY THIS EXISTS
 * A popup is the most-looked-at card in the product — it sits centred with
 * everything else pushed behind it. The portal's popups were the least
 * maintained surface in it. Of the 10 customer-facing modals, 8 referenced no
 * theme token at all; they were built from `bg-white`, `bg-gray-50` and a
 * `bg-blue-600` header bar:
 *
 *   <div className="fixed inset-0 bg-black bg-opacity-50 ...">
 *     <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
 *       <div className="bg-blue-600 text-white px-6 py-4 ...">
 *
 * Three defects in three lines: `bg-white` is a lit slab in dark mode because it
 * ignores the theme; the blue header contradicts the portal's palette, which is
 * emerald/amber/red with no blue; and `rounded-lg` (8px) against the pages'
 * 16-24px corner makes the dialog look bolted on. Fixing pages while leaving
 * these would have made the mismatch *more* obvious, not less.
 *
 * The backdrop was inconsistent too — four different shells existed
 * (`bg-black/10`, `bg-black/50`, `--scrim` with blur, `--scrim` without). The
 * `bg-black/10` one is barely a dim at all.
 *
 * WHY NOT `--scrim`
 * `--scrim` darkens the BG.png decoration behind page content, so it is
 * `transparent` in dark and light, which have no decoration. A dialog backdrop
 * built on it would be invisible in two themes out of three. `--backdrop-bg` is
 * a separate token that is opaque everywhere, and it keeps its blur in light
 * mode — unlike a card, what sits behind it is real page content.
 *
 * The panel is a `Surface`, so a dialog and a page card are literally the same
 * object and cannot drift apart again.
 *
 * ADMIN SAFETY
 * New component. The admin modals (AddAdminModal, AddCustomerModal, …) are
 * separate files and are not touched.
 */

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

const Modal = ({
  open = true,
  onClose,
  title,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  children,
  className = '',
}) => {
  // Escape-to-close and background scroll lock: neither existed on any of the
  // portal's modals, so both are added once here rather than 10 times.
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
      role="presentation"
    >
      <Surface
        tone="strong"
        size="flush"
        sheen
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        // Full-width sheet on phones, centred card from `sm` up — the one
        // in-page modal that already did this was the only mobile-usable dialog
        // in the portal.
        className={`flex max-h-[90vh] w-full flex-col ${SIZES[size] || SIZES.md} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--divider)] px-6 py-4">
            {title && (
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 shrink-0 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-[var(--divider)] px-6 py-4">{footer}</div>
        )}
      </Surface>
    </div>
  );
};

export default Modal;
