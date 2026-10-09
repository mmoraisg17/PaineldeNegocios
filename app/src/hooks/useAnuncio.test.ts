import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useAnuncio } from './useAnuncio';

describe('useAnuncio', () => {
  test('começa vazio', () => {
    // Arrange / Act
    const { result } = renderHook(() => useAnuncio());

    // Assert
    expect(result.current[0]).toBe('');
  });

  test('um texto novo entra de imediato, sem esperar o quadro seguinte', () => {
    // Arrange
    const { result } = renderHook(() => useAnuncio());

    // Act
    act(() => result.current[1]('Código copiado.'));

    // Assert
    expect(result.current[0]).toBe('Código copiado.');
  });

  test('o mesmo texto de novo é limpo e regravado no quadro seguinte', async () => {
    // Arrange
    const { result } = renderHook(() => useAnuncio());
    act(() => result.current[1]('Link copiado.'));

    // Act
    act(() => result.current[1]('Link copiado.'));

    // Assert
    expect(result.current[0]).toBe('');
    await waitFor(() => expect(result.current[0]).toBe('Link copiado.'));
  });

  test('limpar com texto vazio cancela a regravação que estava pendente', async () => {
    // Arrange
    const { result } = renderHook(() => useAnuncio());
    act(() => result.current[1]('Link copiado.'));
    act(() => result.current[1]('Link copiado.'));

    // Act
    act(() => result.current[1](''));
    await new Promise((resolver) => setTimeout(resolver, 20));

    // Assert
    expect(result.current[0]).toBe('');
  });

  test('um texto diferente chegando antes da regravação vence o pendente', async () => {
    // Arrange
    const { result } = renderHook(() => useAnuncio());
    act(() => result.current[1]('A'));
    act(() => result.current[1]('A'));

    // Act
    act(() => result.current[1]('B'));
    await new Promise((resolver) => setTimeout(resolver, 20));

    // Assert
    expect(result.current[0]).toBe('B');
  });

  test('ao desmontar, cancela a regravação pendente', () => {
    // Arrange
    const { result, unmount } = renderHook(() => useAnuncio());
    act(() => result.current[1]('A'));
    act(() => result.current[1]('A'));

    // Act / Assert
    expect(() => unmount()).not.toThrow();
  });
});
