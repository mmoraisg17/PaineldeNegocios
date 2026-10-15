import type { CSSProperties } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/* Textos e o medidor por cima da cena 3D. Tudo anima pelo número do quadro
   (useCurrentFrame/interpolate/spring): transição ou animação de CSS não
   aparece no render, que tira uma foto por quadro. */

export type Paleta = { fundo: string; acento: string; salmao: string; texto: string; suave: string };

const limitar = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const decimal = (valor: number) => valor.toFixed(1).replace('.', ',');

/* Entra subindo (mola sem quique) e sai esmaecendo nos últimos quadros. */
function useEntradaESaida(duracao: number, saida = 10) {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: quadro, fps, config: { damping: 200 }, durationInFrames: 18 });
  const sumir = interpolate(quadro, [duracao - saida, duracao], [1, 0], limitar);
  return { opacity: Math.min(entrada, sumir), transform: `translateY(${(1 - entrada) * 40}px)` };
}

export function Abertura({ paleta, duracao }: { paleta: Paleta; duracao: number }) {
  const quadro = useCurrentFrame();
  const titulo = useEntradaESaida(duracao);
  // O subtítulo entra um pouco depois do título, para a leitura ir de cima para baixo.
  const subtitulo = spring({ frame: quadro - 8, fps: useVideoConfig().fps, config: { damping: 200 }, durationInFrames: 18 });
  /* O degradê só garante leitura do título sobre o fundo; ele acompanha a
     opacidade do título e acaba antes da cabeça do boneco (~600 px), para não
     escurecer o corpo (a primeira versão deixava a cabeça cinza-escura). */
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(${paleta.fundo} 0%, ${paleta.fundo}cc 22%, transparent 30%)`, opacity: titulo.opacity }} />
      <div style={{ position: 'absolute', top: 210, left: 72, right: 72, ...titulo }}>
        <div style={{ width: 96, height: 10, borderRadius: 5, background: paleta.acento, marginBottom: 36 }} />
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.08, color: paleta.texto, letterSpacing: -1.5 }}>
          Força e explosão · Lucas, 24 anos
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 600,
            marginTop: 28,
            color: paleta.salmao,
            opacity: subtitulo,
            transform: `translateY(${(1 - subtitulo) * 24}px)`,
          }}
        >
          Salto vertical (CMJ)
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* Cabeçalho discreto depois da abertura: quem pega o vídeo no meio sabe o que é. */
export function Cabecalho({ paleta, nivel, duracao }: { paleta: Paleta; nivel: number; duracao: number }) {
  const estilo = useEntradaESaida(duracao);
  return (
    <div style={{ position: 'absolute', top: 96, left: 72, right: 72, ...estilo }}>
      <div style={{ fontSize: 34, fontWeight: 500, color: paleta.suave }}>Lucas, 24 anos · Força e explosão</div>
      <div style={{ fontSize: 48, fontWeight: 800, color: paleta.texto, marginTop: 6 }}>
        Salto vertical (CMJ) · nível {nivel}
      </div>
    </div>
  );
}

export function SeloDeVelocidade({ paleta, texto, destaque, duracao }: { paleta: Paleta; texto: string; destaque: boolean; duracao: number }) {
  const estilo = useEntradaESaida(duracao, 6);
  return (
    <div
      style={{
        position: 'absolute',
        top: 250,
        left: 72,
        padding: '14px 30px',
        borderRadius: 999,
        fontSize: 38,
        fontWeight: 700,
        color: destaque ? '#ffffff' : paleta.fundo,
        background: destaque ? paleta.acento : paleta.salmao,
        ...estilo,
      }}
    >
      {texto}
    </div>
  );
}

/* Legenda da fase (o mesmo texto que o app mostra sob a cena). `idade` =
   quadros desde a troca: a frase nova aparece esmaecendo em 6 quadros. Começa
   em 35%, não em zero: as trocas caem justo nos quadros que importam
   (decolagem, contato, absorção), e um quadro sem legenda ali confunde. */
export function LegendaDaFase({ paleta, fase, idade, opacidade }: { paleta: Paleta; fase: string; idade: number; opacidade: number }) {
  const entrada = interpolate(idade, [0, 6], [0.35, 1], { ...limitar, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: 'absolute', left: 72, right: 72, bottom: 120, textAlign: 'center', opacity: opacidade }}>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, color: paleta.salmao, marginBottom: 14 }}>FASE</div>
      <div
        style={{
          fontSize: 58,
          fontWeight: 800,
          lineHeight: 1.15,
          color: paleta.texto,
          opacity: entrada,
          transform: `translateY(${(1 - entrada) * 16}px)`,
        }}
      >
        {fase}
      </div>
    </div>
  );
}

/* Medidor da carga nos pés (Carga.pes do app, em vezes o peso corporal).
   Escala de 0 a 3×: o pico do impacto no nível 3 é 2,6×. O traço em 1× é o
   peso parado; no ar a barra zera. `pico` = maior valor do trecho até aqui. */
const ESCALA_MAXIMA = 3;
const ALTURA_DA_BARRA = 640;

export function MedidorDeCarga({ paleta, carga, pico, opacidade }: { paleta: Paleta; carga: number; pico: number; opacidade: number }) {
  const y = (valor: number) => ALTURA_DA_BARRA * (1 - Math.min(valor, ESCALA_MAXIMA) / ESCALA_MAXIMA);
  const acimaDoPeso = carga > 1.5;
  const rotulo: CSSProperties = { position: 'absolute', right: 84, fontSize: 26, fontWeight: 600, color: paleta.suave, whiteSpace: 'nowrap' };
  return (
    <div style={{ position: 'absolute', right: 72, top: 520, width: 300, opacity: opacidade }}>
      <div style={{ textAlign: 'right', fontSize: 30, fontWeight: 700, color: paleta.texto, marginBottom: 20 }}>Carga nos pés</div>
      <div style={{ position: 'relative', height: ALTURA_DA_BARRA }}>
        <div style={{ position: 'absolute', right: 0, top: 0, width: 64, height: ALTURA_DA_BARRA, borderRadius: 16, background: '#ffffff1f' }} />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: y(carga),
            width: 64,
            height: ALTURA_DA_BARRA - y(carga),
            borderRadius: 16,
            background: acimaDoPeso ? paleta.acento : paleta.salmao,
          }}
        />
        {[0, 1, 2, 3].map((valor) => (
          <div key={valor} style={{ ...rotulo, top: y(valor) - 16 }}>
            {valor}×
          </div>
        ))}
        {/* Peso corporal: a referência para ler "mais que o peso" no impulso. */}
        <div style={{ position: 'absolute', right: -8, top: y(1) - 2, width: 80, height: 4, background: paleta.texto }} />
        {pico > 0.05 && (
          <div style={{ position: 'absolute', right: -8, top: y(pico) - 2, width: 80, height: 4, background: paleta.acento, opacity: 0.9 }} />
        )}
      </div>
      <div style={{ textAlign: 'right', marginTop: 22 }}>
        <span style={{ fontSize: 76, fontWeight: 800, color: paleta.texto, fontVariantNumeric: 'tabular-nums' }}>{decimal(carga)}×</span>
        <div style={{ fontSize: 26, fontWeight: 500, color: paleta.suave }}>o peso corporal</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: paleta.acento, marginTop: 6 }}>pico {decimal(pico)}×</div>
      </div>
    </div>
  );
}

export function Fecho({ paleta }: { paleta: Paleta }) {
  const quadro = useCurrentFrame();
  const fundo = interpolate(quadro, [0, 12], [0, 0.88], limitar);
  const texto = interpolate(quadro, [6, 18], [0, 1], limitar);
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(20, 20, 30, ${fundo})`, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: texto, textAlign: 'center', padding: '0 96px' }}>
        <div style={{ width: 96, height: 10, borderRadius: 5, background: paleta.acento, margin: '0 auto 40px' }} />
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.25, color: paleta.texto }}>
          Dados: simulação do app, não substitui orientação profissional
        </div>
      </div>
    </AbsoluteFill>
  );
}
