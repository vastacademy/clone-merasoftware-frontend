import React from 'react';

/**
 * The portal's status pill.
 *
 * WHY THIS EXISTS
 * `PaymentStatusChip` was the only shared badge and it was used twice, against
 * 81 inline pills. Because each one was written by hand, the same mistake got
 * written 25 times: a light tinted fill with same-hue text of a similar
 * lightness — `bg-emerald-50 text-emerald-700` and friends (12 emerald, 8 amber,
 * 5 red). On the light page that pairing has almost no contrast. It is the same
 * bug the sidebar badge had.
 *
 * Passing a `tone` instead of classes makes that unwritable: fill, foreground
 * and border are one token triple in index.css, and the light theme inverts the
 * foreground to a dark shade (emerald-700 / amber-700 / red-700) rather than
 * reusing the dark theme's light one.
 *
 * COLOUR HAS TO MEAN SOMETHING
 * Four tones, no more. `success` is for something that finished or is healthy —
 * not for decoration. The portal currently paints `SERVICES` and `TOTAL ADDED`
 * green, which are neither, and that is why five green pills on one screen stop
 * registering. Anything that is not a status takes `neutral`.
 *
 * ADMIN SAFETY
 * New component; the admin panel does not import it. Admin's own STATUS_STYLES
 * maps are untouched.
 */

const TONES = {
  success: 'badge-success',
  pending: 'badge-pending',
  error: 'badge-error',
  neutral: 'badge-neutral',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
};

const ICON_SIZE = { sm: 12, md: 13 };

const Badge = ({
  tone = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
  children,
  ...rest
}) => (
  <span
    className={[
      'badge inline-flex items-center font-semibold',
      TONES[tone] || TONES.neutral,
      SIZES[size] || SIZES.md,
      className,
    ].filter(Boolean).join(' ')}
    {...rest}
  >
    {Icon && <Icon size={ICON_SIZE[size] || ICON_SIZE.md} className="shrink-0" />}
    {children}
  </span>
);

export default Badge;
