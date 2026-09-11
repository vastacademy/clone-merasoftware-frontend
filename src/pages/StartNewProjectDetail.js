import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardLayout from '../components/DashboardLayout';
import ProjectDetailView from '../components/ProjectDetailView';
import Surface from '../components/Surface';
import GlassButton from '../components/GlassButton';
import SummaryApi from '../common';
import { useDraftOrders } from '../context/DraftOrdersContext';
import { goToCustomerReturn } from '../helpers/customerReturnNavigation';

const StartNewProjectDetail = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { saveDraftOrder, openCartDrawer } = useDraftOrders();
  const [project, setProject] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const response = await fetch(SummaryApi.productDetails.url, {
        method: SummaryApi.productDetails.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: projectId }),
      });
      const dataResponse = await response.json();
      setProject(dataResponse?.data || null);
      setLoaded(true);
    };
    fetchProduct();
  }, [projectId]);

  const handleBack = () => goToCustomerReturn(navigate, location, '/start-new-project/services');

  const handleProceedWithPayment = (selectedFeatureIds, pageSelection) => {
    const additionalFeatures = project.additionalFeaturesData || [];
    const availableFeatures = additionalFeatures
      .filter((feature) => !pageSelection || (feature._id || feature.text) !== pageSelection.featureId)
      .map((feature) => ({
        id: feature && typeof feature === 'object' ? feature._id || feature.text : feature,
        name: feature && typeof feature === 'object' ? feature.serviceName || feature.text : feature,
        sellingPrice: feature && typeof feature === 'object' ? feature.sellingPrice || 0 : 0,
      }));

    const featuresPrice = availableFeatures
      .filter((feature) => selectedFeatureIds.includes(feature.id))
      .reduce((sum, feature) => sum + feature.sellingPrice, 0);

    const draftOrder = {
      draftOrderId: `project-${project._id}`,
      productId: project._id,
      type: 'project',
      typeLabel: 'Project',
      category: project.category,
      name: project.serviceName,
      basePrice: project.sellingPrice,
      price: project.sellingPrice + featuresPrice + (pageSelection?.extraCost || 0),
      availableFeatures,
      selectedFeatureIds,
      pageSelection,
      totalPages: project.totalPages,
      sourceProduct: project,
    };

    saveDraftOrder(draftOrder);
    openCartDrawer();
  };

  return (
    <DashboardLayout user={user}>
      <div className="w-full px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {!loaded ? null : !project ? (
            <Surface radius="lg" className="overflow-hidden px-5 py-10 text-center">
              <p className="text-base text-[var(--text-primary)]">Project not found.</p>
              <GlassButton variant="primary" onClick={handleBack} className="mt-4">
                Back to Projects
              </GlassButton>
            </Surface>
          ) : (
            <ProjectDetailView
              project={project}
              onBack={handleBack}
              onProceedWithPayment={handleProceedWithPayment}
              onProceedWithoutPayment={() => {}}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProjectDetail;
