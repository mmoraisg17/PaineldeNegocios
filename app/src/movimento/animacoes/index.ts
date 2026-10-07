import type { Animacao } from '../animacao';
import type { ModoBracos } from '../corpo';
import { sentarELevantar } from './sentarELevantar';

/* Registro das animações por id de exercício (os mesmos ids do catálogo em
   src/dominio). Cada exercício entra aqui depois da sua pesquisa sistemática
   (fase 6 do PRD); os que ainda não têm animação devolvem undefined e a tela
   mostra só as instruções. */
const FABRICAS: Record<string, (bracos: ModoBracos) => Animacao> = {
  'sentar-e-levantar': sentarELevantar,
};

export function animacaoDe(idExercicio: string, bracos: ModoBracos = 'barras'): Animacao | undefined {
  return FABRICAS[idExercicio]?.(bracos);
}

export const exerciciosAnimados = (): string[] => Object.keys(FABRICAS);
