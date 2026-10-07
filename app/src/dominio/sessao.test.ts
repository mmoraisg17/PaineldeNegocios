import { describe, expect, test } from 'vitest';
import { congelarProfundo } from './imutavel';
import {
  apoioMedioDaSessao,
  notaMediaDaSessao,
  notasRecentesDoExercicio,
  ordenarSessoes,
  semanaDeTreino,
  type ResultadoExercicio,
  type Sessao,
} from './sessao';
import type { IdExercicio, Nivel } from './tipos';

function resultado(sobrescrever: Partial<ResultadoExercicio> = {}): ResultadoExercicio {
  return {
    id: 'pes-em-linha',
    nivel: 1,
    nota: 70,
    simetria: 70,
    estabilidade: 70,
    apoioNasBarras: 0.2,
    ...sobrescrever,
  };
}

function sessao(data: string, exercicios: ResultadoExercicio[] = [resultado()]): Sessao {
  return { data, exercicios, percepcao: 'ok' };
}

function comNota(data: string, id: IdExercicio, nivel: Nivel, nota: number): Sessao {
  return sessao(data, [resultado({ id, nivel, nota })]);
}

describe('ordenarSessoes', () => {
  test('ordena da mais antiga para a mais recente sem alterar o vetor original', () => {
    const original = congelarProfundo([
      sessao('2026-10-03T10:00:00.000Z'),
      sessao('2026-10-01T10:00:00.000Z'),
      sessao('2026-10-02T10:00:00.000Z'),
    ]);

    const ordenadas = ordenarSessoes(original);

    expect(ordenadas.map((item) => item.data)).toEqual([
      '2026-10-01T10:00:00.000Z',
      '2026-10-02T10:00:00.000Z',
      '2026-10-03T10:00:00.000Z',
    ]);
    expect(original[0]?.data).toBe('2026-10-03T10:00:00.000Z');
  });

  test('aceita um vetor vazio', () => {
    expect(ordenarSessoes([])).toEqual([]);
  });
});

describe('apoioMedioDaSessao e notaMediaDaSessao', () => {
  const exemplo = sessao('2026-10-01T10:00:00.000Z', [
    resultado({ nota: 60, apoioNasBarras: 0.2 }),
    resultado({ nota: 80, apoioNasBarras: 0.4 }),
  ]);

  test('calculam a média entre os exercícios da sessão', () => {
    expect(apoioMedioDaSessao(exemplo)).toBeCloseTo(0.3);
    expect(notaMediaDaSessao(exemplo)).toBe(70);
  });

  test('uma sessão sem exercícios tem média 0, sem dividir por zero', () => {
    const vazia = sessao('2026-10-01T10:00:00.000Z', []);

    expect(apoioMedioDaSessao(vazia)).toBe(0);
    expect(notaMediaDaSessao(vazia)).toBe(0);
  });
});

describe('notasRecentesDoExercicio', () => {
  const historico = congelarProfundo([
    comNota('2026-10-01T10:00:00.000Z', 'pes-em-linha', 1, 55),
    comNota('2026-10-03T10:00:00.000Z', 'pes-em-linha', 2, 61),
    comNota('2026-10-05T10:00:00.000Z', 'sentar-e-levantar', 1, 99),
    comNota('2026-10-07T10:00:00.000Z', 'pes-em-linha', 2, 66),
    comNota('2026-10-09T10:00:00.000Z', 'pes-em-linha', 2, 72),
  ]);

  test('devolve as últimas notas do exercício, da mais antiga para a mais recente', () => {
    expect(notasRecentesDoExercicio(historico, 'pes-em-linha', 2)).toEqual([66, 72]);
  });

  test('ignora sessões em que o exercício não aconteceu', () => {
    expect(notasRecentesDoExercicio(historico, 'sentar-e-levantar', 1, 5)).toEqual([99]);
  });

  test('só conta as notas do nível atual, parando na última troca de nível', () => {
    expect(notasRecentesDoExercicio(historico, 'pes-em-linha', 2, 5)).toEqual([61, 66, 72]);
  });

  test('ignora notas de um nível diferente do atual', () => {
    expect(notasRecentesDoExercicio(historico, 'pes-em-linha', 1, 5)).toEqual([]);
  });

  test('ordena o histórico antes de olhar, mesmo se vier desordenado', () => {
    const desordenado = [...historico].reverse();

    expect(notasRecentesDoExercicio(desordenado, 'pes-em-linha', 2)).toEqual([66, 72]);
  });

  test('usa 2 notas por padrão', () => {
    expect(notasRecentesDoExercicio(historico, 'pes-em-linha', 2)).toHaveLength(2);
  });

  test('devolve vazio para um histórico vazio', () => {
    expect(notasRecentesDoExercicio([], 'pes-em-linha', 1)).toEqual([]);
  });
});

describe('semanaDeTreino', () => {
  const agora = new Date('2026-10-10T12:00:00.000Z');

  test('conta as sessões dos últimos 7 dias', () => {
    const sessoes = [
      sessao('2026-10-02T12:00:00.000Z'),
      sessao('2026-10-04T12:00:00.000Z'),
      sessao('2026-10-08T12:00:00.000Z'),
      sessao('2026-10-10T11:00:00.000Z'),
    ];

    expect(semanaDeTreino(sessoes, 3, agora)).toEqual({ planejadas: 3, feitas: 3 });
  });

  test('a sessão de exatamente 7 dias atrás já pertence à semana anterior', () => {
    const sessoes = [sessao('2026-10-03T12:00:00.000Z')];

    expect(semanaDeTreino(sessoes, 3, agora).feitas).toBe(0);
  });

  test('ignora sessões no futuro', () => {
    const sessoes = [sessao('2026-10-11T12:00:00.000Z')];

    expect(semanaDeTreino(sessoes, 3, agora).feitas).toBe(0);
  });

  test('ignora datas inválidas', () => {
    const sessoes = [sessao('isto-nao-e-data')];

    expect(semanaDeTreino(sessoes, 3, agora).feitas).toBe(0);
  });
});
