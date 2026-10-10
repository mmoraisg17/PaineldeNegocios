import { describe, expect, test } from 'vitest';
import { congelarProfundo } from './imutavel';
import { NIVEL_MAXIMO, NIVEL_MINIMO, forcaDoMascote } from './forcaDoMascote';
import type { Sessao } from './sessao';

const AGORA = new Date('2026-10-10T12:00:00Z');
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function sessaoHa(dias: number): Sessao {
  return { data: new Date(AGORA.getTime() - dias * MS_POR_DIA).toISOString(), exercicios: [], percepcao: 'ok' };
}

/* `porSemana[k]` = treinos na janela de 7 dias k (0 = a mais recente). Os
   treinos ficam no meio da janela, longe das bordas. */
function historico(porSemana: readonly number[]): Sessao[] {
  return porSemana.flatMap((quantidade, semana) =>
    Array.from({ length: quantidade }, (_, indice) => sessaoHa(semana * 7 + 1 + indice * 0.5)),
  );
}

/* O último treino de `historico` foi há 1 dia; o deslocamento de
   `dias - 1` deixa exatamente `dias` dias desde o último treino. */
function base(dias: number) {
  return historico([3, 3, 3, 3]).map((s) => ({
  ...s,
  data: new Date(Date.parse(s.data) - (dias - 1) * MS_POR_DIA).toISOString(),
}));
}

describe('forcaDoMascote', () => {
  test('sem nenhum treino o mascote fica em 2 (devagar), não em 1', () => {
    expect(forcaDoMascote([], 3, AGORA)).toBe(2);
  });

  test('um treino recente já leva o mascote a 3 (em forma)', () => {
    expect(forcaDoMascote([sessaoHa(1)], 3, AGORA)).toBe(3);
  });

  test('2 treinos por semana em 3 das últimas 4 semanas dá 4 (forte)', () => {
    expect(forcaDoMascote(historico([2, 2, 2, 0]), 3, AGORA)).toBe(4);
  });

  test('2 treinos por semana em só 2 das 4 semanas fica em 3', () => {
    expect(forcaDoMascote(historico([2, 2, 0, 0]), 3, AGORA)).toBe(3);
  });

  test('a meta da rotina cumprida nas 4 semanas dá 5 (campeão)', () => {
    expect(forcaDoMascote(historico([3, 3, 3, 3]), 3, AGORA)).toBe(5);
  });

  test('a meta cumprida em 3 das 4 semanas não chega a campeão', () => {
    expect(forcaDoMascote(historico([3, 3, 3, 2]), 3, AGORA)).toBe(4);
  });

  test('com meta de 1 por semana, 1 treino por semana nas 4 semanas dá 5', () => {
    expect(forcaDoMascote(historico([1, 1, 1, 1]), 1, AGORA)).toBe(5);
  });

  test('meta 0 ou negativa conta como 1 por semana', () => {
    expect(forcaDoMascote(historico([1, 1, 1, 1]), 0, AGORA)).toBe(5);
    expect(forcaDoMascote(historico([1, 1, 1, 1]), -2, AGORA)).toBe(5);
  });

  describe('queda gradual: um nível por semana sem treinar', () => {

    test('até 6 dias sem treinar mantém o nível', () => {
      expect(forcaDoMascote(base(6), 3, AGORA)).toBe(5);
    });

    test('7 dias sem treinar tira um nível', () => {
      expect(forcaDoMascote(base(7), 3, AGORA)).toBe(4);
    });

    test('14 dias tiram dois níveis', () => {
      expect(forcaDoMascote(base(14), 3, AGORA)).toBe(3);
    });

    test('28 dias ou mais chegam ao mínimo e ficam nele', () => {
      expect(forcaDoMascote(base(28), 3, AGORA)).toBe(NIVEL_MINIMO);
      expect(forcaDoMascote(base(200), 3, AGORA)).toBe(NIVEL_MINIMO);
    });
  });

  test('quem estava em forma e parou 8 dias vai a 2; com 14 dias, a 1', () => {
    expect(forcaDoMascote([sessaoHa(8)], 3, AGORA)).toBe(2);
    expect(forcaDoMascote([sessaoHa(14)], 3, AGORA)).toBe(1);
  });

  test('voltar a treinar depois de uma pausa longa devolve o mascote a 3 já no primeiro treino', () => {
    const volta = [...historico([3, 3, 3, 3]).map((s) => ({
      ...s,
      data: new Date(Date.parse(s.data) - 40 * MS_POR_DIA).toISOString(),
    })), sessaoHa(0.2)];
    expect(forcaDoMascote(volta, 3, AGORA)).toBe(3);
  });

  test('datas inválidas e treinos no futuro são ignorados', () => {
    const ruins: Sessao[] = [
      { data: 'ontem', exercicios: [], percepcao: 'ok' },
      sessaoHa(-3),
    ];
    expect(forcaDoMascote(ruins, 3, AGORA)).toBe(2);
    expect(forcaDoMascote([...ruins, sessaoHa(1)], 3, AGORA)).toBe(3);
  });

  test('o resultado sempre fica entre o mínimo e o máximo', () => {
    for (const dias of [0, 1, 7, 13, 30, 400]) {
      const nivel = forcaDoMascote(historico([3, 3, 3, 3]).concat(sessaoHa(dias)), 3, AGORA);
      expect(nivel).toBeGreaterThanOrEqual(NIVEL_MINIMO);
      expect(nivel).toBeLessThanOrEqual(NIVEL_MAXIMO);
    }
  });

  test('não altera a lista recebida', () => {
    const sessoes = congelarProfundo(historico([2, 2, 2, 2]));
    expect(() => forcaDoMascote(sessoes, 3, AGORA)).not.toThrow();
  });
});
