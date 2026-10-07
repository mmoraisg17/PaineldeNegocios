import { type Esqueleto, alturaDaSuperficie } from './corpo';

/* Fio de prumo (auditoria visual, V7): o quadril deve ficar sobre o meio dos
   pés no eixo lateral. Ir para a frente e para trás faz parte do movimento
   (sentar e levantar), então só o lado conta. */

export const LIMIAR_DE_ALINHAMENTO = 0.025; // m: até 2,5 cm é "no meio"

/* Meio dos pés APOIADOS: num pé só (panturrilha, abdução, equilíbrio), o
   quadril deve ficar sobre o pé de apoio, não entre os dois. */
export function meioDosPes(e: Esqueleto): { x: number; y: number; z: number } {
  const todos = [e.lados.esquerdo, e.lados.direito];
  const apoiados = todos.filter((l) => l.apoiado);
  const pes = apoiados.length > 0 ? apoiados : todos;
  const x = pes.reduce((s, l) => s + l.tornozelo.x, 0) / pes.length;
  const z = pes.reduce((s, l) => s + l.tornozelo.z, 0) / pes.length;
  return { x, y: alturaDaSuperficie(x, z, e.inclinacaoDaBase), z };
}

/* desvio > 0: quadril para a esquerda do praticante (+X); < 0: para a direita. */
export function alinhamentoLateral(e: Esqueleto): { desvio: number; alinhado: boolean } {
  const desvio = e.pelve.x - meioDosPes(e).x;
  return { desvio, alinhado: Math.abs(desvio) <= LIMIAR_DE_ALINHAMENTO };
}
