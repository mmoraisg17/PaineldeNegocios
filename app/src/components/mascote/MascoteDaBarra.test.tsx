import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import type { NivelDoMascote } from '../../dominio';
import { MascoteDaBarra } from './MascoteDaBarra';
import { COMO_SUBIR, FRASE_DO_NIVEL, NOME_DO_NIVEL } from './textos';

/* A região viva da fala (sem role="status" de propósito: as telas já têm as suas). */
const regiao = () => {
  const elemento = document.querySelector('[aria-live="polite"]');
  if (!elemento) throw new Error('região viva ausente');
  return elemento;
};

function renderizar(nivel: NivelDoMascote = 3) {
  return render(
    <>
      <ul>
        <MascoteDaBarra nivel={nivel} />
      </ul>
      <button type="button">Fora</button>
    </>,
  );
}

describe('MascoteDaBarra', () => {
  test('fica parado, num botão que diz o estado dele', () => {
    renderizar(4);

    const botao = screen.getByRole('button', { name: /Mascote, forte/ });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao.querySelector('svg')).toHaveAttribute('data-pose', 'parado');
    expect(botao.querySelector('svg')).toHaveAttribute('data-nivel', '4');
    expect(botao.querySelector('svg')).toHaveClass('mascote-na-barra');
  });

  test.each([1, 2, 3, 4, 5] as const)('o nível %i mostra como ele está e o que fazer para progredir', async (nivel) => {
    const usuario = userEvent.setup();
    renderizar(nivel);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));

    expect(regiao()).toHaveTextContent(NOME_DO_NIVEL[nivel]);
    expect(regiao()).toHaveTextContent(FRASE_DO_NIVEL[nivel]);
    expect(regiao()).toHaveTextContent('Para ele progredir');
    expect(regiao()).toHaveTextContent(COMO_SUBIR[nivel]);
  });

  test('aberto, ele acena e o botão avisa que está expandido', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));

    const botao = screen.getByRole('button', { name: /^Mascote/ });
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(botao.querySelector('svg')).toHaveAttribute('data-pose', 'acenar');
    expect(botao).toHaveAttribute('aria-controls', regiao().id);
  });

  test('a região viva existe antes da fala, vazia, e é a mesma depois', async () => {
    const usuario = userEvent.setup();
    renderizar(3);
    const viva = regiao();
    expect(viva).toBeEmptyDOMElement();

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));

    expect(regiao()).toBe(viva);
    expect(viva).not.toBeEmptyDOMElement();
  });

  test('tocar de novo fecha o balão', async () => {
    const usuario = userEvent.setup();
    renderizar(3);
    const botao = screen.getByRole('button', { name: /^Mascote/ });

    await usuario.click(botao);
    await usuario.click(botao);

    expect(regiao()).toBeEmptyDOMElement();
  });

  test('Esc fecha o balão', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));
    await usuario.keyboard('{Escape}');

    expect(regiao()).toBeEmptyDOMElement();
  });

  test('tocar fora fecha o balão', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));
    await usuario.click(screen.getByRole('button', { name: 'Fora' }));

    expect(regiao()).toBeEmptyDOMElement();
  });

  test('tocar dentro do balão não o fecha', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));
    await usuario.click(screen.getByText('Para ele progredir'));

    expect(regiao()).not.toBeEmptyDOMElement();
  });

  test('sair do foco com o teclado fecha o balão', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));
    await usuario.tab();

    expect(regiao()).toBeEmptyDOMElement();
  });

  test('o balão não some sozinho: dá tempo de ler', async () => {
    const usuario = userEvent.setup();
    renderizar(3);

    await usuario.click(screen.getByRole('button', { name: /^Mascote/ }));
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(regiao()).not.toBeEmptyDOMElement();
  });
});
