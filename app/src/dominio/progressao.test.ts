import { describe, expect, test } from 'vitest';
import { congelarProfundo } from './imutavel';
import { decidirNivel, notaDeExecucao, type EntradaDaDecisao } from './progressao';

function entrada(sobrescrever: Partial<EntradaDaDecisao> = {}): EntradaDaDecisao {
  return congelarProfundo({
    nivelAtual: 2,
    notasRecentes: [85, 90],
    percepcao: 'ok',
    fixado: false,
    ...sobrescrever,
  });
}

describe('notaDeExecucao', () => {
  test('execução perfeita, sem apoio, vale 100', () => {
    expect(notaDeExecucao({ simetria: 100, estabilidade: 100, apoioNasBarras: 0 })).toBe(100);
  });

  test('execução nula, com todo o peso nas barras, vale 0', () => {
    expect(notaDeExecucao({ simetria: 0, estabilidade: 0, apoioNasBarras: 1 })).toBe(0);
  });

  test('pesa 40% simetria, 40% estabilidade e 20% ausência de apoio', () => {
    expect(notaDeExecucao({ simetria: 100, estabilidade: 0, apoioNasBarras: 1 })).toBe(40);
    expect(notaDeExecucao({ simetria: 0, estabilidade: 100, apoioNasBarras: 1 })).toBe(40);
    expect(notaDeExecucao({ simetria: 0, estabilidade: 0, apoioNasBarras: 0 })).toBe(20);
  });

  test('arredonda para o inteiro mais próximo', () => {
    // 0,4 * 71 + 0,4 * 72 + 0,2 * 75 = 72,2
    expect(notaDeExecucao({ simetria: 71, estabilidade: 72, apoioNasBarras: 0.25 })).toBe(72);
    // 0,4 * 70 + 0,4 * 70 + 0,2 * 85 = 73 (sem arredondar nada)
    expect(notaDeExecucao({ simetria: 70, estabilidade: 70, apoioNasBarras: 0.15 })).toBe(73);
  });

  test('limita entradas fora da faixa em vez de passar de 100 ou abaixo de 0', () => {
    expect(notaDeExecucao({ simetria: 250, estabilidade: 250, apoioNasBarras: -4 })).toBe(100);
    expect(notaDeExecucao({ simetria: -9, estabilidade: -9, apoioNasBarras: 7 })).toBe(0);
  });

  test('entrada inválida (NaN) não vira NaN na nota', () => {
    const nota = notaDeExecucao({ simetria: Number.NaN, estabilidade: 80, apoioNasBarras: 0 });
    expect(Number.isNaN(nota)).toBe(false);
  });
});

describe('decidirNivel: sobe', () => {
  test('sobe com nota >= 80 nas 2 últimas sessões e percepção ok', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 1, notasRecentes: [80, 80], percepcao: 'ok' }));

    expect(decisao.nivel).toBe(2);
    expect(decisao.mudanca).toBe('sobe');
    expect(decisao.motivo.length).toBeGreaterThan(0);
  });

  test('sobe com percepção fácil', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 2, percepcao: 'facil' }));

    expect(decisao).toMatchObject({ nivel: 3, mudanca: 'sobe' });
  });

  test('olha só as 2 últimas notas, ignorando uma sessão antiga ruim', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 1, notasRecentes: [40, 82, 91] }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'sobe' });
  });

  test('mantém se só a última nota passou de 80', () => {
    const decisao = decidirNivel(entrada({ notasRecentes: [79, 95] }));

    expect(decisao.mudanca).toBe('mantem');
  });

  test('mantém se a percepção é difícil, mesmo com notas altas', () => {
    const decisao = decidirNivel(entrada({ percepcao: 'dificil' }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
  });

  test('no nível 3 não passa do máximo e explica o motivo', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 3 }));

    expect(decisao.nivel).toBe(3);
    expect(decisao.mudanca).toBe('mantem');
    expect(decisao.motivo).toMatch(/máximo/i);
  });

  test('não sobe acima do nível máximo que a inclinação da plataforma permite, e explica por quê', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 2, nivelMaximo: 2 }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
    expect(decisao.motivo).toMatch(/inclinação/i);
  });

  test('sobe normalmente até o nível máximo permitido', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 1, nivelMaximo: 2 }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'sobe' });
  });

  test('um nível máximo abaixo do atual nunca faz o app subir', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 2, nivelMaximo: 1 }));

    expect(decisao.mudanca).toBe('mantem');
  });

  test('sem nível máximo informado, o teto é o nível 3', () => {
    expect(decidirNivel(entrada({ nivelAtual: 2 })).nivel).toBe(3);
  });
});

describe('decidirNivel: desce', () => {
  test('desce com nota < 60 nas 2 últimas sessões', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 3, notasRecentes: [59, 40], percepcao: 'ok' }));

    expect(decisao.nivel).toBe(2);
    expect(decisao.mudanca).toBe('desce');
    expect(decisao.motivo.length).toBeGreaterThan(0);
  });

  test('desce mesmo com percepção fácil: a segurança vem primeiro', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 2, notasRecentes: [50, 55], percepcao: 'facil' }));

    expect(decisao).toMatchObject({ nivel: 1, mudanca: 'desce' });
  });

  test('nota exatamente 60 não é "abaixo de 60"', () => {
    const decisao = decidirNivel(entrada({ notasRecentes: [60, 60] }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
  });

  test('mantém se só uma das 2 últimas notas ficou abaixo de 60', () => {
    const decisao = decidirNivel(entrada({ notasRecentes: [30, 50, 75] }));

    expect(decisao.mudanca).toBe('mantem');
  });

  test('no nível 1 não passa do mínimo e explica o motivo', () => {
    const decisao = decidirNivel(entrada({ nivelAtual: 1, notasRecentes: [10, 20] }));

    expect(decisao.nivel).toBe(1);
    expect(decisao.mudanca).toBe('mantem');
    expect(decisao.motivo).toMatch(/nível 1/i);
  });
});

describe('decidirNivel: mantém', () => {
  test('mantém com notas entre 60 e 79', () => {
    const decisao = decidirNivel(entrada({ notasRecentes: [65, 78] }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
  });

  test('mantém com menos de 2 notas', () => {
    const umaNota = decidirNivel(entrada({ notasRecentes: [95] }));
    const nenhuma = decidirNivel(entrada({ notasRecentes: [] }));

    expect(umaNota).toMatchObject({ nivel: 2, mudanca: 'mantem' });
    expect(nenhuma).toMatchObject({ nivel: 2, mudanca: 'mantem' });
    expect(umaNota.motivo).toMatch(/2 treinos|duas sessões|2 sessões/i);
  });

  test('o profissional que fixou o nível impede subir', () => {
    const decisao = decidirNivel(entrada({ fixado: true }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
    expect(decisao.motivo).toMatch(/profissional/i);
  });

  test('o profissional que fixou o nível impede descer', () => {
    const decisao = decidirNivel(entrada({ fixado: true, notasRecentes: [10, 10] }));

    expect(decisao).toMatchObject({ nivel: 2, mudanca: 'mantem' });
    expect(decisao.motivo).toMatch(/profissional/i);
  });

  test('não altera a entrada recebida', () => {
    const original = entrada();
    const copia = JSON.parse(JSON.stringify(original)) as EntradaDaDecisao;

    decidirNivel(original);

    expect(original).toEqual(copia);
  });
});
