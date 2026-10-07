import { describe, expect, test } from 'vitest';
import { iconeDoEstado, setaDaCorrecao } from './setas';

/* Auditoria visual, V6: a seta mostra PARA ONDE corrigir, e o ícone no canto
   da cena diz se está certo ou não (com forma, não só cor). */

describe('setaDaCorrecao', () => {
  test('peso jogado na direita: a seta leva o quadril para a esquerda (+X)', () => {
    expect(setaDaCorrecao('assimetria')).toEqual({ direcao: { x: 1, y: 0, z: 0 }, ancora: 'pelve' });
  });

  test('corpo indo para a esquerda: a seta leva de volta para a direita (−X)', () => {
    expect(setaDaCorrecao('desvio-lateral')?.direcao).toEqual({ x: -1, y: 0, z: 0 });
  });

  test('peso na ponta dos pés: a seta leva o peso para trás, para os calcanhares (−Z)', () => {
    expect(setaDaCorrecao('peso-na-ponta')).toEqual({ direcao: { x: 0, y: 0, z: -1 }, ancora: 'pelve' });
  });

  test.each(['apoio-excessivo', 'apoio-total'] as const)('%s: a seta aponta para baixo, nos pés (peso nas pernas)', (desvio) => {
    expect(setaDaCorrecao(desvio)).toEqual({ direcao: { x: 0, y: -1, z: 0 }, ancora: 'pes' });
  });

  test('sem desvio, ou desvio sem direção clara, não há seta', () => {
    expect(setaDaCorrecao(null)).toBeNull();
    expect(setaDaCorrecao('oscilacao')).toBeNull();
    expect(setaDaCorrecao('brusco')).toBeNull();
  });
});

describe('iconeDoEstado', () => {
  test.each([
    ['ok', { simbolo: '✓', texto: 'Execução certa' }],
    ['dica', { simbolo: '✓', texto: 'Execução certa' }],
    ['atencao', { simbolo: '!', texto: 'Atenção' }],
    ['pare', { simbolo: '✕', texto: 'Pare' }],
  ] as const)('%s', (estado, esperado) => {
    expect(iconeDoEstado(estado)).toMatchObject(esperado);
  });
});
