import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { GraficoSemanal } from './GraficoSemanal';

const rotulos = ['02/09', '09/09', '16/09', '23/09', '30/09', '07/10'];

test('mostra o título e o resumo em texto, visíveis', () => {
  // Arrange / Act
  render(<GraficoSemanal titulo="Simetria" valores={[62, 70, 75, 80, 82, 84]} rotulos={rotulos} unidade="pontos" resumo="Simetria: subiu 22 pontos." />);

  // Assert
  expect(screen.getByRole('heading', { name: 'Simetria' })).toBeInTheDocument();
  expect(screen.getByText('Simetria: subiu 22 pontos.')).toBeVisible();
});

test('o gráfico é uma imagem com nome que traz o resumo e o valor de cada semana', () => {
  // Arrange / Act
  render(<GraficoSemanal titulo="Simetria" valores={[62, null, 75, 80, 82, 84]} rotulos={rotulos} unidade="pontos" resumo="Simetria: subiu 22 pontos." />);

  // Assert
  const grafico = screen.getByRole('img', { name: /Simetria: subiu 22 pontos\./ });
  expect(grafico).toHaveAccessibleName(/semana até 02\/09: 62 pontos/);
  expect(grafico).toHaveAccessibleName(/semana até 09\/09: sem treino/);
  expect(grafico).toHaveAccessibleName(/semana até 07\/10: 84 pontos/);
});

test('desenha um ponto por semana com treino e escreve o valor ao lado (não só cor)', () => {
  // Arrange / Act
  const { container } = render(
    <GraficoSemanal titulo="Estabilidade" valores={[null, 70, null, 80, 90, null]} rotulos={rotulos} unidade="pontos" resumo="resumo" />,
  );

  // Assert
  expect(container.querySelectorAll('circle')).toHaveLength(3);
  const textos = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent);
  expect(textos).toEqual(expect.arrayContaining(['70', '80', '90']));
});

test('liga só os pontos vizinhos: semana sem treino interrompe a linha', () => {
  // Arrange / Act
  const { container } = render(
    <GraficoSemanal titulo="Apoio nas barras" valores={[30, 20, null, 10, 10, 10]} rotulos={rotulos} unidade="%" resumo="resumo" />,
  );

  // Assert
  expect(container.querySelectorAll('polyline')).toHaveLength(2);
});

test('mostra a dica quando ela existe', () => {
  // Arrange / Act
  render(<GraficoSemanal titulo="Apoio nas barras" valores={[30, 10]} rotulos={['a', 'b']} unidade="%" resumo="resumo" dica="Quanto menos apoio, mais firme você está." />);

  // Assert
  expect(screen.getByText('Quanto menos apoio, mais firme você está.')).toBeInTheDocument();
});

test('sem nenhum valor, não desenha pontos nem linhas e continua com o resumo', () => {
  // Arrange / Act
  const { container } = render(<GraficoSemanal titulo="Simetria" valores={[null, null]} rotulos={['a', 'b']} unidade="pontos" resumo="Sem treinos." />);

  // Assert
  expect(container.querySelectorAll('circle')).toHaveLength(0);
  expect(container.querySelectorAll('polyline')).toHaveLength(0);
  expect(screen.getByText('Sem treinos.')).toBeInTheDocument();
});
