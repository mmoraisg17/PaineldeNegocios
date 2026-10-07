import { afterEach, describe, expect, test, vi } from 'vitest';
import { aleatorioSeguro, gerarValorUnico, novoId, TENTATIVAS_PARA_VALOR_UNICO } from './aleatorio';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('aleatorioSeguro', () => {
  test('sorteia com crypto.getRandomValues e devolve um valor em [0, 1)', () => {
    const espiao = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((vetor: Uint32Array) => {
      vetor[0] = 2 ** 31;
      return vetor;
    }) as typeof globalThis.crypto.getRandomValues);

    expect(aleatorioSeguro()).toBe(0.5);
    expect(espiao).toHaveBeenCalledTimes(1);
  });

  test('o maior valor possível continua abaixo de 1', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((vetor: Uint32Array) => {
      vetor[0] = 2 ** 32 - 1;
      return vetor;
    }) as typeof globalThis.crypto.getRandomValues);

    expect(aleatorioSeguro()).toBeLessThan(1);
  });

  test('sem crypto disponível, cai no Math.random', () => {
    vi.stubGlobal('crypto', undefined);
    const espiao = vi.spyOn(Math, 'random').mockReturnValue(0.25);

    expect(aleatorioSeguro()).toBe(0.25);
    expect(espiao).toHaveBeenCalledTimes(1);
  });
});

describe('novoId', () => {
  test('usa crypto.randomUUID quando existe', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('11111111-2222-4333-8444-555555555555');

    expect(novoId()).toBe('11111111-2222-4333-8444-555555555555');
  });

  test('ids consecutivos são diferentes', () => {
    expect(novoId()).not.toBe(novoId());
  });

  test('sem randomUUID, monta um id no formato UUID v4', () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });

    expect(novoId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('sem nenhum crypto, ainda devolve um id no formato UUID v4', () => {
    vi.stubGlobal('crypto', undefined);

    expect(novoId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('gerarValorUnico', () => {
  test('devolve o primeiro valor que ainda não existe', () => {
    const valor = gerarValorUnico(() => 'novo', () => false, 'um código');

    expect(valor).toBe('novo');
  });

  test('tenta de novo quando o valor já existe', () => {
    const sorteados = ['A', 'A', 'B'];
    let indice = 0;
    const gerar = (): string => sorteados[indice++] ?? 'Z';

    const valor = gerarValorUnico(gerar, (candidato) => candidato === 'A', 'um código');

    expect(valor).toBe('B');
  });

  test('desiste com erro claro depois de esgotar as tentativas', () => {
    let chamadas = 0;
    const gerar = (): string => {
      chamadas += 1;
      return 'A';
    };

    expect(() => gerarValorUnico(gerar, () => true, 'um código')).toThrow(/um código/);
    expect(chamadas).toBe(TENTATIVAS_PARA_VALOR_UNICO);
  });
});
