import React from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useDraftOrders } from '../context/DraftOrdersContext';
import DraftOrderCard, { formatPrice } from './DraftOrderCard';

const DraftOrderSavedDrawer = () => {
  const {
    draftOrders,
    removeDraftOrder,
    toggleDraftOrderFeature,
    updateDraftOrderPageQuantity,
    clearDraftOrders,
    isCartDrawerOpen,
    closeCartDrawer,
    selectedForCheckout,
    toggleCheckoutSelection,
  } = useDraftOrders();

  if (!isCartDrawerOpen) return null;

  const onClose = closeCartDrawer;

  const projectDrafts = draftOrders.filter((draft) => draft.type === 'project');
  const planDrafts = draftOrders.filter((draft) => draft.type === 'service_plan');

  const selectedDrafts = draftOrders.filter((draft) => selectedForCheckout.includes(draft.draftOrderId));
  const selectedTotal = selectedDrafts.reduce((sum, draft) => sum + draft.price, 0);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="modal-backdrop fixed inset-0" onClick={onClose} />

      <div className="portal-surface fixed inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[var(--glass-bg-strong)] backdrop-blur-2xl" />
        <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[var(--text-primary)]" />
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              Your Cart ({draftOrders.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {draftOrders.length === 0 ? (
            <p className="text-center text-base text-[var(--text-secondary)]">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {projectDrafts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Projects</p>
                  <div className="mt-3 space-y-3">
                    {projectDrafts.map((draft) => (
                      <DraftOrderCard
                        key={draft.draftOrderId}
                        draft={draft}
                        onRemove={removeDraftOrder}
                        onToggleFeature={toggleDraftOrderFeature}
                        onUpdatePageQuantity={updateDraftOrderPageQuantity}
                        isSelectedForCheckout={selectedForCheckout.includes(draft.draftOrderId)}
                        onToggleCheckoutSelection={toggleCheckoutSelection}
                      />
                    ))}
                  </div>
                </div>
              )}

              {planDrafts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Service Plans</p>
                  <div className="mt-3 space-y-3">
                    {planDrafts.map((draft) => (
                      <DraftOrderCard
                        key={draft.draftOrderId}
                        draft={draft}
                        onRemove={removeDraftOrder}
                        onToggleFeature={toggleDraftOrderFeature}
                        onUpdatePageQuantity={updateDraftOrderPageQuantity}
                        isSelectedForCheckout={selectedForCheckout.includes(draft.draftOrderId)}
                        onToggleCheckoutSelection={toggleCheckoutSelection}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {draftOrders.length > 0 && (
          <div className="space-y-3 border-t border-[var(--divider)] px-6 py-6">
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedDrafts.length > 0
                  ? `${selectedDrafts.length} item${selectedDrafts.length === 1 ? '' : 's'} selected — Total: ${formatPrice(selectedTotal)}`
                  : 'Select items to pay'}
              </p>
              <button
                type="button"
                onClick={() => {}}
                disabled={selectedDrafts.length === 0}
                className="mt-2 w-full rounded-xl bg-[rgb(var(--ink-rgb))] px-4 py-2.5 text-sm font-semibold text-[var(--page-bg)] transition hover:bg-[rgb(var(--ink-rgb)/0.85)] disabled:cursor-not-allowed disabled:bg-[var(--glass-bg-subtle)] disabled:text-[var(--text-muted)]"
              >
                Pay Now
              </button>
            </div>
            <button
              type="button"
              onClick={clearDraftOrders}
              className="glass-panel w-full rounded-2xl px-4 py-3.5 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--glass-bg-hover)]"
            >
              Clear Cart
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default DraftOrderSavedDrawer;
