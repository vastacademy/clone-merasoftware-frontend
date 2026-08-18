import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { AnimatedSection, getStaggerDelay } from '../components/PageMotion';
import backgroundImage from '../assets/BG.png';

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
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Games
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Take a break
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Play a quick game with a friend while your projects are in progress.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((game, index) => (
              <AnimatedSection key={game.id} delay={getStaggerDelay(index)}>
                <button
                  type="button"
                  onClick={() => navigate(game.to)}
                  className="group relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:bg-white/[0.16] hover:shadow-[0_24px_48px_rgba(16,185,129,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/30 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:ring-emerald-300/40" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-colors duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15">
                  <Gamepad2 className="h-7 w-7 text-white transition-colors duration-300 group-hover:text-emerald-400" strokeWidth={1.75} />
                </div>

                <h3 className="relative mt-5 text-xl font-semibold text-white">
                  {game.name}
                </h3>
                <p className="relative mt-2 text-base leading-relaxed text-slate-300">
                  {game.description}
                </p>

                <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 group-hover:gap-3 group-hover:border-emerald-300/60 group-hover:bg-emerald-500/35">
                  Play
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </div>
                </button>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default GamesListPage;
