import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Cloud, Database, Globe, Smartphone, Sparkles } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { SAMPLE_PROJECTS } from '../data/sampleStartNewProjects';

const CATEGORY_STYLE = {
  standard_websites: { icon: Globe, color: 'text-blue-600' },
  dynamic_websites: { icon: Database, color: 'text-emerald-600' },
  cloud_software_development: { icon: Cloud, color: 'text-purple-600' },
  app_development: { icon: Smartphone, color: 'text-orange-600' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'websites', label: 'Websites' },
  { id: 'cloud', label: 'Cloud Software' },
  { id: 'app', label: 'App Development' },
];

const TAB_CATEGORIES = {
  websites: ['standard_websites', 'dynamic_websites'],
  cloud: ['cloud_software_development'],
  app: ['app_development'],
};

const StartNewProject = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  const [view, setView] = useState('all');

  const visibleProjects = useMemo(() => {
    if (view === 'all') return SAMPLE_PROJECTS;
    const categories = TAB_CATEGORIES[view] || [];
    return SAMPLE_PROJECTS.filter((project) => categories.includes(project.category));
  }, [view]);

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start New Project
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Choose your project
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Compare the key points below, then tap View Details for the full picture.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  Total: {SAMPLE_PROJECTS.length}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    view === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((project) => {
                const style = CATEGORY_STYLE[project.category] || CATEGORY_STYLE.standard_websites;
                const Icon = style.icon;

                return (
                  <div
                    key={project.id}
                    className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white/95 px-4 py-5 shadow-lg shadow-slate-300/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Icon className={`h-6 w-6 ${style.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black leading-snug text-slate-950">
                          {project.serviceName}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{project.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Who is it for?
                      </p>
                      <div className="mt-1.5 flex gap-x-3 overflow-hidden">
                        {project.perfectFor.map((item) => (
                          <span
                            key={item}
                            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-slate-700"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-600">
                        Type: <span className={style.color}>{project.tech[0]}</span> ({project.tech.slice(1).join(', ')})
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/start-new-project/${project.id}`)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StartNewProject;
