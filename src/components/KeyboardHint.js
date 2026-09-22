import React from 'react';
import { Keyboard } from 'lucide-react';

/**
 * Keyboard-shortcut hint pill for a form field. Hidden by default; appears
 * only while its field has focus, via Tailwind's `peer-focus` (the field
 * itself must carry the `peer` class, and this must render immediately
 * after it in the DOM).
 *
 * Layout note: the pill must never change the height of the form while it
 * appears and disappears. It used to toggle `hidden` -> `flex`, which takes
 * the pill in and out of layout: pressing the mouse on a button below a
 * focused field blurred that field, the pill collapsed, everything beneath it
 * jumped up, and `mouseup` landed off the button — the browser then produced
 * no click at all and the first click appeared to do nothing.
 *
 * So this element stays a peer sibling of the field (`peer-focus` compiles to
 * `.peer:focus ~ .peer-focus\:*`, so it must remain a sibling, never nested),
 * but takes no height of its own: it is `h-0` and positions the pill inside
 * itself via `relative`. No page has to add positioning to the wrapper, and
 * the pill is `pointer-events-none` so it can never intercept a click either.
 */
const KeyboardHint = ({ id, hint, className = '' }) => (
  <span
    aria-hidden="true"
    className={[
      'pointer-events-none relative block h-0 opacity-0 transition-opacity duration-150',
      'peer-focus:opacity-100 peer-focus-within:opacity-100',
      className,
    ].filter(Boolean).join(' ')}
  >
    <span
      id={id}
      className="absolute left-0 top-0 mt-1.5 flex w-max items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
    >
      <Keyboard size={12} className="shrink-0" />
      {hint}
    </span>
  </span>
);

export default KeyboardHint;
