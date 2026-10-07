import {
  type AjusteProfissional,
  type DadosPraticante,
  type EstadoApp,
  type IdExercicio,
  type Nivel,
  FREQUENCIA_SEMANAL_PADRAO,
  ajusteVigente,
  exerciciosDaTrilha,
  montarRotina,
  nivelMaximoCompativel,
  rotinaDoPraticante,
  trilhaDoObjetivo,
} from '../../dominio';

/* O formulário "Ajustar rotina" (manual, 12.4) como dado puro: de um lado o que
   a tela edita, do outro o AjusteProfissional que o domínio guarda. A conversão
   fica aqui, fora do React, porque é onde mora a regra (o que vira inclusão,
   remoção ou nível fixado). */

/* O manual cita o miniagachamento como o exercício da meta de simetria. */
export const EXERCICIO_DA_META: IdExercicio = 'miniagachamento-simetrico';
/* Faixa da meta: de 40 a 60% do peso na perna esquerda (60/40 durante a
   recuperação, manual 12.4). 50 é o peso dividido igualmente. */
export const META_MINIMA = 40;
export const META_MAXIMA = 60;
export const META_PADRAO = 50;
/* Otago pede ao menos 2 treinos por semana; mais de 5 deixa pouco descanso. */
export const FREQUENCIA_MINIMA = 2;
export const FREQUENCIA_MAXIMA = 5;

export type ItemDoFormulario = {
  exercicioId: IdExercicio;
  incluido: boolean;
  nivel: Nivel;
  fixar: boolean;
};

export type FormularioDaRotina = {
  itens: ItemDoFormulario[];
  usarMeta: boolean;
  metaEsquerda: number;
  frequencia: number;
};

export type AjusteDoFormulario = Omit<AjusteProfissional, 'autor' | 'autorId'>;

const limitar = (valor: number, minimo: number, maximo: number): number => Math.min(Math.max(valor, minimo), maximo);

/* Parte do que vale hoje para o aluno: a rotina já montada (com o ajuste
   vigente), os níveis atuais e as metas. Devolve undefined se o aluno não
   existe. O nível mostrado nunca passa do que a plataforma dele alcança. */
export function formularioInicial(estado: EstadoApp, alunoId: string): FormularioDaRotina | undefined {
  const praticante = estado.praticantes[alunoId];
  if (!praticante) return undefined;

  const ajuste = ajusteVigente(estado, alunoId);
  const naRotina = new Set((rotinaDoPraticante(estado, alunoId)?.itens ?? []).map((item) => item.exercicioId));
  const meta = ajuste?.metas?.[EXERCICIO_DA_META];

  const itens = exerciciosDaTrilha(trilhaDoObjetivo(praticante.perfil.objetivo)).map((exercicio): ItemDoFormulario => {
    const fixado = ajuste?.niveisFixados?.[exercicio.id];
    const desejado = fixado ?? praticante.niveis[exercicio.id] ?? 1;
    const maximo = nivelMaximoCompativel(exercicio, praticante.perfil.inclinacaoMaxima);
    return {
      exercicioId: exercicio.id,
      incluido: naRotina.has(exercicio.id),
      nivel: Math.min(desejado, maximo) as Nivel,
      fixar: fixado !== undefined,
    };
  });

  return {
    itens,
    usarMeta: meta !== undefined,
    metaEsquerda: limitar(meta?.simetriaEsquerda ?? META_PADRAO, META_MINIMA, META_MAXIMA),
    frequencia: limitar(
      rotinaDoPraticante(estado, alunoId)?.frequenciaSemanal ?? FREQUENCIA_SEMANAL_PADRAO,
      FREQUENCIA_MINIMA,
      FREQUENCIA_MAXIMA,
    ),
  };
}

/* Inclusão e remoção são relativas à rotina PADRÃO do aluno (sem ajuste), que
   é o que o domínio espera em `exerciciosIncluidos`/`exerciciosRemovidos`:
   marcar o que já estaria lá não vira ajuste nenhum. */
export function ajusteDoFormulario(formulario: FormularioDaRotina, praticante: DadosPraticante): AjusteDoFormulario {
  const padrao = new Set(montarRotina(praticante.perfil, praticante.niveis).itens.map((item) => item.exercicioId));
  const marcados = formulario.itens.filter((item) => item.incluido);
  const metaValeAqui = formulario.usarMeta && marcados.some((item) => item.exercicioId === EXERCICIO_DA_META);

  return {
    exerciciosIncluidos: marcados.filter((item) => !padrao.has(item.exercicioId)).map((item) => item.exercicioId),
    exerciciosRemovidos: formulario.itens.filter((item) => !item.incluido && padrao.has(item.exercicioId)).map((item) => item.exercicioId),
    niveisFixados: Object.fromEntries(marcados.filter((item) => item.fixar).map((item) => [item.exercicioId, item.nivel])),
    metas: metaValeAqui
      ? { [EXERCICIO_DA_META]: { simetriaEsquerda: limitar(formulario.metaEsquerda, META_MINIMA, META_MAXIMA) } }
      : {},
    frequenciaSemanal: limitar(formulario.frequencia, FREQUENCIA_MINIMA, FREQUENCIA_MAXIMA),
  };
}
