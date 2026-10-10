import { screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { EstadoApp } from '../../dominio';
import { abrirTela, estadoDeTeste, usarRelogioFixo } from './auxiliaresDeTeste';

usarRelogioFixo();

/* Uma pessoa recém-chegada: mesmo perfil da Lúcia, sem nenhum treino. */
function estadoSemTreinos(): EstadoApp {
  const base = estadoDeTeste();
  const lucia = base.praticantes.lucia;
  if (!lucia) throw new Error('lucia ausente');
  return {
    ...base,
    contaAtual: { papel: 'praticante', id: 'maria' },
    praticantes: { maria: { ...lucia, id: 'maria', niveis: {}, sessoes: [] } },
  };
}

test('mostra o título e leva o foco a ele', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Progresso' })).toHaveFocus();
});

test('avisa que os dados são de exemplo nas contas da demonstração', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  expect(screen.getByText('Dados de exemplo para demonstração')).toBeInTheDocument();
});

test('o Rafael, da demonstração, também vê o aviso de dados de exemplo', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso', { estado: estadoDeTeste('rafael') });

  // Assert
  expect(screen.getByText('Dados de exemplo para demonstração')).toBeInTheDocument();
});

test('quem não é da demonstração não vê o aviso', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso', { estado: estadoSemTreinos() });

  // Assert
  expect(screen.queryByText('Dados de exemplo para demonstração')).not.toBeInTheDocument();
});

test('adesão: treinos feitos contra os planejados nas últimas 6 semanas', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  const adesao = screen.getByRole('region', { name: 'Adesão' });
  expect(within(adesao).getByText('16 de 18 treinos nas últimas 6 semanas (89%)')).toBeInTheDocument();
  expect(within(adesao).getAllByRole('listitem')).toHaveLength(6);
  expect(within(adesao).getByText('Esta semana').closest('li')).toHaveTextContent('3 de 3');
});

test('a semana em que faltou treino aparece com menos treinos que o planejado', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert: na demonstração da Lúcia, a 2ª e a 4ª semana têm 2 de 3 treinos
  const linhas = within(screen.getByRole('region', { name: 'Adesão' })).getAllByRole('listitem');
  expect(linhas.filter((linha) => linha.textContent?.includes('2 de 3'))).toHaveLength(2);
});

test('cada gráfico tem um resumo em texto e uma imagem com o mesmo conteúdo', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  for (const [nome, direcao] of [
    ['Simetria', 'subiu'],
    ['Estabilidade', 'subiu'],
    ['Apoio nas barras', 'caiu'],
  ] as const) {
    const grafico = screen.getByRole('img', { name: new RegExp(`^${nome}\\.`) });
    expect(grafico).toHaveAccessibleName(new RegExp(`${nome}: de \\d+.* para \\d+.*: ${direcao} \\d+ pontos\\.`));
    expect(screen.getByText(new RegExp(`^${nome}: de .*: ${direcao}`))).toBeVisible();
  }
});

test('o apoio nas barras explica que menos é melhor', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  expect(screen.getByText('Quanto menos apoio, mais firme você está.')).toBeInTheDocument();
});

test('mostra o nível atual de cada exercício da trilha', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  const niveis = within(screen.getByRole('region', { name: 'Nível de cada exercício' }));
  expect(niveis.getAllByRole('listitem')).toHaveLength(4);
  expect(niveis.getByText('Sentar e levantar')).toBeInTheDocument();
  expect(niveis.getByText('Sentar e levantar').closest('li')).toHaveTextContent(/Nível [123] de 3/);
});

test('conquistas: semanas seguidas treinando e treinos concluídos', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert
  const conquistas = within(screen.getByRole('region', { name: 'Conquistas' }));
  expect(conquistas.getByText('6 semanas seguidas treinando')).toBeInTheDocument();
  expect(conquistas.getByText('16 treinos concluídos')).toBeInTheDocument();
  expect(conquistas.getByText('4 semanas com todos os treinos feitos')).toBeInTheDocument();
});

test('sem treinos ainda: convida a treinar, sem gráficos, e mantém os níveis', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso', { estado: estadoSemTreinos() });

  // Assert
  expect(screen.getByText(/Quando você fizer os primeiros treinos/)).toBeInTheDocument();
  // Só o mascote é imagem aqui: nenhum gráfico.
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(screen.getByRole('img', { name: /Mascote do app/ })).toBeInTheDocument();
  expect(screen.getByText('0 de 18 treinos nas últimas 6 semanas (0%)')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Nível de cada exercício' })).getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getByText(/aparecem aqui conforme você treina/)).toBeInTheDocument();
});

test('praticante inexistente: mensagem amigável', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso', { estado: estadoDeTeste('fantasma') });

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Progresso' })).toBeInTheDocument();
  expect(screen.getByText(/Não encontramos os seus dados/)).toBeInTheDocument();
});

test('mostra o parceiro de treino com o estado em texto e a dica', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso');

  // Assert: a Lúcia treina em dia, então o mascote está forte ou campeão
  const secao = screen.getByRole('region', { name: 'Seu parceiro de treino' });
  expect(within(secao).getByText(/^(Forte|Campeão)$/)).toBeInTheDocument();
  expect(within(secao).getByRole('img', { name: /Mascote do app/ })).toBeInTheDocument();
});

test('quem ainda não treinou vê o mascote devagar, sem culpa, e a dica de como animá-lo', () => {
  // Arrange / Act
  abrirTela('/praticante/progresso', { estado: estadoSemTreinos() });

  // Assert
  const secao = screen.getByRole('region', { name: 'Seu parceiro de treino' });
  expect(within(secao).getByText('Devagar')).toBeInTheDocument();
  expect(within(secao).getByText(/Faça um treino nesta semana/)).toBeInTheDocument();
});
