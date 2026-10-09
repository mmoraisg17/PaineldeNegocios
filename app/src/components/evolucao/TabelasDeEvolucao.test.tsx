import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { EvolucaoDoExercicio } from './evolucaoPorExercicio';
import { TabelaPorExercicio, TabelaSemanaASemana } from './TabelasDeEvolucao';
import type { SemanaResumida } from './evolucao';

function semana(fim: string, sobrescrever: Partial<SemanaResumida> = {}): SemanaResumida {
  return { fim: new Date(fim), treinos: 3, nota: 80, simetria: 70, estabilidade: 75, apoio: 20, ...sobrescrever };
}

const SEMANAS: SemanaResumida[] = [
  semana('2026-09-02T12:00:00Z'),
  semana('2026-09-09T12:00:00Z', { treinos: 0, nota: null, simetria: null, estabilidade: null, apoio: null }),
  semana('2026-09-16T12:00:00Z', { treinos: 2, nota: 61, simetria: 55, estabilidade: 66, apoio: 35 }),
];

function exercicio(sobrescrever: Partial<EvolucaoDoExercicio> = {}): EvolucaoDoExercicio {
  return {
    id: 'sentar-e-levantar',
    nome: 'Sentar e levantar',
    treinos: 4,
    nivelInicial: 1,
    nivelAtual: 2,
    notaInicial: 60,
    notaAtual: 78,
    variacaoDaNota: 18,
    ...sobrescrever,
  };
}

describe('TabelaSemanaASemana', () => {
  test('tem legenda, cabeçalhos de coluna e uma linha de dados por semana', () => {
    // Arrange / Act
    render(<TabelaSemanaASemana semanas={SEMANAS} planejadas={3} />);

    // Assert
    const tabela = screen.getByRole('table', { name: 'Semana a semana' });
    const cabecalhos = within(tabela).getAllByRole('columnheader').map((c) => c.textContent);
    expect(cabecalhos).toEqual(['Semana até', 'Treinos', 'Nota', 'Simetria', 'Estabilidade', 'Apoio']);
    expect(within(tabela).getAllByRole('row')).toHaveLength(1 + SEMANAS.length);
  });

  test('cada linha começa pela data da semana, como cabeçalho de linha', () => {
    // Arrange / Act
    render(<TabelaSemanaASemana semanas={SEMANAS} planejadas={3} />);

    // Assert
    const tabela = screen.getByRole('table');
    expect(within(tabela).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['02/09', '09/09', '16/09']);
  });

  test('mostra treinos feitos de planejados, as notas e o apoio em porcentagem', () => {
    // Arrange / Act
    render(<TabelaSemanaASemana semanas={SEMANAS} planejadas={3} />);

    // Assert
    const linha = screen.getByRole('row', { name: /^16\/09/ });
    const celulas = within(linha).getAllByRole('cell').map((c) => c.textContent);
    expect(celulas).toEqual(['2 de 3', '61', '55', '66', '35%']);
  });

  test('semana sem treino mostra "—" para quem vê e "sem treino" para o leitor de tela', () => {
    // Arrange / Act
    render(<TabelaSemanaASemana semanas={SEMANAS} planejadas={3} />);

    // Assert
    const linha = screen.getByRole('row', { name: /^09\/09/ });
    const celulas = within(linha).getAllByRole('cell');
    expect(celulas[0]).toHaveTextContent('0 de 3');
    for (const celula of celulas.slice(1)) {
      expect(celula).toHaveAccessibleName('sem treino');
      expect(celula.querySelector('[aria-hidden="true"]')).toHaveTextContent('—');
    }
  });

  test('a tabela rola na horizontal dentro de uma região que o teclado alcança', () => {
    // Arrange / Act
    render(<TabelaSemanaASemana semanas={SEMANAS} planejadas={3} />);

    // Assert
    const regiao = screen.getByRole('region', { name: /Semana a semana/ });
    expect(regiao).toHaveAttribute('tabindex', '0');
    expect(regiao).toHaveClass('overflow-x-auto');
    expect(within(regiao).getByRole('table')).toBeInTheDocument();
  });
});

describe('TabelaPorExercicio', () => {
  test('tem legenda e cabeçalhos com o que cada coluna compara', () => {
    // Arrange / Act
    render(<TabelaPorExercicio exercicios={[exercicio()]} />);

    // Assert
    const tabela = screen.getByRole('table', { name: 'Por exercício' });
    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Exercício',
      'Treinos',
      'Nível (início → agora)',
      'Nota (primeiro → último)',
      'Variação',
    ]);
  });

  test('mostra nome, treinos, nível e nota do começo ao fim, e a variação com sinal e a palavra "pontos"', () => {
    // Arrange / Act
    render(<TabelaPorExercicio exercicios={[exercicio()]} />);

    // Assert
    const linha = screen.getByRole('row', { name: /^Sentar e levantar/ });
    expect(within(linha).getByRole('rowheader')).toHaveTextContent('Sentar e levantar');
    const celulas = within(linha).getAllByRole('cell');
    expect(celulas[0]).toHaveTextContent('4');
    expect(celulas[1]).toHaveAccessibleName('de 1 para 2');
    expect(celulas[2]).toHaveAccessibleName('de 60 para 78');
    expect(celulas[3]).toHaveTextContent('+18 pontos');
  });

  test('variação negativa usa o sinal de menos e zero não leva sinal', () => {
    // Arrange / Act
    render(
      <TabelaPorExercicio
        exercicios={[
          exercicio({ id: 'pes-em-linha', nome: 'Caiu', variacaoDaNota: -7 }),
          exercicio({ id: 'transferencia-de-peso', nome: 'Igual', variacaoDaNota: 0 }),
          exercicio({ id: 'descida-de-degrau', nome: 'Subiu pouco', variacaoDaNota: 1 }),
        ]}
      />,
    );

    // Assert
    expect(within(screen.getByRole('row', { name: /^Caiu/ })).getByText('−7 pontos')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /^Igual/ })).getByText('0 pontos')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /^Subiu pouco/ })).getByText('+1 ponto')).toBeInTheDocument();
  });

  test('nível que não mudou aparece uma vez, com a palavra "igual"', () => {
    // Arrange / Act
    render(<TabelaPorExercicio exercicios={[exercicio({ nivelInicial: 2, nivelAtual: 2 })]} />);

    // Assert
    const celulas = within(screen.getByRole('row', { name: /^Sentar e levantar/ })).getAllByRole('cell');
    expect(celulas[1]).toHaveTextContent('2 (igual)');
  });

  test('a tabela rola na horizontal dentro de uma região que o teclado alcança', () => {
    // Arrange / Act
    render(<TabelaPorExercicio exercicios={[exercicio()]} />);

    // Assert
    const regiao = screen.getByRole('region', { name: /Por exercício/ });
    expect(regiao).toHaveAttribute('tabindex', '0');
    expect(regiao).toHaveClass('overflow-x-auto');
  });
});
