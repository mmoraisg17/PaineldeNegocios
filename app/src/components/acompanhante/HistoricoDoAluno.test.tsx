import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import type { Sessao } from '../../dominio';
import { HistoricoDoAluno } from './HistoricoDoAluno';

const AGORA = new Date('2026-10-09T12:00:00Z');
const SEM_TREINOS = 'Ainda não há treinos registrados.';
const SEM_TREINOS_RECENTES = 'Nenhum treino nas últimas 6 semanas. Veja a aba Treinos para o histórico completo.';

function sessaoEm(data: string): Sessao {
  return {
    data,
    percepcao: 'ok',
    exercicios: [{ id: 'sentar-e-levantar', nivel: 1, nota: 80, simetria: 70, estabilidade: 75, apoioNasBarras: 0.2 }],
  };
}

/* Um treino por dia, do dia 1 ao dia `quantidade`, em junho: tudo bem além das 6 semanas. */
const treinosAntigos = (quantidade: number) => Array.from({ length: quantidade }, (_, i) => sessaoEm(`2026-06-${String(i + 1).padStart(2, '0')}T12:00:00Z`));

function abrir(sessoes: readonly Sessao[]) {
  render(<HistoricoDoAluno sessoes={sessoes} planejadas={3} agora={AGORA} />);
  return screen.getByRole('region', { name: 'Histórico de treinos' });
}

describe('mensagens quando não há o que mostrar na evolução', () => {
  test('sem nenhum treino, gráficos e tabelas dizem que não há treinos registrados', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const historico = abrir([]);

    // Assert: gráficos
    expect(within(historico).getByText(SEM_TREINOS)).toBeInTheDocument();
    expect(within(historico).queryByText(SEM_TREINOS_RECENTES)).not.toBeInTheDocument();
    expect(within(historico).queryByRole('img')).not.toBeInTheDocument();

    // Act / Assert: tabelas
    await usuario.click(within(historico).getByRole('tab', { name: 'Tabelas' }));
    expect(within(historico).getByText(SEM_TREINOS)).toBeInTheDocument();
    expect(within(historico).queryByRole('table')).not.toBeInTheDocument();
  });

  test('com treinos só antigos, os gráficos apontam para a aba Treinos e não mostram gráfico vazio', () => {
    // Arrange / Act
    const historico = abrir(treinosAntigos(3));

    // Assert
    expect(within(historico).getByText(SEM_TREINOS_RECENTES)).toBeInTheDocument();
    expect(within(historico).queryByText(SEM_TREINOS)).not.toBeInTheDocument();
    expect(within(historico).queryByRole('img')).not.toBeInTheDocument();
  });

  test('com treinos só antigos, as tabelas continuam e a mensagem é a mesma dos gráficos', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const historico = abrir(treinosAntigos(3));

    // Act
    await usuario.click(within(historico).getByRole('tab', { name: 'Tabelas' }));

    // Assert
    expect(within(historico).getByText(SEM_TREINOS_RECENTES)).toBeInTheDocument();
    expect(within(historico).queryByText(SEM_TREINOS)).not.toBeInTheDocument();
    expect(within(historico).getAllByRole('table').length).toBeGreaterThan(0);
  });

  test('com um treino recente, mostra os gráficos e nenhuma das duas mensagens', () => {
    // Arrange / Act
    const historico = abrir([...treinosAntigos(3), sessaoEm('2026-10-07T12:00:00Z')]);

    // Assert
    expect(within(historico).getByRole('img', { name: /^Treinos por semana/ })).toBeInTheDocument();
    expect(within(historico).queryByText(SEM_TREINOS)).not.toBeInTheDocument();
    expect(within(historico).queryByText(SEM_TREINOS_RECENTES)).not.toBeInTheDocument();
  });

  test('a aba Treinos mostra a mesma mensagem de "sem treinos registrados"', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const historico = abrir([]);

    // Act
    await usuario.click(within(historico).getByRole('tab', { name: 'Treinos' }));

    // Assert
    expect(within(historico).getByText(SEM_TREINOS)).toBeInTheDocument();
  });
});

describe('"Ver todos os treinos" sobrevive à troca de aba', () => {
  test('depois de expandir, ir a Gráficos e voltar a Treinos mantém a lista completa', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const historico = abrir(treinosAntigos(8));
    await usuario.click(within(historico).getByRole('tab', { name: 'Treinos' }));
    expect(within(historico).getAllByRole('listitem', { name: /^Treino de / })).toHaveLength(5);

    // Act
    await usuario.click(within(historico).getByRole('button', { name: /Ver todos os treinos \(8\)/ }));
    await usuario.click(within(historico).getByRole('tab', { name: 'Gráficos' }));
    await usuario.click(within(historico).getByRole('tab', { name: 'Treinos' }));

    // Assert
    expect(within(historico).getAllByRole('listitem', { name: /^Treino de / })).toHaveLength(8);
    expect(within(historico).getByRole('button', { name: 'Mostrar só os mais recentes' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('sem expandir, a lista continua com os 5 mais recentes depois da troca de aba', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const historico = abrir(treinosAntigos(8));

    // Act
    await usuario.click(within(historico).getByRole('tab', { name: 'Treinos' }));
    await usuario.click(within(historico).getByRole('tab', { name: 'Tabelas' }));
    await usuario.click(within(historico).getByRole('tab', { name: 'Treinos' }));

    // Assert
    expect(within(historico).getAllByRole('listitem', { name: /^Treino de / })).toHaveLength(5);
    expect(within(historico).getByRole('button', { name: /Ver todos os treinos \(8\)/ })).toHaveAttribute('aria-expanded', 'false');
  });
});
