import type { Desvio, EstadoDaExecucao } from '../sensores/tipos';
import type { Vec3 } from './vetor';
import type { CorDoAnel } from './aneis';

/* Marcações de correção dentro da cena (auditoria visual, V6), como o ✓/✕ e
   as setas da referência. Funções puras; a cena só as desenha.

   Eixos da cena: +X = esquerda do praticante, +Z = frente, +Y = cima. */

export type Seta = { direcao: Vec3; ancora: 'pelve' | 'pes' };

/* Para onde levar o corpo em cada desvio que tem direção clara. Os demais
   (oscilação, movimento brusco…) não têm "para onde": ficam só no aviso. */
export function setaDaCorrecao(desvio: Desvio | null): Seta | null {
  switch (desvio) {
    case 'assimetria': // peso jogado na perna direita → leve para a esquerda
      return { direcao: { x: 1, y: 0, z: 0 }, ancora: 'pelve' };
    case 'desvio-lateral': // corpo indo para a esquerda → volte para a direita
      return { direcao: { x: -1, y: 0, z: 0 }, ancora: 'pelve' };
    case 'peso-na-ponta': // peso na ponta → leve para os calcanhares
      return { direcao: { x: 0, y: 0, z: -1 }, ancora: 'pelve' };
    case 'apoio-excessivo':
    case 'apoio-total': // pendurado nas barras → peso nas pernas
      return { direcao: { x: 0, y: -1, z: 0 }, ancora: 'pes' };
    default:
      return null;
  }
}

export type IconeDoEstado = { simbolo: '✓' | '!' | '✕'; texto: string; cor: CorDoAnel };

/* Ícone do canto da cena: forma + texto, nunca só a cor (daltonismo). */
export function iconeDoEstado(estado: EstadoDaExecucao): IconeDoEstado {
  if (estado === 'pare') return { simbolo: '✕', texto: 'Pare', cor: 'erro' };
  if (estado === 'atencao') return { simbolo: '!', texto: 'Atenção', cor: 'atencao' };
  return { simbolo: '✓', texto: 'Execução certa', cor: 'certo' };
}
