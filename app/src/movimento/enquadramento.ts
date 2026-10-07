import type { EstadoDaExecucao } from '../sensores/tipos';
import type { RegiaoDoCorpo } from './desvios';

/* Close-up no erro (auditoria visual, V8). A câmera mira a região que o app
   pede para corrigir e chega um pouco mais perto; na execução certa, volta a
   mostrar o corpo inteiro. `distancia` é uma fração da distância normal da
   câmera ao alvo, e o close-up para em 75% para não cortar o corpo. */

export type Enquadramento = { alturaDoAlvo: number; distancia: number };

export const ENQUADRAMENTO_PADRAO: Enquadramento = { alturaDoAlvo: 0.98, distancia: 1 };

const CLOSE_UP: Record<RegiaoDoCorpo, Enquadramento> = {
  // Suave: a câmera base já fica perto (cartão de 360 px); mais que isso corta a cabeça.
  pernas: { alturaDoAlvo: 0.68, distancia: 0.88 },
  tronco: { alturaDoAlvo: 1.05, distancia: 0.9 },
  bracos: { alturaDoAlvo: 1.1, distancia: 0.9 },
};

export function enquadramento(regiao: RegiaoDoCorpo | null, estado: EstadoDaExecucao): Enquadramento {
  const pedeCorrecao = estado === 'atencao' || estado === 'pare';
  return pedeCorrecao && regiao ? CLOSE_UP[regiao] : ENQUADRAMENTO_PADRAO;
}
