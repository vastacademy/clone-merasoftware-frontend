import React from 'react';
import { CheckCircle2, CircleDot, Play, Flag, XCircle, RotateCcw, Sparkles } from 'lucide-react';

// Renders an order's lifecycle history — when it was approved, when work began, when it finished,
// when it was cancelled — from the `lifecycleTimeline` the order-details endpoint returns
// (built by backend/helpers/orderLifecycleLog.js).
//
// Until that log existed the order carried only its CURRENT state; apart from cancellation there
// was no record of when it got there, and updatedAt could not answer it because any later edit
// overwrites it. This is the surface that makes that history visible.
//
// Two things it deliberately shows rather than hides:
//   - Entries reconstructed by the backfill script are marked "estimated". A date derived from a
//     payment record is good enough to be useful and not good enough to present as observed, and
//     the reader is the one who should decide which.
//   - Nothing is invented for gaps. An order with no work_started entry never passed 0%, and the
//     timeline simply has no such row — it does not show a guessed date.

const EVENT_META = {
  created: {
    label: 'Order created',
    Icon: Sparkles,
    tone: { light: 'text-slate-600 bg-slate-100', dark: 'text-slate-300 bg-white/10' },
  },
  approved: {
    label: 'Payment approved',
    Icon: CheckCircle2,
    tone: { light: 'text-emerald-700 bg-emerald-100', dark: 'text-emerald-300 bg-emerald-500/15' },
  },
  work_started: {
    label: 'Work started',
    Icon: Play,
    tone: { light: 'text-blue-700 bg-blue-100', dark: 'text-blue-300 bg-blue-500/15' },
  },
  completed: {
    label: 'Project completed',
    Icon: Flag,
    tone: { light: 'text-emerald-700 bg-emerald-100', dark: 'text-emerald-300 bg-emerald-500/15' },
  },
  reopened: {
    label: 'Reopened',
    Icon: RotateCcw,
    tone: { light: 'text-amber-700 bg-amber-100', dark: 'text-amber-300 bg-amber-500/15' },
  },
  rejected: {
    label: 'Payment rejected',
    Icon: XCircle,
    tone: { light: 'text-rose-700 bg-rose-100', dark: 'text-rose-300 bg-rose-500/15' },
  },
  cancelled: {
    label: 'Project cancelled',
    Icon: XCircle,
    tone: { light: 'text-slate-700 bg-slate-200', dark: 'text-slate-300 bg-white/10' },
  },
};

const FALLBACK_META = {
  label: 'Update',
  Icon: CircleDot,
  tone: { light: 'text-slate-600 bg-slate-100', dark: 'text-slate-300 bg-white/10' },
};

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

// `dark` selects the palette so this component drops into both the light customer page and the
// dark admin surfaces without either having to restyle it.
const OrderLifecycleTimeline = ({ timeline = [], dark = false, className = '' }) => {
  const entries = Array.isArray(timeline) ? timeline : [];

  if (!entries.length) {
    return (
      <p className={dark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
        No lifecycle history recorded for this order yet.
      </p>
    );
  }

  return (
    <ol className={`relative space-y-0 ${className}`}>
      {entries.map((entry, index) => {
        const meta = EVENT_META[entry.eventType] || FALLBACK_META;
        const { Icon } = meta;
        const tone = dark ? meta.tone.dark : meta.tone.light;
        const isLast = index === entries.length - 1;
        // Reconstructed after the fact rather than observed when it happened — see the header.
        const isEstimated = entry.actorType === 'backfill';

        return (
          <li key={`${entry.eventType}-${entry.occurredAt}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Connector line, stopped short on the final entry so the rail does not dangle */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className={`absolute left-[13px] top-7 bottom-0 w-px ${dark ? 'bg-white/10' : 'bg-slate-200'}`}
              />
            ) : null}

            <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon size={15} />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className={dark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-black'}>
                  {meta.label}
                </span>
                {typeof entry.progressAtEvent === 'number' && entry.eventType === 'work_started' ? (
                  <span className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
                    at {entry.progressAtEvent}%
                  </span>
                ) : null}
                {isEstimated ? (
                  <span
                    title={entry.derivedFrom ? `Reconstructed from: ${entry.derivedFrom}` : 'Reconstructed from earlier records'}
                    className={
                      dark
                        ? 'rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'
                    }
                  >
                    estimated
                  </span>
                ) : null}
              </div>

              <p className={dark ? 'mt-0.5 text-xs text-slate-400' : 'mt-0.5 text-xs text-slate-500'}>
                {formatWhen(entry.occurredAt)}
              </p>

              {entry.reason ? (
                <p className={dark ? 'mt-1 text-xs text-slate-300' : 'mt-1 text-xs text-slate-600'}>
                  {entry.reason}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderLifecycleTimeline;
