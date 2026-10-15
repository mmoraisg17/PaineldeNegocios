import type { Animacao } from '../../app/src/movimento/animacao';
import type { IdDoAtleta } from './dadosDaDemo';
import {
  ANTES_DA_DESCIDA,
  DEPOIS_DO_TOPO,
  type Nivel,
  type TemposDoCiclo,
  type Trecho,
  animacaoDoBulgaro,
  quadroDoTempo,
  quadros,
  temposDoCiclo,
} from './roteiro';

/* Roteiro do vídeo "LucasEDiego": o mesmo búlgaro explosivo nível 3 do app
   mostrado duas vezes, uma por conta de demonstração, e depois os números
   dos dois lado a lado. Como em roteiro.ts, tudo é função pura do número do
   quadro (o Remotion renderiza fora de ordem e em paralelo).

   Por que a câmera lenta não pega o ciclo inteiro: o ciclo mostrado tem 4 s
   (descida de 2,5 s, meio segundo parado no fundo, subida de 0,6 s e a
   chegada em pé); a 0,5× seriam 8 s por atleta só de câmera lenta, e o vídeo
   passaria de 30 s. A lenta pega o fim da descida, o fundo e a subida (o que
   interessa ver devagar, já que a descida é lenta de propósito); a velocidade
   real mostra o ciclo inteiro. Cada bloco fica com 8,2 s. */

export const NIVEL_DO_VIDEO: Nivel = 3;
export const VELOCIDADE_LENTA = 0.5;

/* Segundos de vídeo. */
const ABERTURA = 2;
const COMPARACAO = 4;
const FECHO = 1.5;
/* A câmera lenta começa este tanto (segundos da animação) antes do fundo. */
const LENTA_ANTES_DO_FUNDO = 0.7;

export type IdDoTrechoLD = 'abertura' | 'lucas-lenta' | 'lucas-real' | 'diego-lenta' | 'diego-real' | 'comparacao' | 'fecho';
export type TrechoLD = Trecho<IdDoTrechoLD> & {
  /* De quem é o trecho (cor, cartão, título); abertura, comparação e fecho não têm dono. */
  readonly atleta?: IdDoAtleta;
};

export type RoteiroLD = {
  readonly animacao: Animacao;
  readonly trechos: readonly TrechoLD[];
  readonly duracaoEmQuadros: number;
  readonly tempos: TemposDoCiclo;
};

export function montarRoteiroLucasEDiego(): RoteiroLD {
  const animacao = animacaoDoBulgaro(NIVEL_DO_VIDEO);
  const tempos = temposDoCiclo(animacao, NIVEL_DO_VIDEO);
  const inicioDoCiclo = tempos.inicioDaDescida - ANTES_DA_DESCIDA;
  const fim = tempos.tTopo + DEPOIS_DO_TOPO;
  const inicioDaLenta = tempos.tFundo - LENTA_ANTES_DO_FUNDO;

  const trechos: TrechoLD[] = [];
  const somar = (id: IdDoTrechoLD, duracao: number, tempoInicial: number, velocidade: number, extras: { atleta?: IdDoAtleta } = {}) => {
    const de = trechos.at(-1)?.ate ?? 0;
    trechos.push({ id, de, ate: de + duracao, tempoInicial, velocidade, ...extras });
  };
  /* Abertura: o boneco em pé, respirando (pausa inicial do ciclo, como no
     vídeo "Bulgaro"), sem chegar à descida. */
  somar('abertura', quadros(ABERTURA), 0, inicioDoCiclo / ABERTURA);
  for (const atleta of ['lucas', 'diego'] as const) {
    somar(`${atleta}-lenta`, quadros((fim - inicioDaLenta) / VELOCIDADE_LENTA), inicioDaLenta, VELOCIDADE_LENTA, { atleta });
    somar(`${atleta}-real`, quadros(fim - inicioDoCiclo), inicioDoCiclo, 1, { atleta });
  }
  /* Comparação e fecho são cartões cheios, sem a cena 3D (ela nem é montada,
     o que também encurta o render): o tempo da animação para no fim do ciclo. */
  somar('comparacao', quadros(COMPARACAO), fim, 0);
  somar('fecho', quadros(FECHO), fim, 0);
  return { animacao, trechos, duracaoEmQuadros: trechos.at(-1)?.ate ?? 0, tempos };
}

export function trechoLD(roteiro: RoteiroLD, id: IdDoTrechoLD): TrechoLD {
  const achado = roteiro.trechos.find((t) => t.id === id);
  if (!achado) throw new Error(`Trecho ${id} não existe no roteiro`);
  return achado;
}

/* Quadros em que a imagem troca de cena (abertura → Lucas → Diego →
   comparação). Ali o vídeo escurece e clareia rápido (`escurecimentoNoQuadro`),
   para a troca de atleta (e o salto do boneco em pé para o fim da descida)
   não parecer um tropeço da animação. A emenda lenta → real de cada atleta
   NÃO entra: ela é a mesma cena, só muda o selo de velocidade. */
export function trocasDeCena(roteiro: RoteiroLD): number[] {
  return ['lucas-lenta', 'diego-lenta', 'comparacao'].map((id) => trechoLD(roteiro, id as IdDoTrechoLD).de);
}

const QUADROS_DO_ESCURECIMENTO = 6;
/* 0 = imagem normal, 1 = tela no fundo escuro. Pico exatamente no quadro da troca. */
export function escurecimentoNoQuadro(roteiro: RoteiroLD, quadro: number): number {
  let maior = 0;
  for (const troca of trocasDeCena(roteiro)) {
    // A imagem nova aparece no quadro da troca: o escuro termina meio quadro antes dela.
    const distancia = quadro < troca ? troca - 1 - quadro : quadro - troca;
    maior = Math.max(maior, 1 - Math.min(distancia, QUADROS_DO_ESCURECIMENTO) / QUADROS_DO_ESCURECIMENTO);
  }
  return maior;
}

/* Pôster: o meio da subida do Diego na câmera lenta, com o cartão dele (e o
   recado da Renata) na tela. O script `npm run poster:lucas-diego` usa este
   número; o teste confere. */
export function quadroDoPosterLD(roteiro: RoteiroLD): number {
  const { tComeca, tTopo } = roteiro.tempos;
  return quadroDoTempo(roteiro, (tComeca + tTopo) / 2, 'diego-lenta');
}
