import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { GraficoDeTreinos } from './GraficoDeTreinos';

const rotulos = ['02/09', '09/09', '16/09', '23/09', '30/09', '07/10'];

describe('GraficoDeTreinos', () => {
  test('mostra o título, o resumo e a explicação da linha tracejada em texto', () => {
    // Arrange / Act
    render(<GraficoDeTreinos titulo="Treinos por semana" feitos={[3, 3, 2, 3, 3, 3]} planejadas={3} rotulos={rotulos} resumo="17 de 18 treinos." />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Treinos por semana' })).toBeInTheDocument();
    expect(screen.getByText('17 de 18 treinos.')).toBeVisible();
    expect(screen.getByText(/linha tracejada/i)).toHaveTextContent('3 treinos por semana');
  });

  test('o gráfico é uma imagem com nome que traz os feitos e os planejados de cada semana', () => {
    // Arrange / Act
    render(<GraficoDeTreinos titulo="Treinos por semana" feitos={[3, 0, 2, 3, 3, 1]} planejadas={3} rotulos={rotulos} resumo="Resumo." />);

    // Assert
    const grafico = screen.getByRole('img', { name: /Treinos por semana\. Resumo\./ });
    expect(grafico).toHaveAccessibleName(/semana até 02\/09: 3 de 3/);
    expect(grafico).toHaveAccessibleName(/semana até 09\/09: 0 de 3/);
    expect(grafico).toHaveAccessibleName(/semana até 07\/10: 1 de 3/);
  });

  test('desenha uma barra por semana com treino e escreve o número de cada semana', () => {
    // Arrange / Act
    const { container } = render(
      <GraficoDeTreinos titulo="Treinos por semana" feitos={[3, 0, 2, 3, 3, 1]} planejadas={3} rotulos={rotulos} resumo="r" />,
    );

    // Assert: a semana com zero treinos não tem barra, mas mostra o "0"
    expect(container.querySelectorAll('rect')).toHaveLength(5);
    const numeros = Array.from(container.querySelectorAll('svg text.valor')).map((t) => t.textContent);
    expect(numeros).toEqual(['3', '0', '2', '3', '3', '1']);
  });

  test('a barra mais alta cresce com o número de treinos', () => {
    // Arrange / Act
    const { container } = render(<GraficoDeTreinos titulo="t" feitos={[1, 3]} planejadas={3} rotulos={['a', 'b']} resumo="r" />);

    // Assert
    const alturas = Array.from(container.querySelectorAll('rect')).map((r) => Number(r.getAttribute('height')));
    expect(alturas[1]).toBeCloseTo((alturas[0] ?? 0) * 3);
  });

  test('a linha da meta é desenhada quando há treinos planejados e a escala cobre os feitos acima da meta', () => {
    // Arrange / Act
    const { container } = render(<GraficoDeTreinos titulo="t" feitos={[5, 1]} planejadas={3} rotulos={['a', 'b']} resumo="r" />);

    // Assert
    expect(container.querySelectorAll('line.meta')).toHaveLength(1);
    const barra = container.querySelector('rect');
    expect(Number(barra?.getAttribute('y'))).toBeGreaterThanOrEqual(0);
  });

  test('sem treinos planejados, não desenha a linha da meta nem a explicação', () => {
    // Arrange / Act
    const { container } = render(<GraficoDeTreinos titulo="t" feitos={[0, 0]} planejadas={0} rotulos={['a', 'b']} resumo="r" />);

    // Assert
    expect(container.querySelectorAll('line.meta')).toHaveLength(0);
    expect(screen.queryByText(/linha tracejada/i)).not.toBeInTheDocument();
  });
});
