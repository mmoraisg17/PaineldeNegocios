import { describe, expect, test } from 'vitest';
import { ANTEBRACO, BRACO, CANELA, COXA, PE, type Perfil, TRONCO } from './perfisDoCorpo';

const PERFIS: Record<string, Perfil> = { COXA, CANELA, PE, BRACO, ANTEBRACO, TRONCO };

describe.each(Object.entries(PERFIS))('perfil %s', (_, perfil) => {
  test('vai de 0 a 1 ao longo do osso, sempre subindo', () => {
    expect(perfil[0]?.[1]).toBe(0);
    expect(perfil.at(-1)?.[1]).toBe(1);
    for (let i = 1; i < perfil.length; i += 1) expect(perfil[i]![1]).toBeGreaterThan(perfil[i - 1]![1]);
  });

  test('começa e termina fechado (raio ~0), sem buraco nas pontas', () => {
    expect(perfil[0]![0]).toBeLessThan(0.001);
    expect(perfil.at(-1)![0]).toBeLessThan(0.001);
  });

  test('raios de gente: positivos e no máximo 13 cm', () => {
    for (const [raio] of perfil) {
      expect(raio).toBeGreaterThan(0);
      expect(raio).toBeLessThanOrEqual(0.13);
    }
  });
});

test('as pernas afinam de cima para baixo (coxa > joelho, panturrilha > tornozelo)', () => {
  const maior = (p: Perfil, de: number, ate: number) => Math.max(...p.filter(([, y]) => y >= de && y <= ate).map(([r]) => r));
  expect(maior(COXA, 0.1, 0.3)).toBeGreaterThan(maior(COXA, 0.85, 0.97));
  expect(maior(CANELA, 0.15, 0.3)).toBeGreaterThan(maior(CANELA, 0.85, 0.97));
});
