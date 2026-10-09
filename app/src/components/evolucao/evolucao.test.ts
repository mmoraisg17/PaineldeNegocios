import { describe, expect, test } from 'vitest';
import type { ResultadoExercicio, Sessao } from '../../dominio';
import { contarSemanasCompletas, descreverEvolucao, resumirSemanas, semanasSeguidas, type SemanaResumida } from './evolucao';

const AGORA = new Date('2026-10-07T12:00:00Z');
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function resultado(sobrescrever: Partial<ResultadoExercicio> = {}): ResultadoExercicio {
  return { id: 'pes-em-linha', nivel: 1, nota: 70, simetria: 70, estabilidade: 70, apoioNasBarras: 0.2, ...sobrescrever };
}

function sessaoHa(dias: number, exercicios: ResultadoExercicio[] = [resultado()]): Sessao {
  return { data: new Date(AGORA.getTime() - dias * MS_POR_DIA).toISOString(), exercicios, percepcao: 'ok' };
}

function semana(treinos: number): SemanaResumida {
  return { fim: AGORA, treinos, nota: null, simetria: null, estabilidade: null, apoio: null };
}

describe('resumirSemanas', () => {
  test('devolve 6 semanas, da mais antiga para a mais recente, a última terminando em "agora"', () => {
    // Act
    const semanas = resumirSemanas([], AGORA);

    // Assert
    expect(semanas).toHaveLength(6);
    expect(semanas.at(-1)?.fim.getTime()).toBe(AGORA.getTime());
    expect(semanas[0]?.fim.getTime()).toBe(AGORA.getTime() - 5 * 7 * MS_POR_DIA);
  });

  test('semana sem treino tem zero treinos e medidas nulas', () => {
    // Act
    const semanas = resumirSemanas([], AGORA);

    // Assert
    expect(semanas.every((s) => s.treinos === 0 && s.nota === null && s.simetria === null && s.estabilidade === null && s.apoio === null)).toBe(true);
  });

  test('coloca cada sessão na semana certa', () => {
    // Arrange
    const sessoes = [sessaoHa(1), sessaoHa(3), sessaoHa(10)];

    // Act
    const semanas = resumirSemanas(sessoes, AGORA);

    // Assert
    expect(semanas.map((s) => s.treinos)).toEqual([0, 0, 0, 0, 1, 2]);
  });

  test('a sessão de exatamente 7 dias atrás já pertence à semana anterior (mesma regra de semanaDeTreino)', () => {
    // Act
    const semanas = resumirSemanas([sessaoHa(7), sessaoHa(0)], AGORA);

    // Assert
    expect(semanas.at(-1)?.treinos).toBe(1);
    expect(semanas.at(-2)?.treinos).toBe(1);
  });

  test('tira a média das sessões da semana: simetria, estabilidade e apoio em porcentagem', () => {
    // Arrange
    const sessoes = [
      sessaoHa(1, [resultado({ simetria: 60, estabilidade: 50, apoioNasBarras: 0.2 })]),
      sessaoHa(2, [resultado({ simetria: 80, estabilidade: 70, apoioNasBarras: 0.4 })]),
    ];

    // Act
    const ultima = resumirSemanas(sessoes, AGORA).at(-1);

    // Assert
    expect(ultima).toMatchObject({ treinos: 2, simetria: 70, estabilidade: 60, apoio: 30 });
  });

  test('tira a média da nota por sessão, arredondada; sem treino a nota é nula', () => {
    // Arrange: a sessão de 1 exercício (nota 40) pesa o mesmo que a de 3 exercícios (média 90)
    const sessoes = [
      sessaoHa(1, [resultado({ nota: 40 })]),
      sessaoHa(2, [resultado({ nota: 80 }), resultado({ nota: 90 }), resultado({ nota: 100 })]),
    ];

    // Act
    const semanas = resumirSemanas(sessoes, AGORA);

    // Assert
    expect(semanas.at(-1)?.nota).toBe(65);
    expect(semanas.at(-2)?.nota).toBeNull();
  });

  test('uma sessão vale o mesmo que outra, mesmo com mais exercícios dentro', () => {
    // Arrange
    const sessoes = [
      sessaoHa(1, [resultado({ simetria: 100 }), resultado({ simetria: 100 }), resultado({ simetria: 100 })]),
      sessaoHa(2, [resultado({ simetria: 40 })]),
    ];

    // Act
    const ultima = resumirSemanas(sessoes, AGORA).at(-1);

    // Assert
    expect(ultima?.simetria).toBe(70);
  });

  test('ignora sessões com data inválida e as anteriores às 6 semanas', () => {
    // Arrange
    const invalida: Sessao = { data: 'ontem', exercicios: [resultado()], percepcao: 'ok' };

    // Act
    const semanas = resumirSemanas([invalida, sessaoHa(50)], AGORA);

    // Assert
    expect(semanas.reduce((total, s) => total + s.treinos, 0)).toBe(0);
  });

  test('sessão sem exercícios conta como treino, mas não entra nas médias', () => {
    // Act
    const ultima = resumirSemanas([sessaoHa(1, [])], AGORA).at(-1);

    // Assert
    expect(ultima).toMatchObject({ treinos: 1, nota: null, simetria: null, estabilidade: null, apoio: null });
  });

  test('não altera o vetor de sessões recebido', () => {
    // Arrange
    const sessoes = Object.freeze([Object.freeze(sessaoHa(1))]);

    // Act / Assert
    expect(() => resumirSemanas(sessoes, AGORA)).not.toThrow();
  });
});

describe('semanasSeguidas', () => {
  test('conta de trás para frente até a primeira semana sem treino', () => {
    expect(semanasSeguidas([1, 1, 0, 1, 1, 2].map(semana))).toBe(3);
    expect(semanasSeguidas([1, 1, 0, 1, 1, 0].map(semana))).toBe(0);
  });

  test('todas as semanas com treino valem 6', () => {
    expect(semanasSeguidas([1, 3, 2, 1, 1, 1].map(semana))).toBe(6);
  });

  test('sem semanas, zero', () => {
    expect(semanasSeguidas([])).toBe(0);
  });
});

describe('contarSemanasCompletas', () => {
  test('conta as semanas em que os treinos feitos alcançaram os planejados', () => {
    expect(contarSemanasCompletas([3, 2, 4, 0, 3, 1].map(semana), 3)).toBe(3);
  });

  test('com zero treinos planejados nenhuma semana vale como completa', () => {
    expect(contarSemanasCompletas([0, 1].map(semana), 0)).toBe(0);
  });
});

describe('descreverEvolucao', () => {
  const rotulos = ['02/09', '09/09', '16/09', '23/09', '30/09', '07/10'];

  test('sem nenhum treino, avisa que ainda não há o que mostrar', () => {
    expect(descreverEvolucao({ nome: 'Simetria', valores: [null, null, null], rotulos, unidade: 'pontos' })).toBe(
      'Simetria: ainda não há treinos nestas semanas para mostrar.',
    );
  });

  test('com uma única semana, não compara', () => {
    expect(descreverEvolucao({ nome: 'Simetria', valores: [null, 84, null], rotulos, unidade: 'pontos' })).toBe(
      'Simetria: 84 pontos na semana até 09/09. Com mais semanas de treino dá para comparar.',
    );
  });

  test('diz que subiu, comparando a primeira e a última semana com treino', () => {
    expect(descreverEvolucao({ nome: 'Simetria', valores: [null, 62, 70, null, 80, 84], rotulos, unidade: 'pontos' })).toBe(
      'Simetria: de 62 pontos (semana até 09/09) para 84 pontos (semana até 07/10): subiu 22 pontos.',
    );
  });

  test('diz que caiu, em porcentagem', () => {
    expect(descreverEvolucao({ nome: 'Apoio nas barras', valores: [35, 30, 20, 10, 10, 10], rotulos, unidade: '%' })).toBe(
      'Apoio nas barras: de 35% (semana até 02/09) para 10% (semana até 07/10): caiu 25 pontos.',
    );
  });

  test('variação pequena é "ficou estável"', () => {
    expect(descreverEvolucao({ nome: 'Estabilidade', valores: [80, 81, 80, 80, 81, 81], rotulos, unidade: 'pontos' })).toBe(
      'Estabilidade: de 80 pontos (semana até 02/09) para 81 pontos (semana até 07/10): ficou estável.',
    );
  });
});
