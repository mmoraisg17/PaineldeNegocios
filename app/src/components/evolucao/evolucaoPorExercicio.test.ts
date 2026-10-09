import { describe, expect, test } from 'vitest';
import type { ResultadoExercicio, Sessao } from '../../dominio';
import { evolucaoPorExercicio } from './evolucaoPorExercicio';

type IdDoCatalogo = ResultadoExercicio['id'];

function resultado(id: IdDoCatalogo, nivel: 1 | 2 | 3, nota: number): ResultadoExercicio {
  return { id, nivel, nota, simetria: 70, estabilidade: 70, apoioNasBarras: 0.2 };
}

function sessao(data: string, exercicios: ResultadoExercicio[]): Sessao {
  return { data, exercicios, percepcao: 'ok' };
}

describe('evolucaoPorExercicio', () => {
  test('sem sessões, devolve lista vazia', () => {
    // Act / Assert
    expect(evolucaoPorExercicio([])).toEqual([]);
  });

  test('compara o primeiro e o último treino de cada exercício, com a variação da nota', () => {
    // Arrange
    const sessoes = [
      sessao('2026-09-01T12:00:00Z', [resultado('sentar-e-levantar', 1, 60)]),
      sessao('2026-09-15T12:00:00Z', [resultado('sentar-e-levantar', 2, 72)]),
      sessao('2026-10-01T12:00:00Z', [resultado('sentar-e-levantar', 2, 78)]),
    ];

    // Act
    const [linha] = evolucaoPorExercicio(sessoes);

    // Assert
    expect(linha).toEqual({
      id: 'sentar-e-levantar',
      nome: 'Sentar e levantar',
      treinos: 3,
      nivelInicial: 1,
      nivelAtual: 2,
      notaInicial: 60,
      notaAtual: 78,
      variacaoDaNota: 18,
    });
  });

  test('ordena as sessões antes de comparar, mesmo que cheguem fora de ordem', () => {
    // Arrange
    const sessoes = [
      sessao('2026-10-01T12:00:00Z', [resultado('sentar-e-levantar', 3, 50)]),
      sessao('2026-09-01T12:00:00Z', [resultado('sentar-e-levantar', 1, 80)]),
    ];

    // Act
    const [linha] = evolucaoPorExercicio(sessoes);

    // Assert
    expect(linha).toMatchObject({ nivelInicial: 1, nivelAtual: 3, notaInicial: 80, notaAtual: 50, variacaoDaNota: -30 });
  });

  test('lista só os exercícios que aparecem no histórico, na ordem do catálogo', () => {
    // Arrange: o histórico cita primeiro o tandem, que no catálogo vem depois de "sentar e levantar"
    const sessoes = [
      sessao('2026-09-01T12:00:00Z', [resultado('pes-em-linha', 1, 70), resultado('sentar-e-levantar', 1, 60)]),
    ];

    // Act
    const ids = evolucaoPorExercicio(sessoes).map((linha) => linha.id);

    // Assert
    expect(ids).toEqual(['sentar-e-levantar', 'pes-em-linha']);
  });

  test('um único treino tem variação zero', () => {
    // Act
    const [linha] = evolucaoPorExercicio([sessao('2026-09-01T12:00:00Z', [resultado('sentar-e-levantar', 2, 66.4)])]);

    // Assert
    expect(linha).toMatchObject({ treinos: 1, notaInicial: 66, notaAtual: 66, variacaoDaNota: 0 });
  });

  test('a variação é a diferença entre as notas mostradas (já arredondadas), para a conta bater na tela', () => {
    // Arrange: 60,4 e 64,6 aparecem como 60 e 65
    const sessoes = [
      sessao('2026-09-01T12:00:00Z', [resultado('sentar-e-levantar', 1, 60.4)]),
      sessao('2026-09-08T12:00:00Z', [resultado('sentar-e-levantar', 1, 64.6)]),
    ];

    // Act
    const [linha] = evolucaoPorExercicio(sessoes);

    // Assert
    expect(linha).toMatchObject({ notaInicial: 60, notaAtual: 65, variacaoDaNota: 5 });
  });

  test('ignora exercícios que não existem no catálogo e não altera a entrada', () => {
    // Arrange
    const sessoes = Object.freeze([
      Object.freeze(sessao('2026-09-01T12:00:00Z', [resultado('inexistente' as IdDoCatalogo, 1, 50), resultado('sentar-e-levantar', 1, 60)])),
    ]);

    // Act
    const linhas = evolucaoPorExercicio(sessoes);

    // Assert
    expect(linhas.map((linha) => linha.id)).toEqual(['sentar-e-levantar']);
  });
});
