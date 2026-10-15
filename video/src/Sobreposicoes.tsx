import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Cronometro } from './roteiro';

/* Textos, cronômetro e medidor por cima da cena 3D. Tudo anima pelo número
   do quadro (useCurrentFrame/interpolate/spring): transição ou animação de CSS
   não aparece no render, que tira uma foto por quadro.

   Layout (1080×1920): cabeçalho e selo de velocidade em cima, a cena no meio
   e um painel de dados embaixo (fase, cronômetro e carga). Na vista lateral o
   banquinho fica à direita e a perna da frente à esquerda, ocupando a largura
   toda na altura da plataforma; por isso o medidor fica no rodapé, e não
   numa coluna ao lado do boneco, onde cobriria o banquinho. */

/* `sobreAcento`: cor do texto em cima do acento (branco no vermelho do Lucas,
   escuro no âmbar do Diego, que com branco não teria contraste). */
export type Paleta = { fundo: string; acento: string; sobreAcento: string; salmao: string; texto: string; suave: string };

export const limitar = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const decimal = (valor: number) => valor.toFixed(1).replace('.', ',');
export const MARGEM = 64;

/* Entra subindo (mola sem quique) e sai esmaecendo nos últimos quadros. */
export function useEntradaESaida(duracao: number, saida = 10) {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame: quadro, fps, config: { damping: 200 }, durationInFrames: 18 });
  const sumir = interpolate(quadro, [duracao - saida, duracao], [1, 0], limitar);
  return { opacity: Math.min(entrada, sumir), transform: `translateY(${(1 - entrada) * 40}px)` };
}

export function Abertura({
  paleta,
  duracao,
  texto = 'Força e explosão · Lucas, 24 anos',
  textoMenor = 'Búlgaro explosivo',
}: {
  paleta: Paleta;
  duracao: number;
  texto?: string;
  textoMenor?: string;
}) {
  const quadro = useCurrentFrame();
  const titulo = useEntradaESaida(duracao);
  // O subtítulo entra um pouco depois do título, para a leitura ir de cima para baixo.
  const subtitulo = spring({ frame: quadro - 8, fps: useVideoConfig().fps, config: { damping: 200 }, durationInFrames: 18 });
  /* O título fica embaixo, no lugar do painel de dados (que só entra depois
     da abertura): em cima ele cobriria a cabeça do boneco em pé. O degradê
     só garante leitura sobre o chão e acompanha a opacidade do título. */
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(transparent 70%, ${paleta.fundo}cc 76%, ${paleta.fundo} 100%)`, opacity: titulo.opacity }} />
      <div style={{ position: 'absolute', top: 1440, left: 72, right: 72, ...titulo }}>
        <div style={{ width: 96, height: 10, borderRadius: 5, background: paleta.acento, marginBottom: 32 }} />
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, color: paleta.texto, letterSpacing: -1.5 }}>
          {texto}
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            marginTop: 24,
            color: paleta.salmao,
            opacity: subtitulo,
            transform: `translateY(${(1 - subtitulo) * 24}px)`,
          }}
        >
          {textoMenor}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* Cabeçalho discreto depois da abertura: quem pega o vídeo no meio sabe o que é. */
export function Cabecalho({ paleta, nivel, duracao }: { paleta: Paleta; nivel: number; duracao: number }) {
  const estilo = useEntradaESaida(duracao);
  return (
    <div style={{ position: 'absolute', top: 80, left: MARGEM, right: MARGEM, ...estilo }}>
      <div style={{ fontSize: 32, fontWeight: 500, color: paleta.suave }}>Lucas, 24 anos · Força e explosão</div>
      <div style={{ fontSize: 48, fontWeight: 800, color: paleta.texto, marginTop: 4 }}>Búlgaro explosivo · nível {nivel}</div>
    </div>
  );
}

export function SeloDeVelocidade({
  paleta,
  texto,
  destaque,
  duracao,
  posicao = { top: 222, left: MARGEM },
}: {
  paleta: Paleta;
  texto: string;
  destaque: boolean;
  duracao: number;
  posicao?: CSSProperties;
}) {
  const estilo = useEntradaESaida(duracao, 6);
  return (
    <div
      style={{
        position: 'absolute',
        ...posicao,
        padding: '12px 28px',
        borderRadius: 999,
        fontSize: 34,
        fontWeight: 700,
        color: destaque ? paleta.sobreAcento : paleta.fundo,
        background: destaque ? paleta.acento : paleta.salmao,
        ...estilo,
      }}
    >
      {texto}
    </div>
  );
}

/* Faixa "SUBIDA EXPLOSIVA" no alto, à direita do selo: acende durante a
   subida e segura um pouco depois (`intensidade` 0–1 vem de fora), porque a
   subida real dura só 18 quadros e sumiria antes de ser lida. */
export function FaixaDaSubida({
  paleta,
  intensidade,
  subida,
  topo = 222,
}: {
  paleta: Paleta;
  intensidade: number;
  subida: number;
  topo?: number;
}) {
  if (intensidade <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: topo,
        right: MARGEM,
        padding: '12px 26px',
        borderRadius: 18,
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 2,
        color: paleta.sobreAcento,
        background: paleta.acento,
        boxShadow: `0 0 ${40 * intensidade}px ${paleta.acento}`,
        opacity: intensidade,
        transform: `scale(${0.92 + 0.08 * intensidade})`,
        transformOrigin: 'right center',
      }}
    >
      SUBIDA EXPLOSIVA · {decimal(subida)} s
    </div>
  );
}

/* Moldura da cena acesa na subida: o destaque visual que não depende de ler. */
export function BrilhoDaSubida({ paleta, intensidade }: { paleta: Paleta; intensidade: number }) {
  if (intensidade <= 0.01) return null;
  return <AbsoluteFill style={{ boxShadow: `inset 0 0 ${120 * intensidade}px ${paleta.acento}`, opacity: 0.85 * intensidade }} />;
}

/* Legenda da fase (o mesmo texto que o app mostra sob a cena). `idade` =
   quadros desde a troca: a frase nova aparece esmaecendo em 6 quadros. Começa
   em 35%, não em zero: um quadro sem legenda logo na troca confunde. */
export function LegendaDaFase({
  paleta,
  fase,
  idade,
  opacidade,
  topo = 1372,
}: {
  paleta: Paleta;
  fase: string;
  idade: number;
  opacidade: number;
  topo?: number;
}) {
  const entrada = interpolate(idade, [0, 6], [0.35, 1], { ...limitar, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: 'absolute', left: MARGEM, right: MARGEM, top: topo, textAlign: 'center', opacity: opacidade }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: paleta.salmao, marginBottom: 10 }}>FASE</div>
      <div
        style={{
          // 44 px: a frase mais longa ("Termine com o pé inteiro…") quebra em
          // duas linhas e, maior, encostaria nos cartões do rodapé.
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.12,
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

/* Cartão do rodapé (cronômetro e carga), lado a lado. */
const LARGURA_DO_CARTAO = (1080 - 2 * MARGEM - 32) / 2;
const TOPO_DOS_CARTOES = 1560;
function Cartao({
  paleta,
  lado,
  titulo,
  children,
  opacidade,
  topo = TOPO_DOS_CARTOES,
}: {
  paleta: Paleta;
  lado: 'esquerda' | 'direita';
  titulo: string;
  children: ReactNode;
  opacidade: number;
  topo?: number | undefined;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: topo,
        [lado === 'esquerda' ? 'left' : 'right']: MARGEM,
        width: LARGURA_DO_CARTAO,
        height: 300,
        boxSizing: 'border-box',
        padding: '24px 28px',
        borderRadius: 28,
        background: '#ffffff12',
        opacity: opacidade,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: paleta.suave, marginBottom: 16 }}>{titulo}</div>
      {children}
    </div>
  );
}

/* Cronômetro do exercício: descida e subida em segundos do exercício (não do
   vídeo), cada uma com uma barra na mesma escala de tempo. Assim a diferença
   "descida 2,5 s × subida 0,6 s" se vê no tamanho das barras, e a da subida
   fica na cor de destaque. Os totais vêm de temposDoBulgaro (via roteiro). */
export function CronometroDoExercicio({
  paleta,
  cronometro,
  totais,
  opacidade,
  topo,
}: {
  paleta: Paleta;
  cronometro: Cronometro;
  totais: { descida: number; subida: number };
  opacidade: number;
  topo?: number;
}) {
  const escala = Math.max(totais.descida, totais.subida);
  const linha = (nome: string, valor: number, total: number, cor: string, ativa: boolean) => {
    const largura = LARGURA_DO_CARTAO - 56;
    return (
      <div style={{ marginBottom: 22, opacity: ativa ? 1 : 0.62 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: paleta.texto }}>{nome}</span>
          <span style={{ fontSize: 44, fontWeight: 800, color: ativa ? cor : paleta.texto, fontVariantNumeric: 'tabular-nums' }}>
            {decimal(valor)} s
          </span>
        </div>
        <div style={{ position: 'relative', height: 14, marginTop: 8, width: largura, borderRadius: 7, background: '#ffffff1f' }}>
          {/* Traço do total previsto, para a barra "encher" até ele. */}
          <div style={{ position: 'absolute', left: (largura * total) / escala - 2, top: -6, width: 4, height: 26, background: paleta.suave }} />
          <div style={{ position: 'absolute', left: 0, top: 0, height: 14, borderRadius: 7, width: (largura * valor) / escala, background: cor }} />
        </div>
      </div>
    );
  };
  const { etapa } = cronometro;
  return (
    <Cartao paleta={paleta} lado="esquerda" titulo="Tempo do movimento" opacidade={opacidade} topo={topo}>
      {linha('Descida', cronometro.descida, totais.descida, paleta.salmao, etapa === 'descida')}
      {linha('Subida', cronometro.subida, totais.subida, paleta.acento, etapa === 'subida' || etapa === 'topo')}
    </Cartao>
  );
}

/* Medidor da carga nos pés (Carga.pes do app, em vezes o peso corporal).
   Barra horizontal de 0 a 2×: sem salto não há impacto, e o pico do búlgaro
   nível 3 é ~1,55×; 2× deixa folga sem achatar a barra. O traço branco em 1×
   é o peso parado; o vermelho, o pico do trecho até aqui. Valores acima de 2×
   (não acontecem neste exercício) ficariam presos no fim da escala. */
export const ESCALA_MAXIMA_DA_CARGA = 2;

export function MedidorDeCarga({
  paleta,
  carga,
  pico,
  opacidade,
  topo,
}: {
  paleta: Paleta;
  carga: number;
  pico: number;
  opacidade: number;
  topo?: number;
}) {
  const largura = LARGURA_DO_CARTAO - 56;
  const x = (valor: number) => (largura * Math.min(Math.max(valor, 0), ESCALA_MAXIMA_DA_CARGA)) / ESCALA_MAXIMA_DA_CARGA;
  const acimaDoPeso = carga > 1.15;
  const marca: CSSProperties = { position: 'absolute', top: 40, fontSize: 24, fontWeight: 600, color: paleta.suave, transform: 'translateX(-50%)' };
  return (
    <Cartao paleta={paleta} lado="direita" titulo="Carga nos pés" opacidade={opacidade} topo={topo}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 64, fontWeight: 800, color: paleta.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{decimal(carga)}×</span>
        <span style={{ fontSize: 24, fontWeight: 500, color: paleta.suave }}>o peso</span>
        <span style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 700, color: paleta.acento }}>pico {decimal(pico)}×</span>
      </div>
      <div style={{ position: 'relative', height: 80, marginTop: 22, width: largura }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: largura, height: 28, borderRadius: 14, background: '#ffffff1f' }} />
        <div
          style={{ position: 'absolute', left: 0, top: 0, width: x(carga), height: 28, borderRadius: 14, background: acimaDoPeso ? paleta.acento : paleta.salmao }}
        />
        {/* Peso corporal: a referência para ler "mais que o peso" na subida. */}
        <div style={{ position: 'absolute', left: x(1) - 2, top: -8, width: 4, height: 44, background: paleta.texto }} />
        {pico > 0.05 && <div style={{ position: 'absolute', left: x(pico) - 2, top: -8, width: 4, height: 44, background: paleta.acento }} />}
        {[0, 1, 2].map((valor) => (
          <div key={valor} style={{ ...marca, left: x(valor) }}>
            {valor}×
          </div>
        ))}
      </div>
    </Cartao>
  );
}

export function Fecho({ paleta, nota }: { paleta: Paleta; nota?: string }) {
  const quadro = useCurrentFrame();
  const fundo = interpolate(quadro, [0, 12], [0, 0.9], limitar);
  const texto = interpolate(quadro, [6, 18], [0, 1], limitar);
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(20, 20, 30, ${fundo})`, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: texto, textAlign: 'center', padding: '0 96px' }}>
        <div style={{ width: 96, height: 10, borderRadius: 5, background: paleta.acento, margin: '0 auto 40px' }} />
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.25, color: paleta.texto }}>
          Dados: simulação do app, não substitui orientação profissional
        </div>
        {nota && <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.35, color: paleta.suave, marginTop: 36 }}>{nota}</div>}
      </div>
    </AbsoluteFill>
  );
}
