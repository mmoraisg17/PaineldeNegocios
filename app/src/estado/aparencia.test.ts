import { afterEach, describe, expect, test, vi } from 'vitest';
import { APARENCIA_PADRAO, aparenciaEfetiva, aplicarAparencia, lerAparencia, marcarAparencia } from './aparencia';

afterEach(() => {
  document.documentElement.removeAttribute('data-aparencia');
  document.documentElement.style.colorScheme = '';
  vi.unstubAllGlobals();
});

describe('lerAparencia', () => {
  test.each(['automatica', 'clara', 'escura'] as const)('aceita o valor salvo "%s"', (valor) => {
    expect(lerAparencia(valor)).toBe(valor);
  });

  test.each([undefined, null, 42, '', 'dark', 'toString', 'constructor', {}])('volta ao padrão para %j (armazenamento editável)', (valor) => {
    expect(lerAparencia(valor)).toBe(APARENCIA_PADRAO);
  });

  test('o padrão é a aparência clara', () => {
    expect(APARENCIA_PADRAO).toBe('clara');
  });
});

describe('aparenciaEfetiva', () => {
  test('clara e escura valem como escolhidas, mesmo com o aparelho no outro modo', () => {
    expect(aparenciaEfetiva('clara', true)).toBe('clara');
    expect(aparenciaEfetiva('escura', false)).toBe('escura');
  });

  test('automática segue o aparelho', () => {
    expect(aparenciaEfetiva('automatica', true)).toBe('escura');
    expect(aparenciaEfetiva('automatica', false)).toBe('clara');
  });
});

describe('aplicarAparencia', () => {
  test('marca a página com a aparência efetiva e avisa o navegador (barras de rolagem e campos nativos)', () => {
    aplicarAparencia(document.documentElement, 'escura');

    expect(document.documentElement).toHaveAttribute('data-aparencia', 'escura');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  test('automática lê o modo do aparelho e acompanha as mudanças dele', () => {
    // Arrange
    const ouvintes: Array<() => void> = [];
    const consulta = {
      matches: false,
      addEventListener: (_tipo: string, ouvinte: () => void) => {
        ouvintes.push(ouvinte);
      },
      removeEventListener: vi.fn<() => void>(),
    };
    vi.stubGlobal('matchMedia', () => consulta);

    // Act
    const parar = aplicarAparencia(document.documentElement, 'automatica');

    // Assert: aparelho claro
    expect(document.documentElement).toHaveAttribute('data-aparencia', 'clara');

    // Act: o aparelho passa para o modo escuro
    consulta.matches = true;
    ouvintes.forEach((ouvinte) => ouvinte());

    // Assert
    expect(document.documentElement).toHaveAttribute('data-aparencia', 'escura');
    parar();
    expect(consulta.removeEventListener).toHaveBeenCalled();
  });

  test('em navegador antigo (Safari/iOS antes do 14), que só tem addListener, o modo automático não quebra', () => {
    // Arrange
    const ouvintes: Array<() => void> = [];
    const consulta = { matches: false, addListener: (ouvinte: () => void) => ouvintes.push(ouvinte), removeListener: vi.fn<() => void>() };
    vi.stubGlobal('matchMedia', () => consulta);

    // Act
    const parar = aplicarAparencia(document.documentElement, 'automatica');
    consulta.matches = true;
    ouvintes.forEach((ouvinte) => ouvinte());

    // Assert
    expect(document.documentElement).toHaveAttribute('data-aparencia', 'escura');
    parar();
    expect(consulta.removeListener).toHaveBeenCalled();
  });

  test('marcarAparencia pinta a página uma vez, sem ficar ouvindo o aparelho', () => {
    // Arrange
    const consulta = { matches: true, addEventListener: vi.fn<() => void>(), removeEventListener: vi.fn<() => void>() };
    vi.stubGlobal('matchMedia', () => consulta);

    // Act
    marcarAparencia(document.documentElement, 'automatica');

    // Assert
    expect(document.documentElement).toHaveAttribute('data-aparencia', 'escura');
    expect(consulta.addEventListener).not.toHaveBeenCalled();
  });

  test('sem suporte a matchMedia (jsdom, navegador antigo), automática fica clara', () => {
    vi.stubGlobal('matchMedia', undefined);

    aplicarAparencia(document.documentElement, 'automatica');

    expect(document.documentElement).toHaveAttribute('data-aparencia', 'clara');
  });
});
