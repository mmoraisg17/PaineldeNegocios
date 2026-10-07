import { describe, expect, test } from 'vitest';
import * as dominio from './index';

describe('API pública do domínio', () => {
  test('expõe as funções que as telas usam', () => {
    const esperadas = [
      'buscarExercicio',
      'exerciciosDaTrilha',
      'nivelInicial',
      'trilhaDoObjetivo',
      'montarRotina',
      'nivelMaximoCompativel',
      'permissoesDoVinculo',
      'solicitarVinculo',
      'ajusteVigente',
      'rotinaDoPraticante',
      'notaDeExecucao',
      'decidirNivel',
      'permissoes',
      'gerarConvite',
      'resgatarConvite',
      'autorizar',
      'revogar',
      'podeVer',
      'alertasDoAluno',
      'adesao',
      'semanaDeTreino',
      'carregarEstado',
      'salvarEstado',
      'apagarDados',
      'criarEstadoDemo',
    ];

    for (const nome of esperadas) {
      expect(typeof dominio[nome as keyof typeof dominio], nome).toBe('function');
    }
  });

  test('expõe o catálogo e a lista de ids com os mesmos 8 exercícios', () => {
    expect(dominio.CATALOGO.map((exercicio) => exercicio.id)).toEqual([...dominio.IDS_DOS_EXERCICIOS]);
  });
});
