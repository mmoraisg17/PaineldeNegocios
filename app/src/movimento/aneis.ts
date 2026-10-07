import type { EstadoDaExecucao } from '../sensores/tipos';

/* Anel de pressão sob cada pé (auditoria visual, V5). O tamanho mostra
   quanto peso aquele pé recebe; a cor mostra o estado da avaliação. É o mapa
   de pressão levado para dentro da cena: o idoso vê no próprio boneco que
   jogou o peso numa perna só. Funções puras; a cena só as aplica. */

export const RAIO_MINIMO_DO_ANEL = 0.055; // m: pé sem carga ainda aparece
export const RAIO_MAXIMO_DO_ANEL = 0.13;
const CARGA_CHEIA_POR_PE = 0.6; // fração do peso corporal que enche o anel

export function cargaDosPes(leitura: { pes: number; cargaEsquerda: number }): { esquerdo: number; direito: number } {
  return { esquerdo: leitura.pes * leitura.cargaEsquerda, direito: leitura.pes * (1 - leitura.cargaEsquerda) };
}

export function raioDoAnel(cargaNoPe: number): number {
  const fracao = Math.min(1, Math.max(0, cargaNoPe / CARGA_CHEIA_POR_PE));
  return RAIO_MINIMO_DO_ANEL + (RAIO_MAXIMO_DO_ANEL - RAIO_MINIMO_DO_ANEL) * fracao;
}

export type CorDoAnel = 'certo' | 'atencao' | 'erro';

/* "Dica" é um ajuste fino, não um erro: o anel continua verde. */
export function corDoEstado(estado: EstadoDaExecucao): CorDoAnel {
  if (estado === 'pare') return 'erro';
  if (estado === 'atencao') return 'atencao';
  return 'certo';
}
