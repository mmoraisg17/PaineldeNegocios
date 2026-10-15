import type { Exercicio } from '../dominio';
import type { Carga } from '../movimento/animacao';
import type { Esperado } from './tipos';

/* O que a base deveria medir na execução certa de cada exercício.

   Exercícios em um pé só: o centro de pressão fica embaixo do pé de apoio
   (o esquerdo, por convenção da demonstração), e não no meio da base. */
const EM_UM_PE = new Set(['panturrilha-unilateral', 'abducao-com-elastico', 'agachamento-bulgaro-explosivo']);
const PE_DE_APOIO_ML = 0.5;

export function esperadoDoExercicio(exercicio: Exercicio, carga: Carga, cargaEsquerdaMeta?: number): Esperado {
  const base: Esperado = { ...carga, ...(cargaEsquerdaMeta === undefined ? {} : { cargaEsquerdaMeta }) };
  return EM_UM_PE.has(exercicio.id) ? { ...base, copML: PE_DE_APOIO_ML } : base;
}
