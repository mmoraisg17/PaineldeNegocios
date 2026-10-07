import { describe, expect, test } from 'vitest';
import { amostrar, duracao, type Animacao } from './animacao';
import { CORPO, PLATAFORMA, QUADRIL_ACIMA_DO_ASSENTO, TOPO_BASE } from './cenario';
import { type Esqueleto, montarEsqueleto, tornozeloPadrao } from './corpo';
import { ikDoisOssos } from './ik';
import { sentarELevantar } from './animacoes/sentarELevantar';
import { anguloEntre, distancia, sub, vec } from './vetor';
import { aplicarDesvioNaPose, regiaoDoDesvio } from './desvios';

/* Como pede a skill de inspeção de movimento: fatos medidos antes de
   screenshot. Amostra o ciclo inteiro a 30 quadros por segundo e confere
   contato com o chão, comprimento dos ossos, apoio no assento e ângulos da
   pesquisa. */
const QPS = 30;
const MM = 0.001;

function amostrasDe(animacao: Animacao) {
  const n = Math.round(duracao(animacao) * QPS);
  return Array.from({ length: n + 1 }, (_, i) => {
    const amostra = amostrar(animacao, i / QPS);
    return { t: i / QPS, amostra, esqueleto: montarEsqueleto(amostra.pose) };
  });
}

const flexaoDoJoelho = (e: Esqueleto) => {
  const l = e.lados.esquerdo;
  return 180 - anguloEntre(sub(l.tornozelo, l.joelho), sub(l.quadril, l.joelho));
};
const flexaoDoTronco = (e: Esqueleto) => anguloEntre(sub(e.pescoco, e.pelve), vec(0, 1, 0));

describe('IK de dois ossos', () => {
  test('preserva os comprimentos dos ossos quando o alvo é alcançável', () => {
    const r = ikDoisOssos(vec(0, 0, 0), vec(0, 0.6, 0.2), 0.42, 0.42, vec(0, 0, 1));
    expect(distancia(vec(0, 0, 0), r.meio)).toBeCloseTo(0.42, 6);
    expect(distancia(r.meio, r.fim)).toBeCloseTo(0.42, 6);
    expect(r.alcancou).toBe(true);
  });

  test('dobra a articulação para o lado do polo', () => {
    const r = ikDoisOssos(vec(0, 0, 0), vec(0, 0.6, 0), 0.42, 0.42, vec(0, 0, 1));
    expect(r.meio.z).toBeGreaterThan(0);
  });

  test('estica na direção do alvo e avisa quando ele está longe demais', () => {
    const r = ikDoisOssos(vec(0, 0, 0), vec(0, 2, 0), 0.42, 0.42, vec(0, 0, 1));
    expect(r.alcancou).toBe(false);
    expect(r.fim.y).toBeLessThan(0.85);
    expect(distancia(r.meio, r.fim)).toBeCloseTo(0.42, 6);
  });

  test('não quebra com polo paralelo ao membro', () => {
    const r = ikDoisOssos(vec(0, 0, 0), vec(0, 0.5, 0), 0.42, 0.42, vec(0, 1, 0));
    expect(Number.isFinite(r.meio.x + r.meio.y + r.meio.z)).toBe(true);
  });
});

describe.each(['barras', 'cruzados'] as const)('sentar e levantar (braços: %s)', (bracos) => {
  const animacao = sentarELevantar(bracos);
  const quadros = amostrasDe(animacao);
  const cadeira = animacao.cadeira!;

  test('os pés ficam plantados na base o ciclo inteiro (sem deslizar nem afundar)', () => {
    for (const { esqueleto } of quadros) {
      for (const lado of ['esquerdo', 'direito'] as const) {
        const l = esqueleto.lados[lado];
        expect(distancia(l.tornozelo, tornozeloPadrao(lado))).toBeLessThan(MM);
        expect(l.ponta.y).toBeGreaterThanOrEqual(TOPO_BASE - MM);
        expect(l.ponta.z).toBeLessThanOrEqual(PLATAFORMA.profundidade / 2);
        expect(l.calcanhar.z).toBeGreaterThanOrEqual(-PLATAFORMA.profundidade / 2);
      }
    }
  });

  test('canela e coxa mantêm o comprimento e o quadril é sempre alcançável', () => {
    for (const { esqueleto, t } of quadros) {
      const l = esqueleto.lados.direito;
      expect(distancia(l.tornozelo, l.joelho), `canela em t=${t}`).toBeCloseTo(CORPO.canela, 3);
      expect(distancia(l.joelho, l.quadril), `coxa em t=${t}`).toBeCloseTo(CORPO.coxa, 3);
      expect(esqueleto.quadrilAlcancavel, `quadril em t=${t}`).toBe(true);
    }
  });

  test('sentado, o quadril fica apoiado no assento, sem atravessá-lo', () => {
    const sentado = quadros.filter((q) => q.t <= 1.0);
    for (const { esqueleto } of sentado) {
      expect(esqueleto.pelve.y - cadeira.assentoY).toBeCloseTo(QUADRIL_ACIMA_DO_ASSENTO, 2);
    }
    for (const { esqueleto, t } of quadros) {
      const sobreOAssento = esqueleto.pelve.z <= cadeira.frenteZ;
      if (sobreOAssento) expect(esqueleto.pelve.y, `t=${t}`).toBeGreaterThanOrEqual(cadeira.assentoY + QUADRIL_ACIMA_DO_ASSENTO - 0.01);
    }
  });

  test('o joelho começa entre 85° e 105° de flexão e termina quase estendido', () => {
    const inicio = flexaoDoJoelho(quadros[0]!.esqueleto);
    expect(inicio).toBeGreaterThanOrEqual(85);
    expect(inicio).toBeLessThanOrEqual(105);
    const emPe = quadros.find((q) => q.t >= 5.0)!;
    expect(flexaoDoJoelho(emPe.esqueleto)).toBeLessThan(20);
  });

  test('o tronco está entre 40° e 60° na saída da cadeira (faixa da pesquisa)', () => {
    const saida = quadros.find((q) => q.t >= 2.8)!;
    const tronco = flexaoDoTronco(saida.esqueleto);
    expect(tronco).toBeGreaterThanOrEqual(40);
    expect(tronco).toBeLessThanOrEqual(60);
  });

  test('a carga nos pés e o centro de pressão à frente têm pico na saída da cadeira', () => {
    const pico = quadros.reduce((a, b) => (b.amostra.carga.pes > a.amostra.carga.pes ? b : a));
    expect(pico.t).toBeGreaterThan(2.4);
    expect(pico.t).toBeLessThan(3.4);
    const maisAFrente = quadros.reduce((a, b) => (b.amostra.carga.copAP > a.amostra.carga.copAP ? b : a));
    expect(Math.abs(maisAFrente.t - pico.t)).toBeLessThan(0.4);
  });

  test('o ciclo fecha: o fim é igual ao começo', () => {
    const ini = amostrar(animacao, 0);
    const fim = amostrar(animacao, duracao(animacao) - 1e-6);
    expect(fim.pose.quadril.y).toBeCloseTo(ini.pose.quadril.y, 3);
    expect(fim.pose.tronco).toBeCloseTo(ini.pose.tronco, 1);
  });
});

test('com as barras, as mãos alcançam a pegada o ciclo inteiro', () => {
  for (const { esqueleto, t } of amostrasDe(sentarELevantar('barras'))) {
    expect(esqueleto.maosNoAlvo, `t=${t}`).toBe(true);
    expect(Math.abs(esqueleto.lados.esquerdo.mao.x)).toBeCloseTo(PLATAFORMA.barraX, 2);
    expect(esqueleto.lados.esquerdo.mao.y).toBeCloseTo(TOPO_BASE + PLATAFORMA.pegadaAltura, 2);
  }
});

test('com as barras, parte do impulso vai para as mãos e o pico nos pés é menor', () => {
  const pico = (a: Animacao) => Math.max(...amostrasDe(a).map((q) => q.amostra.carga.pes));
  expect(pico(sentarELevantar('barras'))).toBeLessThan(pico(sentarELevantar('cruzados')));
});

test('amostrar aceita tempo além do ciclo e negativo', () => {
  const a = sentarELevantar();
  expect(amostrar(a, duracao(a) + 2.2).fase).toBe(amostrar(a, 2.2).fase);
  expect(amostrar(a, -0.5).pose.quadril.y).toBeCloseTo(amostrar(a, duracao(a) - 0.5).pose.quadril.y, 6);
});

describe('variações por nível e desvios', () => {
  test('com uma mão, a esquerda segura a barra e a direita fica solta, sem quebrar o corpo', () => {
    for (const { esqueleto, t } of amostrasDe(sentarELevantar('uma-mao'))) {
      expect(Math.abs(esqueleto.lados.esquerdo.mao.x), `t=${t}`).toBeCloseTo(PLATAFORMA.barraX, 2);
      expect(Math.abs(esqueleto.lados.direito.mao.x), `t=${t}`).toBeLessThan(PLATAFORMA.barraX - 0.1);
      expect(esqueleto.quadrilAlcancavel).toBe(true);
    }
  });

  test.each(['assimetria', 'desvio-lateral', 'peso-na-ponta', 'apoio-total', 'oscilacao', 'perda-de-equilibrio'] as const)(
    'o desvio "%s" muda a pose sem tirar os pés da base nem esticar ossos',
    (desvio) => {
      const animacao = sentarELevantar('barras');
      for (const { t } of amostrasDe(animacao)) {
        const pose = aplicarDesvioNaPose(amostrar(animacao, t).pose, desvio, t);
        const e = montarEsqueleto(pose);
        expect(e.quadrilAlcancavel, `t=${t}`).toBe(true);
        expect(distancia(e.lados.esquerdo.tornozelo, tornozeloPadrao('esquerdo'))).toBeLessThan(MM);
      }
    },
  );

  test('a assimetria desloca o corpo para a direita, e a região destacada é a das pernas', () => {
    const pose = amostrar(sentarELevantar(), 5.2).pose;
    expect(montarEsqueleto(aplicarDesvioNaPose(pose, 'assimetria', 5.2)).pelve.x).toBeLessThan(montarEsqueleto(pose).pelve.x);
    expect(regiaoDoDesvio('assimetria')).toBe('pernas');
    expect(regiaoDoDesvio('apoio-total')).toBe('bracos');
    expect(regiaoDoDesvio(null)).toBeNull();
    expect(aplicarDesvioNaPose(pose, null, 0)).toBe(pose);
  });

  test('tempo inválido não gera pose inválida', () => {
    expect(Number.isFinite(amostrar(sentarELevantar(), Number.NaN).pose.quadril.y)).toBe(true);
  });
});
