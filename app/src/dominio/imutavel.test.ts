import { describe, expect, test } from 'vitest';
import { congelarProfundo, copiarProfundo } from './imutavel';

describe('copiarProfundo', () => {
  test('devolve uma cópia sem nenhuma referência compartilhada com o original', () => {
    const original = { a: { b: [1, { c: 2 }] } };

    const copia = copiarProfundo(original);

    expect(copia).toEqual(original);
    expect(copia).not.toBe(original);
    expect(copia.a).not.toBe(original.a);
    expect(copia.a.b[1]).not.toBe(original.a.b[1]);
  });

  test('a cópia de um valor congelado é editável', () => {
    const copia = copiarProfundo<{ n: number }>(congelarProfundo({ n: 1 }));

    copia.n = 2;

    expect(copia.n).toBe(2);
  });
});

describe('congelarProfundo', () => {
  test('impede alterar propriedades de objetos aninhados', () => {
    const valor = congelarProfundo({ a: { b: 1 } });

    expect(() => {
      (valor.a as { b: number }).b = 2;
    }).toThrow(TypeError);
    expect(valor.a.b).toBe(1);
  });

  test('impede alterar itens de vetores aninhados', () => {
    const valor = congelarProfundo({ lista: [{ n: 1 }] });

    expect(() => {
      (valor.lista as { n: number }[]).push({ n: 2 });
    }).toThrow(TypeError);
    expect(Object.isFrozen(valor.lista[0])).toBe(true);
  });

  test('devolve o próprio valor para primitivos', () => {
    expect(congelarProfundo(7)).toBe(7);
    expect(congelarProfundo('texto')).toBe('texto');
    expect(congelarProfundo(null)).toBeNull();
  });

  test('não quebra com um objeto que já está congelado', () => {
    const jaCongelado = Object.freeze({ x: 1 });

    expect(congelarProfundo(jaCongelado)).toBe(jaCongelado);
  });
});
