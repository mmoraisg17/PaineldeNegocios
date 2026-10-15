import type { Animacao } from '../animacao';
import type { ModoBracos } from '../corpo';
import { abducao } from './abducao';
import { agachamentoBulgaroExplosivo } from './agachamentoBulgaroExplosivo';
import { descidaDeDegrau } from './descidaDeDegrau';
import { miniagachamento } from './miniagachamento';
import { panturrilha } from './panturrilha';
import { pesEmLinha } from './pesEmLinha';
import { sentarELevantar } from './sentarELevantar';

/* O que muda a demonstração de um mesmo exercício: o apoio das mãos e o nível
   (profundidade, ritmo, um pé ou dois). */
export type OpcoesDaAnimacao = { bracos: ModoBracos; nivel: 1 | 2 | 3 };

const PADRAO: OpcoesDaAnimacao = { bracos: 'barras', nivel: 1 };

/* Registro das animações por id de exercício (os mesmos ids do catálogo em
   src/dominio). Cada exercício entra aqui depois da sua pesquisa sistemática
   (docs/pesquisa/exercicios); os que ainda não têm animação devolvem
   undefined e a tela mostra só as instruções. */
const FABRICAS: Record<string, (opcoes: OpcoesDaAnimacao) => Animacao> = {
  'sentar-e-levantar': (o) => sentarELevantar(o.bracos),
  'miniagachamento-simetrico': (o) => miniagachamento(o.bracos, o.nivel),
  'panturrilha-unilateral': (o) => panturrilha(o.bracos, o.nivel),
  'pes-em-linha': (o) => pesEmLinha(o.bracos),
  'descida-de-degrau': (o) => descidaDeDegrau(o.bracos, o.nivel),
  'abducao-com-elastico': (o) => abducao(o.bracos),
  'agachamento-bulgaro-explosivo': (o) => agachamentoBulgaroExplosivo(o.bracos, o.nivel),
};

export function animacaoDe(idExercicio: string, opcoes: Partial<OpcoesDaAnimacao> = {}): Animacao | undefined {
  return FABRICAS[idExercicio]?.({ ...PADRAO, ...opcoes });
}

export const exerciciosAnimados = (): string[] => Object.keys(FABRICAS);
