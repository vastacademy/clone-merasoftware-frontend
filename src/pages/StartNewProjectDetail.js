import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Globe, Layers3, Rocket, Smartphone } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { SAMPLE_PROJECTS, formatPrice } from '../data/sampleStartNewProjects';

const CATEGORY_ICON = {
  standard_websites: Globe,
  dynamic_websites: Globe,
  cloud_software_development: Layers3,
  app_development: Smartphone,
};

const StartNewProjectDetail = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const { projectId } = useParams();

  const project = SAMPLE_PROJECTS.find((item) => item.id === projectId);
  const Icon = project ? CATEGORY_ICON[project.category] || Globe : Globe;

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate('/start-new-project')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </button>

          {!project ? (
            <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white/95 px-5 py-10 text-center shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-500">Project not found.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {project.criticalInfo}
                    </p>
                    <h1 className="text-2xl font-black text-slate-950">{project.serviceName}</h1>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-emerald-700">{formatPrice(project.sellingPrice)}</p>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <p className="text-sm leading-6 text-slate-600">{project.description}</p>

                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    What's included
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {project.whatsIncluded.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Perfect for
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.perfectFor.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Rocket className="h-4 w-4" />
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProjectDetail;
