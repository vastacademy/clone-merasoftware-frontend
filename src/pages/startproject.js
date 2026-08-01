import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Rocket,
  Sparkles,
  ArrowRight,
  Clock,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useSelector } from 'react-redux';
import backgroundImage from '../assets/BG.png';

const CATEGORIES = [
  {
    id: 'new_website',
    title: 'New Website Project',
    description: 'Build a new website for your business or brand.',
    action: 'Continue',
    icon: Globe,
  },
  {
    id: 'new_project',
    title: 'New Software Project',
    description: 'Build a new website, app or software.',
    action: 'Continue',
    icon: Rocket,
  },
  {
    id: 'feature_update',
    title: 'Features & Updates',
    description: 'Add a new feature, fix issues, update content, or change design.',
    action: 'Continue',
    icon: Sparkles,
  },
];

const COMING_SOON_IDS = ['new_project', 'feature_update'];

const StartProject = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const handleSelect = (categoryId) => {
    if (COMING_SOON_IDS.includes(categoryId)) {
      setComingSoonOpen(true);
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

          <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelect(category.id)}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className="group animate-[fadeSlideUp_0.5s_ease-out_both] relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:bg-white/[0.16] hover:shadow-[0_24px_48px_rgba(16,185,129,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
              );
            })}
          </div>
        </div>
      </div>

      {comingSoonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setComingSoonOpen(false)}
          />
          <div className="relative w-full max-w-sm animate-[fadeSlideUp_0.3s_ease-out_both] overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />

            <button
              type="button"
              onClick={() => setComingSoonOpen(false)}
              className="absolute right-4 top-4 rounded-lg border border-white/20 bg-white/10 p-1.5 text-white transition-colors duration-200 hover:border-emerald-300/60 hover:bg-white/[0.16]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 backdrop-blur-md">
              <Clock className="h-7 w-7 text-emerald-400" strokeWidth={1.75} />
            </div>

            <h3 className="relative mt-5 text-xl font-semibold text-white">
              Coming Soon
            </h3>
            <p className="relative mt-2 text-base leading-relaxed text-slate-300">
              This is on its way. We&apos;re working on it and it&apos;ll be available soon.
            </p>

            <button
              type="button"
              onClick={() => setComingSoonOpen(false)}
              className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300/60 hover:bg-emerald-500/35"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StartProject;
