import { CATALOGO, ordenarSessoes, type IdExercicio, type Nivel, type ResultadoExercicio, type Sessao } from '../../dominio';

/* Evolução de cada exercício no histórico, sem React: compara o primeiro e o
   último treino em que ele apareceu. É o que a tabela "Por exercício" mostra. */

export type EvolucaoDoExercicio = {
  id: IdExercicio;
  nome: string;
  treinos: number;
  nivelInicial: Nivel;
  nivelAtual: Nivel;
  /* 0 a 100, arredondadas como aparecem na tela. */
  notaInicial: number;
  notaAtual: number;
  /* Último menos primeiro, calculada sobre as notas arredondadas: a conta
     feita à mão na tela tem de bater. Positivo é melhora. */
  variacaoDaNota: number;
};

/* Ordem do catálogo (a do manual): a tabela não muda de lugar conforme o
   exercício que a pessoa fez primeiro. Exercício fora do catálogo é ignorado,
   pois sem nome não há o que mostrar. */
export function evolucaoPorExercicio(sessoes: readonly Sessao[]): EvolucaoDoExercicio[] {
  const cronologicas = ordenarSessoes(sessoes);
  return CATALOGO.flatMap((exercicio) => {
    const resultados = cronologicas.flatMap((sessao): ResultadoExercicio[] => sessao.exercicios.filter((feito) => feito.id === exercicio.id));
    const primeiro = resultados[0];
    const ultimo = resultados.at(-1);
    if (!primeiro || !ultimo) return [];
    const notaInicial = Math.round(primeiro.nota);
    const notaAtual = Math.round(ultimo.nota);
    return [
      {
        id: exercicio.id,
        nome: exercicio.nome,
        treinos: resultados.length,
        nivelInicial: primeiro.nivel,
        nivelAtual: ultimo.nivel,
        notaInicial,
        notaAtual,
        variacaoDaNota: notaAtual - notaInicial,
      },
    ];
  });
}
