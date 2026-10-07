import {
  type AjusteProfissional,
  type ContaAtual,
  type DecisaoDeNivel,
  type EstadoApp,
  type IdExercicio,
  type Nivel,
  type Percepcao,
  type Perfil,
  type Recado,
  type ResultadoExercicio,
  type TipoAcompanhante,
  type Vinculo,
  ajusteVigente,
  buscarExercicio,
  TAMANHO_MAXIMO_DA_FUNCAO,
  decidirNivel,
  limparNome,
  novoId,
  TAMANHO_MAXIMO_DO_RECADO,
  exerciciosDaTrilha,
  gerarConvite,
  nivelMaximoCompativel,
  notasRecentesDoExercicio,
  permissoesDoVinculo,
  podeVer,
  resgatarConvite,
  autorizar as autorizarVinculoDominio,
  revogar as revogarVinculoDominio,
  solicitarVinculo,
  trilhaDoObjetivo,
  type Convite,
  type Acompanhante,
  type DadosPraticante,
} from '../dominio';

/* Ações do app sobre o estado. Funções puras: recebem o estado e devolvem um
   estado NOVO (nunca alteram o recebido). O Provider (ContextoApp.tsx) só as
   chama e salva o resultado; toda regra fica aqui, testável sem React. */

type GerarId = () => string;
// Mesmo gerador do domínio (crypto.randomUUID, ou getRandomValues como reserva).
const idPadrao: GerarId = novoId;

export const entrar = (estado: EstadoApp, conta: ContaAtual): EstadoApp => ({ ...estado, contaAtual: conta });
export const sair = (estado: EstadoApp): EstadoApp => ({ ...estado, contaAtual: null });

/* ---------- praticante ---------- */

export function criarPraticante(
  estado: EstadoApp,
  perfil: Perfil,
  nivel: Nivel,
  gerarId: GerarId = idPadrao,
): { estado: EstadoApp; id: string } {
  const id = gerarId();
  // O nível sugerido pela avaliação vale para todos os exercícios da trilha,
  // limitado ao que a inclinação da plataforma da pessoa permite.
  const niveis = Object.fromEntries(
    exerciciosDaTrilha(trilhaDoObjetivo(perfil.objetivo)).map((e) => [e.id, Math.min(nivel, nivelMaximoCompativel(e, perfil.inclinacaoMaxima))]),
  ) as DadosPraticante['niveis'];
  const praticante: DadosPraticante = { id, perfil: { ...perfil, nome: limparNome(perfil.nome) }, niveis, sessoes: [] };
  return { estado: { ...estado, praticantes: { ...estado.praticantes, [id]: praticante } }, id };
}

/* `nivelAnterior` permite recusar a mudança (manual, 8.2: "você pode recusar");
   `recusada` marca, no resumo, que a pessoa preferiu ficar onde estava. */
export type DecisaoDoExercicio = {
  exercicioId: IdExercicio;
  nome: string;
  nivelAnterior: Nivel;
  decisao: DecisaoDeNivel;
  recusada?: true;
};

/* Fecha um treino: grava a sessão e decide o nível de cada exercício com a
   regra do manual (8.2), respeitando o nível fixado pelo profissional (só se
   o vínculo dele ainda vale) e a inclinação máxima da plataforma. */
export function registrarSessao(
  estado: EstadoApp,
  praticanteId: string,
  resultados: readonly ResultadoExercicio[],
  percepcao: Percepcao,
  agora: Date,
): { estado: EstadoApp; decisoes: DecisaoDoExercicio[] } {
  const praticante = estado.praticantes[praticanteId];
  if (!praticante || resultados.length === 0) return { estado, decisoes: [] };

  const sessoes = [...praticante.sessoes, { data: agora.toISOString(), exercicios: [...resultados], percepcao }];
  const fixados = ajusteVigente(estado, praticanteId)?.niveisFixados ?? {};
  const decisoes = resultados.flatMap((r): DecisaoDoExercicio[] => {
    const exercicio = buscarExercicio(r.id);
    if (!exercicio) return [];
    const nivelAtual = praticante.niveis[r.id] ?? r.nivel;
    const decisao = decidirNivel({
      nivelAtual,
      notasRecentes: notasRecentesDoExercicio(sessoes, r.id, nivelAtual),
      percepcao,
      fixado: fixados[r.id] !== undefined,
      nivelMaximo: nivelMaximoCompativel(exercicio, praticante.perfil.inclinacaoMaxima),
    });
    return [{ exercicioId: r.id, nome: exercicio.nome, nivelAnterior: nivelAtual, decisao }];
  });
  const niveis = { ...praticante.niveis, ...Object.fromEntries(decisoes.map((d) => [d.exercicioId, d.decisao.nivel])) };
  return {
    estado: { ...estado, praticantes: { ...estado.praticantes, [praticanteId]: { ...praticante, sessoes, niveis } } },
    decisoes,
  };
}

/* "Prefiro continuar no nível X": devolve o nível de antes só daquele
   exercício. A sessão fica gravada; no próximo treino a regra reavalia. */
export function recusarMudancaDeNivel(estado: EstadoApp, praticanteId: string, exercicioId: IdExercicio, nivelAnterior: Nivel): EstadoApp {
  const praticante = estado.praticantes[praticanteId];
  if (!praticante) return estado;
  const niveis = { ...praticante.niveis, [exercicioId]: nivelAnterior };
  return { ...estado, praticantes: { ...estado.praticantes, [praticanteId]: { ...praticante, niveis } } };
}

/* ---------- acompanhantes, convites e vínculos ---------- */

export function criarAcompanhante(
  estado: EstadoApp,
  dados: { nome: string; tipo: TipoAcompanhante; funcao: string },
  gerarId: GerarId = idPadrao,
): { estado: EstadoApp; id: string } {
  const id = gerarId();
  const acompanhante: Acompanhante = { id, ...dados, nome: limparNome(dados.nome), funcao: limparNome(dados.funcao, TAMANHO_MAXIMO_DA_FUNCAO) };
  return { estado: { ...estado, acompanhantes: [...estado.acompanhantes, acompanhante] }, id };
}

export function gerarConviteDe(
  estado: EstadoApp,
  alunoId: string,
  tipo: TipoAcompanhante,
  agora: Date,
): { estado: EstadoApp; convite: Convite } {
  const convite: Convite = { ...gerarConvite(tipo, agora, estado.convites), alunoId };
  return { estado: { ...estado, convites: [...estado.convites, convite] }, convite };
}

export type ResultadoDoCodigo =
  | { ok: true; vinculo: Vinculo }
  | { ok: false; erro: 'nao-encontrado' | 'expirado' | 'convite-sem-aluno' };

/* O acompanhante digita o código: o convite é consumido e nasce um vínculo
   PENDENTE. O praticante ainda precisa autorizar (manual, 11.2). */
export function usarCodigo(
  estado: EstadoApp,
  codigo: string,
  acompanhanteId: string,
  agora: Date,
): { estado: EstadoApp; resultado: ResultadoDoCodigo } {
  const resgate = resgatarConvite(codigo, estado.convites, agora);
  const semVencidos = { ...estado, convites: resgate.convitesRestantes };
  if (!resgate.ok) return { estado: semVencidos, resultado: { ok: false, erro: resgate.erro } };
  const alunoId = resgate.convite.alunoId;
  if (!alunoId || !estado.praticantes[alunoId]) return { estado: semVencidos, resultado: { ok: false, erro: 'convite-sem-aluno' } };
  const { vinculos, vinculo } = solicitarVinculo(estado.vinculos, resgate.convite.tipo, alunoId, acompanhanteId, agora);
  return { estado: { ...semVencidos, vinculos }, resultado: { ok: true, vinculo } };
}

function trocarVinculo(estado: EstadoApp, vinculoId: string, mudar: (v: Vinculo) => Vinculo): EstadoApp {
  return { ...estado, vinculos: estado.vinculos.map((v) => (v.id === vinculoId ? mudar(v) : v)) };
}

export const autorizarVinculo = (estado: EstadoApp, vinculoId: string, agora: Date) =>
  trocarVinculo(estado, vinculoId, (v) => autorizarVinculoDominio(v, agora));

export const revogarVinculo = (estado: EstadoApp, vinculoId: string, agora: Date) =>
  trocarVinculo(estado, vinculoId, (v) => revogarVinculoDominio(v, agora));

export type VinculoComPessoa = { vinculo: Vinculo; acompanhante: Acompanhante | undefined };

/* Para a tela Perfil → Acompanhantes: pendentes e autorizados (revogados
   somem da lista; o histórico continua no estado). */
export function vinculosDoPraticante(estado: EstadoApp, praticanteId: string): VinculoComPessoa[] {
  return estado.vinculos
    .filter((v) => v.alunoId === praticanteId && v.status !== 'revogado')
    .map((vinculo) => ({ vinculo, acompanhante: estado.acompanhantes.find((a) => a.id === vinculo.acompanhanteId) }));
}

export type AlunoVisivel = { vinculo: Vinculo; praticante: DadosPraticante };

/* Só quem autorizou aparece para o acompanhante: toda leitura de dados de
   terceiros passa por podeVer (limitação do protótipo documentada em
   dominio/persistencia.ts). */
export function alunosDe(estado: EstadoApp, acompanhanteId: string): AlunoVisivel[] {
  return estado.vinculos.flatMap((vinculo) => {
    const praticante = estado.praticantes[vinculo.alunoId];
    return vinculo.acompanhanteId === acompanhanteId && podeVer(vinculo) && praticante ? [{ vinculo, praticante }] : [];
  });
}

export function vinculoEntre(estado: EstadoApp, acompanhanteId: string, alunoId: string): Vinculo | undefined {
  return estado.vinculos.find((v) => v.acompanhanteId === acompanhanteId && v.alunoId === alunoId && podeVer(v));
}

/* ---------- ajuste e recados (só profissional com vínculo autorizado) ---------- */

export function salvarAjuste(
  estado: EstadoApp,
  acompanhanteId: string,
  praticanteId: string,
  ajuste: Omit<AjusteProfissional, 'autor' | 'autorId'>,
): { estado: EstadoApp; ok: boolean } {
  const vinculo = vinculoEntre(estado, acompanhanteId, praticanteId);
  const autor = estado.acompanhantes.find((a) => a.id === acompanhanteId);
  const praticante = estado.praticantes[praticanteId];
  if (!vinculo || !permissoesDoVinculo(vinculo).ajustarRotina || !autor || !praticante) return { estado, ok: false };
  const completo: AjusteProfissional = { ...ajuste, autor: autor.nome, autorId: autor.id };
  return { estado: { ...estado, praticantes: { ...estado.praticantes, [praticanteId]: { ...praticante, ajuste: completo } } }, ok: true };
}


export function enviarRecado(
  estado: EstadoApp,
  deId: string,
  paraId: string,
  texto: string,
  agora: Date,
  gerarId: GerarId = idPadrao,
): { estado: EstadoApp; ok: boolean } {
  const limpo = texto.trim().slice(0, TAMANHO_MAXIMO_DO_RECADO);
  const vinculo = vinculoEntre(estado, deId, paraId);
  if (!limpo || !vinculo || !permissoesDoVinculo(vinculo).enviarRecados) return { estado, ok: false };
  const recado: Recado = { id: gerarId(), deId, paraId, texto: limpo, enviadoEm: agora.toISOString(), lido: false };
  return { estado: { ...estado, recados: [...estado.recados, recado] }, ok: true };
}

export function marcarRecadosLidos(estado: EstadoApp, paraId: string): EstadoApp {
  if (!estado.recados.some((r) => r.paraId === paraId && !r.lido)) return estado;
  return { ...estado, recados: estado.recados.map((r) => (r.paraId === paraId ? { ...r, lido: true } : r)) };
}

/* Recados visíveis: só de quem ainda tem vínculo autorizado. */
export function recadosPara(estado: EstadoApp, praticanteId: string): (Recado & { autor: string })[] {
  return estado.recados
    .filter((r) => r.paraId === praticanteId && vinculoEntre(estado, r.deId, praticanteId))
    .map((r) => ({ ...r, autor: estado.acompanhantes.find((a) => a.id === r.deId)?.nome ?? 'Acompanhante' }));
}

export { TAMANHO_MAXIMO_DO_RECADO };
