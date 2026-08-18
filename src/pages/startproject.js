import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Layers3,
  BriefcaseBusiness,
  ArrowRight,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { AnimatedSection, getStaggerDelay } from '../components/PageMotion';
import { useSelector } from 'react-redux';
import backgroundImage from '../assets/BG.png';

const CATEGORIES = [
  {
    id: 'new_website',
    title: 'Start a Project',
    description: 'Start a new website, app, or software project for your business.',
    action: 'Start Project',
    icon: Globe,
  },
  {
    id: 'services',
    title: 'Start a Service or Add-ons',
    description: 'Start a standalone service or add a service to an existing project.',
    action: 'Explore Services',
    icon: Layers3,
  },
];

const StartProject = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const [serviceChoiceOpen, setServiceChoiceOpen] = useState(false);

  const handleSelect = (categoryId) => {
    if (categoryId === 'services') {
      setServiceChoiceOpen(true);
      return;
    }
    navigate(`/start-new-project/build/${categoryId}`);
  };

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              Start New Project
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              What would you like to do today?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Pick what matches your need — we&apos;ll guide you through a few quick questions next.
            </p>
          </div>

          <div className="mt-10 grid w-full grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2">
            {CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              return (
                <AnimatedSection key={category.id} delay={getStaggerDelay(index)}>
                  <button
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className="group relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:bg-white/[0.16] hover:shadow-[0_24px_48px_rgba(16,185,129,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                  {/* glass sheen */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/30 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:ring-emerald-300/40" />

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-colors duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15">
                    <Icon className="h-7 w-7 text-white transition-colors duration-300 group-hover:text-emerald-400" strokeWidth={1.75} />
                  </div>

                  <h3 className="relative mt-5 text-xl font-semibold text-white">
                    {category.title}
                  </h3>
                  <p className="relative mt-2 text-base leading-relaxed text-slate-300">
                    {category.description}
                  </p>

                  <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 group-hover:gap-3 group-hover:border-emerald-300/60 group-hover:bg-emerald-500/35">
                    {category.action}
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </div>
                  </button>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </div>

      {serviceChoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setServiceChoiceOpen(false)}
          />
          <AnimatedSection className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-7 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />

            <button
              type="button"
              onClick={() => setServiceChoiceOpen(false)}
              className="absolute right-4 top-4 rounded-lg border border-white/20 bg-white/10 p-1.5 text-white transition-colors duration-200 hover:border-emerald-300/60 hover:bg-white/[0.16]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <h3 className="relative text-center text-xl font-semibold text-white">
              Choose how you want to continue
            </h3>
            <p className="relative mt-2 text-center text-base leading-relaxed text-slate-300">
              Services can start independently, or be attached to a project you already own.
            </p>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => navigate('/start-new-project/services?tab=plans')} className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-4 text-left text-white transition hover:border-emerald-300/70 hover:bg-emerald-500/30">
                <Layers3 className="h-6 w-6 text-emerald-200" strokeWidth={1.75} />
                <span className="mt-3 block text-base font-semibold">Start a Service</span>
                <span className="mt-1 block text-sm text-slate-200">Browse services that can begin without a project.</span>
              </button>
              <button type="button" onClick={() => navigate('/projects-and-plans')} className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white transition hover:border-sky-300/60 hover:bg-white/[0.16]">
                <BriefcaseBusiness className="h-6 w-6 text-sky-200" strokeWidth={1.75} />
                <span className="mt-3 block text-base font-semibold">Add to a Project</span>
                <span className="mt-1 block text-sm text-slate-200">Open your project, then add its service or add-on.</span>
              </button>
            </div>
          </AnimatedSection>
        </div>
      )}

    </DashboardLayout>
  );
};

export default StartProject;
