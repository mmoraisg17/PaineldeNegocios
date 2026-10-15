import type { Animacao, Quadro } from '../animacao';
import { TOPO_BASE } from '../cenario';
import type { ModoBracos, Pose } from '../corpo';
import { carga, pesoNasMaos, pose, quadrilParaFlexao } from './comum';
import { CADEIRA_SENTAR } from './sentarELevantar';

/* Agachamento búlgaro explosivo (trilha Força e explosão).

   Pesquisa (docs/pesquisa/exercicios/10-bulgaro-explosivo.md):
   - Agachamento unilateral com o pé de trás no banquinho (RFESS): a perna da
     frente leva ~84% da força vertical (Helme 2022) e o exercício ativa mais
     isquiotibial e glúteo médio que o split squat (Mausehund 2018).
   - A intenção de mover rápido, e não a velocidade real, define a adaptação à
     velocidade (Behm e Sale 1993; meta-análise de RFD, 2021). Por isso: descida
     controlada de 2–3 s e subida o mais rápida possível, mas sem voo: o pé da
     frente termina inteiro no chão. É uma extrapolação (não há estudo do RFESS
     com intenção máxima e sem salto).
   - Sem salto, a plataforma não recebe impacto: o pico de carga da subida é
     ~1,3–1,6× o peso, não os 2,6× da aterrissagem.

   Geometria: o banquinho fica em cima da plataforma, na parte de trás (a
   mesma posição do sentar e levantar, assento a 0,40 m da base). O pé da frente
   pisa inteiro a 0,27 m do centro e o de trás apoia a ponta dos dedos no
   banquinho: o boneco não tem o peito do pé deitado, então a ponta rodada é o
   que ele consegue mostrar. A perna esquerda fica na frente (convenção das
   demonstrações de um pé só). O joelho de trás chega a ~112° no fundo; a
   pesquisa estima 90–110° (estimativa, não medida).

   Níveis: 1 = duas mãos nas barras, descida rasa (70°) e subida em 1,2 s;
   2 = uma mão, 80° e 0,9 s; 3 = sem as mãos, 90° e subida máxima (0,6 s). */

type Nivel = 1 | 2 | 3;
type PorNivel<T> = Record<Nivel, T>;

const JOELHO_NO_FUNDO: PorNivel<number> = { 1: 70, 2: 80, 3: 90 };
const TRONCO_NO_FUNDO: PorNivel<number> = { 1: 20, 2: 23, 3: 25 };
/* Duração da subida (s). Nível 3: abaixo de 0,7 s, como pede a pesquisa. */
const SUBIDA: PorNivel<number> = { 1: 1.2, 2: 0.9, 3: 0.6 };
/* Pico de carga na base (× peso) no meio da subida: peso + aceleração do corpo. */
const PICO_DA_SUBIDA: PorNivel<number> = { 1: 1.25, 2: 1.4, 3: 1.55 };

const DESCIDA = 2.5; // s, excêntrica controlada (2–3 s)
const PAUSA_NO_FUNDO = 0.5;
const PAUSA_INICIAL = 1.0;
const FIRME_NO_FIM = 1.0;
const JOELHO_EM_PE = 24; // num pé só o quadril fica 8,5 cm ao lado do pé: o joelho dobra um pouco mais que em pé nos dois pés
const TRONCO_EM_PE = 12;
const CANELA_NO_FUNDO = 0.25; // canela quase vertical: o joelho não passa muito dos dedos
const SOBRE_O_PE_ESQUERDO = 0.085;

/* Pé da frente: 0,27 m à frente do centro, com a ponta a 0,44 m (a base vai a 0,50 m). */
export const PE_DA_FRENTE_DZ = 0.27;
/* Pé de trás: ponta dos dedos no banquinho, a 0,46 m atrás do centro (assento de
   0,45 m, centro em −0,283 m), a altura do assento acima da base. */
const PONTA_DO_PE_DE_TRAS_Z = -0.46;
const PE_DE_TRAS = {
  dx: SOBRE_O_PE_ESQUERDO,
  dz: PONTA_DO_PE_DE_TRAS_Z - 0.17, // dz é o deslocamento do pé; a ponta fica 0,17 m à frente do tornozelo
  elevacao: CADEIRA_SENTAR.assentoY - TOPO_BASE,
  calcanhar: 70,
} as const;

export const tempoDaSubida = (nivel: Nivel): number => SUBIDA[nivel];
export const temposDoBulgaro = (nivel: Nivel) => {
  const tFundo = PAUSA_INICIAL + DESCIDA;
  const tComeca = tFundo + PAUSA_NO_FUNDO;
  return { tFundo, tComeca, tTopo: tComeca + SUBIDA[nivel] };
};

export function agachamentoBulgaroExplosivo(bracos: ModoBracos, nivel: Nivel): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const { tFundo, tComeca, tTopo } = temposDoBulgaro(nivel);

  const p = (joelho: number, tronco: number, canela?: number): Pose => {
    const h = quadrilParaFlexao(joelho, canela);
    return pose(
      {
        quadril: { y: h.y, z: h.z + PE_DA_FRENTE_DZ },
        tronco,
        deslocamentoLateral: SOBRE_O_PE_ESQUERDO,
        maoZ: 0.12,
        pes: { esquerdo: { dz: PE_DA_FRENTE_DZ }, direito: PE_DE_TRAS },
      },
      bracos,
    );
  };
  const emPe = p(JOELHO_EM_PE, TRONCO_EM_PE);
  const noFundo = p(JOELHO_NO_FUNDO[nivel], TRONCO_NO_FUNDO[nivel], CANELA_NO_FUNDO);
  const metade = p((JOELHO_NO_FUNDO[nivel] + JOELHO_EM_PE) / 2, (TRONCO_NO_FUNDO[nivel] + TRONCO_EM_PE) / 2, 0.35);

  const quadros: Quadro[] = [
    { t: 0, pose: emPe, carga: carga(1, 0.05, maos(0.06), 1), fase: 'Em pé, pé da frente inteiro no chão' },
    { t: PAUSA_INICIAL, pose: emPe, carga: carga(1, 0.05, maos(0.06), 1), fase: 'Desça devagar, contando até 3' },
    { t: tFundo, pose: noFundo, carga: carga(1.02, 0.1, maos(0.08), 1), fase: 'Segure meio segundo embaixo' },
    { t: tComeca, pose: noFundo, carga: carga(1.02, 0.1, maos(0.08), 1), fase: 'Suba o mais rápido que conseguir' },
    {
      t: tComeca + SUBIDA[nivel] / 2,
      pose: metade,
      carga: carga(PICO_DA_SUBIDA[nivel], 0.12, maos(0.1), 1),
      fase: 'Suba o mais rápido que conseguir',
    },
    { t: tTopo, pose: emPe, carga: carga(0.97, 0.05, maos(0.06), 1), fase: 'Termine com o pé inteiro no chão, sem saltar' },
    { t: tTopo + FIRME_NO_FIM, pose: emPe, carga: carga(1, 0.05, maos(0.06), 1), fase: 'Em pé, pé da frente inteiro no chão' },
  ];

  return {
    id: 'agachamento-bulgaro-explosivo',
    quadros,
    cadeira: CADEIRA_SENTAR,
    musculos: ['quadriceps', 'gluteos', 'abdutores'],
    // De lado (esquerda do praticante): a perna da frente e o pé de trás no banquinho.
    camera: { posicao: [3.6, 1.45, -0.05], alvo: [0, 0.85, -0.05] },
  };
}
