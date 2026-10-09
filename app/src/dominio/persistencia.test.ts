import { describe, expect, test } from 'vitest';
import { estadoInicial, type EstadoApp } from './estado';
import {
  CHAVES_ANTIGAS,
  CHAVE_DA_SESSAO,
  CHAVE_DO_ESTADO,
  apagarDados,
  apagarVersoesAntigas,
  armazenamentoDaSessao,
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
    expect(CHAVE_DO_ESTADO).toBe('app-equilibrio:v2');
  });

  test('a chave da sessão é versionada e diferente da chave do estado', () => {
    expect(CHAVE_DA_SESSAO).toBe('app-equilibrio:sessao:v2');
    expect(CHAVE_DA_SESSAO).not.toBe(CHAVE_DO_ESTADO);
  });

  test('a versão 1 está na lista de chaves antigas', () => {
    expect(CHAVES_ANTIGAS).toEqual(['app-equilibrio:v1']);
  });
});

describe('estadoInicial', () => {
  test('começa sem conta, sem dados e na versão 2', () => {
    expect(estadoInicial()).toEqual({
      versao: 2,
      contaAtual: null,
      praticantes: {},
      acompanhantes: [],
      vinculos: [],
      convites: [],
      recados: [],
      credenciais: [],
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
    const armazenamento = armazenamentoFalso({ [CHAVE_DO_ESTADO]: '{"versao": 2, ' });

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
    ['uma versão futura', { ...estadoInicial(), versao: 3 }],
    ['a versão 1, de antes das contas com senha', { ...estadoInicial(), versao: 1 }],
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

const comConta = (manterConectado?: boolean): EstadoApp => ({
  ...estadoComDados(),
  contaAtual: { papel: 'praticante', id: 'lucia', ...(manterConectado === undefined ? {} : { manterConectado }) },
});

describe('manter conectado (local x sessão)', () => {
  test('manterConectado true grava o estado inteiro no local e nada na sessão', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso();

    const gravou = salvarEstado(local, comConta(true), sessao);

    expect(gravou).toBe(true);
    expect(JSON.parse(local.dados.get(CHAVE_DO_ESTADO) ?? 'null')).toEqual(comConta(true));
    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
  });

  test('manterConectado ausente vale como true', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso();

    salvarEstado(local, comConta(), sessao);

    expect(JSON.parse(local.dados.get(CHAVE_DO_ESTADO) ?? 'null').contaAtual).toEqual({ papel: 'praticante', id: 'lucia' });
    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
  });

  test('manterConectado false tira a conta do local e guarda só a conta na sessão', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso();

    salvarEstado(local, comConta(false), sessao);

    const noLocal = JSON.parse(local.dados.get(CHAVE_DO_ESTADO) ?? 'null');
    expect(noLocal.contaAtual).toBeNull();
    expect(noLocal.praticantes.lucia.id).toBe('lucia');
    expect(JSON.parse(sessao.dados.get(CHAVE_DA_SESSAO) ?? 'null')).toEqual({
      papel: 'praticante',
      id: 'lucia',
      manterConectado: false,
    });
  });

  test('o estado recebido não é alterado quando a conta vai para a sessão', () => {
    const estado = Object.freeze({ ...comConta(false) });

    expect(() => salvarEstado(armazenamentoFalso(), estado, armazenamentoFalso())).not.toThrow();
    expect(estado.contaAtual?.id).toBe('lucia');
  });

  test('sem armazenamento de sessão, manterConectado false não deixa a conta no local', () => {
    const local = armazenamentoFalso();

    salvarEstado(local, comConta(false));

    expect(JSON.parse(local.dados.get(CHAVE_DO_ESTADO) ?? 'null').contaAtual).toBeNull();
  });

  test('sair (sem conta) apaga a conta que estava na sessão', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso({ [CHAVE_DA_SESSAO]: '{"papel":"praticante","id":"lucia"}' });

    salvarEstado(local, { ...comConta(false), contaAtual: null }, sessao);

    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
  });

  test('trocar de "não manter" para "manter" apaga a conta da sessão', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso();
    salvarEstado(local, comConta(false), sessao);

    salvarEstado(local, comConta(true), sessao);

    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
  });

  test('carrega a conta da sessão quando o local veio sem conta (reabrir a mesma aba)', () => {
    const local = armazenamentoFalso();
    const sessao = armazenamentoFalso();
    salvarEstado(local, comConta(false), sessao);

    const estado = carregarEstado(local, sessao);

    expect(estado.contaAtual).toEqual({ papel: 'praticante', id: 'lucia', manterConectado: false });
    expect(estado.praticantes['lucia']?.id).toBe('lucia');
  });

  test('numa aba nova (sessão vazia) a pessoa que não quis ficar conectada volta sem conta', () => {
    const local = armazenamentoFalso();
    salvarEstado(local, comConta(false), armazenamentoFalso());

    expect(carregarEstado(local, armazenamentoFalso()).contaAtual).toBeNull();
  });

  test('a conta do local vence a da sessão', () => {
    const local = guardar({ ...estadoComDados(), contaAtual: { papel: 'acompanhante', id: 'carlos' } });
    const sessao = armazenamentoFalso({ [CHAVE_DA_SESSAO]: '{"papel":"praticante","id":"lucia"}' });

    expect(carregarEstado(local, sessao).contaAtual).toEqual({ papel: 'acompanhante', id: 'carlos' });
  });

  test.each([
    ['JSON corrompido', '{"papel": "prat'],
    ['conta que não existe', '{"papel":"praticante","id":"fantasma"}'],
    ['papel inválido', '{"papel":"admin","id":"lucia"}'],
    ['null', 'null'],
    ['texto solto', '"lucia"'],
  ])('sessão com %s é ignorada, sem lançar erro', (_nome, conteudo) => {
    const local = guardar({ ...estadoComDados(), contaAtual: null });
    const sessao = armazenamentoFalso({ [CHAVE_DA_SESSAO]: conteudo });

    expect(carregarEstado(local, sessao).contaAtual).toBeNull();
  });

  test('sessão que lança erro ao ler é ignorada', () => {
    const local = guardar({ ...estadoComDados(), contaAtual: null });

    expect(carregarEstado(local, armazenamentoQueFalha()).contaAtual).toBeNull();
  });

  test('sessão ausente (null) é ignorada', () => {
    const local = guardar({ ...estadoComDados(), contaAtual: null });

    expect(carregarEstado(local, null).contaAtual).toBeNull();
  });

  test('salvar com sessão que falha não lança e devolve false, mas o local fica gravado', () => {
    const local = armazenamentoFalso();

    const gravou = salvarEstado(local, comConta(false), armazenamentoQueFalha());

    expect(gravou).toBe(false);
    expect(local.dados.has(CHAVE_DO_ESTADO)).toBe(true);
  });

  test('salvar com sessão que falha e manterConectado true não lança', () => {
    expect(() => salvarEstado(armazenamentoFalso(), comConta(true), armazenamentoQueFalha())).not.toThrow();
  });
});

describe('apagarDados com sessão', () => {
  test('apaga o estado e a conta da sessão', () => {
    const local = guardar(estadoComDados());
    const sessao = armazenamentoFalso({ [CHAVE_DA_SESSAO]: '{"papel":"praticante","id":"lucia"}', outra: 'x' });

    const apagou = apagarDados(local, sessao);

    expect(apagou).toBe(true);
    expect(local.dados.has(CHAVE_DO_ESTADO)).toBe(false);
    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
    expect(sessao.dados.get('outra')).toBe('x');
  });

  test('sessão que falha não impede de apagar o local, mas devolve false', () => {
    const local = guardar(estadoComDados());

    expect(apagarDados(local, armazenamentoQueFalha())).toBe(false);
    expect(local.dados.has(CHAVE_DO_ESTADO)).toBe(false);
  });

  test('sem local ainda apaga a sessão, e devolve false', () => {
    const sessao = armazenamentoFalso({ [CHAVE_DA_SESSAO]: '{}' });

    expect(apagarDados(null, sessao)).toBe(false);
    expect(sessao.dados.has(CHAVE_DA_SESSAO)).toBe(false);
  });
});

describe('apagarVersoesAntigas', () => {
  test('remove a chave da versão 1 e preserva a atual e as outras', () => {
    const armazenamento = armazenamentoFalso({
      'app-equilibrio:v1': '{"versao":1}',
      [CHAVE_DO_ESTADO]: '{}',
      'app-equilibrio:preferencias': '{}',
      outra: 'x',
    });

    const apagou = apagarVersoesAntigas(armazenamento);

    expect(apagou).toBe(true);
    expect([...armazenamento.dados.keys()].toSorted()).toEqual(['app-equilibrio:preferencias', CHAVE_DO_ESTADO, 'outra'].toSorted());
  });

  test('não faz nada (e não falha) quando não há chave antiga', () => {
    const armazenamento = armazenamentoFalso({ [CHAVE_DO_ESTADO]: '{}' });

    expect(apagarVersoesAntigas(armazenamento)).toBe(true);
    expect(armazenamento.dados.has(CHAVE_DO_ESTADO)).toBe(true);
  });

  test('armazenamento que falha ou ausente devolve false, sem lançar erro', () => {
    expect(apagarVersoesAntigas(armazenamentoQueFalha())).toBe(false);
    expect(apagarVersoesAntigas(null)).toBe(false);
    expect(apagarVersoesAntigas(undefined)).toBe(false);
  });

  test('tenta apagar todas as chaves antigas mesmo se uma falhar', () => {
    const tentadas: string[] = [];
    const armazenamento: Armazenamento = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: (chave) => {
        tentadas.push(chave);
        throw new Error('bloqueado');
      },
    };

    expect(apagarVersoesAntigas(armazenamento)).toBe(false);
    expect(tentadas).toEqual([...CHAVES_ANTIGAS]);
  });
});

describe('armazenamentoDaSessao', () => {
  test('devolve o sessionStorage do ambiente quando está disponível', () => {
    expect(armazenamentoDaSessao()).toBe(globalThis.sessionStorage);
  });

  test('devolve o sessionStorage do escopo informado', () => {
    const armazenamento = armazenamentoFalso();

    expect(armazenamentoDaSessao({ sessionStorage: armazenamento as unknown as Storage })).toBe(armazenamento);
  });

  test('devolve null quando só acessar o sessionStorage já lança erro', () => {
    const bloqueado = {
      get sessionStorage(): Storage {
        throw new Error('SecurityError');
      },
    };

    expect(armazenamentoDaSessao(bloqueado)).toBeNull();
  });

  test('devolve null quando o ambiente não tem sessionStorage', () => {
    expect(armazenamentoDaSessao({ sessionStorage: undefined as unknown as Storage })).toBeNull();
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
