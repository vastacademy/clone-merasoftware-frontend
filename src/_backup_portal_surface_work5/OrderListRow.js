import React from 'react';
import { ArrowRight, Layers3, LayoutGrid } from 'lucide-react';
import Badge from './Badge';
import Surface from './Surface';
import { isProjectItem, isPlanItem } from '../helpers/orderType';
import {
  getItemStatusMeta,
  getItemSummary,
  getItemTypeLabel,
  getItemTypeAccent,
  getOrderCategory,
  getOrderDisplayName,
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
  <div className="relative grid grid-cols-12 gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-5 py-3 text-sm font-semibold uppercase text-[var(--text-secondary)] sm:px-6">
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
  const category = getOrderCategory(order, 'Unknown type').split('_').join(' ');
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
        'grid w-full grid-cols-12 gap-3 border-l-4 px-5 py-4 text-left transition hover:bg-[var(--glass-bg-hover)] sm:px-6',
        accent.border,
        index % 2 === 0 ? 'bg-[var(--glass-bg-subtle)]' : 'bg-[var(--glass-bg-subtle)]',
      ].join(' ')}
    >
      <div className="col-span-12 lg:col-span-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[length:var(--glass-border-width)] border-[var(--glass-border-strong)] bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-md">
            {isProject ? <LayoutGrid className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={accent.badge} className="uppercase">
                {getItemTypeLabel(order)}
              </Badge>
              {summary && (
                <Badge tone="neutral" className="uppercase">
                  {summary}
                </Badge>
              )}
            </div>
            <h3 className="mt-2 truncate text-lg font-semibold text-[var(--text-primary)]">
              {/* Shared SSOT: productId while it exists, else the name frozen on the order
                  itself, so a retired or deleted plan never blanks a purchase history row. */}
              {getOrderDisplayName(order)}
            </h3>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{category}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:hidden">
              Updated {formatDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--text-primary)]">{isPlan ? 'Plan' : 'Project'}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {isPlan ? (order.productId?.isMonthlyRenewablePlan || order.productId?.isMonthlyLimitedPlan ? 'Monthly' : 'Update based') : 'Work item'}
          </p>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <Badge tone={status.tone} className="w-fit">
          {status.label}
        </Badge>
      </div>

      <div className="col-span-6 lg:col-span-2 lg:flex lg:items-center">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--text-primary)]">{formatDate(order.updatedAt || order.createdAt)}</p>
          {isPlan && <p className="text-sm text-[var(--text-secondary)]">{currentValue}</p>}
        </div>
      </div>

      <div className="col-span-6 flex items-center justify-end lg:col-span-1">
        <div className="hidden text-right lg:block">
          {isPlan && (
            <p className="text-sm text-[var(--text-secondary)]">
              {currentValue}
            </p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--text-muted)]" />
      </div>
    </button>
  );
};

// The whole list panel — frame, title bar, column header, rows, empty state.
//
// WHY THIS EXISTS
// The rows were already shared, but everything around them was written twice.
// CustomerDashboard and ProjectsAndPlans each had their own panel, their own
// title bar, their own divide wrapper and their own empty state, so the two
// drifted on the frame while agreeing on the rows: at one point the dashboard
// list and the projects list had different corners, and the pages had to be
// compared side by side to notice. A "recent projects" list is the projects
// list with fewer rows; it should not be a second implementation of it.
//
// What stays per-page is what genuinely differs: the heading, the controls in
// the title bar, and the empty state. Everything structural comes from here.
export const OrderList = ({
  title,
  icon: Icon = Layers3,
  actions,
  toolbar,
  items = [],
  onOpen,
  loading = false,
  loadingLabel = 'Loading...',
  emptyIcon: EmptyIcon,
  empty,
  // ProjectsAndPlans animates its panel in on mount and the dashboard does not,
  // so the wrapper element stays the caller's choice rather than being baked in.
  as,
  className = '',
  ...rest
}) => (
  <Surface as={as} radius="panel" sheen className={`overflow-hidden ${className}`} {...rest}>
    <div className="relative flex flex-col gap-3 border-b border-[var(--glass-border)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
      <h2 className="flex items-center text-xl font-semibold text-[var(--text-primary)]">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h2>
      {toolbar}
      {actions && <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>

    {loading ? (
      <div className="relative px-5 py-10 text-center text-base text-[var(--text-secondary)] sm:px-6">{loadingLabel}</div>
    ) : items.length > 0 ? (
      <>
        <OrderListHeader />
        <div className="relative divide-y divide-[var(--divider)]">
          {items.map((order, index) => (
            <OrderListRow key={order._id} order={order} index={index} onClick={onOpen} />
          ))}
        </div>
      </>
    ) : (
      <div className="relative px-5 py-12 text-center sm:px-6">
        {/* The round glass tile above an empty state is written out 11 times
            across the portal, always at h-14 w-14. Passing the icon is enough. */}
        {EmptyIcon && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[length:var(--glass-border-width)] border-[var(--glass-border-strong)] bg-[var(--glass-bg)] text-[var(--text-primary)]">
            <EmptyIcon className="h-6 w-6" />
          </div>
        )}
        {empty}
      </div>
    )}
  </Surface>
);

export default OrderListRow;
