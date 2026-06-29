import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {VideoProps} from './schema';
import {StockSequence} from './components/StockSequence';
import {Captions} from './components/Captions';
import {BrandBug} from './components/Chrome';
import {VerdictCard} from './components/VerdictCard';
import {COLORS} from './components/Brand';

const anton = loadAnton().fontFamily;

const SubscribeTag: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        bottom: height * 0.07,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: anton,
        fontSize: width * 0.1,
        color: COLORS.gold,
        letterSpacing: 4,
        opacity,
        textTransform: 'uppercase',
        textShadow: '0 0 30px rgba(212,175,55,0.6), 0 4px 20px rgba(0,0,0,0.95)',
      }}
    >
      ↓ Se inscreva ↓
    </div>
  );
};

const Gancho: React.FC<{texto: string}> = ({texto}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const opacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  if (!texto) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '12%',
        left: '6%',
        right: '6%',
        textAlign: 'center',
        fontFamily: anton,
        fontSize: width * 0.085,
        color: COLORS.gold,
        lineHeight: 1.05,
        opacity,
        textShadow: '0 4px 18px rgba(0,0,0,0.85)',
      }}
    >
      {texto}
    </div>
  );
};

export const Short: React.FC<VideoProps> = ({veredicto, audioSrc, clips, captions, ganchoTexto}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const ganchoLen = Math.round(fps * 3);
  const verdictStart = durationInFrames - Math.round(fps * 9);
  const verdictLen = Math.round(fps * 5);
  const subscribeStart = durationInFrames - Math.round(fps * 3);
  const subscribeLen = Math.round(fps * 3);

  return (
    <AbsoluteFill style={{backgroundColor: '#0E0E0E'}}>
      <StockSequence clips={clips} durationInFrames={durationInFrames} />
      <Audio src={staticFile(audioSrc)} />

      <Sequence durationInFrames={ganchoLen}>
        <Gancho texto={ganchoTexto} />
      </Sequence>

      <Captions captions={captions} variant="short" />
      <BrandBug variant="short" />

      <Sequence from={verdictStart} durationInFrames={verdictLen}>
        <VerdictCard veredicto={veredicto} variant="short" />
      </Sequence>

      <Sequence from={subscribeStart} durationInFrames={subscribeLen}>
        <SubscribeTag />
      </Sequence>
    </AbsoluteFill>
  );
};
