import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { criarEstadoDemo } from '../dominio';
import { ProvedorDoApp } from '../estado/ContextoApp';
import { useNivelDoMascote } from './useNivelDoMascote';

const AGORA = new Date('2026-10-07T12:00:00Z');
const DIA = 24 * 60 * 60 * 1000;

function provedor({ children }: { children: ReactNode }) {
  return <ProvedorDoApp estadoInicial={{ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia' } }}>{children}</ProvedorDoApp>;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(AGORA);
});
afterEach(() => vi.useRealTimers());

test('com os treinos em dia, o mascote está forte ou campeão', () => {
  const { result } = renderHook(() => useNivelDoMascote(), { wrapper: provedor });

  expect(result.current).toBeGreaterThanOrEqual(4);
});

test('o app aberto por semanas sem treinar faz o mascote descer sozinho, sem recarregar', () => {
  const { result } = renderHook(() => useNivelDoMascote(), { wrapper: provedor });
  const antes = result.current ?? 0;

  act(() => {
    vi.setSystemTime(new Date(AGORA.getTime() + 21 * DIA));
    vi.advanceTimersByTime(60 * 60 * 1000);
  });

  expect(result.current).toBeLessThan(antes);
});

test('ao voltar para a aba, o nível é recalculado na hora', () => {
  const { result } = renderHook(() => useNivelDoMascote(), { wrapper: provedor });
  const antes = result.current ?? 0;

  act(() => {
    vi.setSystemTime(new Date(AGORA.getTime() + 21 * DIA));
    document.dispatchEvent(new Event('visibilitychange'));
  });

  expect(result.current).toBeLessThan(antes);
});

test('sem praticante aberto, não há mascote', () => {
  const semConta = ({ children }: { children: ReactNode }) => (
    <ProvedorDoApp estadoInicial={{ ...criarEstadoDemo(AGORA), contaAtual: null }}>{children}</ProvedorDoApp>
  );
  const { result } = renderHook(() => useNivelDoMascote(), { wrapper: semConta });

  expect(result.current).toBeUndefined();
});
