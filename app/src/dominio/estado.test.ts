import { describe, expect, test } from 'vitest';
import type { Vinculo } from './acompanhamento';
import { ajusteVigente, estadoInicial, rotinaDoPraticante, type EstadoApp } from './estado';
import { congelarProfundo } from './imutavel';
import type { AjusteProfissional } from './rotina';

const AJUSTE: AjusteProfissional = {
  autor: 'Carlos',
  autorId: 'carlos',
  niveisFixados: { 'pes-em-linha': 2 },
  metas: { 'sentar-e-levantar': { simetriaEsquerda: 50 } },
};

function vinculo(sobrescrever: Partial<Vinculo> = {}): Vinculo {
  return {
    id: 'v1',
    alunoId: 'lucia',
    acompanhanteId: 'carlos',
    tipo: 'profissional',
    status: 'autorizado',
    criadoEm: '2026-10-01T00:00:00.000Z',
    ...sobrescrever,
  };
}

function estadoCom(vinculos: Vinculo[], ajuste: AjusteProfissional | null = AJUSTE): EstadoApp {
  return congelarProfundo({
    ...estadoInicial(),
    praticantes: {
      lucia: {
        id: 'lucia',
        perfil: {
          nome: 'Lúcia',
          objetivo: 'equilibrio',
          firmeza: 'as-vezes',
          acessoriosEmCasa: ['cadeira', 'elastico'],
          inclinacaoMaxima: 2,
        },
        niveis: {},
        sessoes: [],
        ...(ajuste ? { ajuste } : {}),
      },
    },
    vinculos,
  });
}

describe('ajusteVigente', () => {
  test('devolve o ajuste quando o profissional que o fez tem vínculo autorizado', () => {
    expect(ajusteVigente(estadoCom([vinculo()]), 'lucia')).toEqual(AJUSTE);
  });

  test.each([
    ['pendente', 'pendente'],
    ['revogado', 'revogado'],
  ] as const)('ignora o ajuste quando o vínculo está %s', (_nome, status) => {
    expect(ajusteVigente(estadoCom([vinculo({ status })]), 'lucia')).toBeUndefined();
  });

  test('ignora o ajuste quando o autor é só um familiar (familiar não ajusta a rotina)', () => {
    expect(ajusteVigente(estadoCom([vinculo({ tipo: 'familiar' })]), 'lucia')).toBeUndefined();
  });

  test('ignora o ajuste quando não há nenhum vínculo do autor com este aluno', () => {
    const deOutro = vinculo({ acompanhanteId: 'ana' });
    const deOutroAluno = vinculo({ alunoId: 'rafael' });

    expect(ajusteVigente(estadoCom([deOutro]), 'lucia')).toBeUndefined();
    expect(ajusteVigente(estadoCom([deOutroAluno]), 'lucia')).toBeUndefined();
    expect(ajusteVigente(estadoCom([]), 'lucia')).toBeUndefined();
  });

  test('um vínculo antigo revogado não anula um novo vínculo autorizado do mesmo par', () => {
    const antigo = vinculo({ id: 'antigo', status: 'revogado' });
    const novo = vinculo({ id: 'novo', status: 'autorizado' });

    expect(ajusteVigente(estadoCom([antigo, novo]), 'lucia')).toEqual(AJUSTE);
  });

  test('ignora ajuste sem autorId, porque não há como conferir o vínculo', () => {
    const semAutorId: AjusteProfissional = { autor: 'Carlos' };

    expect(ajusteVigente(estadoCom([vinculo()], semAutorId), 'lucia')).toBeUndefined();
  });

  test('devolve undefined sem ajuste ou para praticante inexistente', () => {
    expect(ajusteVigente(estadoCom([vinculo()], null), 'lucia')).toBeUndefined();
    expect(ajusteVigente(estadoCom([vinculo()]), 'ninguem')).toBeUndefined();
  });
});

describe('rotinaDoPraticante', () => {
  test('aplica o ajuste do profissional autorizado (selo e nível fixado)', () => {
    const rotina = rotinaDoPraticante(estadoCom([vinculo()]), 'lucia');
    const tandem = rotina?.itens.find((item) => item.exercicioId === 'pes-em-linha');

    expect(rotina?.ajustadoPor).toBe('Carlos');
    expect(tandem).toMatchObject({ nivel: 2, fixadoPor: 'Carlos' });
  });

  test('sem vínculo autorizado, monta a rotina padrão: sem selo, sem nível fixado, sem metas', () => {
    const rotina = rotinaDoPraticante(estadoCom([vinculo({ status: 'revogado' })]), 'lucia');

    expect(rotina?.ajustadoPor).toBeUndefined();
    expect(rotina?.itens.every((item) => item.fixadoPor === undefined && item.meta === undefined)).toBe(true);
    expect(rotina?.itens.find((item) => item.exercicioId === 'pes-em-linha')?.nivel).toBe(1);
  });

  test('usa os níveis atuais do praticante', () => {
    const base = estadoCom([], null);
    const lucia = base.praticantes['lucia'];
    const estado = congelarProfundo({
      ...base,
      praticantes: { lucia: { ...lucia!, niveis: { 'sentar-e-levantar': 3 as const } } },
    });

    const item = rotinaDoPraticante(estado, 'lucia')?.itens.find((i) => i.exercicioId === 'sentar-e-levantar');

    expect(item?.nivel).toBe(3);
  });

  test('devolve undefined para praticante inexistente', () => {
    expect(rotinaDoPraticante(estadoCom([]), 'ninguem')).toBeUndefined();
  });
});
