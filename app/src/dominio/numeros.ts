/* Restringe um número a [minimo, maximo]. NaN vira o mínimo: as medidas do
   sensor chegam de fora do domínio, e um NaN que passasse adiante faria
   qualquer comparação ("nota >= 80") dar falso sem ninguém perceber. */
export function limitar(valor: number, minimo: number, maximo: number): number {
  if (Number.isNaN(valor)) return minimo;
  return Math.min(maximo, Math.max(minimo, valor));
}
