export type { Desvio, Esperado, EstadoDaExecucao, Leitura } from './tipos';
export { CARGA_EM_PE, simularLeitura } from './simulador';
export { alvoDaTransferencia, esperadoDoExercicio } from './esperado';
export { DETECTOR_DA_CORRECAO, LIMIAR, ROTULO_DO_DESVIO, avaliar, desviosSimulaveis, detectar, metricas, type Avaliacao } from './regras';
export {
  ESPERA_OK,
  ESPERA_PROBLEMA,
  TEMPO_MINIMO_NA_TELA,
  atualizarFeedback,
  desvioDoModoAutomatico,
  iniciarFeedback,
  type EstadoDoFeedback,
} from './feedback';
