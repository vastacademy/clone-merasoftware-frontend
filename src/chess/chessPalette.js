export const BOARD_PALETTES = {
  classicGreen: { name: 'Classic Green', light: '#ebecd0', dark: '#779556', pieceDark: '#3f5c2a' },
  oceanBlue: { name: 'Ocean Blue', light: '#e8eef4', dark: '#3d6d99', pieceDark: '#1f3f5c' },
  walnutBrown: { name: 'Walnut Brown', light: '#e8d3a9', dark: '#8b5a2b', pieceDark: '#5a3714' },
  slateGray: { name: 'Slate Gray', light: '#e2e2e2', dark: '#5b6470', pieceDark: '#2f353d' }
};

const WHITE_PIECE_COLOR = '#f5f5f0';

export function getPieceColorSet(paletteKey) {
  const palette = BOARD_PALETTES[paletteKey] || BOARD_PALETTES.classicGreen;
  return {
    white: WHITE_PIECE_COLOR,
    black: palette.pieceDark
  };
}
