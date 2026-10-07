import { describe, expect, test } from 'vitest';
import { RAIO_MAXIMO_DO_ANEL, RAIO_MINIMO_DO_ANEL, cargaDosPes, corDoEstado, raioDoAnel } from './aneis';

/* Auditoria visual, V5: um anel sob cada pé mostra a pressão medida pela
   base, como o anel verde de apoio da referência. */

describe('cargaDosPes', () => {
  test('divide a carga dos pés entre esquerda e direita', () => {
    const { esquerdo, direito } = cargaDosPes({ pes: 1, cargaEsquerda: 0.7 });
    expect(esquerdo).toBeCloseTo(0.7, 6);
    expect(direito).toBeCloseTo(0.3, 6);
  });

  test('sentado, com pouco peso nos pés, os dois pés recebem pouco', () => {
    const { esquerdo, direito } = cargaDosPes({ pes: 0.3, cargaEsquerda: 0.5 });
    expect(esquerdo + direito).toBeCloseTo(0.3, 6);
  });
});

describe('raioDoAnel', () => {
  test('cresce com a carga do pé e fica entre o mínimo e o máximo', () => {
    expect(raioDoAnel(0)).toBe(RAIO_MINIMO_DO_ANEL);
    expect(raioDoAnel(0.3)).toBeGreaterThan(raioDoAnel(0.15));
    expect(raioDoAnel(5)).toBe(RAIO_MAXIMO_DO_ANEL);
  });

  test('peso jogado numa perna: o anel desse pé fica visivelmente maior', () => {
    const { esquerdo, direito } = cargaDosPes({ pes: 1, cargaEsquerda: 0.25 });
    expect(raioDoAnel(direito) - raioDoAnel(esquerdo)).toBeGreaterThan(0.03); // > 3 cm de diferença
  });
});

describe('corDoEstado', () => {
  test.each([
    ['ok', 'certo'],
    ['dica', 'certo'],
    ['atencao', 'atencao'],
    ['pare', 'erro'],
  ] as const)('estado %s → cor %s', (estado, cor) => {
    expect(corDoEstado(estado)).toBe(cor);
  });
});
