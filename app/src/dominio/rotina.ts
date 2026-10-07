import { ACESSORIOS_DA_PLATAFORMA, buscarExercicio, exerciciosDaTrilha } from './catalogo';
import { trilhaDoObjetivo, type Perfil } from './perfil';
import type { Apoio, Dose, Exercicio, IdExercicio, Inclinacao, Nivel } from './tipos';

/* Nível atual de cada exercício. Quem não aparece aqui ainda não foi treinado. */
export type NiveisAtuais = Partial<Record<IdExercicio, Nivel>>;

/* Meta do profissional: porcentagem do peso que deve ir para a perna esquerda
   (50 = divisão igual; 60 = 60/40 durante a recuperação). */
export type MetaDeSimetria = { simetriaEsquerda: number };

/* O que o profissional pode mudar na rotina do aluno (manual, seção 12.4). */
export type AjusteProfissional = {
  /* Nome mostrado no selo "Ajustado por [nome]". */
  autor: string;
  /* Id do acompanhante. É por ele que `ajusteVigente` confere se o vínculo
     ainda está autorizado; ajuste sem `autorId` não é aplicado. */
  autorId?: string;
  exerciciosIncluidos?: readonly IdExercicio[];
  exerciciosRemovidos?: readonly IdExercicio[];
  niveisFixados?: NiveisAtuais;
  metas?: Partial<Record<IdExercicio, MetaDeSimetria>>;
  frequenciaSemanal?: number;
};

export type ItemRotina = {
  exercicioId: IdExercicio;
  nivel: Nivel;
  dose: Dose;
  apoio: Apoio;
  inclinacao: Inclinacao;
  /* Presente quando o profissional fixou o nível: o app não o muda sozinho. */
  fixadoPor?: string;
  meta?: MetaDeSimetria;
};

export type Rotina = {
  itens: ItemRotina[];
  minutosEstimados: number;
  frequenciaSemanal: number;
  /* Alimenta o selo "Ajustado por [nome]" da tela Hoje (manual, seção 5). */
  ajustadoPor?: string;
};

/* Otago e o manual (seção 5) recomendam 3 treinos por semana, em dias alternados. */
export const FREQUENCIA_SEMANAL_PADRAO = 3;

/* Estimativa de duração. Uma repetição lenta e controlada leva cerca de 4 s;
   o minuto extra por exercício cobre subir na plataforma, ler a tela e
   descansar entre um exercício e outro. */
const SEGUNDOS_POR_REPETICAO = 4;
const SEGUNDOS_DE_TRANSICAO = 60;
const SEGUNDOS_POR_MINUTO = 60;
const NIVEL_PADRAO: Nivel = 1;

export function segundosDaDose(dose: Dose): number {
  const segundos = dose.tipo === 'repeticoes' ? dose.repeticoes * SEGUNDOS_POR_REPETICAO : dose.segundos;
  return dose.porLado === true ? segundos * 2 : segundos;
}

function temOsAcessoriosDeCasa(exercicio: Exercicio, perfil: Perfil): boolean {
  return exercicio.acessorios.every(
    (acessorio) => ACESSORIOS_DA_PLATAFORMA.includes(acessorio) || perfil.acessoriosEmCasa.includes(acessorio),
  );
}

/* Na fisioterapia a região do objetivo vem primeiro: quem tem o joelho como
   foco faz primeiro os exercícios do joelho, com a energia do começo do treino. */
function exerciciosDoPerfil(perfil: Perfil): Exercicio[] {
  const trilha = exerciciosDaTrilha(trilhaDoObjetivo(perfil.objetivo)).filter((exercicio) =>
    temOsAcessoriosDeCasa(exercicio, perfil),
  );
  const daRegiao = trilha.filter((exercicio) => exercicio.regiao === perfil.objetivo);
  const demais = trilha.filter((exercicio) => exercicio.regiao !== perfil.objetivo);
  return [...daRegiao, ...demais];
}

/* Inclusão e remoção do profissional prevalecem sobre o filtro de
   acessórios (ele sabe o que o aluno tem). Se o mesmo id estiver nas duas
   listas, a remoção vence: é a escolha mais segura. Ids desconhecidos, que
   podem vir de dados salvos por uma versão antiga, são ignorados. */
function aplicarListasDoAjuste(base: Exercicio[], ajuste: AjusteProfissional | undefined): Exercicio[] {
  const incluidos = (ajuste?.exerciciosIncluidos ?? [])
    .map((id) => buscarExercicio(id))
    .filter((exercicio): exercicio is Exercicio => exercicio !== undefined)
    .filter((exercicio) => !base.some((existente) => existente.id === exercicio.id));
  const removidos = ajuste?.exerciciosRemovidos ?? [];
  return [...base, ...incluidos].filter((exercicio) => !removidos.includes(exercicio.id));
}

/* O limite de inclinação é físico (o seletor da plataforma não passa dele),
   então vale até para nível fixado pelo profissional. Desce até achar o maior
   nível compatível; o nível 1 é plano em todos os exercícios. */
function maiorNivelCompativel(exercicio: Exercicio, desejado: Nivel, inclinacaoMaxima: Inclinacao): Nivel {
  for (let nivel = desejado; nivel > NIVEL_PADRAO; nivel -= 1) {
    if (exercicio.niveis[nivel as Nivel].inclinacao <= inclinacaoMaxima) return nivel as Nivel;
  }
  return NIVEL_PADRAO;
}

/* Maior nível do exercício que a plataforma consegue executar. É o
   `nivelMaximo` que a progressão precisa para não propor uma subida que a
   rotina depois recusaria. */
export function nivelMaximoCompativel(exercicio: Exercicio, inclinacaoMaxima: Inclinacao): Nivel {
  return maiorNivelCompativel(exercicio, 3, inclinacaoMaxima);
}

function montarItem(
  exercicio: Exercicio,
  niveis: NiveisAtuais,
  perfil: Perfil,
  ajuste: AjusteProfissional | undefined,
): ItemRotina {
  const nivelFixado = ajuste?.niveisFixados?.[exercicio.id];
  const desejado = nivelFixado ?? niveis[exercicio.id] ?? NIVEL_PADRAO;
  const nivel = maiorNivelCompativel(exercicio, desejado, perfil.inclinacaoMaxima);
  const { dose, apoio, inclinacao } = exercicio.niveis[nivel];
  const meta = ajuste?.metas?.[exercicio.id];

  return {
    exercicioId: exercicio.id,
    nivel,
    dose,
    apoio,
    inclinacao,
    ...(nivelFixado !== undefined && ajuste ? { fixadoPor: ajuste.autor } : {}),
    ...(meta ? { meta } : {}),
  };
}

function minutosDe(itens: readonly ItemRotina[]): number {
  const segundos = itens.reduce((total, item) => total + segundosDaDose(item.dose) + SEGUNDOS_DE_TRANSICAO, 0);
  return Math.ceil(segundos / SEGUNDOS_POR_MINUTO);
}

export function montarRotina(perfil: Perfil, niveis: NiveisAtuais, ajuste?: AjusteProfissional): Rotina {
  const exercicios = aplicarListasDoAjuste(exerciciosDoPerfil(perfil), ajuste);
  const itens = exercicios.map((exercicio) => montarItem(exercicio, niveis, perfil, ajuste));

  return {
    itens,
    minutosEstimados: minutosDe(itens),
    frequenciaSemanal: ajuste?.frequenciaSemanal ?? FREQUENCIA_SEMANAL_PADRAO,
    ...(ajuste ? { ajustadoPor: ajuste.autor } : {}),
  };
}
