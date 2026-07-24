import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import useChessSocket from './useChessSocket';
import ChessLobby from './ChessLobby';
import ChessBoard3D from './ChessBoard3D';

export default function ChessPage() {
  const [searchParams] = useSearchParams();
  const autoJoinAttempted = useRef(false);
  const currentUser = useSelector((state) => state?.user?.user);

  const {
    connected,
    roomCode,
    assignedColor,
    board,
    turn,
    status,
    paletteKey,
    gameStatus,
    resetRequestedBy,
    myGames,
    errorMessage,
    createRoom,
    joinRoomByCode,
    findRandomMatch,
    movePiece,
    undoMove,
    requestReset,
    respondReset,
    fetchMyGames
  } = useChessSocket();

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
      <div className="max-w-md mx-auto p-6 space-y-8">
        {myGames.length > 0 && (
          <div className="space-y-3 border border-black p-4">
            <p className="font-semibold text-black">Resume a game</p>
            {myGames.map((game) => (
              <button
                key={game.roomCode}
                onClick={() => joinRoomByCode(game.roomCode)}
                className="w-full flex items-center justify-between border border-black px-3 py-2 text-left"
              >
                <span className="text-black">
                  Room {game.roomCode} — playing {game.color}
                </span>
                <span className="text-sm text-black underline">Resume</span>
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
    );
  }

  const isResetRequestedByMe = resetRequestedBy && currentUser?._id && String(resetRequestedBy) === String(currentUser._id);
  const isResetRequestedByOpponent = gameStatus === 'reset-pending' && !isResetRequestedByMe;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-black text-center">Chess</h1>

      {errorMessage && (
        <p className="text-red-600 text-center">{errorMessage}</p>
      )}

      {roomCode && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <p className="text-black">Room Code: <span className="font-bold">{roomCode}</span></p>
            <button
              type="button"
              onClick={() => copyToClipboard(roomCode, 'Room code')}
              className="text-sm underline text-black"
            >
              Copy
            </button>
          </div>
          {shareLink && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-black break-all">{shareLink}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(shareLink, 'Link')}
                className="text-sm underline text-black shrink-0"
              >
                Copy
              </button>
            </div>
          )}
          <p className="text-black">You are playing: <span className="font-bold capitalize">{assignedColor}</span></p>
        </div>
      )}

      {status === 'waiting-for-opponent' && (
        <p className="text-center text-black">Waiting for opponent to join...</p>
      )}

      {status === 'opponent-left' && (
        <p className="text-center text-red-600">Opponent disconnected. Your game is saved — you can resume it later.</p>
      )}

      {isResetRequestedByMe && (
        <p className="text-center text-black">Reset request sent. Waiting for the other player to respond...</p>
      )}

      {isResetRequestedByOpponent && (
        <div className="text-center space-y-2 border border-black p-3">
          <p className="text-black">The other player wants to reset this game.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => respondReset(true)}
              className="px-4 py-2 bg-emerald-700 text-white"
            >
              Accept
            </button>
            <button
              onClick={() => respondReset(false)}
              className="px-4 py-2 border border-black text-black"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {board && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-black">Turn: <span className="font-bold capitalize">{turn}</span></p>
          <ChessBoard3D
            board={board}
            turn={turn}
            assignedColor={assignedColor}
            paletteKey={paletteKey}
            onMove={movePiece}
          />
          <div className="flex gap-3">
            <button
              onClick={undoMove}
              className="px-4 py-2 border border-black text-black"
            >
              Undo Last Move
            </button>
            <button
              onClick={requestReset}
              disabled={gameStatus === 'reset-pending'}
              className="px-4 py-2 border border-black text-black disabled:opacity-50"
            >
              Reset Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
