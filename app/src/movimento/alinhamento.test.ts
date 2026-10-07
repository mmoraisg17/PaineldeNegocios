import { describe, expect, test } from 'vitest';
import { amostrar } from './animacao';
import { sentarELevantar } from './animacoes/sentarELevantar';
import { montarEsqueleto } from './corpo';
import { aplicarDesvioNaPose } from './desvios';
import { LIMIAR_DE_ALINHAMENTO, alinhamentoLateral } from './alinhamento';

/* Auditoria visual, V7: fio de prumo do quadril até a base. Só o desvio
   LATERAL conta: ir para a frente e para trás faz parte do sentar e levantar. */

const animacao = sentarELevantar();

describe('alinhamentoLateral', () => {
  test('na execução certa, o quadril fica sobre o meio dos pés o ciclo inteiro', () => {
    for (let t = 0; t < 8.8; t += 0.1) {
      const e = montarEsqueleto(amostrar(animacao, t).pose);
      expect(alinhamentoLateral(e).alinhado, `t=${t.toFixed(1)}`).toBe(true);
    }
  });

  test('com o peso jogado numa perna, o quadril sai do meio e a linha acusa', () => {
    const pose = aplicarDesvioNaPose(amostrar(animacao, 5).pose, 'assimetria', 5);
    const resultado = alinhamentoLateral(montarEsqueleto(pose));
    expect(resultado.alinhado).toBe(false);
    expect(Math.abs(resultado.desvio)).toBeGreaterThan(LIMIAR_DE_ALINHAMENTO);
  });

  test('o desvio tem sinal: peso na direita dá desvio negativo (−X)', () => {
    const pose = aplicarDesvioNaPose(amostrar(animacao, 5).pose, 'assimetria', 5);
    expect(alinhamentoLateral(montarEsqueleto(pose)).desvio).toBeLessThan(0);
  });
});
