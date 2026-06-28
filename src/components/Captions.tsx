import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import type {Caption} from '../schema';
import {COLORS} from './Brand';

const {fontFamily} = loadFont();

// Mostra uma janela de palavras em volta da palavra ativa e destaca a ativa.
// fontSize e position adaptam longo (16:9, embaixo) vs Short (9:16, centro).
export const Captions: React.FC<{
  captions: Caption[];
  variant: 'longo' | 'short';
}> = ({captions, variant}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const activeIndex = captions.findIndex((c) => ms >= c.startMs && ms < c.endMs);
  if (activeIndex === -1) return null;

  const windowSize = variant === 'short' ? 4 : 7;
  const start = Math.max(0, activeIndex - Math.floor(windowSize / 2));
  const slice = captions.slice(start, start + windowSize);

  const fontSize = variant === 'short' ? Math.round(width * 0.075) : Math.round(width * 0.032);

  return (
    <div
      style={{
        position: 'absolute',
        left: '6%',
        right: '6%',
        bottom: variant === 'short' ? undefined : '9%',
        top: variant === 'short' ? '38%' : undefined,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: variant === 'short' ? '0.35em' : '0.3em',
        textAlign: 'center',
        fontFamily,
        fontWeight: 800,
        lineHeight: 1.1,
        textShadow: '0 4px 18px rgba(0,0,0,0.85)',
      }}
    >
      {slice.map((c, i) => {
        const isActive = start + i === activeIndex;
        return (
          <span
            key={c.startMs + '-' + i}
            style={{
              fontSize,
              color: isActive ? COLORS.dark : COLORS.cream,
              backgroundColor: isActive ? COLORS.gold : 'transparent',
              padding: isActive ? '0.05em 0.25em' : '0.05em 0',
              borderRadius: 8,
              transform: isActive ? 'scale(1.04)' : 'none',
            }}
          >
            {c.text.trim()}
          </span>
        );
      })}
    </div>
  );
};
