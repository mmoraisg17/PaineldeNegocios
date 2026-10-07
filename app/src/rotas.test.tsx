import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { APP_NAME } from './config/app';
import { type ContaAtual, criarEstadoDemo } from './dominio';
import { ProvedorDoApp } from './estado/ContextoApp';
import { rotas } from './rotas';

// O jsdom não tem WebGL nem ResizeObserver: a cena 3D é testada pelo motor
// (src/movimento) e verificada no navegador; aqui ela vira um marcador.
vi.mock('./cena3d/VisualizadorExercicio', () => ({ default: () => <p>animação 3D</p> }));

const DEMO = criarEstadoDemo(new Date('2026-10-07T12:00:00Z'));

function abrirEm(caminho: string, conta: ContaAtual | null = null) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] });
  render(
    <ProvedorDoApp estadoInicial={{ ...DEMO, contaAtual: conta }}>
      <RouterProvider router={roteador} />
    </ProvedorDoApp>,
  );
  return roteador;
}

test('o início mostra o nome do app e as duas formas de entrar', () => {
  abrirEm('/');
  expect(screen.getByRole('heading', { level: 1, name: APP_NAME })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sou praticante' })).toHaveAttribute('href', '/entrar/praticante');
  expect(screen.getByRole('link', { name: 'Sou acompanhante' })).toHaveAttribute('href', '/entrar/acompanhante');
});

test('escolher a Dona Lúcia entra como praticante e abre a aba Hoje', async () => {
  const roteador = abrirEm('/entrar/praticante');
  await userEvent.click(screen.getByRole('button', { name: /Dona Lúcia/ }));
  expect(roteador.state.location.pathname).toBe('/praticante/hoje');
  expect(screen.getByRole('link', { name: /Hoje/ })).toHaveAttribute('aria-current', 'page');
});

test('o acompanhante vê as contas de demonstração e entra sem a barra do praticante', async () => {
  const roteador = abrirEm('/entrar/acompanhante');
  await userEvent.click(screen.getByRole('button', { name: /Carlos/ }));
  expect(roteador.state.location.pathname).toBe('/acompanhante/alunos');
  expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
});

test('sem conta, as telas internas voltam ao início (guarda de acesso)', () => {
  const roteador = abrirEm('/acompanhante/alunos');
  expect(roteador.state.location.pathname).toBe('/');
});

test('praticante não abre telas do acompanhante', () => {
  const roteador = abrirEm('/acompanhante/aluno/lucia', { papel: 'praticante', id: 'lucia' });
  expect(roteador.state.location.pathname).toBe('/');
});

test('a tela de exercício abre sem a barra de abas e carrega a animação', async () => {
  abrirEm('/praticante/exercicio/sentar-e-levantar', { papel: 'praticante', id: 'lucia' });
  expect(screen.getByRole('heading', { level: 1, name: 'Sentar e levantar' })).toBeInTheDocument();
  expect(await screen.findByText('animação 3D')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
});

test('primeiro uso: perfil → conectar → calibrar → avaliar → nível → Hoje', async () => {
  const usuario = userEvent.setup();
  const roteador = abrirEm('/primeiro-uso');
  await usuario.type(screen.getByLabelText('Como quer ser chamado?'), 'Dona Maria');
  await usuario.click(screen.getByRole('button', { name: 'Tenho firmeza' }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  await usuario.click(await screen.findByRole('button', { name: 'Continuar' }, { timeout: 3000 }));
  await usuario.click(screen.getByRole('button', { name: 'Estou em cima da plataforma' }));
  await usuario.click(screen.getByRole('button', { name: 'Pular (demonstração)' }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.click(screen.getByRole('button', { name: 'Começar a avaliação' }));
  await usuario.click(screen.getByRole('button', { name: 'Pular (demonstração)' }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText(/nível 3/)).toBeInTheDocument(); // "Tenho firmeza" → nível 3
  await usuario.click(screen.getByRole('button', { name: 'Ver meu treino de hoje' }));
  expect(roteador.state.location.pathname).toBe('/praticante/hoje');
});

test('um endereço inexistente mostra erro amigável com volta ao início', () => {
  abrirEm('/nao-existe');
  expect(screen.getByRole('heading', { name: 'Tela não encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
});

test('o início avisa que é para usar dados fictícios e que tudo fica no aparelho', () => {
  abrirEm('/');
  expect(screen.getByText(/use dados fictícios/i)).toBeInTheDocument();
});
