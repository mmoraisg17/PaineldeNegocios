import type { Convite, StatusDoVinculo, TipoAcompanhante, Vinculo } from './acompanhamento';
import { TAMANHO_MAXIMO_DO_RECADO } from './estado';
import {
  estadoInicial,
  VERSAO_DO_ESTADO,
  type Acompanhante,
  type ContaAtual,
  type DadosPraticante,
  type EstadoApp,
  type PapelDaConta,
  type Recado,
} from './estado';
import { TAMANHO_MAXIMO_DA_FUNCAO, limparNome, type Firmeza, type Objetivo, type Perfil } from './perfil';
import type { AjusteProfissional, MetaDeSimetria, NiveisAtuais } from './rotina';
import type { ResultadoExercicio, Sessao } from './sessao';
import { IDS_DOS_EXERCICIOS, type Acessorio, type IdExercicio, type Inclinacao, type Nivel, type Percepcao } from './tipos';

/* Sanitização do estado lido do aparelho. O dado salvo é "não confiável": pode
   ter vindo de uma versão antiga, de uma edição manual ou de corrupção.
   Princípio: nunca lançar e nunca devolver algo que quebre uma tela. Cada item
   inválido é descartado sozinho (o resto do estado sobrevive); só o formato de
   topo irreconhecível derruba tudo para o estado inicial. O resultado é uma
   cópia nova, montada campo a campo, sem nada herdado do JSON original. */

type Objeto = Record<string, unknown>;

const OBJETIVOS: readonly Objetivo[] = ['equilibrio', 'fortalecimento', 'joelho', 'tornozelo'];
const FIRMEZAS: readonly Firmeza[] = ['preciso-apoio', 'as-vezes', 'firme'];
const ACESSORIOS: readonly Acessorio[] = ['barras', 'elastico', 'inclinacao', 'cadeira'];
const TIPOS: readonly TipoAcompanhante[] = ['profissional', 'familiar'];
const STATUS: readonly StatusDoVinculo[] = ['pendente', 'autorizado', 'revogado'];
const PERCEPCOES: readonly Percepcao[] = ['facil', 'ok', 'dificil'];
const PAPEIS: readonly PapelDaConta[] = ['praticante', 'acompanhante'];
const NIVEIS: readonly Nivel[] = [1, 2, 3];
const INCLINACOES: readonly Inclinacao[] = [0, 1, 2, 3];

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

const ehTexto = (valor: unknown): valor is string => typeof valor === 'string';
const ehNumero = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor);

/* Devolve o próprio valor se ele estiver na lista (e com o tipo estreito). */
function dentroDe<T>(opcoes: readonly T[], valor: unknown): T | undefined {
  return opcoes.find((opcao) => opcao === valor);
}

function sanearLista<T>(valor: unknown, sanearItem: (item: unknown) => T | undefined): T[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item: unknown) => {
    const saneado = sanearItem(item);
    return saneado === undefined ? [] : [saneado];
  });
}

/* Pega os campos de texto obrigatórios de uma vez; undefined se faltar algum. */
function textos<K extends string>(objeto: Objeto, chaves: readonly K[]): Record<K, string> | undefined {
  const pares = chaves.map((chave) => [chave, objeto[chave]] as const);
  if (!pares.every(([, valor]) => ehTexto(valor))) return undefined;
  return Object.fromEntries(pares) as Record<K, string>;
}

function sanearNiveis(valor: unknown): NiveisAtuais {
  if (!ehObjeto(valor)) return {};
  const pares = IDS_DOS_EXERCICIOS.flatMap((id) => {
    const nivel = dentroDe(NIVEIS, valor[id]);
    return nivel === undefined ? [] : [[id, nivel] as const];
  });
  return Object.fromEntries(pares);
}

function sanearIds(valor: unknown): IdExercicio[] {
  return sanearLista(valor, (item) => dentroDe(IDS_DOS_EXERCICIOS, item));
}

function sanearMetas(valor: unknown): Partial<Record<IdExercicio, MetaDeSimetria>> {
  if (!ehObjeto(valor)) return {};
  const pares = IDS_DOS_EXERCICIOS.flatMap((id) => {
    const meta = valor[id];
    const simetriaEsquerda = ehObjeto(meta) ? meta['simetriaEsquerda'] : undefined;
    return ehNumero(simetriaEsquerda) ? [[id, { simetriaEsquerda }] as const] : [];
  });
  return Object.fromEntries(pares);
}

function sanearAjuste(valor: unknown): AjusteProfissional | undefined {
  if (!ehObjeto(valor) || !ehTexto(valor['autor'])) return undefined;
  const frequencia = valor['frequenciaSemanal'];
  const frequenciaValida = ehNumero(frequencia) && Number.isInteger(frequencia) && frequencia > 0;
  return {
    autor: valor['autor'],
    ...(ehTexto(valor['autorId']) ? { autorId: valor['autorId'] } : {}),
    ...(valor['exerciciosIncluidos'] !== undefined ? { exerciciosIncluidos: sanearIds(valor['exerciciosIncluidos']) } : {}),
    ...(valor['exerciciosRemovidos'] !== undefined ? { exerciciosRemovidos: sanearIds(valor['exerciciosRemovidos']) } : {}),
    ...(valor['niveisFixados'] !== undefined ? { niveisFixados: sanearNiveis(valor['niveisFixados']) } : {}),
    ...(valor['metas'] !== undefined ? { metas: sanearMetas(valor['metas']) } : {}),
    ...(frequenciaValida ? { frequenciaSemanal: frequencia } : {}),
  };
}

function sanearPerfil(valor: unknown): Perfil | undefined {
  if (!ehObjeto(valor)) return undefined;
  const objetivo = dentroDe(OBJETIVOS, valor['objetivo']);
  const firmeza = dentroDe(FIRMEZAS, valor['firmeza']);
  const inclinacaoMaxima = dentroDe(INCLINACOES, valor['inclinacaoMaxima']);
  if (!ehTexto(valor['nome']) || !objetivo || !firmeza || inclinacaoMaxima === undefined) return undefined;
  const acessoriosEmCasa = sanearLista(valor['acessoriosEmCasa'], (item) => dentroDe(ACESSORIOS, item));
  return { nome: limparNome(valor['nome']), objetivo, firmeza, acessoriosEmCasa, inclinacaoMaxima };
}

function sanearResultado(valor: unknown): ResultadoExercicio | undefined {
  if (!ehObjeto(valor)) return undefined;
  const id = dentroDe(IDS_DOS_EXERCICIOS, valor['id']);
  const nivel = dentroDe(NIVEIS, valor['nivel']);
  const { nota, simetria, estabilidade, apoioNasBarras, cargaEsquerda } = valor;
  if (!id || !nivel) return undefined;
  if (![nota, simetria, estabilidade, apoioNasBarras].every(ehNumero)) return undefined;
  return {
    id,
    nivel,
    nota: nota as number,
    simetria: simetria as number,
    estabilidade: estabilidade as number,
    apoioNasBarras: apoioNasBarras as number,
    ...(ehNumero(cargaEsquerda) ? { cargaEsquerda } : {}),
  };
}

function sanearSessao(valor: unknown): Sessao | undefined {
  if (!ehObjeto(valor) || !ehTexto(valor['data']) || !Array.isArray(valor['exercicios'])) return undefined;
  const percepcao = dentroDe(PERCEPCOES, valor['percepcao']);
  if (!percepcao) return undefined;
  return { data: valor['data'], exercicios: sanearLista(valor['exercicios'], sanearResultado), percepcao };
}

/* A chave do registro tem de ser igual ao id do praticante: garante que uma
   entrada não "responda" por outra (e descarta chaves esquisitas como
   "__proto__"). */
function sanearPraticante(chave: string, valor: unknown): DadosPraticante | undefined {
  if (!ehObjeto(valor) || valor['id'] !== chave) return undefined;
  const perfil = sanearPerfil(valor['perfil']);
  if (!perfil) return undefined;
  const ajuste = sanearAjuste(valor['ajuste']);
  return {
    id: chave,
    ...(ehNumero(valor['idade']) ? { idade: valor['idade'] } : {}),
    perfil,
    niveis: sanearNiveis(valor['niveis']),
    sessoes: sanearLista(valor['sessoes'], sanearSessao),
    ...(ajuste ? { ajuste } : {}),
  };
}

function sanearPraticantes(valor: unknown): Record<string, DadosPraticante> {
  if (!ehObjeto(valor)) return {};
  const pares = Object.entries(valor).flatMap(([chave, item]) => {
    const praticante = sanearPraticante(chave, item);
    return praticante ? [[chave, praticante] as const] : [];
  });
  return Object.fromEntries(pares);
}

function sanearAcompanhante(valor: unknown): Acompanhante | undefined {
  if (!ehObjeto(valor)) return undefined;
  const campos = textos(valor, ['id', 'nome', 'funcao']);
  const tipo = dentroDe(TIPOS, valor['tipo']);
  if (!campos || !tipo) return undefined;
  return { ...campos, nome: limparNome(campos.nome), funcao: limparNome(campos.funcao, TAMANHO_MAXIMO_DA_FUNCAO), tipo };
}

function sanearVinculo(valor: unknown): Vinculo | undefined {
  if (!ehObjeto(valor)) return undefined;
  const campos = textos(valor, ['id', 'alunoId', 'acompanhanteId', 'criadoEm']);
  const tipo = dentroDe(TIPOS, valor['tipo']);
  const status = dentroDe(STATUS, valor['status']);
  if (!campos || !tipo || !status) return undefined;
  return {
    ...campos,
    tipo,
    status,
    ...(ehTexto(valor['autorizadoEm']) ? { autorizadoEm: valor['autorizadoEm'] } : {}),
    ...(ehTexto(valor['revogadoEm']) ? { revogadoEm: valor['revogadoEm'] } : {}),
  };
}

function sanearConvite(valor: unknown): Convite | undefined {
  if (!ehObjeto(valor)) return undefined;
  const campos = textos(valor, ['codigo', 'criadoEm', 'expiraEm']);
  const tipo = dentroDe(TIPOS, valor['tipo']);
  if (!campos || !tipo) return undefined;
  return { ...campos, tipo, ...(ehTexto(valor['alunoId']) ? { alunoId: valor['alunoId'] } : {}) };
}

function sanearRecado(valor: unknown): Recado | undefined {
  if (!ehObjeto(valor) || typeof valor['lido'] !== 'boolean') return undefined;
  const campos = textos(valor, ['id', 'deId', 'paraId', 'texto', 'enviadoEm']);
  return campos ? { ...campos, texto: campos.texto.slice(0, TAMANHO_MAXIMO_DO_RECADO), lido: valor['lido'] } : undefined;
}

/* Uma conta atual que aponta para alguém que não existe mais (cadastro
   descartado, por exemplo) viraria uma tela quebrada: volta para "ninguém
   entrou". */
function sanearConta(valor: unknown, praticantes: Objeto, acompanhantes: readonly Acompanhante[]): ContaAtual | null {
  if (!ehObjeto(valor) || !ehTexto(valor['id'])) return null;
  const papel = dentroDe(PAPEIS, valor['papel']);
  const id = valor['id'];
  const existe =
    papel === 'praticante' ? Object.hasOwn(praticantes, id) : acompanhantes.some((pessoa) => pessoa.id === id);
  return papel && existe ? { papel, id } : null;
}

export function sanearEstado(valor: unknown): EstadoApp {
  if (!ehObjeto(valor) || valor['versao'] !== VERSAO_DO_ESTADO) return estadoInicial();
  const praticantes = sanearPraticantes(valor['praticantes']);
  const acompanhantes = sanearLista(valor['acompanhantes'], sanearAcompanhante);
  return {
    versao: VERSAO_DO_ESTADO,
    contaAtual: sanearConta(valor['contaAtual'], praticantes, acompanhantes),
    praticantes,
    acompanhantes,
    vinculos: sanearLista(valor['vinculos'], sanearVinculo),
    convites: sanearLista(valor['convites'], sanearConvite),
    recados: sanearLista(valor['recados'], sanearRecado),
  };
}
