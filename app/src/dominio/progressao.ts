import { limitar } from './numeros';
import type { Nivel, Percepcao } from './tipos';

export type MedidasDeExecucao = {
  /* 0 a 100; 100 é o peso igual nas duas pernas. */
  simetria: number;
  /* 0 a 100; 100 é o corpo parado. */
  estabilidade: number;
  /* 0 a 1: fração do peso que vai para as mãos. */
  apoioNasBarras: number;
};

export type EntradaDaDecisao = {
  nivelAtual: Nivel;
  /* Da mais antiga para a mais recente (a mais recente fica por último). */
  notasRecentes: readonly number[];
  /* Percepção da sessão mais recente. */
  percepcao: Percepcao;
  /* Verdadeiro quando o profissional fixou o nível deste exercício. */
  fixado: boolean;
  /* Maior nível que a plataforma da pessoa consegue executar (ver
     `nivelMaximoCompativel`: depende da inclinação máxima do seletor). Sem
     isso, o app proporia um nível que a rotina depois recusaria. */
  nivelMaximo?: Nivel;
};

export type DecisaoDeNivel = {
  nivel: Nivel;
  mudanca: 'sobe' | 'mantem' | 'desce';
  /* Frase pronta para o aviso "o app sempre avisa antes de mudar" (manual, 8.2). */
  motivo: string;
};

/* Pesos da nota: DECISÃO DE PROJETO, não vêm do manual (a seção 16 só diz que a
   nota "combina simetria, estabilidade e apoio", sem pesos). Simetria e
   estabilidade valem o mesmo porque o produto promete as duas; o apoio vale
   menos porque usar as barras é permitido e esperado nas primeiras semanas
   (manual, seção 2). Os pesos devem ser revistos com um profissional. */
const PESO_DA_SIMETRIA = 0.4;
const PESO_DA_ESTABILIDADE = 0.4;
const PESO_DA_AUSENCIA_DE_APOIO = 0.2;
const NOTA_MAXIMA = 100;

/* Limiares da regra do manual, seção 8.2. */
const NOTA_PARA_SUBIR = 80;
const NOTA_ABAIXO_DA_QUAL_DESCE = 60;
const SESSOES_CONSIDERADAS = 2;
const NIVEL_MINIMO: Nivel = 1;
const NIVEL_MAXIMO: Nivel = 3;

export function notaDeExecucao(medidas: MedidasDeExecucao): number {
  const simetria = limitar(medidas.simetria, 0, NOTA_MAXIMA);
  const estabilidade = limitar(medidas.estabilidade, 0, NOTA_MAXIMA);
  const ausenciaDeApoio = (1 - limitar(medidas.apoioNasBarras, 0, 1)) * NOTA_MAXIMA;

  const nota =
    PESO_DA_SIMETRIA * simetria +
    PESO_DA_ESTABILIDADE * estabilidade +
    PESO_DA_AUSENCIA_DE_APOIO * ausenciaDeApoio;
  return Math.round(nota);
}

function manter(nivel: Nivel, motivo: string): DecisaoDeNivel {
  return { nivel, mudanca: 'mantem', motivo };
}

function subir(nivelAtual: Nivel, nivelMaximo: Nivel): DecisaoDeNivel {
  if (nivelAtual >= NIVEL_MAXIMO) {
    return manter(nivelAtual, 'Você já está no nível máximo (3) deste exercício. Continue assim.');
  }
  if (nivelAtual >= nivelMaximo) {
    return manter(
      nivelAtual,
      'O próximo nível pede mais inclinação do que a sua plataforma oferece. Você já está no nível mais alto possível nela.',
    );
  }
  const nivel = (nivelAtual + 1) as Nivel;
  return {
    nivel,
    mudanca: 'sobe',
    motivo: `Nota ${NOTA_PARA_SUBIR} ou mais em 2 treinos seguidos: hora de ir para o nível ${nivel}.`,
  };
}

function descer(nivelAtual: Nivel): DecisaoDeNivel {
  if (nivelAtual <= NIVEL_MINIMO) {
    return manter(nivelAtual, 'Você já está no nível 1 deste exercício. Use as barras e vá no seu tempo.');
  }
  const nivel = (nivelAtual - 1) as Nivel;
  return {
    nivel,
    mudanca: 'desce',
    motivo: `Nota abaixo de ${NOTA_ABAIXO_DA_QUAL_DESCE} em 2 treinos seguidos: voltar ao nível ${nivel} para treinar com mais segurança.`,
  };
}

/* Regra do manual, seção 8.2. Ordem de precedência:
   1. Nível fixado pelo profissional: nunca muda sozinho.
   2. Menos de 2 notas: não há base para decidir, mantém.
   3. Nota abaixo de 60 nas 2 últimas: desce. Vem antes da percepção porque
      "fácil" não desfaz um treino mal executado; segurança primeiro.
   4. Nota >= 80 nas 2 últimas E percepção fácil/ok: sobe.
   5. Qualquer outro caso (inclusive "difícil" com notas altas): mantém. */
export function decidirNivel(entrada: EntradaDaDecisao): DecisaoDeNivel {
  const { nivelAtual, notasRecentes, percepcao, fixado, nivelMaximo = NIVEL_MAXIMO } = entrada;
  if (fixado) {
    return manter(nivelAtual, 'O profissional fixou o nível deste exercício, então o app não o altera sozinho.');
  }
  if (notasRecentes.length < SESSOES_CONSIDERADAS) {
    return manter(nivelAtual, 'O app precisa das notas de 2 sessões neste exercício para decidir.');
  }

  const ultimas = notasRecentes.slice(-SESSOES_CONSIDERADAS);
  if (ultimas.every((nota) => nota < NOTA_ABAIXO_DA_QUAL_DESCE)) return descer(nivelAtual);
  if (ultimas.every((nota) => nota >= NOTA_PARA_SUBIR) && percepcao !== 'dificil') {
    return subir(nivelAtual, nivelMaximo);
  }
  return manter(nivelAtual, 'Suas últimas notas pedem mais prática neste nível.');
}
