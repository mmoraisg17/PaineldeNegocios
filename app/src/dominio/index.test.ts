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
      'nivelPelaFirmeza',
      'consultarConvite',
      'precisaDoPrimeiroUso',
      'normalizarEmail',
      'emailValido',
      'problemaDaSenha',
      'derivarHash',
      'criarCredencial',
      'conferirSenha',
      'buscarCredencial',
      'apagarVersoesAntigas',
      'armazenamentoDaSessao',
      'bytesAleatoriosEmHex',
    ];

    for (const nome of esperadas) {
      expect(typeof dominio[nome as keyof typeof dominio], nome).toBe('function');
    }
  });

  test('expõe as constantes das contas com senha e da demonstração', () => {
    expect(dominio.TAMANHO_MINIMO_DA_SENHA).toBe(8);
    expect(dominio.TAMANHO_MAXIMO_DA_SENHA).toBe(128);
    expect(dominio.TAMANHO_MAXIMO_DO_EMAIL).toBe(254);
    expect(dominio.ITERACOES_DA_SENHA).toBe(600_000);
    expect(dominio.SENHA_DA_DEMO).toBe('demo1234');
    expect(dominio.CONTAS_DA_DEMO).toHaveLength(5);
    expect(dominio.CHAVE_DA_SESSAO).toBe('app-equilibrio:sessao:v2');
    expect(dominio.CHAVES_ANTIGAS).toEqual(['app-equilibrio:v1']);
  });

  test('não expõe mais ACESSORIOS_DA_PLATAFORMA (o kit traz todos os itens)', () => {
    expect('ACESSORIOS_DA_PLATAFORMA' in dominio).toBe(false);
  });

  test('expõe o catálogo e a lista de ids com os mesmos 8 exercícios', () => {
    expect(dominio.CATALOGO.map((exercicio) => exercicio.id)).toEqual([...dominio.IDS_DOS_EXERCICIOS]);
  });
});
