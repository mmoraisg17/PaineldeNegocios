import { describe, expect, test } from 'vitest';
import { limitar } from './numeros';

describe('limitar', () => {
  test('mantém o valor quando está dentro do intervalo', () => {
    expect(limitar(5, 0, 10)).toBe(5);
  });

  test('devolve o mínimo quando o valor é menor', () => {
    expect(limitar(-3, 0, 10)).toBe(0);
  });

  test('devolve o máximo quando o valor é maior', () => {
    expect(limitar(42, 0, 10)).toBe(10);
  });

  test('aceita os próprios limites como valores válidos', () => {
    expect(limitar(0, 0, 10)).toBe(0);
    expect(limitar(10, 0, 10)).toBe(10);
  });

  test('trata NaN como o mínimo, para nunca propagar NaN', () => {
    expect(limitar(Number.NaN, 0, 10)).toBe(0);
  });
});
