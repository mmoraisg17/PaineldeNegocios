import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { rotinaDoPraticante } from '../../dominio';
import { formatarDose } from '../../estado/formatos';
import { rotas } from '../../rotas';
import { abrirTela, estadoDeTeste, lerApp, usarRelogioFixo } from './auxiliaresDeTeste';

// O jsdom não tem WebGL: na navegação real até o exercício, a cena 3D vira um marcador.
vi.mock('../../cena3d/VisualizadorExercicio', () => ({ default: () => <p>animação 3D</p> }));

usarRelogioFixo();

function rotinaDeTeste(id = 'lucia') {
  const rotina = rotinaDoPraticante(estadoDeTeste(id), id);
  if (!rotina) throw new Error('rotina de teste ausente');
  return rotina;
}

test('cumprimenta pelo nome completo e leva o foco ao título', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje');

  // Assert
  const titulo = screen.getByRole('heading', { level: 1, name: 'Olá, Dona Lúcia' });
  expect(titulo).toHaveFocus();
});

test('mostra o recado do acompanhante com o autor e o texto', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje');

  // Assert
  const recados = screen.getByRole('region', { name: 'Recados' });
  expect(within(recados).getByText('Carlos')).toBeInTheDocument();
  expect(within(recados).getByText('Muito bem nesta semana, Dona Lúcia!')).toBeInTheDocument();
});

test('ao exibir os recados, marca todos como lidos', () => {
  // Arrange
  expect(estadoDeTeste().recados.every((r) => !r.lido)).toBe(true);

  // Act
  abrirTela('/praticante/hoje');

  // Assert
  expect(lerApp().estado.recados.every((r) => r.lido)).toBe(true);
});

test('o recado novo continua marcado como "Novo" durante esta visita', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje');

  // Assert
  expect(screen.getByText('Novo')).toBeInTheDocument();
});

test('sem recados, a seção de recados nem aparece', () => {
  // Arrange
  const estado = { ...estadoDeTeste(), recados: [] };

  // Act
  abrirTela('/praticante/hoje', { estado });

  // Assert
  expect(screen.queryByRole('region', { name: 'Recados' })).not.toBeInTheDocument();
});

test('lista cada exercício da rotina com nível, dose e apoio, como link para o exercício', () => {
  // Arrange
  const rotina = rotinaDeTeste();
  const primeiro = rotina.itens[0];
  if (!primeiro) throw new Error('rotina sem itens');

  // Act
  abrirTela('/praticante/hoje');

  // Assert
  const treino = screen.getByRole('region', { name: 'Treino de hoje' });
  expect(within(treino).getAllByRole('link')).toHaveLength(rotina.itens.length);
  const link = within(treino).getAllByRole('link')[0];
  expect(link).toHaveAttribute('href', `/praticante/exercicio/${primeiro.exercicioId}?nivel=${primeiro.nivel}`);
  expect(link).toHaveTextContent(`Nível ${primeiro.nivel}`);
  expect(link).toHaveTextContent(formatarDose(primeiro.dose));
});

test('mostra os minutos estimados', () => {
  // Arrange
  const { minutosEstimados } = rotinaDeTeste();

  // Act
  abrirTela('/praticante/hoje');

  // Assert
  expect(screen.getByText(`Cerca de ${minutosEstimados} minutos`)).toBeInTheDocument();
});

test('mostra quantos treinos foram feitos na semana (janela dos últimos 7 dias)', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje');

  // Assert
  expect(screen.getByText('3 de 3 treinos nesta semana')).toBeInTheDocument();
});

test('sem o ajuste de um profissional, não há selo "Ajustado por"', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje');

  // Assert
  expect(screen.queryByText(/Ajustado por/)).not.toBeInTheDocument();
});

test('mostra o selo "Ajustado por Ana" quando a fisioterapeuta ajustou a rotina', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje', { estado: estadoDeTeste('rafael') });

  // Assert
  expect(screen.getByText('Ajustado por Ana')).toBeInTheDocument();
});

test('avisa quando o profissional fixou o nível de um exercício', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje', { estado: estadoDeTeste('rafael') });

  // Assert
  expect(screen.getByText('Nível fixado por Ana')).toBeInTheDocument();
});

test('"Começar treino" inicia o treino com a rotina e abre o primeiro exercício', async () => {
  // Arrange
  const rotina = rotinaDeTeste();
  const primeiro = rotina.itens[0];
  if (!primeiro) throw new Error('rotina sem itens');
  abrirTela('/praticante/hoje');

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Começar treino' }));

  // Assert
  expect(lerApp().treino?.itens).toEqual(rotina.itens);
  expect(await screen.findByTestId('destino')).toHaveTextContent(
    `/praticante/exercicio/${primeiro.exercicioId}?nivel=${primeiro.nivel}&treino=0`,
  );
});

test('"Começar treino" chega à tela real do primeiro exercício', async () => {
  // Arrange
  abrirTela('/praticante/hoje', { rotas });

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Começar treino' }));

  // Assert
  expect(await screen.findByRole('heading', { level: 1, name: 'Sentar e levantar' })).toBeInTheDocument();
});

test('rotina sem exercícios: explica e não oferece o botão de começar', () => {
  // Arrange
  const base = estadoDeTeste();
  const lucia = base.praticantes.lucia;
  if (!lucia) throw new Error('lucia ausente');
  const estado = {
    ...base,
    praticantes: { ...base.praticantes, lucia: { ...lucia, ajuste: { autor: 'Carlos', autorId: 'carlos', exerciciosRemovidos: rotinaDeTeste().itens.map((i) => i.exercicioId) } } },
  };

  // Act
  abrirTela('/praticante/hoje', { estado });

  // Assert
  expect(screen.getByText(/rotina está vazia/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Começar treino' })).not.toBeInTheDocument();
});

test('praticante inexistente: mensagem amigável e nenhum botão de começar', () => {
  // Arrange / Act
  abrirTela('/praticante/hoje', { estado: estadoDeTeste('fantasma') });

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Hoje' })).toBeInTheDocument();
  expect(screen.getByText(/Não encontramos o seu treino/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Começar treino' })).not.toBeInTheDocument();
});
