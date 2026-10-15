import { describe, expect, test } from 'vitest';
import { buscarExercicio, exerciciosDaTrilha } from './catalogo';
import { congelarProfundo } from './imutavel';
import type { Perfil } from './perfil';
import {
  FREQUENCIA_SEMANAL_PADRAO,
  montarRotina,
  segundosDaDose,
  type AjusteProfissional,
} from './rotina';
import type { IdExercicio } from './tipos';

function perfilDe(sobrescrever: Partial<Perfil> = {}): Perfil {
  return congelarProfundo({
    nome: 'Teste',
    objetivo: 'equilibrio',
    firmeza: 'as-vezes',
    ...sobrescrever,
  } satisfies Perfil);
}

const idsDaRotina = (rotina: ReturnType<typeof montarRotina>): IdExercicio[] =>
  rotina.itens.map((item) => item.exercicioId);

describe('segundosDaDose', () => {
  test('repetição vale cerca de 4 segundos', () => {
    expect(segundosDaDose({ tipo: 'repeticoes', repeticoes: 10 })).toBe(40);
  });

  test('tempo vale os próprios segundos', () => {
    expect(segundosDaDose({ tipo: 'tempo', segundos: 20 })).toBe(20);
  });

  test('dose por lado conta em dobro', () => {
    expect(segundosDaDose({ tipo: 'repeticoes', repeticoes: 8, porLado: true })).toBe(64);
    expect(segundosDaDose({ tipo: 'tempo', segundos: 15, porLado: true })).toBe(30);
  });

  test('porLado falso não dobra', () => {
    expect(segundosDaDose({ tipo: 'tempo', segundos: 15, porLado: false })).toBe(15);
  });
});

describe('montarRotina: trilha Equilíbrio 60+', () => {
  test('traz os 2 exercícios da trilha, na ordem do catálogo, quando a pessoa tem tudo', () => {
    const rotina = montarRotina(perfilDe(), {});

    expect(idsDaRotina(rotina)).toEqual(['sentar-e-levantar', 'pes-em-linha']);
  });

  test('fortalecimento também usa a trilha Equilíbrio 60+', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'fortalecimento' }), {});

    expect(rotina.itens).toHaveLength(2);
  });

  test('todos os exercícios da trilha entram na rotina padrão, porque o kit traz todos os itens', () => {
    const rotina = montarRotina(perfilDe(), {});
    const naTrilha = exerciciosDaTrilha('equilibrio60').map((exercicio) => exercicio.id);

    expect(idsDaRotina(rotina)).toEqual(naTrilha);
  });

  test('o sentar e levantar entra sem nenhuma pergunta sobre a casa', () => {
    const rotina = montarRotina(perfilDe(), {});

    expect(idsDaRotina(rotina)).toContain('sentar-e-levantar');
  });
});

describe('montarRotina: trilha Fisioterapia', () => {
  test('objetivo joelho põe primeiro os 2 exercícios do joelho, depois os do tornozelo', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'joelho' }), {});

    expect(idsDaRotina(rotina)).toEqual(['miniagachamento-simetrico', 'descida-de-degrau', 'panturrilha-unilateral']);
  });

  test('objetivo tornozelo põe primeiro o exercício do tornozelo, depois os do joelho', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'tornozelo' }), {});

    expect(idsDaRotina(rotina)).toEqual(['panturrilha-unilateral', 'miniagachamento-simetrico', 'descida-de-degrau']);
  });

  test('todos os exercícios da trilha entram na rotina padrão', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'joelho' }), {});
    const naTrilha = exerciciosDaTrilha('fisio').map((exercicio) => exercicio.id);

    expect(idsDaRotina(rotina).toSorted()).toEqual(naTrilha.toSorted());
  });
});

describe('montarRotina: níveis', () => {
  test('usa o nível 1 quando o exercício não tem nível definido', () => {
    const rotina = montarRotina(perfilDe(), {});

    expect(rotina.itens.every((item) => item.nivel === 1)).toBe(true);
  });

  test('aplica o nível informado e copia dose e apoio do catálogo', () => {
    const rotina = montarRotina(perfilDe(), { 'pes-em-linha': 3 });
    const item = rotina.itens.find((candidato) => candidato.exercicioId === 'pes-em-linha');
    const esperado = buscarExercicio('pes-em-linha')?.niveis[3];

    expect(item).toMatchObject({
      nivel: 3,
      dose: esperado?.dose,
      apoio: esperado?.apoio,
    });
  });
});

describe('montarRotina: tempo estimado', () => {
  test('soma as doses e 1 minuto de transição por exercício, arredondando para cima', () => {
    // sentar e levantar nível 1: 8 repetições x 4 s = 32 s; tandem nível 1: 10 s.
    // (32 + 10 + 2 x 60) s = 162 s = 2,7 min -> 3 min.
    const rotina = montarRotina(perfilDe(), {});

    expect(idsDaRotina(rotina)).toEqual(['sentar-e-levantar', 'pes-em-linha']);
    expect(rotina.minutosEstimados).toBe(3);
  });

  test('conta dose por lado em dobro', () => {
    // descida de degrau nível 1: 6 repetições x 4 s x 2 lados = 48 s, mais 60 s de transição.
    const rotina = montarRotina(perfilDe({ objetivo: 'joelho' }), {}, {
      autor: 'Ana',
      exerciciosRemovidos: ['panturrilha-unilateral', 'miniagachamento-simetrico'],
    });

    expect(idsDaRotina(rotina)).toEqual(['descida-de-degrau']);
    expect(rotina.minutosEstimados).toBe(2);
  });

  test('a panturrilha do nível 1, com os dois pés, não dobra a dose (40 s + 60 s de transição = 2 min)', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'tornozelo' }), {}, {
      autor: 'Ana',
      exerciciosRemovidos: ['miniagachamento-simetrico', 'descida-de-degrau'],
    });

    expect(rotina.itens[0]?.dose).toEqual({ tipo: 'repeticoes', repeticoes: 10 });
    expect(rotina.minutosEstimados).toBe(2);
  });

  test('uma rotina sem exercícios tem 0 minuto', () => {
    const rotina = montarRotina(perfilDe(), {}, {
      autor: 'Carlos',
      exerciciosRemovidos: ['sentar-e-levantar', 'pes-em-linha'],
    });

    expect(rotina.itens).toEqual([]);
    expect(rotina.minutosEstimados).toBe(0);
  });
});

describe('montarRotina: ajustes do profissional', () => {
  const ajusteBase: AjusteProfissional = { autor: 'Carlos' };

  test('sem ajuste, a rotina não tem selo e usa a frequência padrão', () => {
    const rotina = montarRotina(perfilDe(), {});

    expect(rotina.ajustadoPor).toBeUndefined();
    expect(rotina.frequenciaSemanal).toBe(FREQUENCIA_SEMANAL_PADRAO);
    expect(FREQUENCIA_SEMANAL_PADRAO).toBe(3);
  });

  test('o ajuste põe o selo "ajustado por" com o nome do autor', () => {
    const rotina = montarRotina(perfilDe(), {}, ajusteBase);

    expect(rotina.ajustadoPor).toBe('Carlos');
  });

  test('remove os exercícios pedidos', () => {
    const rotina = montarRotina(perfilDe(), {}, { ...ajusteBase, exerciciosRemovidos: ['pes-em-linha'] });

    expect(idsDaRotina(rotina)).not.toContain('pes-em-linha');
    expect(rotina.itens).toHaveLength(1);
  });

  test('inclui, no fim, um exercício de outra trilha', () => {
    const rotina = montarRotina(perfilDe(), {}, { ...ajusteBase, exerciciosIncluidos: ['miniagachamento-simetrico'] });

    expect(idsDaRotina(rotina).at(-1)).toBe('miniagachamento-simetrico');
    expect(rotina.itens).toHaveLength(3);
  });

  test('incluir um exercício que já está na rotina não o duplica', () => {
    const rotina = montarRotina(perfilDe(), {}, { ...ajusteBase, exerciciosIncluidos: ['pes-em-linha'] });

    expect(idsDaRotina(rotina).filter((id) => id === 'pes-em-linha')).toHaveLength(1);
  });

  test('quando o mesmo exercício é incluído e removido, a remoção vence', () => {
    const rotina = montarRotina(perfilDe(), {}, {
      ...ajusteBase,
      exerciciosIncluidos: ['descida-de-degrau'],
      exerciciosRemovidos: ['descida-de-degrau'],
    });

    expect(idsDaRotina(rotina)).not.toContain('descida-de-degrau');
  });

  test('ignora ids desconhecidos vindos de dados antigos', () => {
    const rotina = montarRotina(perfilDe(), {}, {
      ...ajusteBase,
      exerciciosIncluidos: ['nao-existe' as IdExercicio],
    });

    expect(rotina.itens).toHaveLength(2);
  });

  test('o nível fixado prevalece sobre o nível calculado e leva o nome do autor', () => {
    const rotina = montarRotina(perfilDe(), { 'pes-em-linha': 3 }, {
      ...ajusteBase,
      niveisFixados: { 'pes-em-linha': 2 },
    });
    const fixado = rotina.itens.find((item) => item.exercicioId === 'pes-em-linha');
    const livre = rotina.itens.find((item) => item.exercicioId === 'sentar-e-levantar');

    expect(fixado).toMatchObject({ nivel: 2, fixadoPor: 'Carlos' });
    expect(livre?.fixadoPor).toBeUndefined();
  });

  test('anexa a meta de simetria ao item do exercício', () => {
    const rotina = montarRotina(perfilDe({ objetivo: 'joelho' }), {}, {
      autor: 'Ana',
      metas: { 'miniagachamento-simetrico': { simetriaEsquerda: 60 } },
    });
    const item = rotina.itens.find((candidato) => candidato.exercicioId === 'miniagachamento-simetrico');
    const outro = rotina.itens.find((candidato) => candidato.exercicioId === 'descida-de-degrau');

    expect(item?.meta).toEqual({ simetriaEsquerda: 60 });
    expect(outro?.meta).toBeUndefined();
  });

  test('usa a frequência semanal do profissional', () => {
    const rotina = montarRotina(perfilDe(), {}, { ...ajusteBase, frequenciaSemanal: 4 });

    expect(rotina.frequenciaSemanal).toBe(4);
  });
});

describe('montarRotina: imutabilidade', () => {
  test('não altera perfil, níveis nem ajuste (entradas congeladas não lançam erro)', () => {
    const perfil = perfilDe();
    const niveis = congelarProfundo({ 'pes-em-linha': 2 } as const);
    const ajuste = congelarProfundo<AjusteProfissional>({
      autor: 'Carlos',
      exerciciosIncluidos: ['descida-de-degrau'],
      exerciciosRemovidos: ['sentar-e-levantar'],
      niveisFixados: { 'pes-em-linha': 3 },
      metas: { 'descida-de-degrau': { simetriaEsquerda: 55 } },
      frequenciaSemanal: 4,
    });

    expect(() => montarRotina(perfil, niveis, ajuste)).not.toThrow();
  });

  test('duas chamadas iguais devolvem resultados iguais, mas independentes', () => {
    const primeira = montarRotina(perfilDe(), {});
    const segunda = montarRotina(perfilDe(), {});

    expect(primeira).toEqual(segunda);
    expect(primeira.itens).not.toBe(segunda.itens);
  });
});
