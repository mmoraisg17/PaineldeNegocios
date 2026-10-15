import '@fontsource-variable/inter';
import { useMemo } from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { respiracao } from '../../app/src/movimento/transicoes';
import { FONTE, intensidadeDaSubida, picoNoTrecho, useFonteCarregada } from './Bulgaro';
import { CenaDoBulgaro, type Enquadramento } from './CenaDoBulgaro';
import { coresDaCenaDoApp, coresDosAtletas } from './cores';
import { type IdDoAtleta, cartoesDaDemo } from './dadosDaDemo';
import { amostraNoQuadro, cronometroNoTempo, quadrosDesdeATrocaDeFase, tempoNoQuadro, trechoNoQuadro } from './roteiro';
import {
  VELOCIDADE_LENTA,
  escurecimentoNoQuadro,
  montarRoteiroLucasEDiego,
  trechoLD,
} from './roteiroLucasEDiego';
import {
  Abertura,
  BrilhoDaSubida,
  CronometroDoExercicio,
  FaixaDaSubida,
  Fecho,
  LegendaDaFase,
  MARGEM,
  MedidorDeCarga,
  type Paleta,
  SeloDeVelocidade,
} from './Sobreposicoes';
import { CabecalhoDoAtleta, CartaoDoAtletaNaTela, Comparacao } from './SobreposicoesDosAtletas';

/* Composição "LucasEDiego": o búlgaro explosivo nível 3 do app apresentado
   pelas duas contas modelo de demonstração (Lucas, que treina por conta
   própria, e Diego, acompanhado pela preparadora física Renata), cada um com
   o cartão de dados do estado de demonstração, e no fim os dois lado a lado.
   O movimento é o mesmo nos dois blocos (mesmo exercício, mesmo nível): o que
   muda são os dados e a cor de destaque. */

/* Câmera mais longe e alvo mais alto que no vídeo "Bulgaro": o cartão do
   atleta ocupa o alto da tela, e boneco, banquinho e plataforma precisam
   caber entre ele e a legenda da fase. */
export const ENQUADRAMENTO_DOS_ATLETAS: Enquadramento = { distancia: 6.1, altura: 1.25, alvoY: 0.98 };

/* Posições do layout com o cartão (ver SobreposicoesDosAtletas.tsx). O selo
   de velocidade e a faixa da subida ficam à direita, no alto da cena, logo
   abaixo do cartão: ali só há fundo (a cabeça do boneco fica à esquerda).
   No topo, ao lado do nome, o selo encostava no "Acompanhado por Renata,
   preparadora física", que é longo. */
const SELO = { top: 598, right: MARGEM };
const TOPO_DA_FAIXA = 684;
const TOPO_DA_LEGENDA = 1428;
const TOPO_DOS_CARTOES = 1580;

const NOMES_DOS_TRECHOS = { lenta: `Câmera lenta ${String(VELOCIDADE_LENTA).replace('.', ',')}×`, real: 'Velocidade real 1×' };

/* "Lucas, Diego e Renata". */
const listarNomes = (nomes: readonly string[]) =>
  nomes.length < 2 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`;

export function LucasEDiego() {
  useFonteCarregada();
  const quadro = useCurrentFrame();
  const roteiro = useMemo(() => montarRoteiroLucasEDiego(), []);
  const cartoes = useMemo(() => cartoesDaDemo(), []);
  const cores = useMemo(() => coresDaCenaDoApp(), []);
  const paletas: Record<IdDoAtleta, Paleta> = useMemo(() => {
    const doAtleta = coresDosAtletas();
    const base = { fundo: cores.fundo, salmao: cores.sensores, texto: '#ffffff', suave: '#c9cad6' };
    return { lucas: { ...base, ...doAtleta.lucas }, diego: { ...base, ...doAtleta.diego } };
  }, [cores]);

  const trecho = trechoNoQuadro(roteiro, quadro);
  const atleta = trecho.atleta;
  const paleta = paletas[atleta ?? 'lucas'];
  const tempo = tempoNoQuadro(roteiro, quadro);
  const amostra = amostraNoQuadro(roteiro, quadro);
  // Respiração (M3 do app): só no desenho, como no Boneco; a carga fica intacta.
  const pose = useMemo(() => ({ ...amostra.pose, tronco: amostra.pose.tronco + respiracao(tempo) }), [amostra, tempo]);

  // Quem aparece no vídeo (atletas e quem ajusta a rotina deles), para o aviso do fecho.
  const nomesDaDemo = [cartoes.lucas.nome, cartoes.diego.nome, cartoes.lucas.ajustadoPor, cartoes.diego.ajustadoPor].filter(
    (nome): nome is string => nome !== undefined,
  );
  const abertura = trechoLD(roteiro, 'abertura');
  const comparacao = trechoLD(roteiro, 'comparacao');
  const fecho = trechoLD(roteiro, 'fecho');
  const noExercicio = atleta !== undefined;
  const subida = noExercicio ? intensidadeDaSubida(roteiro, tempo) : 0;
  const { descida: totalDaDescida, subida: totalDaSubida } = roteiro.tempos;
  // Painel de dados (fase, tempo, carga): entra no fim da abertura e sai antes da comparação.
  const dados = interpolate(quadro, [abertura.ate - 8, abertura.ate, comparacao.de - 6, comparacao.de], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cores.fundo, fontFamily: FONTE }}>
      {/* Uma cena só para a abertura e os dois atletas (um contexto WebGL); na
          comparação e no fecho ela é desmontada. A camisa muda com o atleta;
          na abertura o boneco fica com a cor do manequim do app. */}
      <Sequence durationInFrames={comparacao.de} premountFor={15}>
        <CenaDoBulgaro
          animacao={roteiro.animacao}
          pose={pose}
          carga={amostra.carga}
          cores={cores}
          enquadramento={ENQUADRAMENTO_DOS_ATLETAS}
          camisa={atleta ? paletas[atleta].acento : undefined}
        />
      </Sequence>
      <BrilhoDaSubida paleta={paleta} intensidade={subida} />

      <Sequence durationInFrames={abertura.ate} premountFor={15}>
        <Abertura paleta={paletas.lucas} duracao={abertura.ate} texto="Força e explosão" textoMenor="Búlgaro explosivo" />
      </Sequence>

      {(['lucas', 'diego'] as const).map((id) => {
        const lenta = trechoLD(roteiro, `${id}-lenta`);
        const real = trechoLD(roteiro, `${id}-real`);
        const duracao = real.ate - lenta.de;
        const doAtleta = paletas[id];
        return (
          <Sequence key={id} from={lenta.de} durationInFrames={duracao} premountFor={15}>
            <CabecalhoDoAtleta paleta={doAtleta} cartao={cartoes[id]} duracao={duracao} />
            <CartaoDoAtletaNaTela paleta={doAtleta} cartao={cartoes[id]} duracao={duracao} />
            <Sequence durationInFrames={lenta.ate - lenta.de}>
              <SeloDeVelocidade
                paleta={doAtleta}
                texto={NOMES_DOS_TRECHOS.lenta}
                destaque={false}
                duracao={lenta.ate - lenta.de}
                posicao={SELO}
              />
            </Sequence>
            <Sequence from={real.de - lenta.de} durationInFrames={real.ate - real.de}>
              <SeloDeVelocidade
                paleta={doAtleta}
                texto={NOMES_DOS_TRECHOS.real}
                destaque
                duracao={real.ate - real.de}
                posicao={SELO}
              />
            </Sequence>
          </Sequence>
        );
      })}

      <FaixaDaSubida paleta={paleta} intensidade={subida} subida={totalDaSubida} topo={TOPO_DA_FAIXA} />
      {quadro < comparacao.de ? (
        <>
          <LegendaDaFase
            paleta={paleta}
            fase={amostra.fase}
            idade={quadrosDesdeATrocaDeFase(roteiro, quadro)}
            opacidade={dados}
            topo={TOPO_DA_LEGENDA}
          />
          <CronometroDoExercicio
            paleta={paleta}
            cronometro={cronometroNoTempo(roteiro.tempos, tempo)}
            totais={{ descida: totalDaDescida, subida: totalDaSubida }}
            opacidade={dados}
            topo={TOPO_DOS_CARTOES}
          />
          <MedidorDeCarga paleta={paleta} carga={amostra.carga.pes} pico={picoNoTrecho(roteiro, quadro)} opacidade={dados} topo={TOPO_DOS_CARTOES} />
        </>
      ) : null}

      <Sequence from={comparacao.de} durationInFrames={comparacao.ate - comparacao.de} premountFor={15}>
        <Comparacao paletas={paletas} cartoes={cartoes} duracao={comparacao.ate - comparacao.de} />
      </Sequence>
      <Sequence from={fecho.de} premountFor={15}>
        <AbsoluteFill style={{ backgroundColor: cores.fundo }} />
        <Fecho paleta={paletas.lucas} nota={`${listarNomes(nomesDaDemo)} são contas de demonstração.`} />
      </Sequence>

      {/* Troca de cena: escurece e clareia em poucos quadros (ver trocasDeCena). */}
      <AbsoluteFill style={{ backgroundColor: cores.fundo, opacity: escurecimentoNoQuadro(roteiro, quadro), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
