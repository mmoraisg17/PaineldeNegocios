import {
  ITERACOES_DA_SENHA,
  type AjusteProfissional,
  type ContaAtual,
  type Credencial,
  type DecisaoDeNivel,
  type EstadoApp,
  type IdExercicio,
  type Nivel,
  type PapelDaConta,
  type Percepcao,
  type Perfil,
  type Recado,
  type ResultadoExercicio,
  type TipoAcompanhante,
  type Vinculo,
  ajusteVigente,
  buscarCredencial,
  buscarExercicio,
  conferirSenha,
  derivarHash,
  temCriptografia,
  emailValido,
  problemaDaSenha,
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
import { codigoDoTexto } from './linkDoConvite';

/* Ações do app sobre o estado. Funções puras: recebem o estado e devolvem um
   estado NOVO (nunca alteram o recebido). O Provider (ContextoApp.tsx) só as
   chama e salva o resultado; toda regra fica aqui, testável sem React. */

type GerarId = () => string;
// Mesmo gerador do domínio (crypto.randomUUID, ou getRandomValues como reserva).
const idPadrao: GerarId = novoId;

export const entrar = (estado: EstadoApp, conta: ContaAtual): EstadoApp => ({ ...estado, contaAtual: conta });
export const sair = (estado: EstadoApp): EstadoApp => ({ ...estado, contaAtual: null });

/* ---------- cadastro e login com e-mail e senha ---------- */

export type ErroDoCadastro = 'email-invalido' | 'senha-curta' | 'senha-longa' | 'email-em-uso';

/* Síncrona de propósito: a tela mostra o erro na hora, antes de gastar os
   ~0,4 s do hash. Para quem já tem conta, "e-mail em uso" revela que o
   endereço existe; é o preço de avisar no cadastro e não tem como evitar sem
   servidor que mande um e-mail de confirmação. O login, esse sim, não revela
   (ver `entrarComSenha`). */
export function validarCadastro(
  estado: EstadoApp,
  dados: { email: string; senha: string; papel: PapelDaConta },
): ErroDoCadastro | null {
  if (!emailValido(dados.email)) return 'email-invalido';
  const problema = problemaDaSenha(dados.senha);
  if (problema) return problema === 'curta' ? 'senha-curta' : 'senha-longa';
  return buscarCredencial(estado.credenciais, dados.email, dados.papel) ? 'email-em-uso' : null;
}

/* Cadastro do praticante. NÃO cria o praticante: ele nasce no fim da triagem
   (`criarPraticante` com `gerarId = () => conta.id`), e até lá `precisaDoPrimeiroUso`
   é verdadeiro. Com a credencial do mesmo e-mail e papel já guardada (toque
   duplo no botão, enquanto o hash era calculado), devolve o estado sem mudar. */
export function cadastrarPraticante(estado: EstadoApp, credencial: Credencial, manterConectado: boolean): EstadoApp {
  if (credencial.papel !== 'praticante') return estado;
  if (buscarCredencial(estado.credenciais, credencial.email, 'praticante')) return estado;
  return {
    ...estado,
    credenciais: [...estado.credenciais, credencial],
    contaAtual: { papel: 'praticante', id: credencial.pessoaId, manterConectado },
  };
}

const FUNCAO_PADRAO: Record<TipoAcompanhante, string> = { profissional: 'Profissional', familiar: 'Familiar' };

/* Cadastro do acompanhante: aqui a pessoa já nasce completa (nome, tipo e
   função), com o id da credencial. Mesma proteção contra toque duplo. */
export function cadastrarAcompanhante(
  estado: EstadoApp,
  dados: { nome: string; tipo: TipoAcompanhante; funcao: string },
  credencial: Credencial,
  manterConectado: boolean,
): EstadoApp {
  if (credencial.papel !== 'acompanhante') return estado;
  if (buscarCredencial(estado.credenciais, credencial.email, 'acompanhante')) return estado;
  const funcao = limparNome(dados.funcao, TAMANHO_MAXIMO_DA_FUNCAO) || FUNCAO_PADRAO[dados.tipo];
  const acompanhante: Acompanhante = { id: credencial.pessoaId, nome: limparNome(dados.nome), tipo: dados.tipo, funcao };
  return {
    ...estado,
    acompanhantes: [...estado.acompanhantes, acompanhante],
    credenciais: [...estado.credenciais, credencial],
    contaAtual: { papel: 'acompanhante', id: credencial.pessoaId, manterConectado },
  };
}

/* Sal sem significado, só para o hash descartável de quem não tem conta. */
const SAL_DESCARTAVEL = '00'.repeat(16);

/* 'sem-criptografia' não é erro da pessoa: o app aberto por http fora de
   localhost não tem WebCrypto, então nenhuma senha poderia ser conferida. */
export type ResultadoDoLogin =
  | { ok: true; conta: ContaAtual }
  | { ok: false; erro: 'credenciais-invalidas' | 'sem-criptografia' };

/* Não altera o estado: devolve a conta e quem chama usa `entrar`. Um único
   erro para e-mail inexistente, senha errada, papel trocado e conta sumida: a
   tela diz "e-mail ou senha incorretos" e não revela quais e-mails existem.
   Quando o e-mail não existe, deriva mesmo assim um hash descartável, para o
   tempo de resposta também não revelar isso. Sem WebCrypto, avisa antes de
   qualquer hash: dizer "senha incorreta" a quem digitou a senha certa só
   faria a pessoa tentar de novo, sem chance de entrar. O aviso vale para
   qualquer e-mail, então também não revela quais contas existem. */
export async function entrarComSenha(
  estado: EstadoApp,
  dados: { email: string; senha: string; papel: PapelDaConta; manterConectado: boolean },
): Promise<ResultadoDoLogin> {
  if (!temCriptografia()) return { ok: false, erro: 'sem-criptografia' };
  const invalido: ResultadoDoLogin = { ok: false, erro: 'credenciais-invalidas' };
  const credencial = buscarCredencial(estado.credenciais, dados.email, dados.papel);
  if (!credencial) {
    await derivarHash(dados.senha, SAL_DESCARTAVEL, ITERACOES_DA_SENHA).catch(() => '');
    return invalido;
  }
  if (!(await conferirSenha(credencial, dados.senha))) return invalido;
  const pessoaExiste =
    dados.papel === 'praticante' || estado.acompanhantes.some((pessoa) => pessoa.id === credencial.pessoaId);
  if (!pessoaExiste) return invalido;
  return { ok: true, conta: { papel: dados.papel, id: credencial.pessoaId, manterConectado: dados.manterConectado } };
}

/* Para onde ir depois de entrar. O convite (código ou link colado) só vale
   para o acompanhante; passa por `codigoDoTexto`, que deixa só letras e
   dígitos, então o caminho nunca carrega "&", "#" nem outro texto da pessoa. */
export function destinoDepoisDeEntrar(estado: EstadoApp, conta: ContaAtual, convite?: string): string {
  if (conta.papel === 'acompanhante') {
    const codigo = codigoDoTexto(convite ?? '');
    return codigo ? `/acompanhante/adicionar?codigo=${codigo}` : '/acompanhante/alunos';
  }
  return Object.hasOwn(estado.praticantes, conta.id) ? '/praticante/hoje' : '/primeiro-uso';
}

/* ---------- praticante ---------- */

export function criarPraticante(
  estado: EstadoApp,
  perfil: Perfil,
  nivel: Nivel,
  gerarId: GerarId = idPadrao,
): { estado: EstadoApp; id: string } {
  const id = gerarId();
  // O nível inicial (ver `nivelPelaFirmeza`) vale para todos os exercícios da trilha,
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
