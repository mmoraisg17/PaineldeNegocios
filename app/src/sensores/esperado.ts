import type { Exercicio, Nivel } from '../dominio';
import type { Carga } from '../movimento/animacao';
import type { Esperado } from './tipos';

/* O que a base deveria medir na execução certa de cada exercício.

   Exercícios em um pé só: o centro de pressão fica embaixo do pé de apoio
   (o esquerdo, por convenção da demonstração), e não no meio da base.
   Transferência de peso: o alvo anda pela base (frente, direita, trás,
   esquerda) e a execução certa leva o ponto até ele. */
const EM_UM_PE = new Set(['panturrilha-unilateral', 'equilibrio-com-inclinacao', 'abducao-com-elastico']);
const PE_DE_APOIO_ML = 0.5;

const TEMPO_POR_ALVO = 4; // segundos em cada alvo
const ALCANCE_POR_NIVEL: Record<Nivel, number> = { 1: 0.35, 2: 0.5, 3: 0.6 };
const DIRECOES = [
  { ap: 1, ml: 0 },
  { ap: 0, ml: -1 },
  { ap: -1, ml: 0 },
  { ap: 0, ml: 1 },
] as const;

export function alvoDaTransferencia(nivel: Nivel, tempo: number): { ap: number; ml: number } {
  const i = Math.floor(Math.max(0, tempo) / TEMPO_POR_ALVO) % DIRECOES.length;
  const d = DIRECOES[i] ?? DIRECOES[0];
  const alcance = ALCANCE_POR_NIVEL[nivel];
  return { ap: d.ap * alcance, ml: d.ml * alcance };
}

export function esperadoDoExercicio(
  exercicio: Exercicio,
  nivel: Nivel,
  carga: Carga,
  tempo: number,
  cargaEsquerdaMeta?: number,
): Esperado {
  const inclinacao = exercicio.niveis[nivel].inclinacao;
  const base: Esperado = { ...carga, inclinacao, ...(cargaEsquerdaMeta === undefined ? {} : { cargaEsquerdaMeta }) };
  if (EM_UM_PE.has(exercicio.id)) return { ...base, copML: PE_DE_APOIO_ML };
  if (exercicio.id === 'transferencia-de-peso') {
    const alvo = alvoDaTransferencia(nivel, tempo);
    return { ...base, copAP: alvo.ap, copML: alvo.ml, alvo };
  }
  return base;
}
