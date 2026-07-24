import { getPieceColorSet } from './chessPieces3d';

function Pawn({ color }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.24, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Rook({ color }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.36, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.19, 0.12, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Knight({ color }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.18, 0.21, 0.32, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.03, 0.42, 0.05]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.16, 0.32, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Bishop({ color }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.36, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <coneGeometry args={[0.14, 0.28, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Queen({ color }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.23, 0.4, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.17, 0.3, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function King({ color }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.21, 0.24, 0.44, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.32, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.16, 0.06, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

const PIECE_COMPONENTS = {
  pawn: Pawn,
  rook: Rook,
  knight: Knight,
  bishop: Bishop,
  queen: Queen,
  king: King
};

export default function ChessPiece3D({ piece, position, isSelected, paletteKey, onClick }) {
  if (!piece) return null;

  const PieceShape = PIECE_COMPONENTS[piece.type];
  const colorSet = getPieceColorSet(paletteKey);
  const pieceColor = colorSet[piece.color];

  return (
    <group position={position} onClick={onClick}>
      <PieceShape color={isSelected ? '#ffd54a' : pieceColor.body} />
    </group>
  );
}
