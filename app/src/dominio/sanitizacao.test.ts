import { describe, expect, test } from 'vitest';
import { estadoInicial, type EstadoApp } from './estado';
import { sanearEstado } from './sanitizacao';

const PERFIL = {
  nome: 'Dona Lúcia',
  objetivo: 'equilibrio',
  firmeza: 'as-vezes',
  acessoriosEmCasa: ['cadeira', 'elastico'],
  inclinacaoMaxima: 2,
};

const RESULTADO = {
  id: 'pes-em-linha',
  nivel: 2,
  nota: 80,
  simetria: 82,
  estabilidade: 84,
  apoioNasBarras: 0.1,
};

const SESSAO = { data: '2026-10-01T10:00:00.000Z', exercicios: [RESULTADO], percepcao: 'ok' };

const AJUSTE = {
  autor: 'Carlos',
  autorId: 'carlos',
  exerciciosIncluidos: ['descida-de-degrau'],
  exerciciosRemovidos: ['sentar-e-levantar'],
  niveisFixados: { 'pes-em-linha': 3 },
  metas: { 'miniagachamento-simetrico': { simetriaEsquerda: 50 } },
  frequenciaSemanal: 4,
};

const PRATICANTE = {
  id: 'lucia',
  idade: 68,
  perfil: PERFIL,
  niveis: { 'pes-em-linha': 2 },
  sessoes: [SESSAO],
  ajuste: AJUSTE,
};

/* Estado completo e válido, em "JSON solto" (unknown), como sai do localStorage. */
function bruto(sobrescrever: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    versao: 1,
    contaAtual: { papel: 'praticante', id: 'lucia' },
    praticantes: { lucia: PRATICANTE },
    acompanhantes: [{ id: 'carlos', nome: 'Carlos', tipo: 'profissional', funcao: 'Personal' }],
    vinculos: [
      {
        id: 'v1',
        alunoId: 'lucia',
        acompanhanteId: 'carlos',
        tipo: 'profissional',
        status: 'autorizado',
        criadoEm: '2026-10-01T00:00:00.000Z',
        autorizadoEm: '2026-10-02T00:00:00.000Z',
      },
    ],
    convites: [{ codigo: 'K7M2QX', tipo: 'familiar', criadoEm: '2026-10-01T00:00:00.000Z', expiraEm: '2026-10-03T00:00:00.000Z' }],
    recados: [
      { id: 'r1', deId: 'carlos', paraId: 'lucia', texto: 'Muito bem!', enviadoEm: '2026-10-02T00:00:00.000Z', lido: false },
    ],
    ...sobrescrever,
  };
}

function comPraticante(sobrescrever: Record<string, unknown>): Record<string, unknown> {
  return bruto({ praticantes: { lucia: { ...PRATICANTE, ...sobrescrever } } });
}

function lucia(estado: EstadoApp) {
  return estado.praticantes['lucia'];
}

describe('sanearEstado: estado válido', () => {
  test('mantém tudo que está certo, numa cópia independente do original', () => {
    const original = bruto();

    const estado = sanearEstado(original);

    expect(estado).toEqual(original);
    expect(estado).not.toBe(original);
    expect(estado.praticantes['lucia']).not.toBe(PRATICANTE);
    expect(estado.praticantes['lucia']?.perfil.acessoriosEmCasa).not.toBe(PERFIL.acessoriosEmCasa);
  });

  test.each([
    ['null', null],
    ['um número', 42],
    ['um texto', 'oi'],
    ['um vetor', []],
    ['indefinido', undefined],
    ['versão antiga', bruto({ versao: 0 })],
    ['versão futura', bruto({ versao: 2 })],
  ])('formato de topo inválido (%s) vira o estado inicial', (_nome, valor) => {
    expect(sanearEstado(valor)).toEqual(estadoInicial());
  });

  test('nunca lança, com qualquer lixo no lugar das coleções', () => {
    const lixo = [null, undefined, NaN, 'x', 7, [], {}, () => 1, Symbol('s')];
    for (const item of lixo) {
      const estado = {
        versao: 1,
        contaAtual: item,
        praticantes: item,
        acompanhantes: item,
        vinculos: item,
        convites: item,
        recados: item,
      };

      expect(() => sanearEstado(estado)).not.toThrow();
      expect(sanearEstado(estado)).toEqual(estadoInicial());
    }
  });
});

describe('sanearEstado: coleções de topo', () => {
  test.each(['acompanhantes', 'vinculos', 'convites', 'recados'])('%s que não é vetor vira vetor vazio', (chave) => {
    const estado = sanearEstado(bruto({ [chave]: { nao: 'e vetor' } }));

    expect(estado[chave as 'recados']).toEqual([]);
  });

  test('praticantes que não é objeto vira vazio, mas o resto do estado é preservado', () => {
    const estado = sanearEstado(bruto({ praticantes: [], contaAtual: null }));

    expect(estado.praticantes).toEqual({});
    expect(estado.acompanhantes).toHaveLength(1);
  });

  test('descarta item nulo, de tipo errado ou incompleto, mantendo os válidos', () => {
    const estado = sanearEstado(
      bruto({
        acompanhantes: [null, 7, { id: 'x' }, { id: 'y', nome: 'Y', tipo: 'chefe', funcao: 'z' }, { id: 'ok', nome: 'Ok', tipo: 'familiar', funcao: 'Filha' }],
      }),
    );

    expect(estado.acompanhantes).toEqual([{ id: 'ok', nome: 'Ok', tipo: 'familiar', funcao: 'Filha' }]);
  });

  test('vínculos: descarta status/tipo inválido e campos de data que não são texto', () => {
    const base = { id: 'v', alunoId: 'a', acompanhanteId: 'b', tipo: 'familiar', status: 'pendente', criadoEm: '2026-10-01' };
    const estado = sanearEstado(
      bruto({
        vinculos: [null, { ...base, status: 'quase' }, { ...base, tipo: 'vizinho' }, { ...base, id: 3 }, { ...base, autorizadoEm: 99 }],
      }),
    );

    expect(estado.vinculos).toEqual([base]);
  });

  test('convites: descarta tipo inválido e datas ausentes', () => {
    const valido = { codigo: 'ABCDEF', tipo: 'profissional', criadoEm: '2026-10-01', expiraEm: '2026-10-03' };
    const estado = sanearEstado(bruto({ convites: [null, { ...valido, tipo: 'x' }, { ...valido, expiraEm: undefined }, valido] }));

    expect(estado.convites).toEqual([valido]);
  });

  test('recados: exige `lido` booleano e textos', () => {
    const valido = { id: 'r', deId: 'a', paraId: 'b', texto: 'oi', enviadoEm: '2026-10-01', lido: true };
    const estado = sanearEstado(bruto({ recados: [{ ...valido, lido: 'sim' }, { ...valido, texto: null }, valido] }));

    expect(estado.recados).toEqual([valido]);
  });
});

describe('sanearEstado: conta atual', () => {
  test('mantém uma conta que existe', () => {
    expect(sanearEstado(bruto()).contaAtual).toEqual({ papel: 'praticante', id: 'lucia' });
    expect(sanearEstado(bruto({ contaAtual: { papel: 'acompanhante', id: 'carlos' } })).contaAtual).toEqual({
      papel: 'acompanhante',
      id: 'carlos',
    });
  });

  test.each([
    ['papel inválido', { papel: 'admin', id: 'lucia' }],
    ['sem id', { papel: 'praticante' }],
    ['número', 42],
    ['praticante que não existe', { papel: 'praticante', id: 'fantasma' }],
    ['acompanhante que não existe', { papel: 'acompanhante', id: 'fantasma' }],
    ['papel trocado (id de acompanhante como praticante)', { papel: 'praticante', id: 'carlos' }],
  ])('conta inválida ou sem cadastro (%s) vira null', (_nome, conta) => {
    expect(sanearEstado(bruto({ contaAtual: conta })).contaAtual).toBeNull();
  });
});

describe('sanearEstado: praticantes', () => {
  test('descarta o praticante sem perfil válido, mantendo os outros', () => {
    const estado = sanearEstado(
      bruto({
        praticantes: {
          lucia: PRATICANTE,
          sem: { ...PRATICANTE, id: 'sem', perfil: null },
          ruim: { ...PRATICANTE, id: 'ruim', perfil: { ...PERFIL, objetivo: 'voar' } },
          alto: { ...PRATICANTE, id: 'alto', perfil: { ...PERFIL, inclinacaoMaxima: 9 } },
          fracionado: { ...PRATICANTE, id: 'fracionado', perfil: { ...PERFIL, inclinacaoMaxima: 1.5 } },
          firmeza: { ...PRATICANTE, id: 'firmeza', perfil: { ...PERFIL, firmeza: 'tanto faz' } },
          semNome: { ...PRATICANTE, id: 'semNome', perfil: { ...PERFIL, nome: 7 } },
          semId: { ...PRATICANTE, id: undefined },
          nulo: null,
        },
      }),
    );

    expect(Object.keys(estado.praticantes)).toEqual(['lucia']);
  });

  test('filtra acessórios inválidos do perfil sem descartar o praticante', () => {
    const estado = sanearEstado(comPraticante({ perfil: { ...PERFIL, acessoriosEmCasa: ['cadeira', 'jetpack', 7, null, 'elastico'] } }));

    expect(lucia(estado)?.perfil.acessoriosEmCasa).toEqual(['cadeira', 'elastico']);
  });

  test('acessórios que não são vetor viram vetor vazio', () => {
    const estado = sanearEstado(comPraticante({ perfil: { ...PERFIL, acessoriosEmCasa: 'cadeira' } }));

    expect(lucia(estado)?.perfil.acessoriosEmCasa).toEqual([]);
  });

  test('idade só é mantida se for número finito', () => {
    expect(lucia(sanearEstado(comPraticante({ idade: Number.NaN })))?.idade).toBeUndefined();
    expect(lucia(sanearEstado(comPraticante({ idade: '68' })))?.idade).toBeUndefined();
    expect(lucia(sanearEstado(comPraticante({ idade: 68 })))?.idade).toBe(68);
  });

  test('chave "__proto__" vinda do JSON não polui o protótipo nem vira praticante', () => {
    const texto = JSON.stringify(bruto()).replace('"praticantes":{', '"praticantes":{"__proto__":' + JSON.stringify(PRATICANTE) + ',');

    const estado = sanearEstado(JSON.parse(texto));

    expect(Object.getPrototypeOf(estado.praticantes)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>)['perfil']).toBeUndefined();
  });
});

describe('sanearEstado: níveis', () => {
  test('mantém só níveis 1, 2 ou 3 de exercícios conhecidos', () => {
    const niveis = {
      'pes-em-linha': 5,
      'sentar-e-levantar': 2,
      'descida-de-degrau': 0,
      'abducao-com-elastico': 2.5,
      'transferencia-de-peso': '3',
      'miniagachamento-simetrico': Number.NaN,
      'panturrilha-unilateral': null,
      'equilibrio-com-inclinacao': 1,
      inexistente: 2,
    };

    const estado = sanearEstado(comPraticante({ niveis }));

    expect(lucia(estado)?.niveis).toEqual({ 'sentar-e-levantar': 2, 'equilibrio-com-inclinacao': 1 });
  });

  test('níveis que não é objeto vira objeto vazio, sem descartar o praticante', () => {
    expect(lucia(sanearEstado(comPraticante({ niveis: [1, 2, 3] })))?.niveis).toEqual({});
    expect(lucia(sanearEstado(comPraticante({ niveis: null })))?.niveis).toEqual({});
  });
});

describe('sanearEstado: sessões', () => {
  test('descarta sessão nula, sem data, com percepção inválida ou sem vetor de exercícios', () => {
    const sessoes = [
      null,
      42,
      { ...SESSAO, data: 12 },
      { ...SESSAO, percepcao: 'otima' },
      { ...SESSAO, exercicios: 'nada' },
      SESSAO,
    ];

    const estado = sanearEstado(comPraticante({ sessoes }));

    expect(lucia(estado)?.sessoes).toEqual([SESSAO]);
  });

  test('descarta exercício nulo, com id desconhecido, nível 5 ou número NaN/Infinity', () => {
    const exercicios = [
      null,
      { ...RESULTADO, id: 'inexistente' },
      { ...RESULTADO, nivel: 5 },
      { ...RESULTADO, nota: Number.NaN },
      { ...RESULTADO, simetria: Number.POSITIVE_INFINITY },
      { ...RESULTADO, estabilidade: '80' },
      { ...RESULTADO, apoioNasBarras: undefined },
      RESULTADO,
    ];

    const estado = sanearEstado(comPraticante({ sessoes: [{ ...SESSAO, exercicios }] }));

    expect(lucia(estado)?.sessoes[0]?.exercicios).toEqual([RESULTADO]);
  });

  test('cargaEsquerda inválida é omitida, mas o exercício é mantido', () => {
    const exercicios = [{ ...RESULTADO, cargaEsquerda: Number.NaN }, { ...RESULTADO, cargaEsquerda: 46 }];

    const estado = sanearEstado(comPraticante({ sessoes: [{ ...SESSAO, exercicios }] }));

    const [primeiro, segundo] = lucia(estado)?.sessoes[0]?.exercicios ?? [];
    expect(primeiro).toEqual(RESULTADO);
    expect(primeiro).not.toHaveProperty('cargaEsquerda');
    expect(segundo?.cargaEsquerda).toBe(46);
  });

  test('uma sessão cujos exercícios são todos inválidos é mantida, com lista vazia', () => {
    const estado = sanearEstado(comPraticante({ sessoes: [{ ...SESSAO, exercicios: [null] }] }));

    expect(lucia(estado)?.sessoes).toEqual([{ ...SESSAO, exercicios: [] }]);
  });

  test('sessões que não é vetor vira vetor vazio', () => {
    expect(lucia(sanearEstado(comPraticante({ sessoes: {} })))?.sessoes).toEqual([]);
  });
});

describe('sanearEstado: ajuste do profissional', () => {
  test('mantém um ajuste válido por inteiro', () => {
    expect(lucia(sanearEstado(bruto()))?.ajuste).toEqual(AJUSTE);
  });

  test.each([
    ['nulo', null],
    ['texto', 'ajuste'],
    ['sem autor', { ...AJUSTE, autor: undefined }],
    ['autor numérico', { ...AJUSTE, autor: 7 }],
  ])('ajuste inválido (%s) é descartado, sem descartar o praticante', (_nome, ajuste) => {
    const estado = sanearEstado(comPraticante({ ajuste }));

    expect(lucia(estado)).toBeDefined();
    expect(lucia(estado)).not.toHaveProperty('ajuste');
  });

  test('níveis fixados seguem a mesma regra: só 1|2|3 e ids conhecidos', () => {
    const ajuste = { ...AJUSTE, niveisFixados: { 'pes-em-linha': 9, 'sentar-e-levantar': 2, inexistente: 1 } };

    expect(lucia(sanearEstado(comPraticante({ ajuste })))?.ajuste?.niveisFixados).toEqual({ 'sentar-e-levantar': 2 });
  });

  test('metas: descarta id desconhecido e simetriaEsquerda que não é número finito', () => {
    const ajuste = {
      ...AJUSTE,
      metas: {
        'miniagachamento-simetrico': { simetriaEsquerda: 55 },
        'descida-de-degrau': { simetriaEsquerda: Number.NaN },
        'pes-em-linha': { simetriaEsquerda: '50' },
        'sentar-e-levantar': null,
        inexistente: { simetriaEsquerda: 50 },
      },
    };

    expect(lucia(sanearEstado(comPraticante({ ajuste })))?.ajuste?.metas).toEqual({
      'miniagachamento-simetrico': { simetriaEsquerda: 55 },
    });
  });

  test('listas de exercícios incluídos e removidos descartam ids desconhecidos', () => {
    const ajuste = { ...AJUSTE, exerciciosIncluidos: ['descida-de-degrau', 'fantasma', 7], exerciciosRemovidos: 'tudo' };

    const resultado = lucia(sanearEstado(comPraticante({ ajuste })))?.ajuste;

    expect(resultado?.exerciciosIncluidos).toEqual(['descida-de-degrau']);
    expect(resultado?.exerciciosRemovidos).toEqual([]);
  });

  test.each([
    [Number.NaN],
    [0],
    [-1],
    [2.5],
    ['3'],
    [Number.POSITIVE_INFINITY],
  ])('frequência semanal inválida (%s) é omitida', (frequencia) => {
    const ajuste = { ...AJUSTE, frequenciaSemanal: frequencia };

    expect(lucia(sanearEstado(comPraticante({ ajuste })))?.ajuste).not.toHaveProperty('frequenciaSemanal');
  });

  test('autorId que não é texto é omitido', () => {
    const ajuste = { ...AJUSTE, autorId: 12 };

    expect(lucia(sanearEstado(comPraticante({ ajuste })))?.ajuste).not.toHaveProperty('autorId');
  });
});

test('o convite mantém quem o gerou (alunoId) e descarta alunoId inválido', () => {
  const base = { codigo: 'ABC234', tipo: 'profissional', criadoEm: '2026-10-07T10:00:00.000Z', expiraEm: '2026-10-09T10:00:00.000Z' };
  const estado = sanearEstado({ versao: 1, convites: [{ ...base, alunoId: 'lucia' }, { ...base, codigo: 'XYZ234', alunoId: 42 }] });
  expect(estado.convites[0]?.alunoId).toBe('lucia');
  expect(estado.convites[1]).not.toHaveProperty('alunoId');
});

describe('sanearEstado: nomes longos', () => {
  test('corta nome do praticante e nome/função do acompanhante no tamanho máximo', () => {
    const longo = 'X'.repeat(500);
    const estado = sanearEstado(
      bruto({
        praticantes: { lucia: { ...PRATICANTE, perfil: { ...PERFIL, nome: longo } } },
        acompanhantes: [{ id: 'carlos', nome: longo, funcao: longo, tipo: 'profissional' }],
      }),
    );
    expect(lucia(estado)?.perfil.nome.length).toBeLessThanOrEqual(40);
    expect(estado.acompanhantes[0]?.nome.length).toBeLessThanOrEqual(40);
    expect(estado.acompanhantes[0]?.funcao.length).toBeLessThanOrEqual(30);
  });
});
