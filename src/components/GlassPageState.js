import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

const GlassPageState = ({ type = 'loading', message, onRetry }) => {
  const isError = type === 'error';

  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/10 px-6 py-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
      <div className="max-w-md">
        {isError ? (
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />
        ) : (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-300" />
        )}
        <p className="mt-4 text-base font-semibold text-white">
          {message || (isError ? 'Something went wrong.' : 'Loading…')}
        </p>
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-emerald-400"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default GlassPageState;
