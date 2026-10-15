import '@fontsource-variable/inter';
import { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useDelayRender } from 'remotion';
import { respiracao } from '../../app/src/movimento/transicoes';
import { CenaDoBulgaro } from './CenaDoBulgaro';
import { coresDaCenaDoApp, tokenDoApp } from './cores';
import {
  type IdDoTrecho,
  type ParametrosDoVideo,
  type Roteiro,
  amostraNoQuadro,
  cronometroNoTempo,
  montarRoteiro,
  quadrosDesdeATrocaDeFase,
  tempoNoQuadro,
  trechoNoQuadro,
} from './roteiro';
import {
  Abertura,
  BrilhoDaSubida,
  Cabecalho,
  CronometroDoExercicio,
  FaixaDaSubida,
  Fecho,
  LegendaDaFase,
  MedidorDeCarga,
  type Paleta,
  SeloDeVelocidade,
} from './Sobreposicoes';

/* Composição "Bulgaro": o agachamento búlgaro explosivo do app, nível 3, para
   a apresentação do perfil do Lucas (conta de demonstração). Abertura com o
   título, o ciclo em câmera lenta e depois em velocidade real, e o aviso no
   fecho. A pose, a fase e a carga de cada quadro vêm do motor do app
   (amostrar + montarEsqueleto) no instante dado por roteiro.ts. */

const FONTE = "'Inter Variable', system-ui, sans-serif";

/* A fonte vem de um CSS (@fontsource); sem esperar, os primeiros quadros
   sairiam com a fonte do sistema. */
function useFonteCarregada() {
  const { delayRender, continueRender } = useDelayRender();
  const [espera] = useState(() => delayRender('Carregando a fonte Inter'));
  useEffect(() => {
    Promise.all([document.fonts.load(`800 64px 'Inter Variable'`), document.fonts.load(`500 32px 'Inter Variable'`)]).finally(() =>
      continueRender(espera),
    );
  }, [continueRender, espera]);
}

const trecho = (roteiro: Roteiro, id: IdDoTrecho) => roteiro.trechos.find((t) => t.id === id)!;

/* Maior carga nos pés do início do trecho até o quadro: o "pico" do medidor. */
function picoNoTrecho(roteiro: Roteiro, quadro: number): number {
  const atual = trechoNoQuadro(roteiro, quadro);
  let pico = 0;
  for (let q = atual.de; q <= quadro; q++) pico = Math.max(pico, amostraNoQuadro(roteiro, q).carga.pes);
  return pico;
}

/* Destaque da subida (0–1), em segundos do exercício: acende rápido no
   começo da subida e só apaga depois do topo, para a faixa ser lida mesmo na
   velocidade real (a subida dura 18 quadros). Apaga até o fim da janela do
   roteiro (topo + 0,3 s), para não cortar aceso na emenda lenta → real. */
function intensidadeDaSubida(roteiro: Roteiro, tempo: number): number {
  const { tComeca, tTopo } = roteiro.tempos;
  return interpolate(tempo, [tComeca - 0.05, tComeca + 0.05, tTopo + 0.1, tTopo + 0.28], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function Bulgaro({ nivel, velocidadeLenta }: ParametrosDoVideo) {
  useFonteCarregada();
  const quadro = useCurrentFrame();
  const roteiro = useMemo(() => montarRoteiro({ nivel, velocidadeLenta }), [nivel, velocidadeLenta]);
  const cores = useMemo(() => coresDaCenaDoApp(), []);
  const paleta: Paleta = useMemo(
    () => ({ fundo: cores.fundo, acento: tokenDoApp('primaria', '#e0214f'), salmao: cores.sensores, texto: '#ffffff', suave: '#c9cad6' }),
    [cores],
  );

  const tempo = tempoNoQuadro(roteiro, quadro);
  const amostra = amostraNoQuadro(roteiro, quadro);
  // Respiração (M3 do app): só no desenho, como no Boneco; a carga fica intacta.
  const pose = useMemo(() => ({ ...amostra.pose, tronco: amostra.pose.tronco + respiracao(tempo) }), [amostra, tempo]);

  const abertura = trecho(roteiro, 'abertura');
  const lenta = trecho(roteiro, 'lenta');
  const real = trecho(roteiro, 'real');
  const fecho = trecho(roteiro, 'fecho');
  const noExercicio = quadro >= lenta.de && quadro < real.ate;
  // Painel de dados: entra no fim da abertura e sai no começo do fecho.
  const dados = interpolate(quadro, [abertura.ate - 8, abertura.ate, fecho.de, fecho.de + 8], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subida = noExercicio ? intensidadeDaSubida(roteiro, tempo) : 0;
  const { descida: totalDaDescida, subida: totalDaSubida } = roteiro.tempos;

  return (
    <AbsoluteFill style={{ backgroundColor: cores.fundo, fontFamily: FONTE }}>
      <CenaDoBulgaro animacao={roteiro.animacao} pose={pose} carga={amostra.carga} cores={cores} />
      <BrilhoDaSubida paleta={paleta} intensidade={subida} />
      <Sequence durationInFrames={abertura.ate} premountFor={15}>
        <Abertura paleta={paleta} duracao={abertura.ate} />
      </Sequence>
      <Sequence from={lenta.de} durationInFrames={real.ate - lenta.de} premountFor={15}>
        <Cabecalho paleta={paleta} nivel={nivel} duracao={real.ate - lenta.de} />
      </Sequence>
      <Sequence from={lenta.de} durationInFrames={lenta.ate - lenta.de} premountFor={15}>
        <SeloDeVelocidade
          paleta={paleta}
          texto={`Câmera lenta ${String(velocidadeLenta).replace('.', ',')}×`}
          destaque={false}
          duracao={lenta.ate - lenta.de}
        />
      </Sequence>
      <Sequence from={real.de} durationInFrames={real.ate - real.de} premountFor={15}>
        <SeloDeVelocidade paleta={paleta} texto="Velocidade real 1×" destaque duracao={real.ate - real.de} />
      </Sequence>
      <FaixaDaSubida paleta={paleta} intensidade={subida} subida={totalDaSubida} />
      <LegendaDaFase paleta={paleta} fase={amostra.fase} idade={quadrosDesdeATrocaDeFase(roteiro, quadro)} opacidade={dados} />
      <CronometroDoExercicio
        paleta={paleta}
        cronometro={cronometroNoTempo(roteiro.tempos, tempo)}
        totais={{ descida: totalDaDescida, subida: totalDaSubida }}
        opacidade={dados}
      />
      <MedidorDeCarga paleta={paleta} carga={amostra.carga.pes} pico={picoNoTrecho(roteiro, quadro)} opacidade={dados} />
      <Sequence from={fecho.de} premountFor={15}>
        <Fecho paleta={paleta} />
      </Sequence>
    </AbsoluteFill>
  );
}
