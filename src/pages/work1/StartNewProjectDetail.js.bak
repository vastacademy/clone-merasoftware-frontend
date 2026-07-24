import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardLayout from '../components/DashboardLayout';
import ProjectDetailView from '../components/ProjectDetailView';
import SummaryApi from '../common';

const StartNewProjectDetail = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const { projectId } = useParams();
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

  const handleBack = () => navigate('/start-new-project');

  return (
    <DashboardLayout user={user}>
      <div className="w-full bg-slate-50 px-4 py-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {!loaded ? null : !project ? (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">Project not found.</p>
              <button
                type="button"
                onClick={handleBack}
                className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Back to Projects
              </button>
            </div>
          ) : (
            <ProjectDetailView
              project={project}
              onBack={handleBack}
              onProceedWithPayment={() => {}}
              onProceedWithoutPayment={() => {}}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProjectDetail;
