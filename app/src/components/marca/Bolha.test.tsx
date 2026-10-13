import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { BarraComBolha, MedidorDeNivel } from './Bolha';

describe('MedidorDeNivel', () => {
  test('uma bolha por degrau; as cheias são o nível', () => {
    const { container } = render(<MedidorDeNivel nivel={2} />);
    const bolhas = container.querySelectorAll('span > span');

    expect(bolhas).toHaveLength(3);
    expect(Array.from(bolhas).map((b) => b.classList.contains('bg-dado'))).toEqual([true, true, false]);
  });

  test('é decorativo: o leitor de tela ouve o texto ao lado', () => {
    const { container } = render(<MedidorDeNivel nivel={1} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  test('aceita outro máximo', () => {
    const { container } = render(<MedidorDeNivel nivel={4} maximo={5} />);

    expect(container.querySelectorAll('span > span')).toHaveLength(5);
  });
});

function posicaoDaBolha(valor: number): string {
  const { container, unmount } = render(<BarraComBolha valor={valor} />);
  const esquerda = (container.querySelector('span') as HTMLElement).style.left;
  unmount();
  return esquerda;
}

describe('BarraComBolha', () => {
  test('a bolha anda com o valor, sem sair da trilha', () => {
    expect(posicaoDaBolha(0).startsWith('calc(0 *')).toBe(true);
    expect(posicaoDaBolha(1).startsWith('calc(1 *')).toBe(true);
    expect(posicaoDaBolha(0.5).startsWith('calc(0.5 *')).toBe(true);
  });

  test('valores fora de 0 a 1 e inválidos ficam presos nas pontas', () => {
    expect(posicaoDaBolha(-3).startsWith('calc(0 *')).toBe(true);
    expect(posicaoDaBolha(7).startsWith('calc(1 *')).toBe(true);
    expect(posicaoDaBolha(Number.NaN).startsWith('calc(0 *')).toBe(true);
  });

  test('é decorativo e tem haste e bolha', () => {
    const { container } = render(<BarraComBolha valor={0.5} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild?.querySelectorAll(':scope > div')).toHaveLength(1);
    expect(container.firstElementChild?.querySelectorAll(':scope > span')).toHaveLength(1);
  });
});
