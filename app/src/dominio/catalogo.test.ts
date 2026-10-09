import { describe, expect, test } from 'vitest';
import {
  CATALOGO,
  buscarExercicio,
  exerciciosDaTrilha,
} from './catalogo';
import { IDS_DOS_EXERCICIOS, type Apoio, type Dose, type IdExercicio, type Inclinacao, type Nivel } from './tipos';

const NIVEIS: Nivel[] = [1, 2, 3];
const TAMANHO_MAXIMO_DA_MENSAGEM = 60;

type EsperadoDoNivel = { dose: Dose; apoio: Apoio; inclinacao: Inclinacao };

const rep = (repeticoes: number, porLado = false): Dose =>
  porLado ? { tipo: 'repeticoes', repeticoes, porLado } : { tipo: 'repeticoes', repeticoes };
const seg = (segundos: number, porLado = false): Dose =>
  porLado ? { tipo: 'tempo', segundos, porLado } : { tipo: 'tempo', segundos };

/* Tabela transcrita do manual, seção 7. Onde o manual cala (dose do sentar e
   levantar e da transferência de peso, apoio de alguns níveis), o catálogo
   escolheu um valor coerente com a regra geral "subir de nível = mais
   repetição, menos apoio, mais inclinação". */
const ESPERADO: Record<IdExercicio, Record<Nivel, EsperadoDoNivel>> = {
  'sentar-e-levantar': {
    1: { dose: rep(8), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: rep(10), apoio: 'uma-mao', inclinacao: 0 },
    3: { dose: rep(12), apoio: 'sem-maos', inclinacao: 0 },
  },
  'pes-em-linha': {
    1: { dose: seg(10), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: seg(20), apoio: 'uma-mao', inclinacao: 0 },
    3: { dose: seg(30), apoio: 'toque', inclinacao: 0 },
  },
  'abducao-com-elastico': {
    1: { dose: rep(8, true), apoio: 'uma-mao', inclinacao: 0 },
    2: { dose: rep(12, true), apoio: 'uma-mao', inclinacao: 0 },
    3: { dose: rep(12, true), apoio: 'uma-mao', inclinacao: 0 },
  },
  'transferencia-de-peso': {
    1: { dose: rep(8), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: rep(10), apoio: 'uma-mao', inclinacao: 1 },
    3: { dose: rep(12), apoio: 'uma-mao', inclinacao: 2 },
  },
  'miniagachamento-simetrico': {
    1: { dose: rep(8), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: rep(12), apoio: 'duas-maos', inclinacao: 0 },
    3: { dose: rep(12), apoio: 'uma-mao', inclinacao: 0 },
  },
  'descida-de-degrau': {
    1: { dose: rep(6, true), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: rep(10, true), apoio: 'uma-mao', inclinacao: 0 },
    3: { dose: rep(10, true), apoio: 'uma-mao', inclinacao: 0 },
  },
  'panturrilha-unilateral': {
    1: { dose: rep(10), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: rep(8, true), apoio: 'duas-maos', inclinacao: 0 },
    3: { dose: rep(12, true), apoio: 'uma-mao', inclinacao: 0 },
  },
  'equilibrio-com-inclinacao': {
    1: { dose: seg(15), apoio: 'duas-maos', inclinacao: 0 },
    2: { dose: seg(20), apoio: 'uma-mao', inclinacao: 1 },
    3: { dose: seg(30), apoio: 'toque', inclinacao: 2 },
  },
};

describe('catálogo: composição', () => {
  test('tem exatamente os 8 exercícios do manual, na ordem do manual', () => {
    expect(CATALOGO.map((exercicio) => exercicio.id)).toEqual([...IDS_DOS_EXERCICIOS]);
  });

  test('não repete ids', () => {
    expect(new Set(CATALOGO.map((exercicio) => exercicio.id)).size).toBe(CATALOGO.length);
  });

  test('cada trilha tem 4 exercícios', () => {
    expect(exerciciosDaTrilha('equilibrio60')).toHaveLength(4);
    expect(exerciciosDaTrilha('fisio')).toHaveLength(4);
  });

  test('a trilha Equilíbrio 60+ traz sentar, tandem, abdução e transferência', () => {
    const ids = exerciciosDaTrilha('equilibrio60').map((exercicio) => exercicio.id);
    expect(ids).toEqual([
      'sentar-e-levantar',
      'pes-em-linha',
      'abducao-com-elastico',
      'transferencia-de-peso',
    ]);
  });

  test('só a trilha de fisioterapia tem região, com 2 exercícios por região', () => {
    const fisio = exerciciosDaTrilha('fisio');
    const equilibrio = exerciciosDaTrilha('equilibrio60');
    expect(equilibrio.every((exercicio) => exercicio.regiao === undefined)).toBe(true);
    expect(fisio.filter((exercicio) => exercicio.regiao === 'joelho')).toHaveLength(2);
    expect(fisio.filter((exercicio) => exercicio.regiao === 'tornozelo')).toHaveLength(2);
  });
});

describe('catálogo: conteúdo de cada exercício', () => {
  test.each(CATALOGO.map((exercicio) => [exercicio.id, exercicio] as const))(
    '%s tem textos e 3 níveis completos',
    (_id, exercicio) => {
      expect(exercicio.nome.length).toBeGreaterThan(0);
      expect(exercicio.paraQue.length).toBeGreaterThan(0);
      expect(exercicio.oQueOAppCorrige.length).toBeGreaterThan(0);
      expect(exercicio.comoFazer.length).toBeGreaterThanOrEqual(2);
      expect(exercicio.comoFazer.every((passo) => passo.trim().length > 0)).toBe(true);
      expect(Object.keys(exercicio.niveis).map(Number)).toEqual(NIVEIS);
    },
  );

  test.each(CATALOGO.map((exercicio) => [exercicio.id, exercicio] as const))(
    '%s tem de 2 a 4 correções curtas, com ids únicos e gravidade válida',
    (_id, exercicio) => {
      const { correcoes } = exercicio;
      expect(correcoes.length).toBeGreaterThanOrEqual(2);
      expect(correcoes.length).toBeLessThanOrEqual(4);
      expect(new Set(correcoes.map((correcao) => correcao.id)).size).toBe(correcoes.length);
      for (const correcao of correcoes) {
        expect(['atencao', 'pare']).toContain(correcao.gravidade);
        expect(correcao.mensagem.length).toBeGreaterThan(0);
        expect(correcao.mensagem.length).toBeLessThanOrEqual(TAMANHO_MAXIMO_DA_MENSAGEM);
      }
    },
  );

  test.each(CATALOGO.map((exercicio) => [exercicio.id, exercicio] as const))(
    '%s não usa linguagem de diagnóstico nas correções',
    (_id, exercicio) => {
      const texto = exercicio.correcoes.map((correcao) => correcao.mensagem).join(' ').toLowerCase();
      expect(texto).not.toMatch(/diagn|les[aã]o|patolog|tratamento/);
    },
  );

  test('a inclinação pedida nunca diminui ao subir de nível', () => {
    for (const exercicio of CATALOGO) {
      expect(exercicio.niveis[2].inclinacao).toBeGreaterThanOrEqual(exercicio.niveis[1].inclinacao);
      expect(exercicio.niveis[3].inclinacao).toBeGreaterThanOrEqual(exercicio.niveis[2].inclinacao);
    }
  });

  test('o nível 1 é sempre plano, para qualquer plataforma conseguir executá-lo', () => {
    for (const exercicio of CATALOGO) {
      expect(exercicio.niveis[1].inclinacao).toBe(0);
    }
  });

  test('dose, apoio e inclinação de cada nível seguem o manual', () => {
    for (const exercicio of CATALOGO) {
      for (const nivel of NIVEIS) {
        const { dose, apoio, inclinacao } = exercicio.niveis[nivel];
        expect({ dose, apoio, inclinacao }).toEqual(ESPERADO[exercicio.id][nivel]);
      }
    }
  });

  test('cada nível tem uma descrição curta', () => {
    for (const exercicio of CATALOGO) {
      for (const nivel of NIVEIS) {
        expect(exercicio.niveis[nivel].descricao.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('catálogo: imutabilidade', () => {
  test('rejeita mutação do catálogo compartilhado por todas as telas', () => {
    const primeiro = CATALOGO[0];

    expect(Object.isFrozen(CATALOGO)).toBe(true);
    expect(Object.isFrozen(primeiro)).toBe(true);
    expect(Object.isFrozen(primeiro?.niveis[1])).toBe(true);
    expect(Object.isFrozen(primeiro?.correcoes[0])).toBe(true);
  });
});

describe('catálogo: acessórios', () => {
  test('a abdução exige elástico e o sentar e levantar exige cadeira', () => {
    expect(buscarExercicio('abducao-com-elastico')?.acessorios).toContain('elastico');
    expect(buscarExercicio('sentar-e-levantar')?.acessorios).toContain('cadeira');
  });
});

describe('buscarExercicio', () => {
  test('devolve o exercício do id pedido', () => {
    expect(buscarExercicio('pes-em-linha')?.nome).toBe('Pés em linha (tandem)');
  });

  test('devolve undefined para um id que não existe', () => {
    expect(buscarExercicio('inexistente')).toBeUndefined();
  });

  test('devolve undefined para texto vazio', () => {
    expect(buscarExercicio('')).toBeUndefined();
  });

  test('não confunde com propriedades herdadas de objetos', () => {
    expect(buscarExercicio('constructor')).toBeUndefined();
    expect(buscarExercicio('__proto__')).toBeUndefined();
  });
});
