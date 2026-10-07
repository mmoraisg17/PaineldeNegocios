import { aleatorioSeguro, gerarValorUnico, novoId } from './aleatorio';
import { buscarExercicio } from './catalogo';
import { limitar } from './numeros';
import type { MetaDeSimetria } from './rotina';
import { apoioMedioDaSessao, ordenarSessoes, type SemanaDeTreino, type Sessao } from './sessao';
import { IDS_DOS_EXERCICIOS, type IdExercicio } from './tipos';

export type TipoAcompanhante = 'profissional' | 'familiar';

export type Permissoes = {
  verRelatorios: boolean;
  ajustarRotina: boolean;
  enviarRecados: boolean;
};

/* Datas em texto ISO 8601 para sobreviverem ao JSON do localStorage. */
export type Convite = {
  codigo: string;
  tipo: TipoAcompanhante;
  criadoEm: string;
  expiraEm: string;
  /* Quem gerou o convite: é com essa pessoa que o vínculo será criado quando
     o acompanhante digitar o código. Opcional só por compatibilidade com
     convites criados antes do campo existir. */
  alunoId?: string;
};

/* `convitesRestantes` é a lista para guardar de volta no estado: sem o convite
   consumido (um código só serve uma vez) e sem os que já expiraram. Vem
   também nos erros, para um resgate falho limpar os vencidos. */
export type ResultadoDoResgate =
  | { ok: true; convite: Convite; convitesRestantes: Convite[] }
  | { ok: false; erro: 'nao-encontrado' | 'expirado'; convitesRestantes: Convite[] };

export type StatusDoVinculo = 'pendente' | 'autorizado' | 'revogado';

export type Vinculo = {
  id: string;
  alunoId: string;
  acompanhanteId: string;
  tipo: TipoAcompanhante;
  status: StatusDoVinculo;
  criadoEm: string;
  autorizadoEm?: string;
  revogadoEm?: string;
};

export type Alerta = {
  tipo: 'apoio-alto' | 'simetria-fora-da-meta' | 'treinos-nao-realizados';
  mensagem: string;
  exercicioId?: IdExercicio;
};

/* Alfabeto do código de convite: letras e dígitos sem 0, O, 1, I e L. O
   código é lido em voz alta ou digitado a partir de uma mensagem, por gente
   que pode ter a vista cansada; esses caracteres se confundem entre si.
   31 símbolos ^ 6 posições dão cerca de 887 milhões de códigos, suficiente
   para um protótipo local (não é um segredo de segurança). */
export const ALFABETO_DO_CONVITE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODIGO_DO_CONVITE_TAMANHO = 6;
/* 48 h dá tempo de a pessoa responder a mensagem, sem deixar um convite
   esquecido valendo para sempre (manual, seção 11.2). */
export const VALIDADE_DO_CONVITE_EM_HORAS = 48;

const MS_POR_HORA = 60 * 60 * 1000;

/* Limiares dos alertas (manual, seção 12.2). */
const APOIO_QUE_GERA_ALERTA = 0.3;
const SESSOES_COM_APOIO_ALTO = 2;
const TREINOS_NAO_REALIZADOS_QUE_GERAM_ALERTA = 3;
/* Tolerância da meta de simetria, em pontos percentuais de carga na perna
   esquerda. A célula de carga e o corpo oscilam de uma repetição para outra:
   sem folga, 49% contra uma meta de 50% viraria alerta todo dia e o
   profissional deixaria de olhar. Vale nos dois sentidos (abaixo ou acima da
   meta), porque carregar a mais a perna esquerda também foge do combinado.
   O valor é decisão de projeto, a validar com um fisioterapeuta. */
export const TOLERANCIA_DA_META_EM_PONTOS = 5;

export function permissoes(tipo: TipoAcompanhante): Permissoes {
  const profissional = tipo === 'profissional';
  return { verRelatorios: true, ajustarRotina: profissional, enviarRecados: profissional };
}

function sortearCodigo(aleatorio: () => number): string {
  const ultimo = ALFABETO_DO_CONVITE.length - 1;
  let codigo = '';
  for (let posicao = 0; posicao < CODIGO_DO_CONVITE_TAMANHO; posicao += 1) {
    const indice = limitar(Math.floor(aleatorio() * ALFABETO_DO_CONVITE.length), 0, ultimo);
    codigo += ALFABETO_DO_CONVITE.charAt(indice);
  }
  return codigo;
}

/* `aleatorio` é injetável para os testes serem determinísticos; o padrão usa
   crypto.getRandomValues, para o código não ser previsível. `convitesExistentes`
   evita repetir o código de um convite ainda ativo (dois convites com o mesmo
   código fariam o resgate entregar o acesso ao convite errado). Convites
   expirados não contam: o código deles já não resgata nada. */
export function gerarConvite(
  tipo: TipoAcompanhante,
  agora: Date,
  convitesExistentes: readonly Convite[] = [],
  aleatorio: () => number = aleatorioSeguro,
): Convite {
  const ativos = convitesExistentes.filter((convite) => !expirou(convite, agora));
  const codigo = gerarValorUnico(
    () => sortearCodigo(aleatorio),
    (candidato) => ativos.some((convite) => convite.codigo === candidato),
    'um código de convite',
  );
  const expiraEm = new Date(agora.getTime() + VALIDADE_DO_CONVITE_EM_HORAS * MS_POR_HORA);
  return { codigo, tipo, criadoEm: agora.toISOString(), expiraEm: expiraEm.toISOString() };
}

function normalizarCodigo(codigo: string): string {
  return codigo.replace(/\s+/g, '').toUpperCase();
}

/* `!(agora < expiração)` em vez de `agora >= expiração`: com uma data de
   expiração inválida (NaN) a comparação direta daria "ainda vale"; assim um
   convite corrompido conta como expirado. */
function expirou(convite: Convite, agora: Date): boolean {
  return !(agora.getTime() < Date.parse(convite.expiraEm));
}

/* Consome o convite: o código só vale uma vez. Com códigos repetidos na lista
   (dado antigo ou corrompido), prefere o válido ao expirado; só um é consumido. */
export function resgatarConvite(
  codigo: string,
  convites: readonly Convite[],
  agora: Date,
): ResultadoDoResgate {
  const procurado = normalizarCodigo(codigo);
  const ativos = convites.filter((convite) => !expirou(convite, agora));
  const indice = procurado === '' ? -1 : ativos.findIndex((convite) => convite.codigo === procurado);
  const encontrado = ativos[indice];
  if (encontrado) {
    const convitesRestantes = ativos.filter((_, posicao) => posicao !== indice);
    return { ok: true, convite: encontrado, convitesRestantes };
  }
  const vencido = procurado !== '' && convites.some((convite) => convite.codigo === procurado);
  return { ok: false, erro: vencido ? 'expirado' : 'nao-encontrado', convitesRestantes: ativos };
}

/* O acompanhante digitou o código: nasce um pedido pendente (com o tipo do
   convite resgatado), que só passa a valer quando o praticante autoriza
   (consentimento explícito, LGPD). O id é único e aleatório (injetável nos
   testes), e não "aluno:acompanhante": assim reconvidar depois de revogar
   cria um registro novo, sem apagar o histórico do revogado. */
export function criarVinculoPendente(
  tipo: TipoAcompanhante,
  alunoId: string,
  acompanhanteId: string,
  agora: Date,
  gerarId: () => string = novoId,
): Vinculo {
  return {
    id: gerarId(),
    alunoId,
    acompanhanteId,
    tipo,
    status: 'pendente',
    criadoEm: agora.toISOString(),
  };
}

/* Só um pedido pendente pode ser autorizado. Um vínculo revogado não volta:
   a pessoa precisa gerar outro convite, para a reautorização ser consciente. */
export function autorizar(vinculo: Vinculo, agora: Date): Vinculo {
  if (vinculo.status !== 'pendente') return vinculo;
  return { ...vinculo, status: 'autorizado', autorizadoEm: agora.toISOString() };
}

export function revogar(vinculo: Vinculo, agora: Date): Vinculo {
  if (vinculo.status === 'revogado') return vinculo;
  return { ...vinculo, status: 'revogado', revogadoEm: agora.toISOString() };
}

export function podeVer(vinculo: Vinculo): boolean {
  return vinculo.status === 'autorizado';
}

const SEM_PERMISSOES: Permissoes = { verRelatorios: false, ajustarRotina: false, enviarRecados: false };

/* Permissões efetivas de um vínculo: as do tipo de acompanhante só valem se o
   praticante autorizou e não revogou. Pedido pendente e acesso revogado não
   dão nada. Toda checagem de "o que este acompanhante pode fazer" deve passar
   por aqui, e não por `permissoes(tipo)` direto. */
export function permissoesDoVinculo(vinculo: Vinculo): Permissoes {
  return podeVer(vinculo) ? permissoes(vinculo.tipo) : { ...SEM_PERMISSOES };
}

/* Acrescenta um pedido de vínculo à lista. Se já existe pedido pendente ou
   autorizado do mesmo par, devolve o existente (sem duplicar). Um vínculo
   revogado nunca é reaproveitado nem sobrescrito: reconvidar gera um novo. */
export function solicitarVinculo(
  vinculos: readonly Vinculo[],
  tipo: TipoAcompanhante,
  alunoId: string,
  acompanhanteId: string,
  agora: Date,
  gerarId: () => string = novoId,
): { vinculos: Vinculo[]; vinculo: Vinculo } {
  const existente = vinculos.find(
    (item) => item.alunoId === alunoId && item.acompanhanteId === acompanhanteId && item.status !== 'revogado',
  );
  if (existente) return { vinculos: [...vinculos], vinculo: existente };

  const id = gerarValorUnico(gerarId, (candidato) => vinculos.some((item) => item.id === candidato), 'um id de vínculo');
  const vinculo = criarVinculoPendente(tipo, alunoId, acompanhanteId, agora, () => id);
  return { vinculos: [...vinculos, vinculo], vinculo };
}

function alertaDeApoio(ordenadas: readonly Sessao[]): Alerta[] {
  const ultimas = ordenadas.slice(-SESSOES_COM_APOIO_ALTO);
  const todasAltas =
    ultimas.length === SESSOES_COM_APOIO_ALTO &&
    ultimas.every((sessao) => apoioMedioDaSessao(sessao) > APOIO_QUE_GERA_ALERTA);
  return todasAltas ? [{ tipo: 'apoio-alto', mensagem: 'Apoiou muito nas barras nos últimos 2 treinos' }] : [];
}

function cargaEsquerdaMaisRecente(ordenadas: readonly Sessao[], id: IdExercicio): number | undefined {
  for (let indice = ordenadas.length - 1; indice >= 0; indice -= 1) {
    const feito = ordenadas[indice]?.exercicios.find((exercicio) => exercicio.id === id);
    if (feito) return feito.cargaEsquerda;
  }
  return undefined;
}

function alertasDeSimetria(
  ordenadas: readonly Sessao[],
  metas: Partial<Record<IdExercicio, MetaDeSimetria>>,
): Alerta[] {
  return IDS_DOS_EXERCICIOS.flatMap((id): Alerta[] => {
    const meta = metas[id];
    const carga = cargaEsquerdaMaisRecente(ordenadas, id);
    if (!meta || carga === undefined) return [];
    if (Math.abs(carga - meta.simetriaEsquerda) <= TOLERANCIA_DA_META_EM_PONTOS) return [];
    const nome = buscarExercicio(id)?.nome ?? id;
    return [{ tipo: 'simetria-fora-da-meta', mensagem: `Simetria fora da meta: ${nome}`, exercicioId: id }];
  });
}

function alertaDeFaltas(semana: SemanaDeTreino): Alerta[] {
  const naoRealizados = semana.planejadas - semana.feitas;
  if (naoRealizados < TREINOS_NAO_REALIZADOS_QUE_GERAM_ALERTA) return [];
  return [{ tipo: 'treinos-nao-realizados', mensagem: `${naoRealizados} treinos planejados não realizados` }];
}

/* Os três alertas do manual (seção 12.2), sempre nesta ordem: apoio,
   simetria, treinos não realizados. `semana` traz os treinos planejados e
   feitos na janela que a tela quer avaliar (ver `semanaDeTreino`). */
export function alertasDoAluno(
  sessoes: readonly Sessao[],
  semana: SemanaDeTreino,
  metas: Partial<Record<IdExercicio, MetaDeSimetria>> = {},
): Alerta[] {
  const ordenadas = ordenarSessoes(sessoes);
  return [...alertaDeApoio(ordenadas), ...alertasDeSimetria(ordenadas, metas), ...alertaDeFaltas(semana)];
}

/* Treinos feitos dividido pelos planejados, de 0 a 1 (manual, seção 16).
   Sem nada planejado a adesão é 0, e não 1: "não há o que medir" não deve
   parecer "tudo cumprido" no relatório do profissional. */
export function adesao(feitos: number, planejados: number): number {
  if (Number.isNaN(feitos) || Number.isNaN(planejados) || planejados <= 0) return 0;
  return limitar(feitos / planejados, 0, 1);
}
