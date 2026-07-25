import React from 'react';
import { getPieceColorSet } from './chessPalette';

const STROKE = { stroke: '#000', strokeWidth: 1.2, strokeLinejoin: 'round', strokeLinecap: 'round' };

function Pawn({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <path
        fill={fill}
        {...STROKE}
        d="M22.5 9a5 5 0 0 0-3 9c-2.5 1.5-4 4-4 7 0 2.5 1.5 4.5 3.5 5.5-3 1-6 3.5-6 8h19c0-4.5-3-7-6-8 2-1 3.5-3 3.5-5.5 0-3-1.5-5.5-4-7a5 5 0 0 0-3-9z"
      />
    </svg>
  );
}

function Rook({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <g fill={fill} {...STROKE}>
        <path d="M9 36h27v-4H9zM12 32V15h5v6h4v-6h6v6h4v-6h5v17z" />
        <path d="M11 14h23v-4H11z" />
        <path d="M12 10V6h4v2h5V6h4v2h5V6h4v4z" />
      </g>
    </svg>
  );
}

function Knight({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <g fill={fill} {...STROKE}>
        <path d="M22 10c10 0 12 9 12 14 0 4-2 6-2 9v3H14v-4c0-3 2-4 2-8 0-2-2-2-3-1-1 1-2 3-4 3-1 0-2-1-2-2 0-3 4-6 4-6s-2-1-2-3c0-3 4-5 6-5 1-3 4-0 7 0z" />
        <circle cx="30" cy="16" r="1.4" fill="#000" stroke="none" />
      </g>
      <path fill={fill} d="M10 36h25v4H10z" {...STROKE} />
    </svg>
  );
}

function Bishop({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <g fill={fill} {...STROKE}>
        <circle cx="22.5" cy="9" r="2.5" />
        <path d="M22.5 13c-4 3-8 8-8 14 0 3 2 5 4 6-2 1-4 3-4 6h16c0-3-2-5-4-6 2-1 4-3 4-6 0-6-4-11-8-14z" />
        <path d="M13 39h19v4H13z" />
      </g>
      <path stroke="#000" strokeWidth="1.2" d="M19 20l7 7M26 20l-7 7" />
    </svg>
  );
}

function Queen({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <g fill={fill} {...STROKE}>
        <circle cx="7" cy="12" r="2.2" />
        <circle cx="16" cy="8" r="2.2" />
        <circle cx="22.5" cy="6" r="2.2" />
        <circle cx="29" cy="8" r="2.2" />
        <circle cx="38" cy="12" r="2.2" />
        <path d="M9 14l3 14h21l3-14-7 5-5.5-8-5.5 8z" />
        <path d="M12 30h21l1.5 5h-24z" />
        <path d="M11 39h23v4H11z" />
      </g>
    </svg>
  );
}

function King({ fill }) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full">
      <g fill={fill} {...STROKE}>
        <path d="M21 8h3v6h-3z" />
        <path d="M18 11h9v3h-9z" />
        <path d="M22.5 17c6 4 9 9 9 13 0 3-2 5-4 6-2 1-4 1-4.5 1s-2.5 0-4.5-1c-2-1-4-3-4-6 0-4 3-9 9-13z" />
        <path d="M13 37h19v4H13z" />
      </g>
    </svg>
  );
}

const PIECE_ICONS = {
  pawn: Pawn,
  rook: Rook,
  knight: Knight,
  bishop: Bishop,
  queen: Queen,
  king: King
};

export function ChessPieceIcon({ piece, paletteKey }) {
  if (!piece) return null;

  const Icon = PIECE_ICONS[piece.type];
  const colorSet = getPieceColorSet(paletteKey);
  const fill = colorSet[piece.color];

  return <Icon fill={fill} />;
}
