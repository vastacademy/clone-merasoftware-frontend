import React, { createContext, useContext, useState } from 'react';

const DraftOrdersContext = createContext();

export const DraftOrdersProvider = ({ children }) => {
  const [draftOrders, setDraftOrders] = useState([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedForCheckout, setSelectedForCheckout] = useState([]);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const saveDraftOrder = (draftOrder) => {
    setDraftOrders((current) => {
      const existingIndex = current.findIndex((draft) => draft.draftOrderId === draftOrder.draftOrderId);
      if (existingIndex === -1) {
        return [...current, draftOrder];
      }
      const updated = [...current];
      updated[existingIndex] = draftOrder;
      return updated;
    });

    setSelectedForCheckout((current) =>
      current.includes(draftOrder.draftOrderId) ? current : [...current, draftOrder.draftOrderId]
    );
  };

  const removeDraftOrder = (draftOrderId) => {
    setDraftOrders((current) => current.filter((draft) => draft.draftOrderId !== draftOrderId));
    setSelectedForCheckout((current) => current.filter((id) => id !== draftOrderId));
  };

  const toggleCheckoutSelection = (draftOrderId) => {
    setSelectedForCheckout((current) =>
      current.includes(draftOrderId)
        ? current.filter((id) => id !== draftOrderId)
        : [...current, draftOrderId]
    );
  };

  const toggleDraftOrderFeature = (draftOrderId, featureId) => {
    setDraftOrders((current) =>
      current.map((draft) => {
        if (draft.draftOrderId !== draftOrderId) return draft;

        const isSelected = draft.selectedFeatureIds.includes(featureId);
        const selectedFeatureIds = isSelected
          ? draft.selectedFeatureIds.filter((id) => id !== featureId)
          : [...draft.selectedFeatureIds, featureId];

        const featuresPrice = (draft.availableFeatures || [])
          .filter((feature) => selectedFeatureIds.includes(feature.id))
          .reduce((sum, feature) => sum + (feature.sellingPrice || 0), 0);

        return {
          ...draft,
          selectedFeatureIds,
          price: draft.basePrice + featuresPrice + (draft.pageSelection?.extraCost || 0),
        };
      })
    );
  };

  const updateDraftOrderPageQuantity = (draftOrderId, quantity) => {
    setDraftOrders((current) =>
      current.map((draft) => {
        if (draft.draftOrderId !== draftOrderId || !draft.pageSelection) return draft;

        const clampedQuantity = Math.max(draft.totalPages || 0, quantity);
        const extraPages = Math.max(0, clampedQuantity - (draft.totalPages || 0));
        const pricePerPage = draft.pageSelection.pricePerPage || 0;
        const extraCost = extraPages * pricePerPage;

        const featuresPrice = (draft.availableFeatures || [])
          .filter((feature) => draft.selectedFeatureIds.includes(feature.id))
          .reduce((sum, feature) => sum + (feature.sellingPrice || 0), 0);

        return {
          ...draft,
          pageSelection: {
            ...draft.pageSelection,
            quantity: clampedQuantity,
            extraPages,
            extraCost,
            pricePerPage,
          },
          price: draft.basePrice + featuresPrice + extraCost,
        };
      })
    );
  };

  const clearDraftOrders = () => {
    setDraftOrders([]);
    setSelectedForCheckout([]);
  };

  return (
    <DraftOrdersContext.Provider
      value={{
        draftOrders,
        saveDraftOrder,
        removeDraftOrder,
        toggleDraftOrderFeature,
        updateDraftOrderPageQuantity,
        clearDraftOrders,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        selectedForCheckout,
        toggleCheckoutSelection,
      }}
    >
      {children}
    </DraftOrdersContext.Provider>
  );
};

export const useDraftOrders = () => {
  const context = useContext(DraftOrdersContext);
  if (!context) {
    throw new Error('useDraftOrders must be used within a DraftOrdersProvider');
  }
  return context;
};

export default DraftOrdersContext;
