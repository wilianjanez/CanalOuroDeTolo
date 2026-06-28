// Identidade visual do canal Ouro de Tolo.
// Assinatura: o carimbo de VEREDICTO (OURO / PIRITA) — tudo o mais fica quieto em volta.

export const COLORS = {
  dark: '#0E0E0E',
  darkSoft: '#15150F',
  cream: '#F4EFE3',
  gold: '#D4AF37',
  goldDeep: '#A9842A',
  pirita: '#C9534A', // veredicto negativo (pirita)
  ouro: '#3FA34D', // veredicto positivo (ouro)
  misto: '#E0A100', // veredicto misto
} as const;

export type Veredicto = 'OURO' | 'PIRITA' | 'MISTO';

export const verdictColor = (v: Veredicto) =>
  v === 'OURO' ? COLORS.ouro : v === 'PIRITA' ? COLORS.pirita : COLORS.misto;

export const FONT_DISPLAY = 'Anton'; // condensada, pesada — wordmark e veredicto
export const FONT_BODY = 'Inter'; // legendas e textos
