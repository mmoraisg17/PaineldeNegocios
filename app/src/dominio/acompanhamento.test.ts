import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ALFABETO_DO_CONVITE,
  CODIGO_DO_CONVITE_TAMANHO,
  TOLERANCIA_DA_META_EM_PONTOS,
  VALIDADE_DO_CONVITE_EM_HORAS,
  adesao,
  alertasDoAluno,
  autorizar,
  consultarConvite,
  criarVinculoPendente,
  gerarConvite,
  permissoes,
  permissoesDoVinculo,
  podeVer,
  resgatarConvite,
  revogar,
  solicitarVinculo,
  type Convite,
  type Vinculo,
} from './acompanhamento';
import { congelarProfundo } from './imutavel';
import type { ResultadoExercicio, Sessao } from './sessao';

const AGORA = new Date('2026-10-07T12:00:00.000Z');
const HORA_EM_MS = 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

/* Gera "aleatórios" que escolhem o caractere de índice i do alfabeto
   (meio do intervalo, para não depender de arredondamento de ponto flutuante). */
function sorteioQueEscolhe(indices: number[]): () => number {
  let proximo = 0;
  return () => {
    const indice = indices[proximo % indices.length] ?? 0;
    proximo += 1;
    return (indice + 0.5) / ALFABETO_DO_CONVITE.length;
  };
}

function convite(sobrescrever: Partial<Convite> = {}): Convite {
  return congelarProfundo({
    codigo: 'K7M2QX',
    tipo: 'profissional',
    criadoEm: '2026-10-07T00:00:00.000Z',
    expiraEm: '2026-10-09T00:00:00.000Z',
    ...sobrescrever,
  } satisfies Convite);
}

function vinculo(sobrescrever: Partial<Vinculo> = {}): Vinculo {
  return congelarProfundo({
    id: 'lucia:carlos',
    alunoId: 'lucia',
    acompanhanteId: 'carlos',
    tipo: 'profissional',
    status: 'pendente',
    criadoEm: '2026-10-07T00:00:00.000Z',
    ...sobrescrever,
  } satisfies Vinculo);
}

describe('permissoes', () => {
  test('o profissional vê relatórios, ajusta a rotina e envia recados', () => {
    expect(permissoes('profissional')).toEqual({ verRelatorios: true, ajustarRotina: true, enviarRecados: true });
  });

  test('o familiar só lê', () => {
    expect(permissoes('familiar')).toEqual({ verRelatorios: true, ajustarRotina: false, enviarRecados: false });
  });
});

describe('alfabeto do convite', () => {
  test('não tem caracteres ambíguos (0, O, 1, I, L)', () => {
    for (const ambiguo of ['0', 'O', '1', 'I', 'L']) {
      expect(ALFABETO_DO_CONVITE).not.toContain(ambiguo);
    }
  });

  test('não repete caracteres e só tem maiúsculas e dígitos', () => {
    expect(new Set(ALFABETO_DO_CONVITE).size).toBe(ALFABETO_DO_CONVITE.length);
    expect(ALFABETO_DO_CONVITE).toMatch(/^[A-Z2-9]+$/);
  });
});

describe('gerarConvite', () => {
  test('monta o código escolhendo os caracteres do alfabeto pelo sorteio', () => {
    const resultado = gerarConvite('profissional', AGORA, [], sorteioQueEscolhe([0, 1, 2, 3, 4, 5]));

    expect(resultado.codigo).toBe(ALFABETO_DO_CONVITE.slice(0, CODIGO_DO_CONVITE_TAMANHO));
    expect(resultado.codigo).toHaveLength(6);
  });

  test('guarda o tipo e as datas, com validade de 48 horas', () => {
    const resultado = gerarConvite('familiar', AGORA, [], sorteioQueEscolhe([3]));

    expect(VALIDADE_DO_CONVITE_EM_HORAS).toBe(48);
    expect(resultado.tipo).toBe('familiar');
    expect(resultado.criadoEm).toBe('2026-10-07T12:00:00.000Z');
    expect(Date.parse(resultado.expiraEm) - Date.parse(resultado.criadoEm)).toBe(48 * HORA_EM_MS);
  });

  test('um sorteio igual a 1 (fora do intervalo) não gera caractere inválido', () => {
    const resultado = gerarConvite('profissional', AGORA, [], () => 1);

    expect(resultado.codigo).toBe('999999');
  });

  test('um sorteio negativo não gera caractere inválido', () => {
    const resultado = gerarConvite('profissional', AGORA, [], () => -0.5);

    expect(resultado.codigo).toBe('AAAAAA');
  });

  test('por padrão sorteia com crypto.getRandomValues, uma vez por caractere, sem usar Math.random', () => {
    const espiaoCripto = vi.spyOn(globalThis.crypto, 'getRandomValues');
    const espiaoMath = vi.spyOn(Math, 'random');

    gerarConvite('profissional', AGORA);

    expect(espiaoCripto).toHaveBeenCalledTimes(CODIGO_DO_CONVITE_TAMANHO);
    expect(espiaoMath).not.toHaveBeenCalled();
  });

  test('não repete o código de um convite ainda ativo: sorteia de novo', () => {
    const ativo = convite({ codigo: 'ABCDEF' });
    // 1º código sorteado: ABCDEF (colide); 2º: GHJKMN.
    const sorteio = sorteioQueEscolhe([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

    const novo = gerarConvite('profissional', AGORA, [ativo], sorteio);

    expect(novo.codigo).toBe('GHJKMN');
  });

  test('pode reaproveitar o código de um convite já expirado', () => {
    const expirado = convite({ codigo: 'ABCDEF', expiraEm: '2026-10-07T11:00:00.000Z' });

    const novo = gerarConvite('profissional', AGORA, [expirado], sorteioQueEscolhe([0, 1, 2, 3, 4, 5]));

    expect(novo.codigo).toBe('ABCDEF');
  });

  test('desiste com erro claro se todo sorteio colide com um convite ativo', () => {
    const ativo = convite({ codigo: 'AAAAAA' });

    expect(() => gerarConvite('profissional', AGORA, [ativo], () => 0)).toThrow(/código de convite/);
  });

  test('200 convites com sorteio real sempre têm 6 caracteres válidos', () => {
    for (let tentativa = 0; tentativa < 200; tentativa += 1) {
      const { codigo } = gerarConvite('profissional', AGORA);

      expect(codigo).toMatch(/^[A-HJ-KM-NP-Z2-9]{6}$/);
    }
  });

  test('não altera a data recebida', () => {
    const copia = AGORA.getTime();

    gerarConvite('profissional', AGORA, [], sorteioQueEscolhe([1]));

    expect(AGORA.getTime()).toBe(copia);
  });
});

describe('resgatarConvite', () => {
  const lista = congelarProfundo([convite(), convite({ codigo: 'AB23CD', tipo: 'familiar' })]);

  test('encontra o convite pelo código e o consome: ele sai da lista restante', () => {
    const resultado = resgatarConvite('K7M2QX', lista, AGORA);

    expect(resultado).toEqual({ ok: true, convite: lista[0], convitesRestantes: [lista[1]] });
  });

  test('ignora maiúsculas, minúsculas e espaços', () => {
    const resultado = resgatarConvite('  k7m 2qx ', lista, AGORA);

    expect(resultado).toMatchObject({ ok: true, convite: lista[0] });
  });

  test('devolve nao-encontrado para um código que não existe, mantendo a lista', () => {
    expect(resgatarConvite('ZZZZZZ', lista, AGORA)).toEqual({
      ok: false,
      erro: 'nao-encontrado',
      convitesRestantes: [...lista],
    });
  });

  test('devolve nao-encontrado para código vazio ou lista vazia', () => {
    expect(resgatarConvite('', lista, AGORA)).toMatchObject({ ok: false, erro: 'nao-encontrado' });
    expect(resgatarConvite('K7M2QX', [], AGORA)).toEqual({
      ok: false,
      erro: 'nao-encontrado',
      convitesRestantes: [],
    });
  });

  test('devolve expirado depois das 48 horas e já descarta o convite vencido', () => {
    const depois = new Date('2026-10-09T00:00:01.000Z');

    expect(resgatarConvite('K7M2QX', lista, depois)).toEqual({
      ok: false,
      erro: 'expirado',
      convitesRestantes: [],
    });
  });

  test('um milissegundo antes de expirar ainda vale; no instante exato já expirou', () => {
    const antes = new Date('2026-10-08T23:59:59.999Z');
    const exato = new Date('2026-10-09T00:00:00.000Z');

    expect(resgatarConvite('K7M2QX', lista, antes).ok).toBe(true);
    expect(resgatarConvite('K7M2QX', lista, exato)).toMatchObject({ ok: false, erro: 'expirado' });
  });

  test('trata data de expiração inválida como expirado, por segurança', () => {
    const quebrado = [convite({ expiraEm: 'lixo' })];

    expect(resgatarConvite('K7M2QX', quebrado, AGORA)).toEqual({
      ok: false,
      erro: 'expirado',
      convitesRestantes: [],
    });
  });

  test('descarta da lista restante os convites expirados de outros códigos', () => {
    const vencido = convite({ codigo: 'VENCID', expiraEm: '2026-10-07T00:00:00.000Z' });
    const mistura = congelarProfundo([vencido, ...lista]);

    const resultado = resgatarConvite('AB23CD', mistura, AGORA);

    expect(resultado).toEqual({ ok: true, convite: lista[1], convitesRestantes: [lista[0]] });
  });

  test('com código duplicado, prefere o convite válido ao expirado', () => {
    const vencido = convite({ expiraEm: '2026-10-07T00:00:00.000Z', tipo: 'familiar' });
    const valido = convite({ tipo: 'profissional' });
    const duplicados = congelarProfundo([vencido, valido]);

    const resultado = resgatarConvite('K7M2QX', duplicados, AGORA);

    expect(resultado).toEqual({ ok: true, convite: valido, convitesRestantes: [] });
  });

  test('consumir um código duplicado válido remove só um deles', () => {
    const duplicados = congelarProfundo([convite(), convite()]);

    const resultado = resgatarConvite('K7M2QX', duplicados, AGORA);

    expect(resultado.ok && resultado.convitesRestantes).toHaveLength(1);
  });

  test('não altera a lista recebida', () => {
    const original = congelarProfundo([convite()]);

    expect(() => resgatarConvite('K7M2QX', original, AGORA)).not.toThrow();
    expect(original).toHaveLength(1);
  });
});

describe('consultarConvite', () => {
  const lista = congelarProfundo([convite(), convite({ codigo: 'AB23CD', tipo: 'familiar' })]);

  test('encontra o convite pelo código sem consumi-lo', () => {
    const resultado = consultarConvite('K7M2QX', lista, AGORA);

    expect(resultado).toEqual({ ok: true, convite: lista[0] });
    expect(lista).toHaveLength(2);
  });

  test('consultar duas vezes dá o mesmo resultado (o código continua valendo)', () => {
    expect(consultarConvite('K7M2QX', lista, AGORA)).toEqual(consultarConvite('K7M2QX', lista, AGORA));
  });

  test('ignora maiúsculas, minúsculas e espaços, como o resgate', () => {
    expect(consultarConvite('  k7m 2qx ', lista, AGORA)).toEqual({ ok: true, convite: lista[0] });
  });

  test('devolve nao-encontrado para código que não existe, vazio ou lista vazia', () => {
    expect(consultarConvite('ZZZZZZ', lista, AGORA)).toEqual({ ok: false, erro: 'nao-encontrado' });
    expect(consultarConvite('', lista, AGORA)).toEqual({ ok: false, erro: 'nao-encontrado' });
    expect(consultarConvite('   ', lista, AGORA)).toEqual({ ok: false, erro: 'nao-encontrado' });
    expect(consultarConvite('K7M2QX', [], AGORA)).toEqual({ ok: false, erro: 'nao-encontrado' });
  });

  test('devolve expirado depois das 48 horas', () => {
    const depois = new Date('2026-10-09T00:00:01.000Z');

    expect(consultarConvite('K7M2QX', lista, depois)).toEqual({ ok: false, erro: 'expirado' });
  });

  test('um milissegundo antes de expirar ainda vale; no instante exato já expirou', () => {
    const antes = new Date('2026-10-08T23:59:59.999Z');
    const exato = new Date('2026-10-09T00:00:00.000Z');

    expect(consultarConvite('K7M2QX', lista, antes).ok).toBe(true);
    expect(consultarConvite('K7M2QX', lista, exato)).toEqual({ ok: false, erro: 'expirado' });
  });

  test('trata data de expiração inválida como expirado, por segurança', () => {
    expect(consultarConvite('K7M2QX', [convite({ expiraEm: 'lixo' })], AGORA)).toEqual({ ok: false, erro: 'expirado' });
  });

  test('com código duplicado, prefere o convite válido ao expirado', () => {
    const vencido = convite({ expiraEm: '2026-10-07T00:00:00.000Z', tipo: 'familiar' });
    const valido = convite({ tipo: 'profissional' });

    expect(consultarConvite('K7M2QX', [vencido, valido], AGORA)).toEqual({ ok: true, convite: valido });
  });

  test('concorda com resgatarConvite em todos os casos', () => {
    const depois = new Date('2026-10-09T00:00:01.000Z');
    const casos: [string, Date][] = [['K7M2QX', AGORA], ['k7m2qx', AGORA], ['ZZZZZZ', AGORA], ['', AGORA], ['K7M2QX', depois]];

    for (const [codigo, quando] of casos) {
      const consulta = consultarConvite(codigo, lista, quando);
      const resgate = resgatarConvite(codigo, lista, quando);
      const resumo = (r: typeof consulta | typeof resgate) => (r.ok ? { ok: true, convite: r.convite } : { ok: false, erro: r.erro });
      expect(resumo(consulta)).toEqual(resumo(resgate));
    }
  });
});

describe('vínculo: criar, autorizar e revogar', () => {
  test('o resgate de um convite cria um vínculo pendente com o tipo informado e o id injetado', () => {
    const criado = criarVinculoPendente('familiar', 'lucia', 'marta', AGORA, () => 'id-1');

    expect(criado).toEqual({
      id: 'id-1',
      alunoId: 'lucia',
      acompanhanteId: 'marta',
      tipo: 'familiar',
      status: 'pendente',
      criadoEm: '2026-10-07T12:00:00.000Z',
    });
  });

  test('por padrão o id do vínculo é único e não deriva de aluno e acompanhante', () => {
    const a = criarVinculoPendente('familiar', 'lucia', 'marta', AGORA);
    const b = criarVinculoPendente('familiar', 'lucia', 'marta', AGORA);

    expect(a.id).not.toBe(b.id);
    expect(a.id).not.toBe('lucia:marta');
    expect(a.id.length).toBeGreaterThan(0);
  });

  describe('solicitarVinculo', () => {
    const geradorDeIds = (): (() => string) => {
      let contador = 0;
      return () => `id-${(contador += 1)}`;
    };

    test('acrescenta o vínculo pendente à lista, sem alterar a original', () => {
      const original = congelarProfundo<Vinculo[]>([]);

      const { vinculos, vinculo: criado } = solicitarVinculo(original, 'profissional', 'lucia', 'carlos', AGORA, geradorDeIds());

      expect(vinculos).toEqual([criado]);
      expect(criado).toMatchObject({ id: 'id-1', status: 'pendente', alunoId: 'lucia', acompanhanteId: 'carlos' });
      expect(original).toEqual([]);
    });

    test('reconvidar depois de revogar cria um vínculo novo, sem sobrescrever o revogado', () => {
      const revogado = vinculo({ id: 'antigo', status: 'revogado', revogadoEm: '2026-10-06T00:00:00.000Z' });

      const { vinculos, vinculo: novo } = solicitarVinculo([revogado], 'profissional', 'lucia', 'carlos', AGORA, geradorDeIds());

      expect(vinculos).toHaveLength(2);
      expect(vinculos[0]).toEqual(revogado);
      expect(novo.id).not.toBe('antigo');
      expect(novo.status).toBe('pendente');
    });

    test('se já existe pedido pendente ou autorizado para o mesmo par, devolve o existente sem duplicar', () => {
      const autorizado = vinculo({ id: 'ativo', status: 'autorizado' });

      const resultado = solicitarVinculo([autorizado], 'profissional', 'lucia', 'carlos', AGORA, geradorDeIds());

      expect(resultado.vinculo).toBe(autorizado);
      expect(resultado.vinculos).toEqual([autorizado]);
    });

    test('pares diferentes não se confundem', () => {
      const deOutroAluno = vinculo({ id: 'outro', alunoId: 'rafael', status: 'autorizado' });

      const { vinculos } = solicitarVinculo([deOutroAluno], 'profissional', 'lucia', 'carlos', AGORA, geradorDeIds());

      expect(vinculos).toHaveLength(2);
    });

    test('nunca reaproveita um id que já está na lista', () => {
      const existente = vinculo({ id: 'id-1', alunoId: 'rafael', acompanhanteId: 'ana' });

      const { vinculo: novo } = solicitarVinculo([existente], 'profissional', 'lucia', 'carlos', AGORA, geradorDeIds());

      expect(novo.id).toBe('id-2');
    });
  });

  describe('permissoesDoVinculo', () => {
    const nada = { verRelatorios: false, ajustarRotina: false, enviarRecados: false };

    test('vínculo autorizado de profissional tem todas as permissões', () => {
      const permitidas = permissoesDoVinculo(vinculo({ status: 'autorizado', tipo: 'profissional' }));

      expect(permitidas).toEqual({ verRelatorios: true, ajustarRotina: true, enviarRecados: true });
    });

    test('vínculo autorizado de familiar só lê', () => {
      const permitidas = permissoesDoVinculo(vinculo({ status: 'autorizado', tipo: 'familiar' }));

      expect(permitidas).toEqual({ verRelatorios: true, ajustarRotina: false, enviarRecados: false });
    });

    test('vínculo pendente não tem nenhuma permissão', () => {
      expect(permissoesDoVinculo(vinculo({ status: 'pendente' }))).toEqual(nada);
    });

    test('vínculo revogado não tem nenhuma permissão', () => {
      expect(permissoesDoVinculo(vinculo({ status: 'revogado' }))).toEqual(nada);
    });
  });

  test('autorizar muda um pedido pendente para autorizado e registra a data', () => {
    const original = vinculo();

    const autorizado = autorizar(original, AGORA);

    expect(autorizado).toMatchObject({ status: 'autorizado', autorizadoEm: '2026-10-07T12:00:00.000Z' });
    expect(original.status).toBe('pendente');
    expect(autorizado).not.toBe(original);
  });

  test('autorizar não ressuscita um vínculo revogado', () => {
    const revogado = vinculo({ status: 'revogado', revogadoEm: '2026-10-06T00:00:00.000Z' });

    expect(autorizar(revogado, AGORA)).toEqual(revogado);
  });

  test('autorizar um vínculo já autorizado não muda a data original', () => {
    const autorizado = vinculo({ status: 'autorizado', autorizadoEm: '2026-10-06T00:00:00.000Z' });

    expect(autorizar(autorizado, AGORA)).toEqual(autorizado);
  });

  test('revogar corta o acesso de um vínculo autorizado e registra a data', () => {
    const original = vinculo({ status: 'autorizado', autorizadoEm: '2026-10-06T00:00:00.000Z' });

    const revogado = revogar(original, AGORA);

    expect(revogado).toMatchObject({
      status: 'revogado',
      autorizadoEm: '2026-10-06T00:00:00.000Z',
      revogadoEm: '2026-10-07T12:00:00.000Z',
    });
    expect(original.status).toBe('autorizado');
  });

  test('revogar também recusa um pedido ainda pendente', () => {
    expect(revogar(vinculo(), AGORA).status).toBe('revogado');
  });

  test('revogar duas vezes mantém a data da primeira revogação', () => {
    const revogado = vinculo({ status: 'revogado', revogadoEm: '2026-10-06T00:00:00.000Z' });

    expect(revogar(revogado, AGORA)).toEqual(revogado);
  });

  test('só um vínculo autorizado pode ver os dados', () => {
    expect(podeVer(vinculo({ status: 'autorizado' }))).toBe(true);
    expect(podeVer(vinculo({ status: 'pendente' }))).toBe(false);
    expect(podeVer(vinculo({ status: 'revogado' }))).toBe(false);
  });
});

function resultado(sobrescrever: Partial<ResultadoExercicio> = {}): ResultadoExercicio {
  return {
    id: 'miniagachamento-simetrico',
    nivel: 1,
    nota: 70,
    simetria: 80,
    estabilidade: 80,
    apoioNasBarras: 0.1,
    ...sobrescrever,
  };
}

function sessao(dia: number, exercicios: ResultadoExercicio[] = [resultado()]): Sessao {
  const data = `2026-10-${String(dia).padStart(2, '0')}T10:00:00.000Z`;
  return { data, exercicios, percepcao: 'ok' };
}

const SEM_FALTAS = { planejadas: 3, feitas: 3 };

describe('alertasDoAluno: apoio nas barras', () => {
  test('alerta quando o apoio médio passa de 0,3 nas 2 últimas sessões', () => {
    const sessoes = [sessao(1), sessao(2, [resultado({ apoioNasBarras: 0.35 })]), sessao(3, [resultado({ apoioNasBarras: 0.4 })])];

    const alertas = alertasDoAluno(sessoes, SEM_FALTAS);

    expect(alertas).toEqual([
      { tipo: 'apoio-alto', mensagem: 'Apoiou muito nas barras nos últimos 2 treinos' },
    ]);
  });

  test('não alerta se só a última sessão teve apoio alto', () => {
    const sessoes = [sessao(1), sessao(2, [resultado({ apoioNasBarras: 0.5 })])];

    expect(alertasDoAluno(sessoes, SEM_FALTAS)).toEqual([]);
  });

  test('apoio exatamente 0,3 não dispara o alerta', () => {
    const sessoes = [sessao(1, [resultado({ apoioNasBarras: 0.3 })]), sessao(2, [resultado({ apoioNasBarras: 0.3 })])];

    expect(alertasDoAluno(sessoes, SEM_FALTAS)).toEqual([]);
  });

  test('com menos de 2 sessões não há como alertar', () => {
    expect(alertasDoAluno([sessao(1, [resultado({ apoioNasBarras: 0.9 })])], SEM_FALTAS)).toEqual([]);
    expect(alertasDoAluno([], SEM_FALTAS)).toEqual([]);
  });

  test('usa a média dos exercícios da sessão e ordena o histórico antes de olhar', () => {
    const alto = resultado({ apoioNasBarras: 0.5 });
    const baixo = resultado({ apoioNasBarras: 0.2 });
    // médias: 0,35 e 0,35 nas 2 últimas; a mais antiga (dia 1) é ignorada.
    const sessoes = [sessao(3, [alto, baixo]), sessao(1), sessao(2, [alto, baixo])];

    expect(alertasDoAluno(sessoes, SEM_FALTAS).map((alerta) => alerta.tipo)).toEqual(['apoio-alto']);
  });
});

describe('alertasDoAluno: simetria fora da meta', () => {
  const metas = { 'miniagachamento-simetrico': { simetriaEsquerda: 50 } } as const;

  test('a tolerância da meta é de 5 pontos percentuais', () => {
    expect(TOLERANCIA_DA_META_EM_PONTOS).toBe(5);
  });

  test('alerta quando a carga na perna esquerda fica mais de 5 pontos abaixo da meta', () => {
    const sessoes = [sessao(1), sessao(2, [resultado({ cargaEsquerda: 44 })])];

    const alertas = alertasDoAluno(sessoes, SEM_FALTAS, metas);

    expect(alertas).toEqual([
      {
        tipo: 'simetria-fora-da-meta',
        mensagem: 'Simetria fora da meta: Miniagachamento com descarga simétrica',
        exercicioId: 'miniagachamento-simetrico',
      },
    ]);
  });

  test('alerta também quando a carga fica mais de 5 pontos ACIMA da meta (desvio nos dois sentidos)', () => {
    const sessoes = [sessao(1, [resultado({ cargaEsquerda: 56 })])];

    expect(alertasDoAluno(sessoes, SEM_FALTAS, metas).map((alerta) => alerta.tipo)).toEqual(['simetria-fora-da-meta']);
  });

  test('não alerta dentro da tolerância, nem exatamente 5 pontos de diferença', () => {
    const naMeta = [sessao(1, [resultado({ cargaEsquerda: 50 })])];
    const quaseFora = [sessao(1, [resultado({ cargaEsquerda: 46 })])];
    const noLimiteAbaixo = [sessao(1, [resultado({ cargaEsquerda: 45 })])];
    const noLimiteAcima = [sessao(1, [resultado({ cargaEsquerda: 55 })])];

    for (const sessoes of [naMeta, quaseFora, noLimiteAbaixo, noLimiteAcima]) {
      expect(alertasDoAluno(sessoes, SEM_FALTAS, metas)).toEqual([]);
    }
  });

  test('só olha a sessão mais recente em que o exercício aconteceu', () => {
    const sessoes = [
      sessao(1, [resultado({ cargaEsquerda: 40 })]),
      sessao(2, [resultado({ cargaEsquerda: 52 })]),
      sessao(3, [resultado({ id: 'descida-de-degrau' })]),
    ];

    expect(alertasDoAluno(sessoes, SEM_FALTAS, metas)).toEqual([]);
  });

  test('sem meta definida, ou sem medida de carga, não há alerta', () => {
    const sessoes = [sessao(1, [resultado({ cargaEsquerda: 10 })])];
    const semMedida = [sessao(1, [resultado()])];

    expect(alertasDoAluno(sessoes, SEM_FALTAS)).toEqual([]);
    expect(alertasDoAluno(sessoes, SEM_FALTAS, {})).toEqual([]);
    expect(alertasDoAluno(semMedida, SEM_FALTAS, metas)).toEqual([]);
  });

  test('ignora meta de exercício que não está no histórico', () => {
    expect(alertasDoAluno([sessao(1)], SEM_FALTAS, { 'pes-em-linha': { simetriaEsquerda: 50 } })).toEqual([]);
  });
});

describe('alertasDoAluno: treinos planejados não realizados', () => {
  test('alerta quando 3 ou mais treinos planejados não foram feitos', () => {
    const alertas = alertasDoAluno([], { planejadas: 3, feitas: 0 });

    expect(alertas).toEqual([
      { tipo: 'treinos-nao-realizados', mensagem: '3 treinos planejados não realizados' },
    ]);
  });

  test('informa a quantidade real de treinos que faltaram', () => {
    const alertas = alertasDoAluno([], { planejadas: 5, feitas: 1 });

    expect(alertas[0]?.mensagem).toBe('4 treinos planejados não realizados');
  });

  test('2 treinos não realizados ainda não é alerta', () => {
    expect(alertasDoAluno([], { planejadas: 3, feitas: 1 })).toEqual([]);
  });

  test('feitos acima do planejado nunca gera alerta', () => {
    expect(alertasDoAluno([], { planejadas: 3, feitas: 5 })).toEqual([]);
  });
});

describe('alertasDoAluno: vários alertas e imutabilidade', () => {
  test('lista os alertas na ordem: apoio, simetria, treinos não realizados', () => {
    const sessoes = [
      sessao(1, [resultado({ apoioNasBarras: 0.6, cargaEsquerda: 40 })]),
      sessao(2, [resultado({ apoioNasBarras: 0.6, cargaEsquerda: 40 })]),
    ];
    const metas = { 'miniagachamento-simetrico': { simetriaEsquerda: 50 } };

    const tipos = alertasDoAluno(sessoes, { planejadas: 3, feitas: 0 }, metas).map((alerta) => alerta.tipo);

    expect(tipos).toEqual(['apoio-alto', 'simetria-fora-da-meta', 'treinos-nao-realizados']);
  });

  test('não altera as sessões recebidas', () => {
    const sessoes = congelarProfundo([sessao(2), sessao(1)]);

    expect(() => alertasDoAluno(sessoes, SEM_FALTAS)).not.toThrow();
    expect(sessoes[0]?.data).toBe('2026-10-02T10:00:00.000Z');
  });
});

describe('adesao', () => {
  test.each([
    [3, 3, 1],
    [2, 4, 0.5],
    [0, 3, 0],
  ])('%i treinos feitos de %i planejados dá adesão %f', (feitos, planejados, esperado) => {
    expect(adesao(feitos, planejados)).toBe(esperado);
  });

  test('sem treinos planejados a adesão é 0, sem dividir por zero', () => {
    expect(adesao(2, 0)).toBe(0);
  });

  test('feitos acima do planejado fica limitado a 1', () => {
    expect(adesao(5, 3)).toBe(1);
  });

  test('valores negativos ou inválidos não geram adesão negativa nem NaN', () => {
    expect(adesao(-2, 3)).toBe(0);
    expect(adesao(Number.NaN, 3)).toBe(0);
    expect(adesao(2, Number.NaN)).toBe(0);
  });
});
