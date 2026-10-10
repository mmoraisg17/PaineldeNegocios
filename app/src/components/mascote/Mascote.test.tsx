import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { NivelDoMascote } from '../../dominio';
import { CartaoDoMascote } from './CartaoDoMascote';
import { Mascote } from './Mascote';
import { COMO_SUBIR, FRASE_DO_NIVEL, NOME_DO_NIVEL } from './textos';

const NIVEIS: NivelDoMascote[] = [1, 2, 3, 4, 5];

function medidas(nivel: NivelDoMascote) {
  const { container, unmount } = render(<Mascote nivel={nivel} />);
  const altura = Number(container.querySelector('.m-olhos ellipse')?.getAttribute('ry'));
  const alca = Number(container.querySelector('.m-alca')?.getAttribute('stroke-width'));
  unmount();
  return { altura, alca };
}

describe('Mascote', () => {
  test('sem descrição o desenho é decorativo e some para o leitor de tela', () => {
    const { container } = render(<Mascote nivel={3} />);
    const desenho = container.querySelector('svg');

    expect(desenho).toHaveAttribute('aria-hidden', 'true');
    expect(desenho).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('com descrição vira uma imagem com esse nome', () => {
    render(<Mascote nivel={3} descricao="Mascote em forma" />);

    expect(screen.getByRole('img', { name: 'Mascote em forma' })).toBeInTheDocument();
  });

  test.each(NIVEIS)('o nível %i e a pose ficam nos atributos que o CSS usa', (nivel) => {
    const { container } = render(<Mascote nivel={nivel} pose="andar" />);
    const desenho = container.querySelector('svg');

    expect(desenho).toHaveAttribute('data-nivel', String(nivel));
    expect(desenho).toHaveAttribute('data-pose', 'andar');
  });

  test('a pose padrão é parado', () => {
    const { container } = render(<Mascote nivel={3} />);

    expect(container.querySelector('svg')).toHaveAttribute('data-pose', 'parado');
  });

  test('é sempre o mesmo kettlebell: corpo, alça, dois olhos e uma boca, sem braços nem pés', () => {
    for (const nivel of NIVEIS) {
      const { container, unmount } = render(<Mascote nivel={nivel} />);
      expect(container.querySelectorAll('.m-alca')).toHaveLength(1);
      expect(container.querySelectorAll('.m-olhos ellipse')).toHaveLength(2);
      expect(container.querySelectorAll('.m-braco, .m-pe')).toHaveLength(0);
      unmount();
    }
  });

  test('só o nível 5 tem brilhos', () => {
    for (const nivel of NIVEIS) {
      const { container, unmount } = render(<Mascote nivel={nivel} />);
      expect(container.querySelectorAll('.m-brilho')).toHaveLength(nivel === 5 ? 2 : 0);
      unmount();
    }
  });

  test('mais forte = olhos mais abertos e alça mais grossa', () => {
    const [cansado, forte, campeao] = [medidas(1), medidas(4), medidas(5)];
    expect(cansado.altura).toBeLessThan(forte.altura);
    expect(forte.altura).toBeLessThanOrEqual(campeao.altura);
    expect(cansado.alca).toBeLessThan(forte.alca);
    expect(forte.alca).toBeLessThan(campeao.alca);
  });

  test('duas instâncias não dividem o mesmo id de degradê', () => {
    const { container } = render(
      <>
        <Mascote nivel={3} />
        <Mascote nivel={3} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('linearGradient')).map((g) => g.id);

    expect(new Set(ids).size).toBe(2);
  });
});

describe('CartaoDoMascote', () => {
  test.each(NIVEIS)('o nível %i aparece em texto, com a frase e a dica', (nivel) => {
    render(<CartaoDoMascote nivel={nivel} />);

    expect(screen.getByText(NOME_DO_NIVEL[nivel])).toBeInTheDocument();
    expect(screen.getByText(FRASE_DO_NIVEL[nivel])).toBeInTheDocument();
    expect(screen.getByText(COMO_SUBIR[nivel])).toBeInTheDocument();
    expect(screen.getByRole('img', { name: new RegExp(NOME_DO_NIVEL[nivel], 'i') })).toBeInTheDocument();
  });

  test('sem dica, mostra só o nome e a frase', () => {
    render(<CartaoDoMascote nivel={2} comDica={false} />);

    expect(screen.queryByText(COMO_SUBIR[2])).not.toBeInTheDocument();
  });

  test('os nomes não culpam a pessoa', () => {
    const texto = Object.values({ ...NOME_DO_NIVEL, ...FRASE_DO_NIVEL, ...COMO_SUBIR }).join(' ');

    expect(texto).not.toMatch(/preguiç|culpa|falhou|abandon|desist/i);
  });
});
