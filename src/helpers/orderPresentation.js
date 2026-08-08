// Single source of truth for how a customer's project/plan order is presented
// in list rows (status badge, summary text, type label, type accent color) and
// the plan validity-days calculation those depend on. Used by CustomerDashboard.js
// and ProjectsAndPlans.js so both render identical labels/logic.

import { isProjectItem, isPlanItem } from './orderType';
import { isOrderApproved } from './orderVisibility';

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

// Status badge label + Tailwind tone for a project/plan order.
export const getItemStatusMeta = (order) => {
  if (!order) {
    return { label: 'Unknown', tone: 'bg-slate-100 text-slate-700' };
  }

  // Admin rejected the payment (nothing paid) — client must retry.
  if (order.orderVisibility === 'payment-rejected') {
    return { label: 'Payment Rejected', tone: 'bg-rose-100 text-rose-700' };
  }

  // Client paid/submitted; admin is verifying. Green so the client sees work is moving.
  if (order.orderVisibility === 'pending-approval') {
    return { label: 'Approval Pending', tone: 'bg-emerald-100 text-emerald-700' };
  }

  if (isProjectItem(order)) {
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' };
    }

    // Admin-created project whose invoice is still unpaid — client action needed.
    // Amber (not green) to signal "you must pay", distinct from Approval Pending.
    if (order.hasUnpaidInvoice) {
      return { label: 'Payment Pending', tone: 'bg-amber-100 text-amber-800' };
    }

    if (isOrderApproved(order)) {
      const progress = Math.round(order.projectProgress || 0);
      // progress 0 = payment approved but work not yet started. Show the last
      // stage that actually passed (payment approval) instead of a negative
      // "Not Started". Blue (same as In Progress), not green — work is starting,
      // not finished, so the user doesn't read it as "done".
      if (progress === 0) {
        return { label: 'Payment Approved', tone: 'bg-blue-100 text-blue-700' };
      }
      return { label: `In Progress · ${progress}%`, tone: 'bg-blue-100 text-blue-700' };
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
      return { label: 'Closed', tone: 'bg-slate-200 text-slate-700' };
    }

    if (isOrderApproved(order) && getRemainingDays(order) > 0) {
      return { label: 'Active plan', tone: 'bg-violet-100 text-violet-700' };
    }
  }

  return { label: 'Processing', tone: 'bg-slate-100 text-slate-700' };
};

// Short summary text: plans show remaining days/updates, projects show progress %.
export const getItemSummary = (order) => {
  if (isPlanItem(order)) {
    if (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan) {
      return `${order.totalYearlyDaysRemaining || 0} day(s) left`;
    }

    const totalUpdates = Number(order.productId?.updateCount || 0);
    const usedUpdates = Number(order.updatesUsed || 0);
    return totalUpdates > 0 ? `${Math.max(0, totalUpdates - usedUpdates)} update(s) left` : 'Plan details available';
  }

  return `${Math.round(order?.projectProgress || 0)}% complete`;
};

export const getItemTypeLabel = (order) => (isPlanItem(order) ? 'Plan' : 'Project');

// Type-based accent colors: emerald = project, amber = plan.
export const getItemTypeAccent = (order) =>
  isPlanItem(order)
    ? { border: 'border-l-amber-400/70', badge: 'bg-amber-500/25 text-amber-100 border border-amber-400/40' }
    : { border: 'border-l-emerald-400/70', badge: 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40' };
