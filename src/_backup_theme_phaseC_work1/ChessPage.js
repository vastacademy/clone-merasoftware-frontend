import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import useChessSocket from './useChessSocket';
import ChessLobby from './ChessLobby';
import ChessBoardFlat from './ChessBoardFlat';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';

export default function ChessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoJoinAttempted = useRef(false);
  const currentUser = useSelector((state) => state?.user?.user);

  // TEMP DEBUG ONLY — remove after iPhone console check is done
  useEffect(() => {
    if (window.__erudaLoaded) return;
    window.__erudaLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.onload = () => window.eruda && window.eruda.init();
    document.body.appendChild(script);
  }, []);

  const {
    connected,
    roomCode,
    assignedColor,
    board,
    players,
    turn,
    status,
    paletteKey,
    gameStatus,
    resetRequestedBy,
    endRequestedBy,
    gameEnded,
    myGames,
    errorMessage,
    createRoom,
    joinRoomByCode,
    findRandomMatch,
    movePiece,
    undoMove,
    requestReset,
    respondReset,
    requestEnd,
    respondEnd,
    fetchMyGames,
    leaveRoomView
  } = useChessSocket();

  useEffect(() => {
    if (gameEnded) {
      toast.success('Game ended and removed for both players.');
      navigate('/games');
    }
  }, [gameEnded, navigate]);

  useEffect(() => {
    const roomFromLink = searchParams.get('room');
    if (roomFromLink && connected && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      joinRoomByCode(roomFromLink.toUpperCase());
    }
  }, [connected, searchParams, joinRoomByCode]);

  useEffect(() => {
    if (connected && !searchParams.get('room') && !roomCode) {
      fetchMyGames();
    }
  }, [connected, searchParams, roomCode, fetchMyGames]);

  const shareLink = roomCode
    ? `${window.location.origin}/games/chess?room=${roomCode}`
    : null;

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy. Please copy it manually.');
    }
  };

  const inLobby = !roomCode && !searchParams.get('room');

  if (inLobby) {
    return (
      <DashboardLayout user={currentUser}>
        <div
          className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/games', { replace: true })}
              className="mr-auto inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            {myGames.length > 0 && (
              <div className="w-full max-w-xl space-y-3 rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-2xl backdrop-saturate-150">
                <p className="font-semibold text-white">Resume a game</p>
                {myGames.map((game) => (
                  <button
                    key={game.roomCode}
                    onClick={() => joinRoomByCode(game.roomCode)}
                    className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <span className="text-white">
                      vs {game.opponentName || 'Unknown player'} <span className="text-slate-400">— playing {game.color}</span>
                    </span>
                    <span className="text-sm text-emerald-300 underline">Resume</span>
                  </button>
                ))}
              </div>
            )}

            <ChessLobby
              onCreateRoom={createRoom}
              onJoinByCode={joinRoomByCode}
              onFindRandomMatch={findRandomMatch}
              status={status}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const opponent = players
    ? (assignedColor === 'white' ? players.black : players.white)
    : null;

  const isResetRequestedByMe = resetRequestedBy && currentUser?._id && String(resetRequestedBy) === String(currentUser._id);
  const isResetRequestedByOpponent = gameStatus === 'reset-pending' && !isResetRequestedByMe;

  const isEndRequestedByMe = endRequestedBy && currentUser?._id && String(endRequestedBy) === String(currentUser._id);
  const isEndRequestedByOpponent = gameStatus === 'end-pending' && !isEndRequestedByMe;

  return (
    <DashboardLayout user={currentUser}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-4">
          <div className="relative flex w-full items-center justify-center">
            <button
              type="button"
              onClick={() => {
                leaveRoomView();
                navigate('/games/chess', { replace: true });
              }}
              className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-white text-center sm:text-3xl">Chess</h1>
          </div>

          <div className="w-full max-w-2xl space-y-4">
            {errorMessage && (
              <p className="text-red-400 text-center">{errorMessage}</p>
            )}

            {roomCode && (
              <div className="text-center space-y-2 rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-2xl backdrop-saturate-150">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-white">Room Code: <span className="font-bold">{roomCode}</span></p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(roomCode, 'Room code')}
                    className="text-sm underline text-emerald-300"
                  >
                    Copy
                  </button>
                </div>
                {shareLink && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-slate-300 break-all">{shareLink}</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareLink, 'Link')}
                      className="text-sm underline text-emerald-300 shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <p className="text-white">You are playing: <span className="font-bold capitalize">{assignedColor}</span></p>
                {opponent && (
                  <p className="text-white">
                    Playing against: <span className="font-bold">{opponent.name || 'Unknown player'}</span>
                    {opponent.email && <span className="text-slate-300"> ({opponent.email})</span>}
                  </p>
                )}
              </div>
            )}

            {status === 'waiting-for-opponent' && (
              <p className="text-center text-slate-300">Waiting for opponent to join...</p>
            )}

            {status === 'opponent-left' && (
              <p className="text-center text-red-400">Opponent disconnected. Your game is saved — you can resume it later.</p>
            )}

            {isResetRequestedByMe && (
              <p className="text-center text-slate-300">Reset request sent. Waiting for the other player to respond...</p>
            )}

            {isResetRequestedByOpponent && (
              <div className="text-center space-y-2 rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-2xl backdrop-saturate-150">
                <p className="text-white">The other player wants to reset this game.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => respondReset(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondReset(false)}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {isEndRequestedByMe && (
              <p className="text-center text-slate-300">End request sent. If the other player doesn't respond within 12 hours, this game will be removed automatically.</p>
            )}

            {isEndRequestedByOpponent && (
              <div className="text-center space-y-2 rounded-[1.5rem] border border-red-400/40 bg-red-500/10 p-4 backdrop-blur-2xl backdrop-saturate-150">
                <p className="text-white">The other player wants to end and delete this game.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => respondEnd(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondEnd(false)}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {board && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white">Turn: <span className="font-bold capitalize">{turn}</span></p>
                <ChessBoardFlat
                  board={board}
                  turn={turn}
                  assignedColor={assignedColor}
                  paletteKey={paletteKey}
                  onMove={movePiece}
                />
                <div className="flex gap-3">
                  <button
                    onClick={undoMove}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  >
                    Undo Last Move
                  </button>
                  <button
                    onClick={requestReset}
                    disabled={gameStatus !== 'active'}
                    className="px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07] disabled:opacity-50"
                  >
                    Reset Game
                  </button>
                  <button
                    onClick={requestEnd}
                    disabled={gameStatus !== 'active'}
                    className="px-4 py-2 rounded-xl border border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    End Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
