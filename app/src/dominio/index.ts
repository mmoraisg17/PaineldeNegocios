/* API pública do domínio. As telas importam daqui (`../dominio`), nunca de
   arquivos internos, para o domínio poder reorganizar os módulos sem quebrar
   ninguém. */

export * from './tipos';
export { CATALOGO, buscarExercicio, exerciciosDaTrilha } from './catalogo';
export {
  TAMANHO_MAXIMO_DA_FUNCAO,
  TAMANHO_MAXIMO_DO_NOME,
  limparNome,
  nivelInicial,
  nivelPelaFirmeza,
  trilhaDoObjetivo,
  type Firmeza,
  type MedidasDaAvaliacao,
  type Objetivo,
  type Perfil,
} from './perfil';
export {
  FREQUENCIA_SEMANAL_PADRAO,
  nivelMaximoCompativel,
  montarRotina,
  segundosDaDose,
  type AjusteProfissional,
  type ItemRotina,
  type MetaDeSimetria,
  type NiveisAtuais,
  type Rotina,
} from './rotina';
export {
  decidirNivel,
  notaDeExecucao,
  type DecisaoDeNivel,
  type EntradaDaDecisao,
  type MedidasDeExecucao,
} from './progressao';
export { NIVEL_MAXIMO, NIVEL_MINIMO, forcaDoMascote, type NivelDoMascote } from './forcaDoMascote';
export {
  apoioMedioDaSessao,
  notaMediaDaSessao,
  notasRecentesDoExercicio,
  ordenarSessoes,
  semanaDeTreino,
  type ResultadoExercicio,
  type SemanaDeTreino,
  type Sessao,
} from './sessao';
export {
  ALFABETO_DO_CONVITE,
  CODIGO_DO_CONVITE_TAMANHO,
  TOLERANCIA_DA_META_EM_PONTOS,
  VALIDADE_DO_CONVITE_EM_HORAS,
  adesao,
  alertasDoAluno,
  autorizar,
  consultarConvite,
  criarVinculoPendente,
  gerarConvite,
  permissoes,
  permissoesDoVinculo,
  podeVer,
  resgatarConvite,
  revogar,
  solicitarVinculo,
  type Alerta,
  type Convite,
  type Permissoes,
  type ResultadoDoResgate,
  type StatusDoVinculo,
  type TipoAcompanhante,
  type Vinculo,
} from './acompanhamento';
export {
  VERSAO_DO_ESTADO,
  ajusteVigente,
  estadoInicial,
  precisaDoPrimeiroUso,
  rotinaDoPraticante,
  type Acompanhante,
  type ContaAtual,
  type DadosPraticante,
  type EstadoApp,
  type PapelDaConta,
  type Recado,
  TAMANHO_MAXIMO_DO_RECADO,
} from './estado';
export { bytesAleatoriosEmHex, novoId } from './aleatorio';
export {
  ErroSemCriptografia,
  ITERACOES_DA_SENHA,
  TAMANHO_MAXIMO_DA_SENHA,
  TAMANHO_MAXIMO_DO_EMAIL,
  TAMANHO_MINIMO_DA_SENHA,
  buscarCredencial,
  conferirSenha,
  criarCredencial,
  derivarHash,
  emailValido,
  normalizarEmail,
  problemaDaSenha,
  temCriptografia,
  type Credencial,
  type OpcoesDaCredencial,
} from './credenciais';
export {
  CHAVES_ANTIGAS,
  CHAVE_DA_SESSAO,
  CHAVE_DO_ESTADO,
  apagarDados,
  apagarVersoesAntigas,
  armazenamentoDaSessao,
  armazenamentoDoNavegador,
  carregarEstado,
  salvarEstado,
  type Armazenamento,
} from './persistencia';
export { CONTAS_DA_DEMO, IDS_DEMO, SENHA_DA_DEMO, criarEstadoDemo } from './demo';
