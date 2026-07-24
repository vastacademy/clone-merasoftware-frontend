import { useState } from 'react';
import { BOARD_PALETTES } from './chessPieces3d';

export default function ChessLobby({ onCreateRoom, onJoinByCode, onFindRandomMatch, status }) {
  const [chosenColor, setChosenColor] = useState('white');
  const [chosenPalette, setChosenPalette] = useState('classicGreen');
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-black text-center">Chess</h1>

      <div className="space-y-3 border border-black p-4">
        <p className="font-semibold text-black">Create a game</p>
        <div className="flex gap-3">
          <button
            onClick={() => setChosenColor('white')}
            className={`flex-1 py-2 border border-black ${chosenColor === 'white' ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            Play as White
          </button>
          <button
            onClick={() => setChosenColor('black')}
            className={`flex-1 py-2 border border-black ${chosenColor === 'black' ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            Play as Black
          </button>
        </div>

        <p className="text-sm font-semibold text-black">Board color</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(BOARD_PALETTES).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => setChosenPalette(key)}
              className={`flex items-center gap-2 border px-2 py-2 text-left text-sm ${chosenPalette === key ? 'border-black font-semibold' : 'border-slate-300'}`}
            >
              <span className="flex h-5 w-5 overflow-hidden rounded-sm border border-black">
                <span className="w-1/2" style={{ backgroundColor: palette.light }} />
                <span className="w-1/2" style={{ backgroundColor: palette.dark }} />
              </span>
              <span className="text-black">{palette.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onCreateRoom(chosenColor, chosenPalette)}
          className="w-full py-2 bg-emerald-700 text-white"
        >
          Create Room
        </button>
      </div>

      <div className="space-y-3 border border-black p-4">
        <p className="font-semibold text-black">Join with a code</p>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Room code"
          className="w-full border border-black px-3 py-2"
        />
        <button
          onClick={() => onJoinByCode(joinCode)}
          disabled={!joinCode}
          className="w-full py-2 bg-emerald-700 text-white disabled:opacity-50"
        >
          Join Room
        </button>
      </div>

      <div className="space-y-3 border border-black p-4">
        <p className="font-semibold text-black">Random match</p>
        <button
          onClick={onFindRandomMatch}
          className="w-full py-2 bg-emerald-700 text-white"
        >
          Find Opponent
        </button>
        {status === 'waiting-for-match' && (
          <p className="text-sm text-black">Waiting for an opponent...</p>
        )}
      </div>
    </div>
  );
}
