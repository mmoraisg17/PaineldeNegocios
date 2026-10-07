import { describe, expect, test } from 'vitest';
import { type Sessao, criarEstadoDemo } from '../../dominio';
import { TREINOS_NO_RESUMO, mediasRecentes, resumoDoAluno } from './resumoDoAluno';

const AGORA = new Date('2026-10-07T12:00:00Z');
const estado = criarEstadoDemo(AGORA);

const sessao = (data: string, notas: number[], apoio = 0.1): Sessao => ({
  data,
  percepcao: 'ok',
  exercicios: notas.map((nota) => ({
    id: 'sentar-e-levantar',
    nivel: 1,
    nota,
    simetria: nota,
    estabilidade: nota + 10,
    apoioNasBarras: apoio,
  })),
});

describe('resumoDoAluno', () => {
  test('conta os treinos da semana contra a frequência da rotina e acha o último treino', () => {
    // Arrange / Act
    const resumo = resumoDoAluno(estado, 'lucia', AGORA);

    // Assert
    expect(resumo).toMatchObject({ feitas: 3, planejadas: 3, alertas: [] });
    expect(resumo?.ultimaSessao?.data.startsWith('2026-10-05')).toBe(true);
  });

  test('usa a meta do ajuste vigente para gerar alerta de simetria', () => {
    // Arrange / Act
    const resumo = resumoDoAluno(estado, 'rafael', AGORA);

    // Assert
    expect(resumo?.alertas.map((a) => a.tipo)).toEqual(['simetria-fora-da-meta']);
  });

  test('sem treinos na semana, aponta os treinos planejados não realizados', () => {
    // Arrange: "agora" um mês depois do último treino
    const depois = new Date('2026-11-10T12:00:00Z');

    // Act
    const resumo = resumoDoAluno(estado, 'lucia', depois);

    // Assert
    expect(resumo?.feitas).toBe(0);
    expect(resumo?.alertas.map((a) => a.tipo)).toContain('treinos-nao-realizados');
  });

  test('devolve undefined para um aluno que não existe', () => {
    expect(resumoDoAluno(estado, 'ninguem', AGORA)).toBeUndefined();
  });
});

describe('mediasRecentes', () => {
  test('sem treinos não há média (evita mostrar zero como se fosse nota)', () => {
    expect(mediasRecentes([])).toBeUndefined();
  });

  test('calcula as médias dos exercícios dos treinos mais recentes', () => {
    // Arrange: fora de ordem de propósito; o mais antigo não entra na conta
    const sessoes = [
      sessao('2026-10-05T12:00:00Z', [80, 90], 0.2),
      sessao('2026-09-01T12:00:00Z', [10, 10, 10], 0.9),
      sessao('2026-10-03T12:00:00Z', [60], 0.1),
      sessao('2026-10-01T12:00:00Z', [70], 0.3),
    ];

    // Act
    const medias = mediasRecentes(sessoes, 3);

    // Assert: nota = média das notas das sessões (85, 60, 70); demais = média dos exercícios (80, 90, 60, 70)
    expect(medias?.nota).toBeCloseTo((85 + 60 + 70) / 3);
    expect(medias?.simetria).toBeCloseTo((80 + 90 + 60 + 70) / 4);
    expect(medias?.estabilidade).toBeCloseTo((90 + 100 + 70 + 80) / 4);
    expect(medias?.apoio).toBeCloseTo((0.2 + 0.2 + 0.1 + 0.3) / 4);
  });

  test('por padrão usa os últimos treinos do resumo', () => {
    expect(TREINOS_NO_RESUMO).toBeGreaterThanOrEqual(2);
    const sessoes = Array.from({ length: TREINOS_NO_RESUMO + 2 }, (_, i) => sessao(`2026-10-0${i + 1}T12:00:00Z`, [i < 2 ? 0 : 100]));
    expect(mediasRecentes(sessoes)?.nota).toBe(100);
  });

  test('não altera a lista recebida', () => {
    // Arrange
    const sessoes = [sessao('2026-10-05T12:00:00Z', [80]), sessao('2026-10-01T12:00:00Z', [60])];
    const copia = structuredClone(sessoes);

    // Act
    mediasRecentes(sessoes);

    // Assert
    expect(sessoes).toEqual(copia);
  });
});
