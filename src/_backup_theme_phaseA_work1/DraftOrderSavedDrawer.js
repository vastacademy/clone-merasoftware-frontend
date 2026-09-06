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
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-semibold text-black">
              Your Cart ({draftOrders.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {draftOrders.length === 0 ? (
            <p className="text-center text-base text-black">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {projectDrafts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-black">Projects</p>
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
                  <p className="text-sm font-semibold text-black">Service Plans</p>
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
          <div className="space-y-3 border-t border-slate-100 px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-black">
                {selectedDrafts.length > 0
                  ? `${selectedDrafts.length} item${selectedDrafts.length === 1 ? '' : 's'} selected — Total: ${formatPrice(selectedTotal)}`
                  : 'Select items to pay'}
              </p>
              <button
                type="button"
                onClick={() => {}}
                disabled={selectedDrafts.length === 0}
                className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Pay Now
              </button>
            </div>
            <button
              type="button"
              onClick={clearDraftOrders}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-black transition hover:bg-slate-50"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftOrderSavedDrawer;
