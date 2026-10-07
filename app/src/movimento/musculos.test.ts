import { describe, expect, test } from 'vitest';
import { amostrar } from './animacao';
import { sentarELevantar } from './animacoes/sentarELevantar';
import { montarEsqueleto } from './corpo';
import { BRILHO_MINIMO, brilhoDoMusculo, esforcoDoMusculo, flexaoDoJoelho, trechoDoPerfil } from './musculos';

/* Auditoria visual, V4: o músculo trabalhado acende, e o brilho acompanha o
   esforço. Fatos medidos na animação real, como nos testes do movimento. */

const animacao = sentarELevantar();
const esforcoEm = (t: number, musculo: 'quadriceps' | 'gluteos' | 'panturrilhas' | 'abdomen') => {
  const amostra = amostrar(animacao, t);
  return esforcoDoMusculo(musculo, amostra.carga, flexaoDoJoelho(montarEsqueleto(amostra.pose)));
};

describe('esforço no sentar e levantar', () => {
  test('o quadríceps trabalha mais na saída da cadeira do que sentado ou em pé', () => {
    const saida = esforcoEm(2.8, 'quadriceps');
    expect(saida).toBeGreaterThan(esforcoEm(0.5, 'quadriceps'));
    expect(saida).toBeGreaterThan(esforcoEm(5.0, 'quadriceps'));
    expect(saida).toBeGreaterThan(0.8);
  });

  test('em pé, parado, o quadríceps quase descansa', () => {
    expect(esforcoEm(5.0, 'quadriceps')).toBeLessThan(0.25);
  });

  test('o esforço fica sempre entre 0 e 1, o ciclo inteiro e para todo músculo', () => {
    for (let t = 0; t < 8.8; t += 0.1) {
      for (const m of ['quadriceps', 'gluteos', 'panturrilhas', 'abdomen'] as const) {
        const e = esforcoEm(t, m);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(1);
      }
    }
  });

  test('a flexão do joelho é ~90° sentado e só um leve dobrar (< 20°) em pé', () => {
    expect(flexaoDoJoelho(montarEsqueleto(amostrar(animacao, 0.5).pose))).toBeGreaterThan(80);
    expect(flexaoDoJoelho(montarEsqueleto(amostrar(animacao, 5.0).pose))).toBeLessThan(20);
  });
});

describe('brilho', () => {
  test('o músculo do exercício nunca apaga de todo (mostra o que se trabalha) e chega a 1 no esforço máximo', () => {
    expect(brilhoDoMusculo(0)).toBe(BRILHO_MINIMO);
    expect(brilhoDoMusculo(1)).toBe(1);
  });
});

describe('trechoDoPerfil', () => {
  const perfil = [
    [0, 0],
    [0.1, 0.5],
    [0, 1],
  ] as const;

  test('corta o perfil entre as alturas pedidas, interpolando as pontas', () => {
    const trecho = trechoDoPerfil(perfil, 0.25, 0.75, 1);
    expect(trecho[0]).toEqual([0.05, 0.25]);
    expect(trecho.at(-1)).toEqual([0.05, 0.75]);
    expect(trecho.some(([r, y]) => r === 0.1 && y === 0.5)).toBe(true);
  });

  test('aumenta o raio pela escala, para a casca ficar por fora do corpo', () => {
    expect(trechoDoPerfil(perfil, 0.25, 0.75, 1.1)[0]?.[0]).toBeCloseTo(0.055, 6);
  });
});
