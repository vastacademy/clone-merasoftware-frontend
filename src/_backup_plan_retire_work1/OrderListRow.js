import React from 'react';
import { ArrowRight, Layers3, LayoutGrid } from 'lucide-react';
import { isProjectItem, isPlanItem } from '../helpers/orderType';
import {
  getItemStatusMeta,
  getItemSummary,
  getItemTypeLabel,
  getItemTypeAccent,
} from '../helpers/orderPresentation';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Single source of truth for the project/plan list layout, shared by
// CustomerDashboard.js (recent list) and ProjectsAndPlans.js (full list).
// The ProjectsAndPlans layout is the canonical one.

export const OrderListHeader = () => (
  <div className="relative grid grid-cols-12 gap-3 border-b border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase text-slate-300 sm:px-6">
    <div className="col-span-12 lg:col-span-5">Item</div>
    <div className="col-span-6 lg:col-span-2">Type</div>
    <div className="col-span-6 lg:col-span-2">Status</div>
    <div className="col-span-6 lg:col-span-2">Updated</div>
    <div className="col-span-6 lg:col-span-1 text-right">Open</div>
  </div>
);

const OrderListRow = ({ order, index = 0, onClick }) => {
  const status = getItemStatusMeta(order);
  const isProject = isProjectItem(order);
  const isPlan = isPlanItem(order);
  const accent = getItemTypeAccent(order);
  const summary = getItemSummary(order);
  const category = order.productId?.category?.split('_').join(' ') || 'Unknown type';
  const currentValue = isPlan
    ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan
      ? `${order.totalYearlyDaysRemaining || 0} day(s) left`
      : `${Math.max(0, Number(order.productId?.updateCount || 0) - Number(order.updatesUsed || 0))} update(s) left`)
    : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(order)}
      className={[
        'grid w-full grid-cols-12 gap-3 border-l-4 px-5 py-4 text-left transition hover:bg-white/[0.1] sm:px-6',
        accent.border,
        index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]',
      ].join(' ')}
    >
      <div className="col-span-12 lg:col-span-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
            {isProject ? <LayoutGrid className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-sm font-semibold uppercase ${accent.badge}`}>
                {getItemTypeLabel(order)}
              </span>
              {summary && (
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-sm font-semibold uppercase text-slate-200">
                  {summary}
                </span>
              )}
            </div>
            <h3 className="mt-2 truncate text-lg font-semibold text-white">
              {/* orderItems[] snapshots the purchased name on the order itself, so a retired
                  (deleted) plan template still shows what the customer actually bought instead
                  of collapsing to 'Untitled'. productId is read first: unchanged while it exists. */}
              {order.productId?.serviceName ||
                (order.orderItems || []).find((item) => item.type === 'main')?.name ||
                order.orderItems?.[0]?.name ||
                'Untitled'}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-300">{category}</p>
            <p className="mt-2 text-sm text-slate-300 sm:hidden">
              Updated {formatDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{isPlan ? 'Plan' : 'Project'}</p>
          <p className="text-sm text-slate-300">
            {isPlan ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan ? 'Monthly' : 'Update based') : 'Work item'}
          </p>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>
          {status.label}
        </span>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{formatDate(order.updatedAt || order.createdAt)}</p>
          {isPlan && <p className="text-sm text-slate-300">{currentValue}</p>}
        </div>
      </div>

      <div className="col-span-6 flex items-center justify-end lg:col-span-1">
        <div className="hidden text-right lg:block">
          {isPlan && (
            <p className="text-sm text-slate-300">
              {currentValue}
            </p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  );
};

export default OrderListRow;
