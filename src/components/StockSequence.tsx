import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {COLORS} from './Brand';

// Divide o tempo total igualmente entre os clipes e os exibe em sequencia,
// cobrindo a tela (object-fit: cover) para 16:9 ou 9:16.
export const StockSequence: React.FC<{
  clips: string[];
  durationInFrames: number;
}> = ({clips, durationInFrames}) => {
  const {fps} = useVideoConfig();
  if (clips.length === 0) {
    return <AbsoluteFill style={{backgroundColor: COLORS.dark}} />;
  }
  const per = Math.ceil(durationInFrames / clips.length);
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.dark}}>
      {clips.map((clip, i) => (
        <Sequence key={clip + i} from={i * per} durationInFrames={per}>
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile(clip)}
              muted
              playbackRate={1}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
            {/* escurece o stock para a legenda ler bem */}
            <AbsoluteFill
              style={{
                background:
                  'linear-gradient(180deg, rgba(14,14,14,0.35) 0%, rgba(14,14,14,0.15) 45%, rgba(14,14,14,0.75) 100%)',
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
