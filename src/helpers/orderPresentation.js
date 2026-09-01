// Single source of truth for how a customer's project/plan order is presented
// in list rows (status badge, summary text, type label, type accent color) and
// the plan validity-days calculation those depend on. Used by CustomerDashboard.js
// and ProjectsAndPlans.js so both render identical labels/logic.

import { isProjectItem, isPlanItem } from './orderType';
import { isOrderApproved } from './orderVisibility';

// The name to show for a purchased order, in order of trustworthiness.
//
// An order must never depend on its catalog product row still existing just to
// render its own name — a plan that is retired (or was hard-deleted before that
// existed) would otherwise blank out a customer's paid purchase history. Every
// other purchase detail is already frozen on the order itself; the name is read
// the same way:
//   1. projectSnapshot.displayName — frozen client-project contract
//   2. productId.serviceName        — reusable catalogue service/legacy fallback
//   3. servicePlanSnapshot.serviceName — frozen at purchase (service plans)
//   4. orderItems[].name            — frozen purchase fallback
//
// This is a display fallback only. It never changes what was bought or charged.
export const getOrderDisplayName = (order, fallback = 'Untitled') => {
  if (!order) return fallback;
  return (
    order.projectSnapshot?.displayName ||
    order.productId?.serviceName ||
    order.servicePlanSnapshot?.serviceName ||
    (order.orderItems || []).find((item) => item.type === 'main')?.name ||
    order.orderItems?.[0]?.name ||
    fallback
  );
};

// A private client project must retain its type after its legacy catalogue
// product is detached. Service and legacy orders continue to read productId.
export const getOrderCategory = (order, fallback = '') =>
  order?.projectSnapshot?.category || order?.productId?.category || fallback;

// Remaining validity days for a plan order. Monthly plans use currentMonthExpiryDate;
// other plans derive from createdAt + validityPeriod.
export const getRemainingDays = (order) => {
  if (!order) return 0;

  if ((order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) && order.currentMonthExpiryDate) {
    const today = new Date();
    const expiryDate = new Date(order.currentMonthExpiryDate);
    return Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)));
  }

  if (!order.createdAt || !order.productId?.validityPeriod) return 0;

  const startDate = new Date(order.createdAt);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + order.productId.validityPeriod);

  return Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
};

// The engine's derived state code (backend/helpers/orderStatusEngine.js), attached to every
// order by applyOrderSummary and getOrderDetails.
export const getOrderStateCode = (order) => order?.orderState?.code;

// The states that mean "the customer still has live work here". Shared rather than written
// inline at each list, because that is precisely how three separate "active items" filters
// (CustomerDashboard, ProjectsAndPlans, OrderPage) all came to omit 'cancelled' — each excluded
// rejected and pending, and none of them was updated when cancellation was added to the system.
const ACTIVE_STATE_CODES = ['in_progress', 'approved_not_started', 'payment_due', 'plan_active'];

// Is this order live work? Plans additionally need validity left, which callers add themselves
// via getRemainingDays — that is a quantity, not a state, so it does not belong in the engine.
export const isActiveWorkItem = (order) => {
  const code = getOrderStateCode(order);
  if (code) return ACTIVE_STATE_CODES.includes(code);

  // ── fallback: payloads that predate the engine ──
  if (order?.orderVisibility === 'cancelled') return false;
  if (order?.orderVisibility === 'payment-rejected') return false;
  if (order?.orderVisibility === 'pending-approval') return false;
  if (!isOrderApproved(order)) return false;
  if (isProjectItem(order)) {
    return order.projectProgress < 100 && order.currentPhase !== 'completed';
  }
  if (isPlanItem(order)) {
    return order.planStatus !== 'closed' && Boolean(order.isActive);
  }
  return false;
};

// Maps the engine's semantic tone key onto this surface's Tailwind classes. The engine returns
// a meaning ("this is a warning"), not a colour, so each surface keeps its own palette while the
// decision about WHICH meaning applies is made in one place.
const TONE_CLASS = {
  neutral: 'bg-slate-200 text-slate-700',
  positive: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
};

// Status badge label + Tailwind tone for a project/plan/service order.
//
// The rules used to live here, duplicated (with drift) across five surfaces. They now live in
// backend/helpers/orderStatusEngine.js and arrive on the order as `orderState`, so this function
// only chooses how to paint the answer — it no longer decides what the answer is.
//
// Why the fallback below still exists: `orderState` is attached by applyOrderSummary() and
// getOrderDetails.js, which covers every list and detail feed. Anything that renders an order
// from a different payload (an older cached response, a nested `orderId` populate that only
// selects a few columns) would otherwise render "Unknown". The fallback keeps the previous
// behaviour for those cases rather than degrading them, and is deliberately minimal — the
// engine is the source of truth wherever it is present.
export const getItemStatusMeta = (order) => {
  if (!order) {
    return { label: 'Unknown', tone: 'bg-slate-100 text-slate-700' };
  }

  if (order.orderState?.label) {
    return {
      label: order.orderState.label,
      tone: TONE_CLASS[order.orderState.tone] || 'bg-slate-100 text-slate-700',
      code: order.orderState.code,
      phase: order.orderState.phase,
      phaseLabel: order.orderState.phaseLabel,
    };
  }

  // ── fallback: payloads that predate the engine ──
  if (order.orderVisibility === 'cancelled') {
    return { label: 'Cancelled', tone: TONE_CLASS.neutral };
  }
  if (order.orderVisibility === 'payment-rejected') {
    return { label: 'Payment Rejected', tone: TONE_CLASS.danger };
  }
  if (order.orderVisibility === 'pending-approval') {
    return { label: 'Approval Pending', tone: TONE_CLASS.warning };
  }

  if (isProjectItem(order)) {
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return { label: 'Completed', tone: TONE_CLASS.positive };
    }
    if (order.hasUnpaidInvoice) {
      return { label: 'Payment Pending', tone: TONE_CLASS.warning };
    }
    if (isOrderApproved(order)) {
      const progress = Math.round(order.projectProgress || 0);
      if (progress === 0) {
        return { label: 'Payment Approved', tone: TONE_CLASS.active };
      }
      return { label: `In Progress · ${progress}%`, tone: TONE_CLASS.active };
    }
  }

  if (isPlanItem(order)) {
    const isClosed =
      order.planStatus === 'closed' ||
      !order.isActive ||
      (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
        ? (order.totalYearlyDaysRemaining || 0) <= 0
        : (order.updatesUsed || 0) >= (order.productId?.updateCount || 0));

    if (isClosed) {
      return { label: 'Closed', tone: TONE_CLASS.neutral };
    }
    if (isOrderApproved(order) && getRemainingDays(order) > 0) {
      return { label: 'Active plan', tone: 'bg-violet-100 text-violet-700' };
    }
  }

  return { label: 'Processing', tone: 'bg-slate-100 text-slate-700' };
};

// Short summary text: plans show remaining days/updates, projects show progress %.
// Projects only get a progress summary once work is actually underway — while the
// order is pending (payment rejected / awaiting approval / unpaid invoice) or
// approved-but-not-started (0%), there is no meaningful progress to show, so the
// summary is empty and callers should render no badge. Pending conditions mirror
// getItemStatusMeta so the summary never contradicts the status badge.
export const getItemSummary = (order) => {
  if (isPlanItem(order)) {
    if (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) {
      return `${order.totalYearlyDaysRemaining || 0} day(s) left`;
    }

    const totalUpdates = Number(order.productId?.updateCount || 0);
    const usedUpdates = Number(order.updatesUsed || 0);
    return totalUpdates > 0 ? `${Math.max(0, totalUpdates - usedUpdates)} update(s) left` : 'Plan details available';
  }

  if (isProjectItem(order)) {
    // Derived from the same engine state the badge uses, so the summary can never contradict it.
    // Only a project genuinely underway has a meaningful progress figure: a cancelled, rejected,
    // pending or payment-due order shows nothing rather than a number the badge disagrees with.
    if (order.orderState?.code) {
      if (order.orderState.code === 'completed') return '100% complete';
      if (order.orderState.code !== 'in_progress') return '';
      return `${order.orderState.progress}% complete`;
    }

    // ── fallback: payloads that predate the engine (see getItemStatusMeta) ──
    if (order.orderVisibility === 'cancelled') return '';

    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return '100% complete';
    }

    const isPending =
      order.orderVisibility === 'payment-rejected' ||
      order.orderVisibility === 'pending-approval' ||
      order.hasUnpaidInvoice ||
      !isOrderApproved(order);

    const progress = Math.round(order?.projectProgress || 0);
    if (isPending || progress <= 0) return '';

    return `${progress}% complete`;
  }

  return '';
};

export const getItemTypeLabel = (order) => (isPlanItem(order) ? 'Plan' : 'Project');

// Type-based accent colors: emerald = project, amber = plan.
export const getItemTypeAccent = (order) =>
  isPlanItem(order)
    ? { border: 'border-l-amber-400/70', badge: 'bg-amber-500/25 text-amber-100 border border-amber-400/40' }
    : { border: 'border-l-emerald-400/70', badge: 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40' };
