import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {VideoProps} from './schema';
import {StockSequence} from './components/StockSequence';
import {Captions} from './components/Captions';
import {BrandBug, Intro, Outro} from './components/Chrome';
import {VerdictCard} from './components/VerdictCard';

export const VideoLongo: React.FC<VideoProps> = ({
  veredicto,
  audioSrc,
  clips,
  captions,
}) => {
  const {fps, durationInFrames} = useVideoConfig();

  const introLen = Math.round(fps * 1.6);
  const outroLen = Math.round(fps * 4);
  const verdictStart = durationInFrames - Math.round(fps * 12);
  const verdictLen = Math.round(fps * 7);

  return (
    <AbsoluteFill style={{backgroundColor: '#0E0E0E'}}>
      <StockSequence clips={clips} durationInFrames={durationInFrames} />

      <Audio src={staticFile(audioSrc)} />

      <Captions captions={captions} variant="longo" />
      <BrandBug variant="longo" />

      <Sequence durationInFrames={introLen}>
        <Intro />
      </Sequence>

      <Sequence from={verdictStart} durationInFrames={verdictLen}>
        <VerdictCard veredicto={veredicto} variant="longo" />
      </Sequence>

      <Sequence from={durationInFrames - outroLen} durationInFrames={outroLen}>
        <Outro />
        <Audio src={staticFile('audio/cta.mp3')} />
      </Sequence>
    </AbsoluteFill>
  );
};
