import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import type { PapelDaConta } from '../../dominio';
import { AbasDeAcesso } from './AbasDeAcesso';

function Exemplo({ inicial = 'praticante' }: { inicial?: PapelDaConta }) {
  const [papel, setPapel] = useState<PapelDaConta>(inicial);
  return (
    <AbasDeAcesso papel={papel} aoTrocar={setPapel}>
      <p>{`conteúdo de ${papel}`}</p>
    </AbasDeAcesso>
  );
}

describe('AbasDeAcesso', () => {
  test('mostra duas abas e só a ativa fica selecionada e focável', () => {
    render(<Exemplo />);

    expect(screen.getByRole('tablist', { name: 'Tipo de conta' })).toBeInTheDocument();
    const praticante = screen.getByRole('tab', { name: 'Praticante' });
    const acompanhante = screen.getByRole('tab', { name: 'Acompanhante' });
    expect(praticante).toHaveAttribute('aria-selected', 'true');
    expect(praticante).toHaveAttribute('tabindex', '0');
    expect(acompanhante).toHaveAttribute('aria-selected', 'false');
    expect(acompanhante).toHaveAttribute('tabindex', '-1');
  });

  test('o painel é nomeado pela aba ativa e está ligado às abas por aria-controls', () => {
    render(<Exemplo />);

    const painel = screen.getByRole('tabpanel', { name: 'Praticante' });
    expect(painel).toHaveTextContent('conteúdo de praticante');
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-controls', painel.id);
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-controls', painel.id);
  });

  test('clicar na outra aba troca o painel', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);

    await usuario.click(screen.getByRole('tab', { name: 'Acompanhante' }));

    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Acompanhante' })).toHaveTextContent('conteúdo de acompanhante');
  });

  test('a seta para a direita troca de aba e leva o foco junto', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    screen.getByRole('tab', { name: 'Praticante' }).focus();

    await usuario.keyboard('{ArrowRight}');

    const acompanhante = screen.getByRole('tab', { name: 'Acompanhante' });
    expect(acompanhante).toHaveAttribute('aria-selected', 'true');
    expect(acompanhante).toHaveFocus();
  });

  test('a seta para a esquerda volta e, na primeira aba, dá a volta até a última', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    screen.getByRole('tab', { name: 'Praticante' }).focus();

    await usuario.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');

    await usuario.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveFocus();
  });

  test('End vai para a última aba e Home para a primeira', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    screen.getByRole('tab', { name: 'Praticante' }).focus();

    await usuario.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');

    await usuario.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveFocus();
  });
});
