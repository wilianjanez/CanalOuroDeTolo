import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {COLORS} from './Brand';

const anton = loadAnton().fontFamily;
const inter = loadInter().fontFamily;

// Wordmark fixo no canto — pequeno, discreto.
export const BrandBug: React.FC<{variant: 'longo' | 'short'}> = ({variant}) => {
  const size = variant === 'short' ? 30 : 26;
  return (
    <div
      style={{
        position: 'absolute',
        top: variant === 'short' ? 48 : 36,
        left: variant === 'short' ? 40 : 48,
        fontFamily: anton,
        fontSize: size,
        letterSpacing: 1,
        color: COLORS.cream,
        opacity: 0.85,
        textShadow: '0 2px 10px rgba(0,0,0,0.7)',
      }}
    >
      OURO<span style={{color: COLORS.gold}}> DE </span>TOLO
    </div>
  );
};

// Abertura: wordmark grande + slogan, ~1.6s.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}});
  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        transform: `scale(${scale})`,
        opacity: enter,
      }}
    >
      <div style={{fontFamily: anton, fontSize: width * 0.085, color: COLORS.cream, letterSpacing: 2}}>
        OURO<span style={{color: COLORS.gold}}> DE </span>TOLO
      </div>
      <div style={{fontFamily: inter, fontWeight: 600, fontSize: width * 0.02, color: COLORS.gold, marginTop: 18}}>
        aprenda a diferenca antes que custe caro
      </div>
    </AbsoluteFill>
  );
};

// Encerramento: CTA pro proximo video.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}});
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        opacity: enter,
      }}
    >
      <div style={{fontFamily: inter, fontWeight: 700, fontSize: width * 0.026, color: COLORS.cream}}>
        Nao seja tolo de novo.
      </div>
      <div style={{fontFamily: anton, fontSize: width * 0.05, color: COLORS.gold, marginTop: 14}}>
        PROXIMO VIDEO →
      </div>
      <div style={{fontFamily: inter, fontWeight: 600, fontSize: width * 0.016, color: COLORS.cream, opacity: 0.8, marginTop: 18}}>
        Inscreva-se no Ouro de Tolo
      </div>
    </AbsoluteFill>
  );
};
