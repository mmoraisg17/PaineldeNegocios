import { autorizar, criarVinculoPendente, type Vinculo } from './acompanhamento';
import { buscarExercicio } from './catalogo';
import { estadoInicial, type Acompanhante, type DadosPraticante, type EstadoApp, type Recado } from './estado';
import { copiarProfundo } from './imutavel';
import { limitar } from './numeros';
import { nivelInicial, type Perfil } from './perfil';
import { decidirNivel, notaDeExecucao } from './progressao';
import { montarRotina, nivelMaximoCompativel, type AjusteProfissional, type ItemRotina, type NiveisAtuais } from './rotina';
import { notaMediaDaSessao, notasRecentesDoExercicio, type ResultadoExercicio, type Sessao } from './sessao';
import type { Percepcao } from './tipos';

/* Contas de demonstração do manual, seção 17. Tudo aqui é determinístico:
   dada a mesma `agora`, o estado é idêntico, para o avaliador ver sempre a
   mesma história e para os testes não oscilarem. */

export const IDS_DEMO = {
  lucia: 'lucia',
  rafael: 'rafael',
  carlos: 'carlos',
  ana: 'ana',
  marta: 'marta',
} as const;

/* Gerador pseudoaleatório "mulberry32": minúsculo, rápido e reproduzível a
   partir de uma semente. As constantes são as do algoritmo original, não
   valores de negócio. */
export function criarGeradorPseudoaleatorio(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let mistura = Math.imul(estado ^ (estado >>> 15), estado | 1);
    mistura ^= mistura + Math.imul(mistura ^ (mistura >>> 7), mistura | 61);
    return ((mistura ^ (mistura >>> 14)) >>> 0) / 4294967296;
  };
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const SEMANAS_DE_HISTORICO = 6;
const DIAS_POR_SEMANA = 7;
const DIAS_DE_HISTORICO = SEMANAS_DE_HISTORICO * DIAS_POR_SEMANA;
/* Segunda, quarta e sexta em relação ao início de cada semana: dias alternados
   (manual, seção 5). */
const DIAS_DOS_TREINOS = [0, 2, 4] as const;
const NOTA_QUE_VIRA_DIFICIL = 62;
const NOTA_QUE_VIRA_FACIL = 80;

/* Variação de uma medida pelo tempo: vai de `inicio` (primeira sessão) a `fim`
   (última). */
type Curva = readonly [inicio: number, fim: number];

type PlanoDeEvolucao = {
  semente: number;
  simetria: Curva;
  estabilidade: Curva;
  apoio: Curva;
  /* Só para exercícios com meta de simetria: % do peso na perna esquerda. */
  cargaEsquerda?: Curva;
  /* Posições (0 a 17) dos treinos planejados que a pessoa não fez. */
  faltas: readonly number[];
};

/* Amplitudes do "ruído" de cada sessão: pequenas para a evolução ser legível
   sem parecer uma reta artificial. */
const RUIDO_EM_PONTOS = 2.5;
const RUIDO_NO_APOIO = 0.03;
const RUIDO_NA_CARGA = 1;
/* Cada exercício da rotina é um pouco mais fácil ou difícil que o outro. */
const DIFICULDADE_POR_POSICAO = 1.5;
const EXERCICIOS_POR_CICLO_DE_DIFICULDADE = 3;
const CARGA_IDEAL_ESQUERDA = 50;
const PONTOS_DE_SIMETRIA_POR_PONTO_DE_DESVIO = 2;

const PLANO_DA_LUCIA: PlanoDeEvolucao = {
  semente: 20261007,
  simetria: [62, 84],
  estabilidade: [58, 86],
  apoio: [0.35, 0.1],
  faltas: [4, 9],
};

const PLANO_DO_RAFAEL: PlanoDeEvolucao = {
  semente: 34,
  simetria: [72, 90],
  estabilidade: [65, 85],
  apoio: [0.25, 0.1],
  cargaEsquerda: [36, 43],
  faltas: [6],
};

const PERFIL_DA_LUCIA: Perfil = {
  nome: 'Dona Lúcia',
  objetivo: 'equilibrio',
  firmeza: 'as-vezes',
  acessoriosEmCasa: ['cadeira', 'elastico'],
  inclinacaoMaxima: 2,
};

const PERFIL_DO_RAFAEL: Perfil = {
  nome: 'Rafael',
  objetivo: 'joelho',
  firmeza: 'as-vezes',
  acessoriosEmCasa: ['elastico'],
  inclinacaoMaxima: 3,
};

/* A fisioterapeuta fixa o miniagachamento no nível 2 e quer 50/50. */
const AJUSTE_DA_ANA: AjusteProfissional = {
  autor: 'Ana',
  autorId: IDS_DEMO.ana,
  niveisFixados: { 'miniagachamento-simetrico': 2 },
  metas: { 'miniagachamento-simetrico': { simetriaEsquerda: CARGA_IDEAL_ESQUERDA } },
  frequenciaSemanal: 3,
};

const ACOMPANHANTES: Acompanhante[] = [
  { id: IDS_DEMO.carlos, nome: 'Carlos', tipo: 'profissional', funcao: 'Personal' },
  { id: IDS_DEMO.ana, nome: 'Ana', tipo: 'profissional', funcao: 'Fisioterapeuta' },
  { id: IDS_DEMO.marta, nome: 'Marta', tipo: 'familiar', funcao: 'Filha' },
];

const naCurva = (curva: Curva, progresso: number): number => curva[0] + (curva[1] - curva[0]) * progresso;

function percepcaoDaNota(nota: number): Percepcao {
  if (nota < NOTA_QUE_VIRA_DIFICIL) return 'dificil';
  return nota < NOTA_QUE_VIRA_FACIL ? 'ok' : 'facil';
}

function simetriaDaCarga(cargaEsquerda: number): number {
  const desvio = Math.abs(CARGA_IDEAL_ESQUERDA - cargaEsquerda);
  return 100 - PONTOS_DE_SIMETRIA_POR_PONTO_DE_DESVIO * desvio;
}

/* O exercício com meta de simetria (miniagachamento do Rafael) deriva a
   simetria da carga na perna esquerda, para os dois números nunca se
   contradizerem; os demais seguem a curva geral. */
function medirExercicio(
  plano: PlanoDeEvolucao,
  progresso: number,
  aleatorio: () => number,
  posicao: number,
  item: ItemRotina,
): ResultadoExercicio {
  const ruido = (amplitude: number): number => (aleatorio() * 2 - 1) * amplitude;
  const dificuldade = ((posicao % EXERCICIOS_POR_CICLO_DE_DIFICULDADE) - 1) * DIFICULDADE_POR_POSICAO;
  const carga =
    plano.cargaEsquerda && item.meta
      ? Math.round(naCurva(plano.cargaEsquerda, progresso) + ruido(RUIDO_NA_CARGA))
      : undefined;
  const simetria = carga !== undefined ? simetriaDaCarga(carga) : naCurva(plano.simetria, progresso) + dificuldade + ruido(RUIDO_EM_PONTOS);

  const medidas = {
    simetria: Math.round(limitar(simetria, 0, 100)),
    estabilidade: Math.round(limitar(naCurva(plano.estabilidade, progresso) - dificuldade + ruido(RUIDO_EM_PONTOS), 0, 100)),
    apoioNasBarras: Math.round(limitar(naCurva(plano.apoio, progresso) + ruido(RUIDO_NO_APOIO), 0, 1) * 100) / 100,
  };
  return {
    id: item.exercicioId,
    nivel: item.nivel,
    nota: notaDeExecucao(medidas),
    ...medidas,
    ...(carga !== undefined ? { cargaEsquerda: carga } : {}),
  };
}

/* Depois de cada treino o app reavalia o nível de cada exercício com a regra
   real do manual (seção 8.2): a demo mostra o que o motor faria, não valores
   inventados à mão. */
function reavaliarNiveis(
  niveis: NiveisAtuais,
  itens: readonly ItemRotina[],
  historico: readonly Sessao[],
  percepcao: Percepcao,
  perfil: Perfil,
): NiveisAtuais {
  return itens.reduce<NiveisAtuais>((atuais, item) => {
    const exercicio = buscarExercicio(item.exercicioId);
    const decisao = decidirNivel({
      nivelAtual: item.nivel,
      notasRecentes: notasRecentesDoExercicio(historico, item.exercicioId, item.nivel),
      percepcao,
      fixado: item.fixadoPor !== undefined,
      ...(exercicio ? { nivelMaximo: nivelMaximoCompativel(exercicio, perfil.inclinacaoMaxima) } : {}),
    });
    return { ...atuais, [item.exercicioId]: decisao.nivel };
  }, niveis);
}

function dataDoTreino(agora: Date, posicao: number): string {
  const semana = Math.floor(posicao / DIAS_DOS_TREINOS.length);
  const diaDaSemana = DIAS_DOS_TREINOS[posicao % DIAS_DOS_TREINOS.length] ?? 0;
  const diasAtras = DIAS_DE_HISTORICO - 1 - (semana * DIAS_POR_SEMANA + diaDaSemana);
  return new Date(agora.getTime() - diasAtras * MS_POR_DIA).toISOString();
}

type Historico = { sessoes: Sessao[]; niveis: NiveisAtuais };

function simularHistorico(
  perfil: Perfil,
  niveisIniciais: NiveisAtuais,
  ajuste: AjusteProfissional | undefined,
  plano: PlanoDeEvolucao,
  agora: Date,
): Historico {
  const aleatorio = criarGeradorPseudoaleatorio(plano.semente);
  const planejados = SEMANAS_DE_HISTORICO * DIAS_DOS_TREINOS.length;
  let historico: Historico = { sessoes: [], niveis: niveisIniciais };

  for (let posicao = 0; posicao < planejados; posicao += 1) {
    if (plano.faltas.includes(posicao)) continue;
    const { itens } = montarRotina(perfil, historico.niveis, ajuste);
    const exercicios = itens.map((item, indice) =>
      medirExercicio(plano, posicao / (planejados - 1), aleatorio, indice, item),
    );
    const sessaoSemPercepcao = { data: dataDoTreino(agora, posicao), exercicios, percepcao: 'ok' as Percepcao };
    const percepcao = percepcaoDaNota(notaMediaDaSessao(sessaoSemPercepcao));
    const sessao: Sessao = { ...sessaoSemPercepcao, percepcao };
    const sessoes = [...historico.sessoes, sessao];
    historico = { sessoes, niveis: reavaliarNiveis(historico.niveis, itens, sessoes, percepcao, perfil) };
  }
  return historico;
}

function criarPraticante(
  id: string,
  idade: number,
  perfil: Perfil,
  medidasDaAvaliacao: { oscilacao: number; apoioNasBarras: number },
  plano: PlanoDeEvolucao,
  agora: Date,
  ajuste?: AjusteProfissional,
): DadosPraticante {
  /* Cópias: o estado devolvido não pode compartilhar objetos com as
     constantes do módulo, senão alterar um estado alteraria o seguinte. */
  const perfilProprio = copiarProfundo(perfil);
  const ajusteProprio = ajuste ? copiarProfundo(ajuste) : undefined;
  const nivel = nivelInicial(medidasDaAvaliacao, perfilProprio.firmeza);
  const inicial: NiveisAtuais = Object.fromEntries(
    montarRotina(perfilProprio, {}, ajusteProprio).itens.map((item) => [item.exercicioId, nivel]),
  );
  const { sessoes, niveis } = simularHistorico(perfilProprio, inicial, ajusteProprio, plano, agora);
  return {
    id,
    idade,
    perfil: perfilProprio,
    niveis,
    sessoes,
    ...(ajusteProprio ? { ajuste: ajusteProprio } : {}),
  };
}

function criarVinculosAutorizados(agora: Date): Vinculo[] {
  const inicio = new Date(agora.getTime() - DIAS_DE_HISTORICO * MS_POR_DIA);
  const pares = [
    [IDS_DEMO.lucia, IDS_DEMO.carlos, 'profissional'],
    [IDS_DEMO.lucia, IDS_DEMO.marta, 'familiar'],
    [IDS_DEMO.rafael, IDS_DEMO.ana, 'profissional'],
  ] as const;
  /* Ids fixos (e não aleatórios) para a demo ser reproduzível. */
  return pares.map(([alunoId, acompanhanteId, tipo], posicao) =>
    autorizar(criarVinculoPendente(tipo, alunoId, acompanhanteId, inicio, () => `vinculo-demo-${posicao + 1}`), inicio),
  );
}

function criarRecadoDoCarlos(agora: Date): Recado {
  return {
    id: 'recado-demo-1',
    deId: IDS_DEMO.carlos,
    paraId: IDS_DEMO.lucia,
    texto: 'Muito bem nesta semana, Dona Lúcia!',
    enviadoEm: new Date(agora.getTime() - MS_POR_DIA).toISOString(),
    lido: false,
  };
}

/* Estado completo da demonstração. `contaAtual` fica nula: quem escolhe a
   conta é a tela inicial. */
export function criarEstadoDemo(agora: Date): EstadoApp {
  const lucia = criarPraticante(
    IDS_DEMO.lucia, 68, PERFIL_DA_LUCIA, { oscilacao: 0.55, apoioNasBarras: 0.35 }, PLANO_DA_LUCIA, agora,
  );
  const rafael = criarPraticante(
    IDS_DEMO.rafael, 34, PERFIL_DO_RAFAEL, { oscilacao: 0.35, apoioNasBarras: 0.15 }, PLANO_DO_RAFAEL, agora, AJUSTE_DA_ANA,
  );
  return {
    ...estadoInicial(),
    praticantes: { [IDS_DEMO.lucia]: lucia, [IDS_DEMO.rafael]: rafael },
    acompanhantes: copiarProfundo(ACOMPANHANTES),
    vinculos: criarVinculosAutorizados(agora),
    recados: [criarRecadoDoCarlos(agora)],
  };
}
