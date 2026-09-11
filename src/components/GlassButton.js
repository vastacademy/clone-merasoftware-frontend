import React from 'react';

/**
 * The portal's secondary button — the glass pill used for "Refresh",
 * "View all orders", counters and other non-primary actions.
 *
 * WHY THIS EXISTS
 * There are 27 of these written out by hand across the portal, in eight
 * different paddings (px-5 py-3, px-4 py-3, px-4 py-2.5, px-4 py-1.5, …). The
 * dashboard and the projects page each had their own Refresh button sitting in
 * the same list header, and they disagreed on padding, border syntax and hover
 * colour at once:
 *
 *   dashboard: border-[length:var(--glass-border-width)] … py-2.5  hover:bg-[var(--glass-bg-hover)]
 *   projects:  border                                    … py-3    hover:bg-[var(--glass-bg-strong)]
 *
 * Same button, same row, two implementations. `hover` is the one that matters:
 * --glass-bg-strong is a fill level, not a hover state, so half of these got
 * brighter on hover and the other half changed weight.
 *
 * `as` lets a Link or a plain div use it — several of these are counters, not
 * buttons, and a div must not become a <button>.
 *
 * `variant="primary"` is the same button in its filled form — the inverted-ink
 * fill used for the one real action on a screen. It lives here rather than in a
 * second component because the two only differ by fill: same shape, same sizes,
 * same `as` behaviour. There are 7 of those written by hand, in 5 paddings.
 *
 * ADMIN SAFETY
 * New component; the admin panel does not import it.
 */

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const VARIANTS = {
  glass: 'border-[length:var(--glass-border-width)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]',
  primary: 'border-[length:var(--glass-border-width)] border-transparent bg-[rgb(var(--ink-rgb))] text-[var(--page-bg)] hover:bg-[rgb(var(--ink-rgb)/0.85)]',
};

const GlassButton = ({
  as: Tag = 'button',
  size = 'md',
  variant = 'glass',
  strong = false,
  className = '',
  children,
  ...rest
}) => (
  <Tag
    className={[
      'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition',
      VARIANTS[variant] || VARIANTS.glass,
      // The border colour only applies to the glass variant; primary sets its
      // own transparent one above so the two keep an identical box size.
      variant === 'glass' && (strong ? 'border-[var(--glass-border-strong)]' : 'border-[var(--glass-border)]'),
      SIZES[size] || SIZES.md,
      className,
    ].filter(Boolean).join(' ')}
    {...(Tag === 'button' ? { type: rest.type || 'button' } : {})}
    {...rest}
  >
    {children}
  </Tag>
);

export default GlassButton;
