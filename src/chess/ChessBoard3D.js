import { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import ChessPiece3D from './ChessPiece3D';
import { BOARD_PALETTES } from './chessPieces3d';

const SQUARE_SIZE = 1;
const BOARD_OFFSET = 3.5;

function squareToPosition(row, col) {
  return [(col - BOARD_OFFSET) * SQUARE_SIZE, 0, (row - BOARD_OFFSET) * SQUARE_SIZE];
}

function Square({ row, col, isDark, isSelected, palette, onClick }) {
  const color = isSelected ? '#ffd54a' : (isDark ? palette.dark : palette.light);
  const [x, , z] = squareToPosition(row, col);

  return (
    <mesh position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick} receiveShadow>
      <planeGeometry args={[SQUARE_SIZE, SQUARE_SIZE]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function CameraRig({ isFlipped }) {
  const cameraRef = useRef(null);
  const { invalidate } = useThree();
  const eye = isFlipped ? [0, 7, -8] : [0, 7, 8];

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(0, 0, 0);
      invalidate();
    }
  }, [isFlipped, invalidate]);

  return (
    <PerspectiveCamera ref={cameraRef} makeDefault position={eye} fov={45} />
  );
}

export default function ChessBoard3D({ board, turn, assignedColor, paletteKey, onMove }) {
  const [selected, setSelected] = useState(null);

  if (!board) return null;

  const isMyTurn = turn === assignedColor;
  const isFlipped = assignedColor === 'black';
  const palette = BOARD_PALETTES[paletteKey] || BOARD_PALETTES.classicGreen;

  const handleSquareClick = (row, col) => {
    if (!isMyTurn) return;

    if (selected) {
      if (selected.row === row && selected.col === col) {
        setSelected(null);
        return;
      }
      onMove(selected, { row, col });
      setSelected(null);
      return;
    }

    const piece = board[row][col];
    if (piece && piece.color === assignedColor) {
      setSelected({ row, col });
    }
  };

  const squares = [];
  const pieces = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isDark = (row + col) % 2 === 1;
      const isSelected = selected && selected.row === row && selected.col === col;

      squares.push(
        <Square
          key={`sq-${row}-${col}`}
          row={row}
          col={col}
          isDark={isDark}
          isSelected={isSelected}
          palette={palette}
          onClick={(event) => {
            event.stopPropagation();
            handleSquareClick(row, col);
          }}
        />
      );

      const piece = board[row][col];
      if (piece) {
        pieces.push(
          <ChessPiece3D
            key={`pc-${row}-${col}`}
            piece={piece}
            position={squareToPosition(row, col)}
            isSelected={isSelected}
            paletteKey={paletteKey}
            onClick={(event) => {
              event.stopPropagation();
              handleSquareClick(row, col);
            }}
          />
        );
      }
    }
  }

  return (
    <div className="w-full max-w-2xl aspect-square border-4 border-black bg-slate-800">
      <Canvas shadows>
        <CameraRig isFlipped={isFlipped} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 10, 4]} intensity={1.1} castShadow />
        <group>
          {squares}
          {pieces}
        </group>
      </Canvas>
    </div>
  );
}
