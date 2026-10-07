import type { Animacao } from '../animacao';
import { GRAUS_POR_NIVEL_DE_INCLINACAO } from '../cenario';
import type { ModoBracos } from '../corpo';
import { miniagachamento } from './miniagachamento';
import { panturrilha } from './panturrilha';
import { pesEmLinha } from './pesEmLinha';
import { sentarELevantar } from './sentarELevantar';

/* O que muda a demonstração de um mesmo exercício: o apoio das mãos, o nível
   (profundidade, ritmo, um pé ou dois) e a inclinação do seletor (0–3). */
export type OpcoesDaAnimacao = { bracos: ModoBracos; nivel: 1 | 2 | 3; inclinacao: 0 | 1 | 2 | 3 };

const PADRAO: OpcoesDaAnimacao = { bracos: 'barras', nivel: 1, inclinacao: 0 };

/* Registro das animações por id de exercício (os mesmos ids do catálogo em
   src/dominio). Cada exercício entra aqui depois da sua pesquisa sistemática
   (docs/pesquisa/exercicios); os que ainda não têm animação devolvem
   undefined e a tela mostra só as instruções. */
const FABRICAS: Record<string, (opcoes: OpcoesDaAnimacao) => Animacao> = {
  'sentar-e-levantar': (o) => sentarELevantar(o.bracos),
  'miniagachamento-simetrico': (o) => miniagachamento(o.bracos, o.nivel),
  'panturrilha-unilateral': (o) => panturrilha(o.bracos, o.nivel),
  'pes-em-linha': (o) => pesEmLinha(o.bracos),
};

export function animacaoDe(idExercicio: string, opcoes: Partial<OpcoesDaAnimacao> = {}): Animacao | undefined {
  const o = { ...PADRAO, ...opcoes };
  const animacao = FABRICAS[idExercicio]?.(o);
  if (!animacao || o.inclinacao === 0) return animacao;
  return { ...animacao, inclinacaoDaBase: o.inclinacao * GRAUS_POR_NIVEL_DE_INCLINACAO };
}

export const exerciciosAnimados = (): string[] => Object.keys(FABRICAS);
