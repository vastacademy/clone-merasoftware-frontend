import React, { useMemo } from 'react';
import { ArrowRight, BriefcaseBusiness, Clock3, Layers3, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/BG.png';

const formatDate = (date) => {
  if (!date) return 'Not started';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getServicePresentation = (service) => {
  const status = service.servicePlanStatus || 'active';
  if (status === 'pending_activation') return { label: 'Waiting for activation', tone: 'amber', priority: 1 };
  if (status === 'active') return { label: 'Active', tone: 'emerald', priority: 0 };
  if (status === 'paused') return { label: 'Paused', tone: 'amber', priority: 2 };
  if (status === 'expired') return { label: 'Expired', tone: 'slate', priority: 3 };
  if (status === 'cancelled' || status === 'inactive') return { label: 'Inactive', tone: 'slate', priority: 4 };
  return { label: status.replace(/_/g, ' '), tone: 'slate', priority: 4 };
};

const toneClasses = {
  emerald: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100',
  amber: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
  slate: 'border-white/20 bg-white/10 text-slate-200',
};

const ProjectServiceWorkspace = ({ project, onAddService }) => {
  const navigate = useNavigate();
  const services = useMemo(
    () => [...(project.linkedServices || [])].sort((left, right) => {
      const priority = getServicePresentation(left).priority - getServicePresentation(right).priority;
      if (priority !== 0) return priority;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    }),
    [project.linkedServices]
  );

  const projectName = project.productId?.serviceName || 'Project';

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">Project workspace</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{projectName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">Project progress and every service purchased for this project stay together here.</p>
            </div>
            <button type="button" onClick={onAddService} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-400">
              <Plus className="h-5 w-5" />
              Add a Service
            </button>
          </div>
        </header>

        <section className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center gap-3 border-b border-white/15 pb-4">
            <Layers3 className="h-5 w-5 text-emerald-300" />
            <div>
              <h2 className="text-lg font-bold text-white">Linked services</h2>
              <p className="text-sm text-slate-300">Active services appear first; their history remains attached to this project.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {services.map((service) => {
              const presentation = getServicePresentation(service);
              const name = service.productId?.serviceName || service.orderItems?.[0]?.name || 'Service';
              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => navigate(`/project-details/${project._id}/services/${service._id}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-slate-950/25 p-4 text-left transition hover:border-emerald-300/50 hover:bg-white/10"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200"><ShieldCheck className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-semibold text-white">{name}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[presentation.tone]}`}>{presentation.label}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><Clock3 className="h-4 w-4" />{service.servicePlanStartDate ? `Started ${formatDate(service.servicePlanStartDate)}` : 'Starts when the project is eligible'}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center gap-3 border-b border-white/15 pb-4">
            <BriefcaseBusiness className="h-5 w-5 text-sky-200" />
            <div><h2 className="text-lg font-bold text-white">Original project</h2><p className="text-sm text-slate-300">Open the project timeline, progress and project records.</p></div>
          </div>
          <button type="button" onClick={() => navigate(`/project-details/${project._id}?view=project`)} className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-slate-950/25 p-4 text-left transition hover:border-sky-300/50 hover:bg-white/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200"><BriefcaseBusiness className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-white">{projectName}</span><span className="mt-1 block text-sm text-slate-300">{Math.round(Number(project.projectProgress || 0))}% complete · project timeline</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" />
          </button>
        </section>
      </div>
    </div>
  );
};

export default ProjectServiceWorkspace;
