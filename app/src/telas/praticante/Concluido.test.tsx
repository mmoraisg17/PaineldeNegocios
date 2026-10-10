import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import type { EstadoApp, IdExercicio, Nivel, ResultadoExercicio } from '../../dominio';
import { abrirTela, estadoDeTeste, lerApp, usarRelogioFixo } from './auxiliaresDeTeste';

usarRelogioFixo();

function resultado(id: IdExercicio, nivel: Nivel, sobrescrever: Partial<ResultadoExercicio> = {}): ResultadoExercicio {
  return { id, nivel, nota: 90, simetria: 90, estabilidade: 90, apoioNasBarras: 0.1, ...sobrescrever };
}

/* Lúcia só com uma sessão anterior de "Sentar e levantar": assim a decisão de
   nível depende apenas das duas notas deste teste. */
function estadoComSessaoAnterior(nivel: Nivel, nota: number | null): EstadoApp {
  const base = estadoDeTeste();
  const lucia = base.praticantes.lucia;
  if (!lucia) throw new Error('lucia ausente');
  const sessoes =
    nota === null
      ? []
      : [{ data: '2026-10-05T12:00:00.000Z', exercicios: [resultado('sentar-e-levantar', nivel, { nota })], percepcao: 'ok' as const }];
  return { ...base, praticantes: { ...base.praticantes, lucia: { ...lucia, niveis: { 'sentar-e-levantar': nivel }, sessoes } } };
}

/* Simula o que a tela do exercício faz: abre o treino e guarda os resultados. */
function treinarComResultados(resultados: ResultadoExercicio[]) {
  act(() => {
    lerApp().iniciarTreino([]);
  });
  act(() => {
    resultados.forEach((r) => lerApp().registrarResultado(r));
  });
}

test('sem treino em andamento e sem resumo, explica e leva de volta ao Hoje', () => {
  // Arrange / Act
  abrirTela('/praticante/concluido');

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Nenhum treino para concluir' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ir para o Hoje' })).toHaveAttribute('href', '/praticante/hoje');
});

test('com o treino em andamento, resume o que foi feito', () => {
  // Arrange
  abrirTela('/praticante/concluido');

  // Act
  treinarComResultados([
    resultado('sentar-e-levantar', 1, { nota: 90, simetria: 80, estabilidade: 100 }),
    resultado('pes-em-linha', 1, { nota: 70, simetria: 60, estabilidade: 60 }),
  ]);

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Treino concluído' })).toBeInTheDocument();
  expect(screen.getByText('Exercícios feitos').closest('div')).toHaveTextContent('2');
  expect(screen.getByText('Nota média').closest('div')).toHaveTextContent('80');
  expect(screen.getByText('Simetria média').closest('div')).toHaveTextContent('70');
  expect(screen.getByText('Estabilidade média').closest('div')).toHaveTextContent('80');
});

test('pergunta "Como foi para você?" com os três botões grandes', () => {
  // Arrange
  abrirTela('/praticante/concluido');

  // Act
  treinarComResultados([resultado('sentar-e-levantar', 1)]);

  // Assert
  expect(screen.getByRole('group', { name: 'Como foi para você?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Fácil' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ok' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Difícil' })).toBeInTheDocument();
});

test('treino aberto sem nenhum exercício medido: avisa em vez de perguntar', () => {
  // Arrange
  abrirTela('/praticante/concluido');

  // Act
  treinarComResultados([]);

  // Assert
  expect(screen.getByText(/Nenhum exercício foi concluído/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Fácil' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/praticante/hoje');
});

test('"Fácil" com duas notas boas seguidas: grava o treino e mostra "Sobe para o nível 2" com o motivo', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1, { nota: 90 })]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

  // Assert
  const decisoes = screen.getByRole('region', { name: 'O que muda no próximo treino' });
  expect(within(decisoes).getByText('Sentar e levantar')).toBeInTheDocument();
  expect(within(decisoes).getByText('Sobe para o nível 2')).toBeInTheDocument();
  expect(within(decisoes).getByText('Nota 80 ou mais em 2 treinos seguidos: hora de ir para o nível 2.')).toBeInTheDocument();
  expect(lerApp().treino).toBeNull();
  expect(lerApp().estado.praticantes.lucia?.sessoes).toHaveLength(2);
  expect(lerApp().estado.praticantes.lucia?.niveis['sentar-e-levantar']).toBe(2);
});

test('depois de responder, as perguntas somem e a resposta fica escrita', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Assert
  expect(screen.queryByRole('group', { name: 'Como foi para você?' })).not.toBeInTheDocument();
  expect(screen.getByText('Você marcou: Ok')).toBeInTheDocument();
  expect(screen.getByText('Exercícios feitos').closest('div')).toHaveTextContent('1');
});

test('"Difícil" mantém o nível, mesmo com notas altas', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1, { nota: 90 })]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Difícil' }));

  // Assert
  expect(screen.getByText('Mantém o nível')).toBeInTheDocument();
  expect(screen.queryByText(/Sobe para o nível/)).not.toBeInTheDocument();
  expect(lerApp().estado.praticantes.lucia?.niveis['sentar-e-levantar']).toBe(1);
});

test('duas notas baixas seguidas: "Volta para o nível 1" com o motivo', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(2, 40) });
  treinarComResultados([resultado('sentar-e-levantar', 2, { nota: 40 })]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Assert
  expect(screen.getByText('Volta para o nível 1')).toBeInTheDocument();
  expect(screen.getByText(/voltar ao nível 1 para treinar com mais segurança/)).toBeInTheDocument();
});

test('sem histórico suficiente: "Mantém o nível" e a explicação', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, null) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

  // Assert
  expect(screen.getByText('Mantém o nível')).toBeInTheDocument();
  expect(screen.getByText('O app precisa das notas de 2 sessões neste exercício para decidir.')).toBeInTheDocument();
});

test('"Voltar ao início" leva ao Hoje', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Act / Assert
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/praticante/hoje');
});

test('depois de responder, o foco vai para o título (o botão clicado saiu da tela)', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Treino concluído' })).toHaveFocus();
});

test('ao subir de nível, dá para recusar e continuar no nível atual (manual, 8.2)', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1, { nota: 90 })]);
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Prefiro continuar no nível 1' }));

  // Assert
  const decisoes = screen.getByRole('region', { name: 'O que muda no próximo treino' });
  expect(within(decisoes).getByText('Você continua no nível 1')).toBeInTheDocument();
  expect(within(decisoes).queryByRole('button', { name: /Prefiro continuar/ })).not.toBeInTheDocument();
  expect(lerApp().estado.praticantes.lucia?.niveis['sentar-e-levantar']).toBe(1);
});

test('"Mantém o nível" não oferece recusa', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, null) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Assert
  expect(screen.queryByRole('button', { name: /Prefiro continuar/ })).not.toBeInTheDocument();
});

test('depois de responder, o mascote comemora e diz como está', async () => {
  // Arrange
  abrirTela('/praticante/concluido', { estado: estadoComSessaoAnterior(1, 90) });
  treinarComResultados([resultado('sentar-e-levantar', 1)]);
  expect(screen.queryByRole('img', { name: /Mascote do app/ })).not.toBeInTheDocument();

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

  // Assert
  const mascote = screen.getByRole('img', { name: /Mascote do app/ });
  expect(mascote).toHaveAttribute('data-pose', 'comemorar');
  expect(mascote).toHaveAccessibleName(/Hoje ele está (em forma|forte|campeão)/);
});
