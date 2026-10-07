import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { montarRotina } from '../dominio';
import { rotas } from '../rotas';
import { abrirTela, estadoDeTeste, lerApp, usarRelogioFixo } from './praticante/auxiliaresDeTeste';

// Sem WebGL no jsdom: a cena 3D vira um marcador (o motor é testado em src/movimento).
vi.mock('../cena3d/VisualizadorExercicio', () => ({ default: () => <p>animação 3D</p> }));

usarRelogioFixo();

/* Abre o treino de hoje da Lúcia e devolve os itens, como a tela Hoje faz. */
function abrirTreino(caminho: (itens: ReturnType<typeof montarRotina>['itens']) => string) {
  const estado = estadoDeTeste();
  const lucia = estado.praticantes.lucia;
  if (!lucia) throw new Error('lucia ausente');
  const { itens } = montarRotina(lucia.perfil, lucia.niveis, lucia.ajuste);
  const roteador = abrirTela(caminho(itens), { estado, rotas });
  act(() => {
    lerApp().iniciarTreino([...itens]);
  });
  return { roteador, itens };
}

test('"Concluir" antes de medir o suficiente não grava nota falsa, mas segue o treino', async () => {
  // Arrange
  const { roteador, itens } = abrirTreino((itens) => `/praticante/exercicio/${itens[0]?.exercicioId}?nivel=${itens[0]?.nivel}&treino=0`);

  // Act
  await userEvent.click(screen.getByRole('button', { name: /Próximo exercício|Concluir/ }));

  // Assert
  expect(lerApp().treino?.resultados).toEqual([]);
  expect(roteador.state.location.pathname).toBe(itens.length > 1 ? `/praticante/exercicio/${itens[1]?.exercicioId}` : '/praticante/concluido');
});

test('"?treino=" inválido vira exercício avulso, sem "Exercício NaN"', () => {
  // Arrange + Act
  abrirTreino((itens) => `/praticante/exercicio/${itens[0]?.exercicioId}?treino=abc`);

  // Assert
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
});

test('posição do treino que não bate com o exercício da rota é ignorada', () => {
  // Arrange + Act: o item 1 é outro exercício, mas a rota mostra o do item 0
  abrirTreino((itens) => `/praticante/exercicio/${itens[0]?.exercicioId}?treino=1`);

  // Assert
  expect(screen.queryByText(/Exercício 2 de/)).not.toBeInTheDocument();
});
