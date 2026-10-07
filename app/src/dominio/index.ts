/* API pública do domínio. As telas importam daqui (`../dominio`), nunca de
   arquivos internos, para o domínio poder reorganizar os módulos sem quebrar
   ninguém. */

export * from './tipos';
export { ACESSORIOS_DA_PLATAFORMA, CATALOGO, buscarExercicio, exerciciosDaTrilha } from './catalogo';
export {
  nivelInicial,
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
  rotinaDoPraticante,
  type Acompanhante,
  type ContaAtual,
  type DadosPraticante,
  type EstadoApp,
  type PapelDaConta,
  type Recado,
} from './estado';
export {
  CHAVE_DO_ESTADO,
  apagarDados,
  armazenamentoDoNavegador,
  carregarEstado,
  salvarEstado,
  type Armazenamento,
} from './persistencia';
export { IDS_DEMO, criarEstadoDemo } from './demo';
