import type { Desvio } from './tipos';
import type { Avaliacao } from './regras';

/* Filtro do que aparece na tela. Sem ele, um aviso piscaria a cada balanço
   do corpo, e um aviso que pisca é ignorado ou assusta. Regras:
   - um problema novo precisa durar 0,4 s para aparecer;
   - "pare" aparece na hora (segurança primeiro);
   - voltar ao "tudo certo" exige 0,8 s sem problema;
   - um aviso fica pelo menos 1,2 s na tela, para dar tempo de ler. */
export const ESPERA_PROBLEMA = 0.4;
export const ESPERA_OK = 0.8;
export const TEMPO_MINIMO_NA_TELA = 1.2;

export type EstadoDoFeedback = {
  readonly exibido: Avaliacao;
  readonly exibidoDesde: number;
  readonly candidato: Avaliacao;
  readonly candidatoDesde: number;
};

const chave = (a: Avaliacao) => a.correcao?.id ?? a.estado;

export function iniciarFeedback(inicial: Avaliacao, tempo: number): EstadoDoFeedback {
  return { exibido: inicial, exibidoDesde: tempo, candidato: inicial, candidatoDesde: tempo };
}

export function atualizarFeedback(estado: EstadoDoFeedback, nova: Avaliacao, tempo: number): EstadoDoFeedback {
  const mesmoCandidato = chave(nova) === chave(estado.candidato);
  const candidato = nova;
  const candidatoDesde = mesmoCandidato ? estado.candidatoDesde : tempo;

  if (chave(candidato) === chave(estado.exibido)) {
    // Mesmo aviso: só atualiza as notas, sem reiniciar o tempo na tela.
    return { ...estado, exibido: candidato, candidato, candidatoDesde };
  }

  const urgente = candidato.estado === 'pare';
  const espera = candidato.estado === 'ok' || candidato.estado === 'dica' ? ESPERA_OK : ESPERA_PROBLEMA;
  const maduro = tempo - candidatoDesde >= espera;
  const exibidoTempoSuficiente = tempo - estado.exibidoDesde >= TEMPO_MINIMO_NA_TELA;

  if (urgente || (maduro && exibidoTempoSuficiente)) {
    return { exibido: candidato, exibidoDesde: tempo, candidato, candidatoDesde };
  }
  return { ...estado, candidato, candidatoDesde };
}

/* Modo automático da demonstração: o avaliador vê a execução certa, um erro,
   a correção, outro erro. Ciclo de 24 s. */
const CICLO_AUTOMATICO = 24;
const JANELAS: readonly { de: number; ate: number; indice: number }[] = [
  { de: 8, ate: 12, indice: 0 },
  { de: 18, ate: 22, indice: 1 },
];

export function desvioDoModoAutomatico(desvios: readonly Desvio[], tempo: number): Desvio | null {
  if (desvios.length === 0) return null;
  const t = ((tempo % CICLO_AUTOMATICO) + CICLO_AUTOMATICO) % CICLO_AUTOMATICO;
  const janela = JANELAS.find((j) => t >= j.de && t < j.ate);
  return janela ? (desvios[janela.indice % desvios.length] ?? null) : null;
}
