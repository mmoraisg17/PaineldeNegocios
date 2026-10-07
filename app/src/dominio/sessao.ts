import type { IdExercicio, Nivel, Percepcao } from './tipos';

export type ResultadoExercicio = {
  id: IdExercicio;
  nivel: Nivel;
  /* Nota de execução, 0 a 100 (ver notaDeExecucao). */
  nota: number;
  /* 0 a 100; 100 é o peso igual nas duas pernas. */
  simetria: number;
  /* 0 a 100; 100 é o corpo parado. */
  estabilidade: number;
  /* 0 a 1: fração do peso que vai para as mãos. */
  apoioNasBarras: number;
  /* Opcional: % do peso que ficou na perna esquerda, para comparar com a meta
     do profissional. Só os exercícios com meta de simetria precisam dele. */
  cargaEsquerda?: number;
};

/* A data fica em texto ISO 8601 (e não em Date) para a sessão sobreviver
   intacta ao JSON do localStorage. */
export type Sessao = {
  data: string;
  exercicios: ResultadoExercicio[];
  percepcao: Percepcao;
};

export type SemanaDeTreino = {
  planejadas: number;
  feitas: number;
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_DA_SEMANA = 7;
const SESSOES_PADRAO_PARA_DECIDIR = 2;

function instante(sessao: Sessao): number {
  return Date.parse(sessao.data);
}

function media(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

/* Cópia ordenada (a entrada nunca é alterada). Datas inválidas viram NaN e
   não mudam de lugar, em vez de bagunçar o resto. */
export function ordenarSessoes(sessoes: readonly Sessao[]): Sessao[] {
  return [...sessoes].sort((a, b) => {
    const diferenca = instante(a) - instante(b);
    return Number.isNaN(diferenca) ? 0 : diferenca;
  });
}

export function apoioMedioDaSessao(sessao: Sessao): number {
  return media(sessao.exercicios.map((exercicio) => exercicio.apoioNasBarras));
}

export function notaMediaDaSessao(sessao: Sessao): number {
  return media(sessao.exercicios.map((exercicio) => exercicio.nota));
}

/* Notas do exercício no nível atual, da mais antiga para a mais recente: é
   a entrada de `decidirNivel`. Para na primeira nota de outro nível, porque
   notas de antes da última troca não dizem se a pessoa dominou o nível novo
   (sem isso, ao subir ela subiria de novo na sessão seguinte). */
export function notasRecentesDoExercicio(
  sessoes: readonly Sessao[],
  id: IdExercicio,
  nivelAtual: Nivel,
  quantidade: number = SESSOES_PADRAO_PARA_DECIDIR,
): number[] {
  const resultados = ordenarSessoes(sessoes)
    .map((sessao) => sessao.exercicios.find((exercicio) => exercicio.id === id))
    .filter((resultado): resultado is ResultadoExercicio => resultado !== undefined);

  const notas: number[] = [];
  for (let indice = resultados.length - 1; indice >= 0 && notas.length < quantidade; indice -= 1) {
    const resultado = resultados[indice];
    if (!resultado || resultado.nivel !== nivelAtual) break;
    notas.unshift(resultado.nota);
  }
  return notas;
}

/* "Semana" aqui é a janela móvel dos 7 dias que terminam em `agora`: o
   instante de exatamente 7 dias atrás já fica de fora. Janela móvel (e não
   semana de calendário) evita zerar a adesão toda segunda-feira. */
export function semanaDeTreino(sessoes: readonly Sessao[], planejadas: number, agora: Date): SemanaDeTreino {
  const fim = agora.getTime();
  const inicio = fim - DIAS_DA_SEMANA * MS_POR_DIA;
  const feitas = sessoes.filter((sessao) => {
    const quando = instante(sessao);
    return quando > inicio && quando <= fim;
  }).length;
  return { planejadas, feitas };
}
