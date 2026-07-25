import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const backendDomain = process.env.REACT_APP_BACKEND_URL;

export default function useChessSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [assignedColor, setAssignedColor] = useState(null);
  const [board, setBoard] = useState(null);
  const [turn, setTurn] = useState('white');
  const [status, setStatus] = useState('idle');
  const [paletteKey, setPaletteKey] = useState('classicGreen');
  const [gameStatus, setGameStatus] = useState('active');
  const [resetRequestedBy, setResetRequestedBy] = useState(null);
  const [endRequestedBy, setEndRequestedBy] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [myGames, setMyGames] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const socket = io(`${backendDomain}/chess`, {
      path: '/chess-socket',
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', (err) => {
      setErrorMessage(err.message || 'Could not connect');
    });

    const applyGameState = (payload) => {
      setBoard(payload.board);
      setTurn(payload.turn);
      setGameStatus(payload.status || 'active');
      setResetRequestedBy(payload.resetRequestedBy || null);
      setEndRequestedBy(payload.endRequestedBy || null);
      if (payload.paletteKey) setPaletteKey(payload.paletteKey);
    };

    socket.on('chess:roomCreated', (payload) => {
      setRoomCode(payload.roomCode);
      setAssignedColor(payload.assignedColor);
      applyGameState(payload);
      setStatus('waiting-for-opponent');
    });

    socket.on('chess:joined', (payload) => {
      setRoomCode(payload.roomCode);
      setAssignedColor(payload.assignedColor);
      applyGameState(payload);
      setStatus('playing');
    });

    socket.on('chess:opponentJoined', (payload) => {
      applyGameState(payload);
      setStatus('playing');
    });

    socket.on('chess:state', (payload) => {
      applyGameState(payload);
    });

    socket.on('chess:waitingForMatch', () => {
      setStatus('waiting-for-match');
    });

    socket.on('chess:opponentLeft', () => {
      setStatus('opponent-left');
    });

    socket.on('chess:gameEnded', () => {
      setGameEnded(true);
    });

    socket.on('chess:myGames', ({ games }) => {
      setMyGames(games);
    });

    socket.on('chess:error', ({ error }) => {
      setErrorMessage(error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((color, palette) => {
    socketRef.current?.emit('chess:createRoom', { color, paletteKey: palette });
  }, []);

  const joinRoomByCode = useCallback((code) => {
    socketRef.current?.emit('chess:joinRoom', { roomCode: code });
    setStatus('playing');
  }, []);

  const findRandomMatch = useCallback(() => {
    socketRef.current?.emit('chess:findRandomMatch');
  }, []);

  const movePiece = useCallback((from, to) => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:move', { roomCode, from, to });
  }, [roomCode]);

  const undoMove = useCallback(() => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:undo', { roomCode });
  }, [roomCode]);

  const requestReset = useCallback(() => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:requestReset', { roomCode });
  }, [roomCode]);

  const respondReset = useCallback((accept) => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:respondReset', { roomCode, accept });
  }, [roomCode]);

  const requestEnd = useCallback(() => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:requestEnd', { roomCode });
  }, [roomCode]);

  const respondEnd = useCallback((accept) => {
    if (!roomCode) return;
    socketRef.current?.emit('chess:respondEnd', { roomCode, accept });
  }, [roomCode]);

  const fetchMyGames = useCallback(() => {
    socketRef.current?.emit('chess:getMyGames');
  }, []);

  const leaveRoomView = useCallback(() => {
    setRoomCode(null);
    setAssignedColor(null);
    setBoard(null);
    setStatus('idle');
    setGameStatus('active');
    setResetRequestedBy(null);
    setEndRequestedBy(null);
  }, []);

  return {
    connected,
    roomCode,
    assignedColor,
    board,
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
  };
}
