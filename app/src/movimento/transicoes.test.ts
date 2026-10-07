import { describe, expect, test } from 'vitest';
import { TAXA_DO_DESTAQUE, fatorDeAproximacao } from './transicoes';

/* Auditoria de animações: A3 (destaque com transição), M1 (rampa de pausa) e
   M3 (respiração). Funções puras; a cena 3D só as aplica a cada quadro. */

const passos = (segundos: number, fps = 60) => Math.round(segundos * fps);

describe('fatorDeAproximacao (A3: cor do destaque)', () => {
  test('chega a ~90% da cor em ~200 ms, independente do fps', () => {
    for (const fps of [30, 60, 120]) {
      let restante = 1;
      for (let i = 0; i < passos(0.2, fps); i += 1) restante *= 1 - fatorDeAproximacao(1 / fps, TAXA_DO_DESTAQUE);
      expect(1 - restante, `${fps} fps`).toBeCloseTo(0.9, 1);
    }
  });

  test('delta zero não muda nada; delta enorme vai direto ao alvo', () => {
    expect(fatorDeAproximacao(0, TAXA_DO_DESTAQUE)).toBe(0);
    expect(fatorDeAproximacao(10, TAXA_DO_DESTAQUE)).toBeCloseTo(1, 6);
  });
});
