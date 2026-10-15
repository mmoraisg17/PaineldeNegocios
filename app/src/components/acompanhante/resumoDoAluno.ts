import {
  type Alerta,
  type EstadoApp,
  type Sessao,
  FREQUENCIA_SEMANAL_PADRAO,
  ajusteVigente,
  alertasDoAluno,
  notaMediaDaSessao,
  ordenarSessoes,
  rotinaDoPraticante,
  semanaDeTreino,
} from '../../dominio';

/* Cálculos que a lista de alunos e o relatório compartilham. Ficam fora do
   React para as duas telas mostrarem sempre os mesmos números e para dar para
   testar sem renderizar nada. */

/* Quantos treinos entram nas médias do resumo. Três (uma semana de rotina
   padrão) deixam a média acompanhar a evolução sem que um treino ruim isolado
   a derrube por semanas. Valor de projeto, a validar com os profissionais. */
export const TREINOS_NO_RESUMO = 3;

export type ResumoDoAluno = {
  feitas: number;
  planejadas: number;
  alertas: Alerta[];
  ultimaSessao: Sessao | undefined;
};

/* `agora` entra por parâmetro: a "semana" é a janela móvel de 7 dias que
   termina nele, e o teste precisa fixar esse instante. O ajuste só conta se
   ainda está vigente (vínculo autorizado), como em toda a rotina do app. */
export function resumoDoAluno(estado: EstadoApp, alunoId: string, agora: Date): ResumoDoAluno | undefined {
  const praticante = estado.praticantes[alunoId];
  if (!praticante) return undefined;

  const planejadas = rotinaDoPraticante(estado, alunoId)?.frequenciaSemanal ?? FREQUENCIA_SEMANAL_PADRAO;
  const semana = semanaDeTreino(praticante.sessoes, planejadas, agora);
  const metas = ajusteVigente(estado, alunoId)?.metas;
  return {
    feitas: semana.feitas,
    planejadas: semana.planejadas,
    alertas: alertasDoAluno(praticante.sessoes, semana, metas),
    ultimaSessao: ordenarSessoes(praticante.sessoes).at(-1),
  };
}

export type MediasDoAluno = {
  /* 0 a 100 */
  nota: number;
  /* 0 a 100 */
  simetria: number;
  /* 0 a 100 */
  estabilidade: number;
  /* 0 a 1: fração do peso que vai para as mãos */
  apoio: number;
};

const media = (valores: readonly number[]): number =>
  valores.length === 0 ? 0 : valores.reduce((soma, valor) => soma + valor, 0) / valores.length;

/* Sem treinos devolve undefined: mostrar "0" daria a impressão de uma nota
   péssima onde na verdade não há o que medir. A nota é a média das notas dos
   treinos (como no domínio); as outras medidas são a média de cada exercício.
   Pelo mesmo motivo, treino sem exercício medido não entra: é o que sobra de
   um treino salvo só com exercícios que saíram do catálogo (ver
   sanitizacao.ts), e a nota "0" dele puxaria a média para baixo. */
export function mediasRecentes(sessoes: readonly Sessao[], quantidade: number = TREINOS_NO_RESUMO): MediasDoAluno | undefined {
  const comMedidas = sessoes.filter((sessao) => sessao.exercicios.length > 0);
  const recentes = ordenarSessoes(comMedidas).slice(-quantidade);
  if (recentes.length === 0) return undefined;
  const exercicios = recentes.flatMap((sessao) => sessao.exercicios);
  return {
    nota: media(recentes.map(notaMediaDaSessao)),
    simetria: media(exercicios.map((e) => e.simetria)),
    estabilidade: media(exercicios.map((e) => e.estabilidade)),
    apoio: media(exercicios.map((e) => e.apoioNasBarras)),
  };
}
