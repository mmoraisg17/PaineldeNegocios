/* Transições visuais da cena 3D (auditoria de animações). Funções puras e
   sem three.js: a cena só as aplica a cada quadro, e os testes conferem os
   números sem WebGL. */

/* A3: a cor de destaque chega a ~90% em ~200 ms (1 − e^(−12·0,2) ≈ 0,91),
   em vez de trocar num quadro só e "piscar". */
export const TAXA_DO_DESTAQUE = 12;

/* Quanto andar até o alvo neste quadro, numa aproximação exponencial. Não
   depende do fps: dois quadros de 8 ms andam o mesmo que um de 16 ms. */
export function fatorDeAproximacao(delta: number, taxa: number): number {
  return 1 - Math.exp(-taxa * Math.max(0, delta));
}

/* M1: ao pausar, o boneco desacelera até parar em 0,35 s (e acelera igual ao
   retomar), em vez de congelar e arrancar num quadro só. */
export const RAMPA_DE_PAUSA = 0.35;

/* Anda de `atual` até `alvo` no máximo `taxa × delta` (rampa linear), sem
   passar do alvo. */
export function aproximar(atual: number, alvo: number, delta: number, taxa: number): number {
  const passo = taxa * Math.max(0, delta);
  return atual < alvo ? Math.min(alvo, atual + passo) : Math.max(alvo, atual - passo);
}

/* M3: respiração calma (0,22 Hz ≈ 13 por minuto) que move o tronco ±0,6°.
   Só aparece quando o corpo está parado (sentado, em pé): durante o
   movimento some na escala do exercício. Só visual: não entra na carga. */
export const RESPIRACAO = { hz: 0.22, graus: 0.6 } as const;

export function respiracao(tempo: number): number {
  return RESPIRACAO.graus * Math.sin(2 * Math.PI * RESPIRACAO.hz * tempo);
}
