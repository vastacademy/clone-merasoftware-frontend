import React from 'react';
import { Keyboard } from 'lucide-react';

/**
 * Keyboard-shortcut hint pill for a form field. Hidden by default; appears
 * only while its field has focus, via Tailwind's `peer-focus` (the field
 * itself must carry the `peer` class, and this must render immediately
 * after it in the DOM).
 */
const KeyboardHint = ({ id, hint, className = '' }) => (
  <p
    id={id}
    className={[
      'mt-1.5 hidden w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 peer-focus:flex peer-focus-within:flex',
      className,
    ].filter(Boolean).join(' ')}
  >
    <Keyboard size={12} className="shrink-0" />
    {hint}
  </p>
);

export default KeyboardHint;
