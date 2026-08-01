import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Wand2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';

const BUDGET_LABELS = {
  range_5k_30k: '5,000 - 30,000',
  range_30k_plus: '30,000 and above',
};

const OWNERSHIP_LABELS = {
  self_managed: "I'll manage content myself",
  we_maintain: 'MeraSoftware will maintain it for me',
};

const StartNewWebsiteCustomize = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state?.user?.user);

  const { budget, ownership } = location.state || {};

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-6xl">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate('/start-new-project/build/new_website')}
              className="absolute left-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-lg font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 hover:border-emerald-300/60 hover:bg-white/[0.16]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
              Back
            </button>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              New Website Project
            </span>
          </div>

          <div className="mt-10 animate-[fadeSlideUp_0.5s_ease-out_both]">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />

              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 backdrop-blur-md">
                <Wand2 className="h-9 w-9 text-emerald-400" strokeWidth={1.75} />
              </div>

              <h1 className="relative mt-5 text-2xl font-bold text-white">
                Customize flow — coming soon
              </h1>
              <p className="relative mx-auto mt-2 max-w-md text-base text-slate-300">
                This is where you'll pick your own features and pages before you buy.
              </p>

              {(budget || ownership) && (
                <div className="relative mt-8 divide-y divide-white/10 rounded-2xl border border-white/15 bg-white/5 text-left">
                  {budget && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-slate-400">Budget</span>
                      <span className="text-base font-medium text-white">
                        {BUDGET_LABELS[budget]}
                      </span>
                    </div>
                  )}
                  {ownership && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-slate-400">Content management</span>
                      <span className="text-base font-medium text-white">
                        {OWNERSHIP_LABELS[ownership]}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StartNewWebsiteCustomize;
