import { describe, expect, test } from 'vitest';
import { RAMPA_DE_PAUSA, RESPIRACAO, TAXA_DO_DESTAQUE, aproximar, fatorDeAproximacao, respiracao } from './transicoes';

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

describe('aproximar (M1: rampa de pausa)', () => {
  test('ao pausar, a velocidade cai de 1 a 0 em RAMPA_DE_PAUSA segundos, sem passar de 0', () => {
    let v = 1;
    const meio = passos(RAMPA_DE_PAUSA / 2);
    for (let i = 0; i < meio; i += 1) v = aproximar(v, 0, 1 / 60, 1 / RAMPA_DE_PAUSA);
    expect(v).toBeCloseTo(0.5, 1);
    for (let i = 0; i < passos(RAMPA_DE_PAUSA); i += 1) v = aproximar(v, 0, 1 / 60, 1 / RAMPA_DE_PAUSA);
    expect(v).toBe(0);
  });

  test('ao retomar, sobe até a velocidade escolhida (inclusive a lenta, 0,5) e para nela', () => {
    let v = 0;
    for (let i = 0; i < passos(1); i += 1) v = aproximar(v, 0.5, 1 / 60, 1 / RAMPA_DE_PAUSA);
    expect(v).toBe(0.5);
  });
});

describe('respiracao (M3)', () => {
  test('é sutil: no máximo RESPIRACAO.graus de tronco', () => {
    for (let t = 0; t < 10; t += 0.05) expect(Math.abs(respiracao(t))).toBeLessThanOrEqual(RESPIRACAO.graus + 1e-9);
  });

  test('tem o ritmo de uma respiração calma (~13 por minuto)', () => {
    const periodo = 1 / RESPIRACAO.hz;
    expect(60 / periodo).toBeGreaterThan(10);
    expect(60 / periodo).toBeLessThan(16);
    expect(respiracao(1.3 + periodo)).toBeCloseTo(respiracao(1.3), 6);
  });
});
