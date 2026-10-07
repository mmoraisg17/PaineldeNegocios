import { describe, expect, test } from 'vitest';
import { TAMANHO_MAXIMO_DO_NOME, limparNome, nivelInicial, trilhaDoObjetivo } from './perfil';

describe('trilhaDoObjetivo', () => {
  test.each([
    ['equilibrio', 'equilibrio60'],
    ['fortalecimento', 'equilibrio60'],
    ['joelho', 'fisio'],
    ['tornozelo', 'fisio'],
  ] as const)('o objetivo %s leva à trilha %s', (objetivo, trilha) => {
    expect(trilhaDoObjetivo(objetivo)).toBe(trilha);
  });
});

describe('nivelInicial', () => {
  test('quem diz que precisa de apoio começa no nível 1, mesmo medindo bem', () => {
    const nivel = nivelInicial({ oscilacao: 0.05, apoioNasBarras: 0 }, 'preciso-apoio');
    expect(nivel).toBe(1);
  });

  test('oscilação acima de 0,6 começa no nível 1, mesmo se a pessoa se diz firme', () => {
    expect(nivelInicial({ oscilacao: 0.61, apoioNasBarras: 0 }, 'firme')).toBe(1);
  });

  test('apoio nas barras acima de 0,3 começa no nível 1', () => {
    expect(nivelInicial({ oscilacao: 0.1, apoioNasBarras: 0.31 }, 'firme')).toBe(1);
  });

  test('oscilação exatamente 0,6 ainda não é instável o bastante para o nível 1', () => {
    expect(nivelInicial({ oscilacao: 0.6, apoioNasBarras: 0.2 }, 'as-vezes')).toBe(2);
  });

  test('apoio exatamente 0,3 ainda não força o nível 1', () => {
    expect(nivelInicial({ oscilacao: 0.4, apoioNasBarras: 0.3 }, 'as-vezes')).toBe(2);
  });

  test('firme, com oscilação abaixo de 0,3 e apoio abaixo de 0,1, começa no nível 3', () => {
    expect(nivelInicial({ oscilacao: 0.29, apoioNasBarras: 0.09 }, 'firme')).toBe(3);
  });

  test('firme, mas com oscilação exatamente 0,3, fica no nível 2', () => {
    expect(nivelInicial({ oscilacao: 0.3, apoioNasBarras: 0.05 }, 'firme')).toBe(2);
  });

  test('firme, mas com apoio exatamente 0,1, fica no nível 2', () => {
    expect(nivelInicial({ oscilacao: 0.1, apoioNasBarras: 0.1 }, 'firme')).toBe(2);
  });

  test('quem se desequilibra às vezes nunca começa no nível 3, mesmo medindo muito bem', () => {
    expect(nivelInicial({ oscilacao: 0, apoioNasBarras: 0 }, 'as-vezes')).toBe(2);
  });

  test('o caso intermediário começa no nível 2', () => {
    expect(nivelInicial({ oscilacao: 0.45, apoioNasBarras: 0.2 }, 'as-vezes')).toBe(2);
  });

  test('medidas inválidas (NaN) começam no nível 1, por segurança', () => {
    expect(nivelInicial({ oscilacao: Number.NaN, apoioNasBarras: 0 }, 'firme')).toBe(1);
    expect(nivelInicial({ oscilacao: 0, apoioNasBarras: Number.NaN }, 'firme')).toBe(1);
  });

  test('medidas fora de 0 a 1 são limitadas ao intervalo', () => {
    expect(nivelInicial({ oscilacao: -2, apoioNasBarras: -1 }, 'firme')).toBe(3);
    expect(nivelInicial({ oscilacao: 5, apoioNasBarras: 0 }, 'firme')).toBe(1);
  });
});

describe('limparNome', () => {
  test('junta espaços repetidos e tira as pontas', () => {
    expect(limparNome('  Dona   Lúcia 	')).toBe('Dona Lúcia');
  });

  test('corta no tamanho máximo, para não quebrar cartões e listas', () => {
    expect(limparNome('A'.repeat(200))).toHaveLength(TAMANHO_MAXIMO_DO_NOME);
    expect(limparNome('Fisioterapeuta esportiva sênior', 10)).toBe('Fisioterap');
  });
});
