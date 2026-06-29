import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {COLORS, Veredicto, verdictColor} from './Brand';

const anton = loadAnton().fontFamily;
const inter = loadInter().fontFamily;

// Thumbnail profissional 1280x720 para YouTube.
// Sem hooks de animação — é uma imagem estática (renderStill).
export const Thumbnail: React.FC<{titulo: string; veredicto: Veredicto}> = ({titulo, veredicto}) => {
  const vColor = verdictColor(veredicto);

  // Encurta o título para caber bem na thumbnail (max ~55 chars)
  const short = titulo.length > 55 ? titulo.slice(0, 52).replace(/\s\S+$/, '') + '…' : titulo;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.dark, overflow: 'hidden', fontFamily: anton}}>

      {/* ── Fundo: gradiente radial colorido por veredicto ── */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 80% 100% at 85% 50%, ${vColor}22 0%, transparent 65%),
            linear-gradient(135deg, #1c1c10 0%, ${COLORS.dark} 55%, #080808 100%)
          `,
        }}
      />

      {/* ── Linhas diagonais douradas (textura sutil) ── */}
      {[0, 24, 48].map((offset) => (
        <div
          key={offset}
          style={{
            position: 'absolute',
            top: -80,
            right: 340 + offset,
            width: offset === 0 ? 5 : 2,
            height: '160%',
            backgroundColor: COLORS.gold,
            opacity: offset === 0 ? 0.12 : 0.06,
            transform: 'rotate(12deg)',
          }}
        />
      ))}

      {/* ── Logo / wordmark (canto superior esquerdo) ── */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        <span style={{fontSize: 30, color: COLORS.cream, letterSpacing: 2}}>OURO</span>
        <span style={{fontSize: 30, color: COLORS.gold, letterSpacing: 2, margin: '0 6px'}}> DE </span>
        <span style={{fontSize: 30, color: COLORS.cream, letterSpacing: 2}}>TOLO</span>
      </div>

      {/* Linha separadora dourada sob o logo */}
      <div
        style={{
          position: 'absolute',
          top: 86,
          left: 64,
          width: 220,
          height: 2,
          background: `linear-gradient(90deg, ${COLORS.gold} 0%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {/* ── Título principal (coluna esquerda) ── */}
      <div
        style={{
          position: 'absolute',
          top: 112,
          left: 64,
          right: 380,
          bottom: 64,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 98,
            lineHeight: 1.03,
            letterSpacing: 0,
            color: COLORS.cream,
            textTransform: 'uppercase',
            textShadow: `0 4px 24px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)`,
            wordBreak: 'break-word',
          }}
        >
          {/* Primeira palavra em dourado para destaque */}
          {short.split(' ').map((word, i) => (
            <span key={i} style={{color: i === 0 ? COLORS.gold : COLORS.cream}}>
              {word}{' '}
            </span>
          ))}
        </div>
      </div>

      {/* ── Carimbo de veredicto (coluna direita) ── */}
      <div
        style={{
          position: 'absolute',
          right: 72,
          bottom: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: `7px solid ${vColor}`,
          borderRadius: 20,
          padding: '22px 52px',
          backgroundColor: 'rgba(10,10,10,0.92)',
          boxShadow: `0 0 60px ${vColor}55, 0 0 120px ${vColor}22, inset 0 0 40px ${vColor}11`,
          transform: 'rotate(-6deg)',
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontWeight: 800,
            fontSize: 18,
            color: COLORS.cream,
            letterSpacing: 5,
            marginBottom: 6,
            opacity: 0.9,
          }}
        >
          O VEREDICTO
        </div>
        <div
          style={{
            fontSize: 96,
            color: vColor,
            letterSpacing: 3,
            lineHeight: 1,
            textShadow: `0 0 40px ${vColor}99, 0 4px 16px rgba(0,0,0,0.8)`,
          }}
        >
          {veredicto}
        </div>
      </div>

      {/* ── Linha dourada inferior ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 64,
          right: 64,
          height: 2,
          background: `linear-gradient(90deg, ${COLORS.gold}88 0%, ${COLORS.gold}22 70%, transparent 100%)`,
        }}
      />

      {/* ── Sub-tagline inferior esquerdo ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 64,
          fontFamily: inter,
          fontWeight: 600,
          fontSize: 18,
          color: COLORS.gold,
          letterSpacing: 3,
          opacity: 0.7,
          textTransform: 'uppercase',
        }}
      >
        aprenda a diferença antes que custe caro
      </div>

    </AbsoluteFill>
  );
};
