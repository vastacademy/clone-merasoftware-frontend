import React from 'react';

/**
 * The portal's card. Fill, border, shadow, corner, padding and the top sheen —
 * all of it decided here.
 *
 * WHY THIS EXISTS
 * `.glass-panel` already existed and was used 11 times, against 267 hand-written
 * glass cards across the 22 portal pages. It lost because it only gave fill,
 * border and shadow — every caller still had to pick a corner and a padding, so
 * writing the whole card inline was barely more work than adopting it. The
 * result was 12 different radii in the portal (`rounded-[1.35rem]` and
 * `rounded-[1.2rem]` appear exactly once each, which is what eyeballing a number
 * looks like) and 4 different blurs.
 *
 * So this component settles fill, border, shadow and corner — the four that
 * were being re-decided per card.
 *
 * PADDING IS OPT-IN, NOT DEFAULT
 * An earlier draft of this file defaulted to `p-6 sm:p-7`, on the assumption
 * that a missing padding was why `.glass-panel` went unused. Counting the real
 * cards disproved that: of the 121 card-shaped glass sites in the portal, 80
 * carry no `p-*` at all — their padding lives on inner rows, because the card
 * has a header strip or a divided body that must run edge to edge. Defaulting
 * to padded would force `size="flush"` on two thirds of all migrations, which
 * is the wrong way round. So `flush` is the default and padding is asked for.
 *
 * LIGHT MODE HAS NO BLUR, ON PURPOSE
 * Blur frosts what is behind it. Dark and immersive have BG.png back there, so
 * it does real work. Light sets `--page-decoration: none` over a flat #e8edf3 —
 * blurring a flat colour returns that same flat colour, so the 112 backdrop-blur
 * sites in the portal were paying for compositing and getting nothing. Depth in
 * light comes from `--glass-border` (1.5px there vs 1px) and the two-layer
 * `--card-shadow` instead. index.css sets `--surface-blur: none` for light; this
 * component does not branch on theme.
 *
 * ADMIN SAFETY
 * A new component the admin panel does not import. Opt-in by construction.
 */

const TONES = {
  base: 'surface',
  subtle: 'surface surface-subtle',
  strong: 'surface surface-strong',
  // Stat tiles: a lighter fill than a card so the page reads through, with an
  // opaque border. Values are per-theme tokens (--metric-*).
  metric: 'surface surface-metric',
};

// `p-5 sm:p-7` matches the recharge panel the portal already treats as its
// reference dialog; `p-4` covers the small stat tiles.
const SIZES = {
  flush: '',
  card: 'p-5 sm:p-7',
  compact: 'p-4',
};

// `card` is the small/medium card (1rem). `panel` is the full-width section or
// list card, which the portal has always drawn with a larger corner.
const RADII = {
  card: '',
  sm: 'surface-sm',
  panel: 'surface-panel',
  lg: 'surface-lg',
  pill: 'surface-pill',
};

const Surface = ({
  tone = 'base',
  size = 'flush',
  radius = 'card',
  sheen = false,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) => {
  const body = (
    <Tag
      className={[
        TONES[tone] || TONES.base,
        RADII[radius] || RADII.card,
        SIZES[size] ?? SIZES.flush,
        // The sheen is absolutely positioned, so it needs a stacking context
        // and a clip. Only pay for those when there is a sheen to clip.
        sheen ? 'relative overflow-hidden' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {/* Two constraints meet here.
          (1) The sheen cannot wrap the children: callers make the Surface
              itself a flex/grid container (Modal stacks header, scrolling body
              and footer in one), and a wrapper would collapse those into a
              single flex child.
          (2) It cannot sit behind them with a negative z-index either — the
              Surface paints its own background-color, and a negative index in
              its stacking context renders *under* that fill, hiding the sheen.
          So it is a normal-flow sibling that comes first and is lifted out of
          flow by `absolute`; later siblings paint over it. Children need no
          z-index of their own. */}
      {sheen && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[var(--glass-sheen)] to-transparent" />
      )}
      {children}
    </Tag>
  );

  return body;
};

export default Surface;
