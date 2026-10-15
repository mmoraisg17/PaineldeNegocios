import type { Animacao, Quadro } from '../animacao';
import { CORPO } from '../cenario';
import type { ModoBracos, Pose } from '../corpo';
import { EM_PE, carga, pesoNasMaos, pose, quadrilParaFlexao } from './comum';

/* Salto vertical com contramovimento, CMJ (trilha Força e explosão).

   Pesquisa (docs/pesquisa/exercicios/09-forca-e-explosao-futevolei.md, seção 3):
   - Contramovimento rápido (~0,5 s): joelho ~95°, quadril ~80° e tronco ~40°
     à frente no fundo; extensão explosiva em ~0,25 s.
   - Aterrissagem em ponta e meio-pé, joelho ~25° no contato, absorção até
     ~90° em 0,3–0,4 s e 2 s parado antes do próximo salto.
   - Pliometria melhora o salto com contramovimento em atletas saudáveis
     (meta-análises em Frontiers in Physiology, 2024 e 2025).
   - Nunca com inclinação, nem com o banquinho montado (limite da plataforma).

   O voo é uma parábola de verdade: o tempo no ar vem da altura
   (T = 2·√(2h/g)) e os pés saem e voltam ao mesmo lugar, sem escorregar. A
   carga medida vai a zero no ar e passa de 2× o peso no impulso e na
   aterrissagem (a plataforma lê isso como o pico de força). Níveis:
   1 = mãos nas barras, só desgrudar os pés; 2 = sem as mãos, salto médio;
   3 = sem as mãos, salto máximo. Sem as mãos, os braços cruzam o peito: com as
   mãos nas barras o boneco não alcançaria a barra no alto do salto. */

const GRAVIDADE = 9.81;
const radianos = (graus: number) => (graus * Math.PI) / 180;

type Nivel = 1 | 2 | 3;
type PorNivel<T> = Record<Nivel, T>;

/* Altura do voo (m) e quanto o corpo "desce" para saltar (graus de joelho). */
const ALTURA_DO_SALTO: PorNivel<number> = { 1: 0.05, 2: 0.2, 3: 0.3 };
const JOELHO_NO_FUNDO: PorNivel<number> = { 1: 40, 2: 75, 3: 95 };
const TRONCO_NO_FUNDO: PorNivel<number> = { 1: 15, 2: 30, 3: 40 };
const JOELHO_NO_CONTATO: PorNivel<number> = { 1: 15, 2: 20, 3: 25 };
const JOELHO_NA_ABSORCAO: PorNivel<number> = { 1: 45, 2: 75, 3: 90 };
// Pico de carga (× peso) no impulso e no impacto da aterrissagem.
const PICO_DO_IMPULSO: PorNivel<number> = { 1: 1.5, 2: 1.9, 3: 2.2 };
const PICO_DO_IMPACTO: PorNivel<number> = { 1: 1.8, 2: 2.3, 3: 2.6 };

const CALCANHAR_NA_DECOLAGEM = 28; // flexão plantar: o calcanhar sobe, a ponta empurra
const JOELHO_NA_DECOLAGEM = 14; // o IK nunca estica a perna toda (movimento/ik.ts)
const CANELA_NO_FUNDO = 0.4; // fração da flexão que vem da canela: quadril mais para trás
const DESCIDA = 0.5; // s: contramovimento rápido
const IMPULSO = 0.25; // s: do fundo à decolagem
const ABSORCAO = 0.4; // s: do contato à absorção máxima
const VOLTA = 1.0; // s: da absorção até ficar em pé
const ESTABILIZAR = 2.0; // s parado antes do próximo salto
const PAUSA_INICIAL = 1.0;
const ENTRADA_NO_AR = 0.02; // s: quadro logo após sair/antes de chegar, que dá a velocidade do salto

/* Quanto o tornozelo sobe e vai para a frente quando o calcanhar sobe girando
   na ponta (a mesma conta de Pose.pes.calcanhar em movimento/corpo.ts). */
const subidaDoTornozelo = (calcanhar: number) =>
  CORPO.peFrente * Math.sin(radianos(calcanhar)) + CORPO.alturaTornozelo * (Math.cos(radianos(calcanhar)) - 1);
const avancoDoTornozelo = (calcanhar: number) =>
  CORPO.peFrente * (1 - Math.cos(radianos(calcanhar))) + CORPO.alturaTornozelo * Math.sin(radianos(calcanhar));

/* Posição do quadril para uma flexão de joelho, com o calcanhar levantado
   `calcanhar` graus e os pés `elevacao` metros acima da base. */
function quadrilEm(joelho: number, calcanhar: number, elevacao: number, canela?: number) {
  const base = quadrilParaFlexao(joelho, canela);
  return { y: base.y + subidaDoTornozelo(calcanhar) + elevacao, z: base.z + avancoDoTornozelo(calcanhar) };
}

export function tempoDeVoo(altura: number): number {
  return 2 * Math.sqrt((2 * altura) / GRAVIDADE);
}

/* Instantes marcantes do ciclo (s): fundo do contramovimento, decolagem e
   contato da aterrissagem. Os testes usam os mesmos números da animação. */
export function temposDoSalto(nivel: Nivel) {
  const tFundo = PAUSA_INICIAL + DESCIDA;
  const tDecola = tFundo + IMPULSO;
  return { tFundo, tDecola, tPouso: tDecola + tempoDeVoo(ALTURA_DO_SALTO[nivel]) };
}

export const alturaDoSalto = (nivel: Nivel): number => ALTURA_DO_SALTO[nivel];

export function saltoComContramovimento(bracos: ModoBracos, nivel: Nivel): Animacao {
  // Mãos nas barras só no nível 1 (salto curto); nos outros, braços no peito.
  const modo: ModoBracos = nivel === 1 ? bracos : 'cruzados';
  const maos = (v: number) => pesoNasMaos(modo, v);
  const altura = ALTURA_DO_SALTO[nivel];
  const voo = tempoDeVoo(altura);
  const velocidade = (GRAVIDADE * voo) / 2;
  const subida = (s: number) => velocidade * s - (GRAVIDADE * s * s) / 2; // altura s segundos depois da decolagem

  const p = (joelho: number, calcanhar: number, elevacao: number, tronco: number, canela?: number): Pose =>
    pose(
      {
        quadril: quadrilEm(joelho, calcanhar, elevacao, canela),
        tronco,
        pes: { esquerdo: { calcanhar, elevacao }, direito: { calcanhar, elevacao } },
      },
      modo,
    );
  const emPe: Pose = pose({ quadril: EM_PE, tronco: 3, pes: { esquerdo: {}, direito: {} } }, modo);

  const { tFundo, tDecola, tPouso } = temposDoSalto(nivel);
  const tAbsorve = tPouso + ABSORCAO;
  const tEmPe = tAbsorve + VOLTA;
  const noFundo = JOELHO_NO_FUNDO[nivel];
  const noContato = JOELHO_NO_CONTATO[nivel];
  const naAbsorcao = JOELHO_NA_ABSORCAO[nivel];

  const quadros: Quadro[] = [
    { t: 0, pose: emPe, carga: carga(1, 0.02, maos(0.05)), fase: 'Em pé, pés na largura do quadril' },
    { t: PAUSA_INICIAL, pose: emPe, carga: carga(1, 0.02, maos(0.05)), fase: 'Desça rápido, quadril para trás' },
    {
      t: tFundo,
      pose: p(noFundo, 0, 0, TRONCO_NO_FUNDO[nivel], CANELA_NO_FUNDO),
      carga: carga(1.15, -0.1, maos(0.08)),
      fase: 'Salte para cima com toda a força',
    },
    {
      t: tDecola - 0.09,
      pose: p((noFundo + JOELHO_NA_DECOLAGEM) / 2, 10, 0, 22),
      carga: carga(PICO_DO_IMPULSO[nivel], 0.3, maos(0.1)),
      fase: 'Salte para cima com toda a força',
    },
    {
      t: tDecola,
      pose: p(JOELHO_NA_DECOLAGEM, CALCANHAR_NA_DECOLAGEM, 0, 8),
      carga: carga(0, 0.8, 0),
      fase: 'No ar, corpo esticado',
    },
    {
      t: tDecola + ENTRADA_NO_AR,
      pose: p(JOELHO_NA_DECOLAGEM + 2, CALCANHAR_NA_DECOLAGEM - 2, subida(ENTRADA_NO_AR), 8),
      carga: carga(0, 0.8, 0),
      fase: 'No ar, corpo esticado',
    },
    {
      t: tDecola + voo / 2,
      pose: p(22, 22, subida(voo / 2), 10),
      carga: carga(0, 0.5, 0),
      fase: 'No ar, corpo esticado',
    },
    {
      t: tPouso - ENTRADA_NO_AR,
      pose: p(noContato - 3, 18, subida(ENTRADA_NO_AR), 14),
      carga: carga(0, 0.6, 0),
      fase: 'Aterrisse nas pontas dos pés',
    },
    {
      t: tPouso,
      pose: p(noContato, 15, 0, 18),
      carga: carga(0, 0.7, 0),
      fase: 'Amorteça dobrando os joelhos',
    },
    {
      t: tPouso + 0.06,
      pose: p((noContato + naAbsorcao) / 2, 6, 0, 28),
      carga: carga(PICO_DO_IMPACTO[nivel], 0.5, maos(0.1)),
      fase: 'Amorteça dobrando os joelhos',
    },
    {
      t: tAbsorve,
      pose: p(naAbsorcao, 0, 0, TRONCO_NO_FUNDO[nivel], CANELA_NO_FUNDO),
      carga: carga(1.3, -0.05, maos(0.08)),
      fase: 'Levante devagar e fique parado',
    },
    { t: tEmPe, pose: emPe, carga: carga(1, 0.02, maos(0.05)), fase: 'Fique parado 2 segundos' },
    { t: tEmPe + ESTABILIZAR, pose: emPe, carga: carga(1, 0.02, maos(0.05)), fase: 'Em pé, pés na largura do quadril' },
  ];

  // Quadríceps e glúteos empurram e freiam; as panturrilhas dão o último impulso.
  return {
    id: 'salto-com-contramovimento',
    quadros,
    comVoo: true,
    musculos: ['quadriceps', 'gluteos', 'panturrilhas'],
    // De lado: o contramovimento, o voo e a aterrissagem aparecem no plano do salto.
    camera: { posicao: [4.0, 1.75, 0.3], alvo: [0, 1.2, -0.02] },
  };
}
