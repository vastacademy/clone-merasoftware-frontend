import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Globe, Layers3, Smartphone, Sparkles } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { SAMPLE_PROJECTS, formatPrice } from '../data/sampleStartNewProjects';

const CATEGORY_ICON = {
  standard_websites: Globe,
  dynamic_websites: Globe,
  cloud_software_development: Layers3,
  app_development: Smartphone,
};

const StartNewProject = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-5 py-5 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Start New Project
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Choose your project
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tap a plan to see full details.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-3">
            {SAMPLE_PROJECTS.map((project) => {
              const Icon = CATEGORY_ICON[project.category] || Globe;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/start-new-project/${project.id}`)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-2 py-3.5 text-center shadow-[0_15px_45px_-30px_rgba(15,23,42,0.35)] transition hover:border-slate-300 sm:gap-2 sm:px-3 sm:py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="line-clamp-2 text-xs font-bold text-slate-950 sm:text-sm">
                    {project.serviceName}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 sm:text-sm">
                    {formatPrice(project.sellingPrice)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProject;
