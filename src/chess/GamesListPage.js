import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const GAMES = [
  {
    id: 'chess',
    name: 'Chess',
    description: 'Play chess with a friend in real time — create a room, share a code or link, or find a random opponent.',
    to: '/games/chess',
  },
];

const GamesListPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="rounded-t-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Games
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  Games
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-6 text-white">
                  Take a break and play a quick game with a friend.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  Total: {GAMES.length}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => navigate(game.to)}
                  className="flex flex-col items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                    <Gamepad2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-black">{game.name}</h3>
                    <p className="mt-1 text-sm text-black">{game.description}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-2 text-base font-semibold text-black">
                    Play
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default GamesListPage;
