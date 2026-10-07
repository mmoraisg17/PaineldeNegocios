import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { APP_NAME } from './config/app';
import { rotas } from './rotas';

// O jsdom não tem WebGL nem ResizeObserver: a cena 3D é testada pelo motor
// (src/movimento) e verificada no navegador; aqui ela vira um marcador.
vi.mock('./cena3d/VisualizadorExercicio', () => ({ default: () => <p>animação 3D</p> }));

function abrirEm(caminho: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] });
  render(<RouterProvider router={roteador} />);
  return roteador;
}

test('o início mostra o nome do app e as duas formas de entrar', () => {
  // Arrange / Act
  abrirEm('/');

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: APP_NAME })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sou praticante' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sou acompanhante' })).toBeInTheDocument();
});

test('quem entra como praticante cai na tela Hoje, com a aba marcada', async () => {
  // Arrange
  abrirEm('/');

  // Act
  await userEvent.click(screen.getByRole('link', { name: 'Sou praticante' }));

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Hoje' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page');
});

test('quem entra como acompanhante vê a lista de alunos, sem a barra do praticante', async () => {
  // Arrange
  abrirEm('/');

  // Act
  await userEvent.click(screen.getByRole('link', { name: 'Sou acompanhante' }));

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Meus alunos' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
});

test('a tela de exercício abre sem a barra de abas e carrega a animação', async () => {
  // Arrange / Act
  abrirEm('/praticante/exercicio/sentar-e-levantar');

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Sentar e levantar' })).toBeInTheDocument();
  expect(await screen.findByText('animação 3D')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
});

test('um endereço inexistente mostra erro amigável com volta ao início', () => {
  // Arrange / Act
  abrirEm('/nao-existe');

  // Assert
  expect(screen.getByRole('heading', { name: 'Tela não encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
});
