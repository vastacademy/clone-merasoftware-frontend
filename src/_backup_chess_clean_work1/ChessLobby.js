import { useState } from 'react';
import { ArrowLeft, ArrowRight, PlusCircle, KeyRound, Shuffle } from 'lucide-react';
import { BOARD_PALETTES } from './chessPalette';

const MODE_OPTIONS = [
  {
    value: 'create',
    icon: PlusCircle,
    title: 'Create a Game',
    description: 'Start a new room and share the code or link with a friend.',
  },
  {
    value: 'join',
    icon: KeyRound,
    title: 'Join with Code',
    description: 'Already have a room code or link? Jump straight into that game.',
  },
  {
    value: 'random',
    icon: Shuffle,
    title: 'Random Match',
    description: "Don't have anyone to play with? We'll find you an opponent.",
  },
];

const COLOR_OPTIONS = [
  { value: 'white', title: 'Play as White', description: 'You move first.' },
  { value: 'black', title: 'Play as Black', description: 'Your opponent moves first.' },
];

export default function ChessLobby({ onCreateRoom, onJoinByCode, onFindRandomMatch, status }) {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [chosenColor, setChosenColor] = useState(null);
  const [chosenPalette, setChosenPalette] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const flowKeys = mode === 'create' ? ['color', 'palette'] : mode ? [mode] : [];

  const handleSelectMode = (value) => {
    setMode(value);
    setStep(0);
  };

  const handleSelectColor = (value) => {
    setChosenColor(value);
    setStep(1);
  };

  const handleSelectPalette = (key) => {
    setChosenPalette(key);
    onCreateRoom(chosenColor, key);
  };

  const handleBack = () => {
    if (step === 0) {
      setMode(null);
      return;
    }
    setStep(step - 1);
  };

  if (!mode) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Chess</h1>
          <p className="mx-auto mt-2 max-w-xl text-base text-slate-300">
            Choose how you want to play — the next step will match your choice.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {MODE_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectMode(option.value)}
                style={{ animationDelay: `${index * 90}ms` }}
                className="group animate-[fadeSlideUp_0.5s_ease-out_both] relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:bg-white/[0.16] hover:shadow-[0_24px_48px_rgba(16,185,129,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/30 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-colors duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15">
                  <Icon className="h-7 w-7 text-white transition-colors duration-300 group-hover:text-emerald-400" strokeWidth={1.75} />
                </div>

                <h3 className="relative mt-5 text-xl font-semibold text-white">{option.title}</h3>
                <p className="relative mt-2 text-base leading-relaxed text-slate-300">{option.description}</p>

                <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-300 group-hover:gap-3 group-hover:border-emerald-300/60 group-hover:bg-emerald-500/35">
                  Select
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl animate-[fadeSlideUp_0.4s_ease-out_both] space-y-6">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back
        </button>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Chess</h1>
      </div>

      {flowKeys.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {flowKeys.map((key, i) => (
            <div
              key={key}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? 'w-10 bg-emerald-400' : i < step ? 'w-6 bg-emerald-400/60' : 'w-6 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      {mode === 'create' && step === 0 && (
        <div>
          <p className="text-center text-base text-slate-300">Which color do you want to play?</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectColor(option.value)}
                className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 text-left backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-white/[0.16]"
              >
                <h3 className="text-lg font-semibold text-white">{option.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'create' && step === 1 && (
        <div>
          <p className="text-center text-base text-slate-300">Choose your board style</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(BOARD_PALETTES).map(([key, palette]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPalette(key)}
                className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-white/[0.16]"
              >
                <span className="flex h-8 w-8 overflow-hidden rounded-md border border-white/20">
                  <span className="w-1/2" style={{ backgroundColor: palette.light }} />
                  <span className="w-1/2" style={{ backgroundColor: palette.dark }} />
                </span>
                <span className="text-base font-medium text-white">{palette.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-6 backdrop-blur-2xl backdrop-saturate-150">
          <p className="text-center text-base text-slate-300">Enter the room code your friend shared with you</p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => onJoinByCode(joinCode)}
            disabled={!joinCode}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Join Room
          </button>
        </div>
      )}

      {mode === 'random' && (
        <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-6 text-center backdrop-blur-2xl backdrop-saturate-150">
          <p className="text-base text-slate-300">We'll match you with the next available player.</p>
          <button
            type="button"
            onClick={onFindRandomMatch}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-700"
          >
            Find Opponent
          </button>
          {status === 'waiting-for-match' && (
            <p className="mt-3 text-sm text-slate-300">Waiting for an opponent...</p>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
