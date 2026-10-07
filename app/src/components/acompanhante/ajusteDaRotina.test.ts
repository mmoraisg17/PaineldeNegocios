import { describe, expect, test } from 'vitest';
import { type EstadoApp, criarEstadoDemo } from '../../dominio';
import {
  FREQUENCIA_MAXIMA,
  FREQUENCIA_MINIMA,
  META_MAXIMA,
  META_MINIMA,
  ajusteDoFormulario,
  formularioInicial,
  type FormularioDaRotina,
} from './ajusteDaRotina';

const estado = criarEstadoDemo(new Date('2026-10-07T12:00:00Z'));

function formularioDe(estadoBase: EstadoApp, alunoId: string): FormularioDaRotina {
  const formulario = formularioInicial(estadoBase, alunoId);
  if (!formulario) throw new Error(`sem formulário para ${alunoId}`);
  return formulario;
}

/* Troca um item do formulário sem alterar o original. */
const comItem = (formulario: FormularioDaRotina, id: string, mudanca: Partial<FormularioDaRotina['itens'][number]>): FormularioDaRotina => ({
  ...formulario,
  itens: formulario.itens.map((item) => (item.exercicioId === id ? { ...item, ...mudanca } : item)),
});

describe('formularioInicial', () => {
  test('lista os exercícios da trilha, todos incluídos, com o nível atual da pessoa', () => {
    // Arrange / Act
    const formulario = formularioDe(estado, 'lucia');

    // Assert
    expect(formulario.itens.map((i) => i.exercicioId)).toEqual([
      'sentar-e-levantar',
      'pes-em-linha',
      'abducao-com-elastico',
      'transferencia-de-peso',
    ]);
    expect(formulario.itens.every((i) => i.incluido && !i.fixar)).toBe(true);
    expect(formulario.itens.map((i) => i.nivel)).toEqual(
      formulario.itens.map((i) => estado.praticantes['lucia']?.niveis[i.exercicioId] ?? 1),
    );
    expect(formulario.frequencia).toBe(3);
    expect(formulario.usarMeta).toBe(false);
    expect(formulario.metaEsquerda).toBe(50);
  });

  test('parte do ajuste vigente: nível fixado, meta e frequência da fisioterapeuta', () => {
    // Arrange / Act
    const formulario = formularioDe(estado, 'rafael');

    // Assert
    const miniagachamento = formulario.itens.find((i) => i.exercicioId === 'miniagachamento-simetrico');
    expect(miniagachamento).toMatchObject({ incluido: true, nivel: 2, fixar: true });
    expect(formulario.usarMeta).toBe(true);
    expect(formulario.metaEsquerda).toBe(50);
  });

  test('um exercício que o ajuste removeu começa desmarcado', () => {
    // Arrange
    const lucia = estado.praticantes['lucia']!;
    const comRemocao: EstadoApp = {
      ...estado,
      praticantes: {
        ...estado.praticantes,
        lucia: { ...lucia, ajuste: { autor: 'Carlos', autorId: 'carlos', exerciciosRemovidos: ['pes-em-linha'] } },
      },
    };

    // Act
    const formulario = formularioDe(comRemocao, 'lucia');

    // Assert
    expect(formulario.itens.find((i) => i.exercicioId === 'pes-em-linha')?.incluido).toBe(false);
  });

  test('devolve undefined para um aluno que não existe', () => {
    expect(formularioInicial(estado, 'ninguem')).toBeUndefined();
  });
});

describe('ajusteDoFormulario', () => {
  test('sem mexer em nada, não inclui, não remove, não fixa e não define meta', () => {
    // Arrange
    const lucia = estado.praticantes['lucia']!;

    // Act
    const ajuste = ajusteDoFormulario(formularioDe(estado, 'lucia'), lucia);

    // Assert
    expect(ajuste).toEqual({
      exerciciosIncluidos: [],
      exerciciosRemovidos: [],
      niveisFixados: {},
      metas: {},
      frequenciaSemanal: 3,
    });
  });

  test('desmarcar um exercício da rotina vira remoção', () => {
    // Arrange
    const lucia = estado.praticantes['lucia']!;
    const formulario = comItem(formularioDe(estado, 'lucia'), 'pes-em-linha', { incluido: false });

    // Act
    const ajuste = ajusteDoFormulario(formulario, lucia);

    // Assert
    expect(ajuste.exerciciosRemovidos).toEqual(['pes-em-linha']);
    expect(ajuste.exerciciosIncluidos).toEqual([]);
  });

  test('marcar um exercício que a rotina padrão não tem (falta de acessório) vira inclusão', () => {
    // Arrange: sem elástico em casa, a abdução fica fora da rotina padrão
    const lucia = estado.praticantes['lucia']!;
    const semElastico = { ...lucia, perfil: { ...lucia.perfil, acessoriosEmCasa: [] } };
    const base: EstadoApp = { ...estado, praticantes: { ...estado.praticantes, lucia: semElastico } };
    const inicial = formularioDe(base, 'lucia');
    expect(inicial.itens.find((i) => i.exercicioId === 'abducao-com-elastico')?.incluido).toBe(false);

    // Act
    const ajuste = ajusteDoFormulario(comItem(inicial, 'abducao-com-elastico', { incluido: true }), semElastico);

    // Assert
    expect(ajuste.exerciciosIncluidos).toEqual(['abducao-com-elastico']);
    expect(ajuste.exerciciosRemovidos).toEqual([]);
  });

  test('só fixa o nível dos exercícios incluídos e marcados para fixar', () => {
    // Arrange
    const lucia = estado.praticantes['lucia']!;
    let formulario = comItem(formularioDe(estado, 'lucia'), 'sentar-e-levantar', { nivel: 3, fixar: true });
    formulario = comItem(formulario, 'pes-em-linha', { nivel: 2, fixar: true, incluido: false });
    formulario = comItem(formulario, 'transferencia-de-peso', { nivel: 2, fixar: false });

    // Act
    const ajuste = ajusteDoFormulario(formulario, lucia);

    // Assert
    expect(ajuste.niveisFixados).toEqual({ 'sentar-e-levantar': 3 });
  });

  test('a meta de simetria só vale com o miniagachamento na rotina e a meta ligada', () => {
    // Arrange
    const rafael = estado.praticantes['rafael']!;
    const formulario = { ...formularioDe(estado, 'rafael'), metaEsquerda: 55 };

    // Act / Assert
    expect(ajusteDoFormulario(formulario, rafael).metas).toEqual({ 'miniagachamento-simetrico': { simetriaEsquerda: 55 } });
    expect(ajusteDoFormulario({ ...formulario, usarMeta: false }, rafael).metas).toEqual({});
    expect(ajusteDoFormulario(comItem(formulario, 'miniagachamento-simetrico', { incluido: false }), rafael).metas).toEqual({});
  });

  test('meta e frequência fora dos limites são trazidas para dentro deles', () => {
    // Arrange
    const rafael = estado.praticantes['rafael']!;
    const base = formularioDe(estado, 'rafael');

    // Act
    const baixo = ajusteDoFormulario({ ...base, metaEsquerda: 10, frequencia: 0 }, rafael);
    const alto = ajusteDoFormulario({ ...base, metaEsquerda: 90, frequencia: 9 }, rafael);

    // Assert
    expect(baixo.metas?.['miniagachamento-simetrico']?.simetriaEsquerda).toBe(META_MINIMA);
    expect(baixo.frequenciaSemanal).toBe(FREQUENCIA_MINIMA);
    expect(alto.metas?.['miniagachamento-simetrico']?.simetriaEsquerda).toBe(META_MAXIMA);
    expect(alto.frequenciaSemanal).toBe(FREQUENCIA_MAXIMA);
  });

  test('não altera o formulário recebido', () => {
    // Arrange
    const lucia = estado.praticantes['lucia']!;
    const formulario = comItem(formularioDe(estado, 'lucia'), 'pes-em-linha', { incluido: false });
    const copia = structuredClone(formulario);

    // Act
    ajusteDoFormulario(formulario, lucia);

    // Assert
    expect(formulario).toEqual(copia);
  });
});
