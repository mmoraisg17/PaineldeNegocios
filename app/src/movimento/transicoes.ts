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
