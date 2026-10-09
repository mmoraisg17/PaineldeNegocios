import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { AbasAcessiveis } from './AbasAcessiveis';

const ABAS = [
  { id: 'graficos', rotulo: 'Gráficos', conteudo: <p>Conteúdo dos gráficos</p> },
  { id: 'tabelas', rotulo: 'Tabelas', conteudo: <p>Conteúdo das tabelas</p> },
  { id: 'treinos', rotulo: 'Treinos', conteudo: <p>Conteúdo dos treinos</p> },
];

const abrir = () => render(<AbasAcessiveis rotulo="Jeito de ver" abas={ABAS} />);

describe('AbasAcessiveis', () => {
  test('começa na primeira aba, com a lista de abas nomeada e só o painel ativo na tela', () => {
    // Arrange / Act
    abrir();

    // Assert
    expect(screen.getByRole('tablist', { name: 'Jeito de ver' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Gráficos', 'Tabelas', 'Treinos']);
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Gráficos' })).toHaveTextContent('Conteúdo dos gráficos');
    expect(screen.queryByText('Conteúdo das tabelas')).not.toBeInTheDocument();
  });

  test('só a aba ativa entra na ordem do Tab; a aba liga ao painel por aria-controls', () => {
    // Arrange / Act
    abrir();

    // Assert
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Treinos' })).toHaveAttribute('tabindex', '-1');
    const painel = screen.getByRole('tabpanel');
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveAttribute('aria-controls', painel.id);
  });

  test('o clique troca de aba e de painel', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir();

    // Act
    await usuario.click(screen.getByRole('tab', { name: 'Tabelas' }));

    // Assert
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Tabelas' })).toHaveTextContent('Conteúdo das tabelas');
    expect(screen.queryByText('Conteúdo dos gráficos')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveAttribute('tabindex', '0');
  });

  test('a seta para a direita vai à próxima aba, move o foco e dá a volta no fim', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir();
    screen.getByRole('tab', { name: 'Gráficos' }).focus();

    // Act / Assert
    await usuario.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Tabelas' })).toHaveAttribute('aria-selected', 'true');

    await usuario.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Gráficos' })).toBeInTheDocument();
  });

  test('a seta para a esquerda volta uma aba e dá a volta no começo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir();
    screen.getByRole('tab', { name: 'Gráficos' }).focus();

    // Act
    await usuario.keyboard('{ArrowLeft}');

    // Assert
    expect(screen.getByRole('tab', { name: 'Treinos' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Treinos' })).toHaveAttribute('aria-selected', 'true');
  });

  test('Home e End vão à primeira e à última aba', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir();
    screen.getByRole('tab', { name: 'Gráficos' }).focus();

    // Act / Assert
    await usuario.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Treinos' })).toHaveFocus();

    await usuario.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveAttribute('aria-selected', 'true');
  });

  test('outras teclas não trocam de aba', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir();
    screen.getByRole('tab', { name: 'Gráficos' }).focus();

    // Act
    await usuario.keyboard('{ArrowDown}a');

    // Assert
    expect(screen.getByRole('tab', { name: 'Gráficos' })).toHaveAttribute('aria-selected', 'true');
  });
});
