import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { APP_NAME } from '../../config/app';
import { LogoNivela } from './LogoNivela';

describe('LogoNivela', () => {
  test('é uma imagem com o nome do app, para o leitor de tela', () => {
    render(<LogoNivela />);

    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument();
    expect(APP_NAME).toBe('Nivela');
  });

  test('desenha as 6 letras de "nivela" e uma só bolha rosa', () => {
    const { container } = render(<LogoNivela />);

    // n tem 2 traços, i 1, v 1, e 1, l 1, a 2 = 8 caminhos.
    expect(container.querySelectorAll('path')).toHaveLength(8);
    const bolhas = container.querySelectorAll('circle');
    expect(bolhas).toHaveLength(1);
    expect(bolhas[0]).toHaveAttribute('fill', 'var(--color-primaria)');
  });

  test('as letras usam a cor do texto do tema, para valer nos dois temas', () => {
    const { container } = render(<LogoNivela />);

    expect(container.querySelector('svg > g')).toHaveAttribute('stroke', 'currentColor');
  });

  test('a largura acompanha a altura que a tela escolher', () => {
    const { container } = render(<LogoNivela className="h-14" />);
    const desenho = container.querySelector('svg');

    expect(desenho).toHaveClass('h-14', 'w-auto');
    expect(desenho).toHaveAttribute('viewBox', '-4 -8 375 118');
  });
});
