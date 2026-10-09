import { describe, expect, test } from 'vitest';
import type { Vinculo } from './acompanhamento';
import type { Credencial } from './credenciais';
import { VERSAO_DO_ESTADO, ajusteVigente, estadoInicial, precisaDoPrimeiroUso, rotinaDoPraticante, type EstadoApp } from './estado';
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

function credencial(sobrescrever: Partial<Credencial> = {}): Credencial {
  return {
    email: 'nova@exemplo.com',
    papel: 'praticante',
    pessoaId: 'nova',
    sal: '00'.repeat(16),
    hash: '11'.repeat(32),
    iteracoes: 600_000,
    criadaEm: '2026-10-07T12:00:00.000Z',
    ...sobrescrever,
  };
}

describe('estadoInicial', () => {
  test('está na versão 2, sem credenciais e sem conta', () => {
    const estado = estadoInicial();

    expect(VERSAO_DO_ESTADO).toBe(2);
    expect(estado.versao).toBe(2);
    expect(estado.credenciais).toEqual([]);
    expect(estado.contaAtual).toBeNull();
  });

  test('devolve uma lista de credenciais nova a cada chamada', () => {
    expect(estadoInicial().credenciais).not.toBe(estadoInicial().credenciais);
  });
});

const semPraticante = (conta: EstadoApp['contaAtual'], credenciais: Credencial[]): EstadoApp => ({
  ...estadoInicial(),
  contaAtual: conta,
  credenciais,
});

describe('precisaDoPrimeiroUso', () => {
  test('é verdadeiro para praticante com credencial e ainda sem triagem', () => {
    const estado = semPraticante({ papel: 'praticante', id: 'nova' }, [credencial()]);

    expect(precisaDoPrimeiroUso(estado)).toBe(true);
  });

  test('é falso quando o praticante já existe (triagem concluída)', () => {
    const base = estadoCom([], null);
    const estado: EstadoApp = {
      ...base,
      contaAtual: { papel: 'praticante', id: 'lucia' },
      credenciais: [credencial({ pessoaId: 'lucia' })],
    };

    expect(precisaDoPrimeiroUso(estado)).toBe(false);
  });

  test('é falso sem conta atual', () => {
    expect(precisaDoPrimeiroUso(semPraticante(null, [credencial()]))).toBe(false);
  });

  test('é falso para acompanhante, mesmo com credencial de mesmo id', () => {
    const estado = semPraticante({ papel: 'acompanhante', id: 'nova' }, [credencial({ papel: 'acompanhante' })]);

    expect(precisaDoPrimeiroUso(estado)).toBe(false);
  });

  test('é falso quando não existe credencial de praticante para o id (conta que não veio do cadastro)', () => {
    expect(precisaDoPrimeiroUso(semPraticante({ papel: 'praticante', id: 'nova' }, []))).toBe(false);
    expect(
      precisaDoPrimeiroUso(semPraticante({ papel: 'praticante', id: 'nova' }, [credencial({ pessoaId: 'outra' })])),
    ).toBe(false);
  });

  test('não confunde com credencial de acompanhante do mesmo id', () => {
    const estado = semPraticante({ papel: 'praticante', id: 'nova' }, [credencial({ papel: 'acompanhante' })]);

    expect(precisaDoPrimeiroUso(estado)).toBe(false);
  });

  test('ignora manterConectado', () => {
    const estado = semPraticante({ papel: 'praticante', id: 'nova', manterConectado: false }, [credencial()]);

    expect(precisaDoPrimeiroUso(estado)).toBe(true);
  });

  test('não é enganado por id herdado de Object (constructor)', () => {
    const estado = semPraticante({ papel: 'praticante', id: 'constructor' }, [credencial({ pessoaId: 'constructor' })]);

    expect(precisaDoPrimeiroUso(estado)).toBe(true);
  });
});
