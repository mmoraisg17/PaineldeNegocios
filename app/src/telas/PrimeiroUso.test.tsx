import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { rotas } from '../rotas';
import { abrirTela } from './praticante/auxiliaresDeTeste';

/* Cada passo troca os botões de lugar: sem mover o foco, quem usa teclado ou
   leitor de tela cai no topo da página (revisão da fase 5, H1). */

async function irParaConectar() {
  const usuario = userEvent.setup();
  abrirTela('/primeiro-uso', { rotas });
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  return usuario;
}

test('ao avançar de passo, o foco vai para o título do novo passo', async () => {
  await irParaConectar();
  expect(screen.getByRole('heading', { level: 2, name: 'Conectar a plataforma' })).toHaveFocus();
});

test('ao conectar, o foco vai para o aviso de conectada; só a linha de status é anunciada', async () => {
  const usuario = await irParaConectar();
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  const status = await screen.findByText(/Conectada/, {}, { timeout: 3000 });
  // O foco vem num efeito depois do texto: sob carga, chega um instante depois.
  await waitFor(() => expect(status).toHaveFocus());
  expect(status).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByRole('heading', { level: 2, name: 'Conectar a plataforma' }).closest('[aria-live]')).toBeNull();
});

test('a contagem não é anunciada a cada segundo; o fim é anunciado e recebe o foco', async () => {
  const usuario = await irParaConectar();
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  await usuario.click(await screen.findByRole('button', { name: 'Continuar' }, { timeout: 3000 }));
  await usuario.click(screen.getByRole('button', { name: 'Estou em cima da plataforma' }));

  expect(screen.getByRole('timer')).not.toHaveAttribute('aria-live');
  await usuario.click(screen.getByRole('button', { name: 'Pular (demonstração)' }));
  await waitFor(() => expect(screen.getByRole('timer')).toHaveFocus());
  expect(screen.getByRole('status')).toHaveTextContent('Pronto! Seu peso foi registrado.');
});
