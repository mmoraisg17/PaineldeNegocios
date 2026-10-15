import '@fontsource-variable/inter';
import { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useDelayRender } from 'remotion';
import { respiracao } from '../../app/src/movimento/transicoes';
import { CenaDoSalto } from './CenaDoSalto';
import { coresDaCenaDoApp, tokenDoApp } from './cores';
import {
  type IdDoTrecho,
  type ParametrosDoVideo,
  type Roteiro,
  amostraNoQuadro,
  montarRoteiro,
  quadrosDesdeATrocaDeFase,
  tempoNoQuadro,
  trechoNoQuadro,
} from './roteiro';
import { Abertura, Cabecalho, Fecho, LegendaDaFase, MedidorDeCarga, type Paleta, SeloDeVelocidade } from './Sobreposicoes';

/* Composição "Salto": o salto vertical (CMJ) do app, nível 3, para a
   apresentação do perfil do Lucas (conta de demonstração). Abertura com o
   título, o salto em câmera lenta e depois em velocidade real, e o aviso no
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

export function Salto({ nivel, velocidadeLenta }: ParametrosDoVideo) {
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
  // Legenda e medidor: entram no fim da abertura e saem no começo do fecho.
  const dados = interpolate(quadro, [abertura.ate - 8, abertura.ate, fecho.de, fecho.de + 8], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cores.fundo, fontFamily: FONTE }}>
      <CenaDoSalto animacao={roteiro.animacao} pose={pose} carga={amostra.carga} cores={cores} />
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
      <LegendaDaFase paleta={paleta} fase={amostra.fase} idade={quadrosDesdeATrocaDeFase(roteiro, quadro)} opacidade={dados} />
      <MedidorDeCarga paleta={paleta} carga={amostra.carga.pes} pico={picoNoTrecho(roteiro, quadro)} opacidade={dados} />
      <Sequence from={fecho.de} premountFor={15}>
        <Fecho paleta={paleta} />
      </Sequence>
    </AbsoluteFill>
  );
}
