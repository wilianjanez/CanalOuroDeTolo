import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {COLORS, Veredicto, verdictColor} from './Brand';

const anton = loadAnton().fontFamily;
const inter = loadInter().fontFamily;

// O CARIMBO. Elemento de assinatura do canal: bate na tela com peso.
export const VerdictCard: React.FC<{veredicto: Veredicto; variant: 'longo' | 'short'}> = ({
  veredicto,
  variant,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const color = verdictColor(veredicto);

  const stamp = spring({frame, fps, config: {damping: 12, mass: 0.6, stiffness: 140}});
  const scale = interpolate(stamp, [0, 1], [1.6, 1]);
  const rot = interpolate(stamp, [0, 1], [-12, -7]);
  const opacity = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          opacity,
          transform: `scale(${scale}) rotate(${rot}deg)`,
          border: `${Math.round(width * 0.008)}px solid ${color}`,
          borderRadius: 18,
          padding: variant === 'short' ? '24px 48px' : '20px 56px',
          backgroundColor: 'rgba(14,14,14,0.82)',
          textAlign: 'center',
          boxShadow: `0 0 60px ${color}55`,
        }}
      >
        <div style={{fontFamily: inter, fontWeight: 700, fontSize: width * 0.018, color: COLORS.cream, letterSpacing: 4}}>
          O VEREDICTO
        </div>
        <div style={{fontFamily: anton, fontSize: width * (variant === 'short' ? 0.14 : 0.11), color, letterSpacing: 2, lineHeight: 1}}>
          {veredicto}
        </div>
      </div>
    </AbsoluteFill>
  );
};
