import type { Esqueleto } from './corpo';

/* Fio de prumo (auditoria visual, V7): o quadril deve ficar sobre o meio dos
   pés no eixo lateral. Ir para a frente e para trás faz parte do movimento
   (sentar e levantar), então só o lado conta. */

export const LIMIAR_DE_ALINHAMENTO = 0.025; // m: até 2,5 cm é "no meio"

export function meioDosPes(e: Esqueleto): { x: number; z: number } {
  const { esquerdo, direito } = e.lados;
  return { x: (esquerdo.tornozelo.x + direito.tornozelo.x) / 2, z: (esquerdo.tornozelo.z + direito.tornozelo.z) / 2 };
}

/* desvio > 0: quadril para a esquerda do praticante (+X); < 0: para a direita. */
export function alinhamentoLateral(e: Esqueleto): { desvio: number; alinhado: boolean } {
  const desvio = e.pelve.x - meioDosPes(e).x;
  return { desvio, alinhado: Math.abs(desvio) <= LIMIAR_DE_ALINHAMENTO };
}
