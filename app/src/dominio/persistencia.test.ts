import { describe, expect, test } from 'vitest';
import { estadoInicial, type EstadoApp } from './estado';
import {
  CHAVE_DO_ESTADO,
  apagarDados,
  armazenamentoDoNavegador,
  carregarEstado,
  salvarEstado,
  type Armazenamento,
} from './persistencia';

function armazenamentoFalso(inicial: Record<string, string> = {}): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      dados.set(chave, valor);
    },
    removeItem: (chave) => {
      dados.delete(chave);
    },
  };
}

function armazenamentoQueFalha(): Armazenamento {
  const falhar = (): never => {
    throw new Error('armazenamento indisponível');
  };
  return { getItem: falhar, setItem: falhar, removeItem: falhar };
}

function estadoComDados(): EstadoApp {
  return {
    ...estadoInicial(),
    contaAtual: { papel: 'praticante', id: 'lucia' },
    praticantes: {
      lucia: {
        id: 'lucia',
        perfil: {
          nome: 'Dona Lúcia',
          objetivo: 'equilibrio',
          firmeza: 'as-vezes',
          acessoriosEmCasa: ['cadeira'],
          inclinacaoMaxima: 2,
        },
        niveis: { 'pes-em-linha': 2 },
        sessoes: [{ data: '2026-10-01T10:00:00.000Z', exercicios: [], percepcao: 'ok' }],
      },
    },
    acompanhantes: [{ id: 'carlos', nome: 'Carlos', tipo: 'profissional', funcao: 'Personal' }],
    recados: [
      { id: 'r1', deId: 'carlos', paraId: 'lucia', texto: 'Muito bem!', enviadoEm: '2026-10-02T10:00:00.000Z', lido: false },
    ],
  };
}

const guardar = (estado: unknown): Armazenamento & { dados: Map<string, string> } =>
  armazenamentoFalso({ [CHAVE_DO_ESTADO]: JSON.stringify(estado) });

describe('chave do armazenamento', () => {
  test('é versionada', () => {
    expect(CHAVE_DO_ESTADO).toBe('app-equilibrio:v1');
  });
});

describe('estadoInicial', () => {
  test('começa sem conta, sem dados e na versão 1', () => {
    expect(estadoInicial()).toEqual({
      versao: 1,
      contaAtual: null,
      praticantes: {},
      acompanhantes: [],
      vinculos: [],
      convites: [],
      recados: [],
    });
  });

  test('devolve objetos independentes a cada chamada', () => {
    const primeiro = estadoInicial();
    const segundo = estadoInicial();

    expect(primeiro).not.toBe(segundo);
    expect(primeiro.recados).not.toBe(segundo.recados);
    expect(primeiro.praticantes).not.toBe(segundo.praticantes);
  });
});

describe('carregarEstado', () => {
  test('devolve o estado inicial quando não há nada salvo', () => {
    expect(carregarEstado(armazenamentoFalso())).toEqual(estadoInicial());
  });

  test('recupera exatamente o que foi salvo', () => {
    const armazenamento = armazenamentoFalso();
    const estado = estadoComDados();

    salvarEstado(armazenamento, estado);

    expect(carregarEstado(armazenamento)).toEqual(estado);
  });

  test('JSON corrompido volta ao estado inicial, sem lançar erro', () => {
    const armazenamento = armazenamentoFalso({ [CHAVE_DO_ESTADO]: '{"versao": 1, ' });

    expect(carregarEstado(armazenamento)).toEqual(estadoInicial());
  });

  test('armazenamento que lança erro ao ler volta ao estado inicial', () => {
    expect(carregarEstado(armazenamentoQueFalha())).toEqual(estadoInicial());
  });

  test('armazenamento ausente (null ou undefined) volta ao estado inicial', () => {
    expect(carregarEstado(null)).toEqual(estadoInicial());
    expect(carregarEstado(undefined)).toEqual(estadoInicial());
  });

  test.each([
    ['null', null],
    ['um número', 42],
    ['um texto', 'oi'],
    ['um vetor', []],
    ['uma versão antiga', { ...estadoInicial(), versao: 0 }],
    ['uma versão futura', { ...estadoInicial(), versao: 2 }],
  ])('formato de topo inválido (%s) volta ao estado inicial', (_descricao, conteudo) => {
    expect(carregarEstado(guardar(conteudo))).toEqual(estadoInicial());
  });

  test('item inválido é descartado sozinho: o resto do estado salvo continua carregando', () => {
    const base = estadoComDados();
    const lucia = base.praticantes['lucia']!;
    const salvo = {
      ...base,
      praticantes: {
        lucia: {
          ...lucia,
          niveis: { 'pes-em-linha': 5, 'sentar-e-levantar': 2 },
          sessoes: [null, ...lucia.sessoes],
        },
        quebrado: { id: 'quebrado', perfil: null },
      },
      recados: [null, ...base.recados],
    };

    const estado = carregarEstado(guardar(salvo));

    expect(Object.keys(estado.praticantes)).toEqual(['lucia']);
    expect(estado.praticantes['lucia']?.niveis).toEqual({ 'sentar-e-levantar': 2 });
    expect(estado.praticantes['lucia']?.sessoes).toEqual(lucia.sessoes);
    expect(estado.recados).toEqual(base.recados);
  });

  test('número NaN salvo (vira null no JSON) descarta só o exercício afetado', () => {
    const base = estadoComDados();
    const lucia = base.praticantes['lucia']!;
    const exercicio = { id: 'pes-em-linha', nivel: 1, nota: Number.NaN, simetria: 1, estabilidade: 1, apoioNasBarras: 0 };
    const sessao = { data: '2026-10-01T10:00:00.000Z', exercicios: [exercicio], percepcao: 'ok' };

    const estado = carregarEstado(guardar({ ...base, praticantes: { lucia: { ...lucia, sessoes: [sessao] } } }));

    expect(estado.praticantes['lucia']?.sessoes[0]?.exercicios).toEqual([]);
  });

  test('aceita um estado válido sem conta atual', () => {
    const estado = { ...estadoComDados(), contaAtual: null };

    expect(carregarEstado(guardar(estado))).toEqual(estado);
  });
});

describe('salvarEstado', () => {
  test('grava o estado em JSON na chave versionada e devolve true', () => {
    const armazenamento = armazenamentoFalso();
    const estado = estadoComDados();

    const gravou = salvarEstado(armazenamento, estado);

    expect(gravou).toBe(true);
    expect(JSON.parse(armazenamento.dados.get(CHAVE_DO_ESTADO) ?? 'null')).toEqual(estado);
  });

  test('armazenamento cheio ou bloqueado devolve false, sem lançar erro', () => {
    expect(salvarEstado(armazenamentoQueFalha(), estadoInicial())).toBe(false);
  });

  test('armazenamento ausente devolve false', () => {
    expect(salvarEstado(null, estadoInicial())).toBe(false);
    expect(salvarEstado(undefined, estadoInicial())).toBe(false);
  });

  test('não altera o estado recebido', () => {
    const estado = Object.freeze(estadoInicial());

    expect(() => salvarEstado(armazenamentoFalso(), estado)).not.toThrow();
  });
});

describe('apagarDados', () => {
  test('remove o estado salvo e devolve true', () => {
    const armazenamento = guardar(estadoComDados());

    const apagou = apagarDados(armazenamento);

    expect(apagou).toBe(true);
    expect(armazenamento.dados.has(CHAVE_DO_ESTADO)).toBe(false);
    expect(carregarEstado(armazenamento)).toEqual(estadoInicial());
  });

  test('só remove a chave do app, preservando o resto do armazenamento', () => {
    const armazenamento = armazenamentoFalso({ [CHAVE_DO_ESTADO]: '{}', outra: 'x' });

    apagarDados(armazenamento);

    expect(armazenamento.dados.get('outra')).toBe('x');
  });

  test('armazenamento que falha ou ausente devolve false, sem lançar erro', () => {
    expect(apagarDados(armazenamentoQueFalha())).toBe(false);
    expect(apagarDados(null)).toBe(false);
  });
});

describe('armazenamentoDoNavegador', () => {
  test('devolve o localStorage do ambiente quando está disponível', () => {
    expect(armazenamentoDoNavegador()).toBe(globalThis.localStorage);
  });

  test('devolve o localStorage do escopo informado', () => {
    const armazenamento = armazenamentoFalso();

    expect(armazenamentoDoNavegador({ localStorage: armazenamento as unknown as Storage })).toBe(armazenamento);
  });

  test('devolve null quando só acessar o localStorage já lança erro (navegador bloqueando)', () => {
    const bloqueado = {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    };

    expect(armazenamentoDoNavegador(bloqueado)).toBeNull();
  });

  test('devolve null quando o ambiente não tem localStorage', () => {
    expect(armazenamentoDoNavegador({ localStorage: undefined as unknown as Storage })).toBeNull();
  });
});
