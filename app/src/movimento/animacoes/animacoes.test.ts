import { describe, expect, test } from 'vitest';
import { type Animacao, amostrar, duracao } from '../animacao';
import { CORPO, TOPO_BASE } from '../cenario';
import { type Esqueleto, montarEsqueleto } from '../corpo';
import { flexaoDoJoelho } from '../musculos';
import { distancia } from '../vetor';
import { quadrilParaFlexao } from './comum';
import { animacaoDe, exerciciosAnimados } from './index';

/* Fatos de todas as animações da fase 6, como pede a skill de inspeção de
   movimento: medidos quadro a quadro a 30 qps, antes de qualquer screenshot.
   Os fatos específicos de cada exercício (ângulos da pesquisa) ficam nos
   blocos de cada um, abaixo. */

const QPS = 30;
const MM = 0.001;

export function quadrosDe(animacao: Animacao) {
  const n = Math.round(duracao(animacao) * QPS);
  return Array.from({ length: n + 1 }, (_, i) => {
    const amostra = amostrar(animacao, i / QPS);
    return { t: i / QPS, amostra, esqueleto: montarEsqueleto(amostra.pose) };
  });
}

const NIVEIS = [1, 2, 3] as const;
const variacoes = exerciciosAnimados().flatMap((id) =>
  NIVEIS.map((nivel) => ({ id, nivel, animacao: animacaoDe(id, { nivel, bracos: nivel === 3 ? 'uma-mao' : 'barras' }) as Animacao })),
);

describe.each(variacoes)('$id, nível $nivel: fatos gerais', ({ animacao }) => {
  const quadros = quadrosDe(animacao);

  test('ossos com o comprimento certo e quadril sempre alcançável', () => {
    for (const { esqueleto: e, t } of quadros) {
      for (const lado of ['esquerdo', 'direito'] as const) {
        const l = e.lados[lado];
        expect(distancia(l.tornozelo, l.joelho), `canela t=${t.toFixed(2)}`).toBeCloseTo(CORPO.canela, 3);
        expect(distancia(l.joelho, l.quadril), `coxa t=${t.toFixed(2)}`).toBeCloseTo(CORPO.coxa, 3);
      }
      expect(e.quadrilAlcancavel, `quadril t=${t.toFixed(2)}`).toBe(true);
    }
  });

  test('nenhum pé atravessa a superfície onde pisa (base ou chão)', () => {
    for (const { esqueleto: e, t } of quadros) {
      const pes = [e.lados.esquerdo, e.lados.direito];
      for (const l of pes) expect(Math.min(l.ponta.y, l.calcanhar.y), `pé t=${t.toFixed(2)}`).toBeGreaterThanOrEqual(-MM);
      for (const l of pes.filter((p) => p.apoiado)) expect(l.ponta.y, `ponta apoiada t=${t.toFixed(2)}`).toBeGreaterThanOrEqual(TOPO_BASE - MM);
    }
  });

  test('sempre há pelo menos um pé apoiado na base (os sensores medem o corpo todo)', () => {
    for (const { esqueleto: e, t } of quadros) {
      expect(e.lados.esquerdo.apoiado || e.lados.direito.apoiado, `t=${t.toFixed(2)}`).toBe(true);
    }
  });

  test('o ciclo fecha: o fim é igual ao começo', () => {
    const ini = amostrar(animacao, 0).pose;
    const fim = amostrar(animacao, duracao(animacao) - 1e-6).pose;
    expect(fim.quadril.y).toBeCloseTo(ini.quadril.y, 3);
    expect(fim.quadril.z).toBeCloseTo(ini.quadril.z, 3);
  });

  test('declara os músculos que trabalha', () => {
    expect(animacao.musculos?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('quadrilParaFlexao', () => {
  test.each([20, 35, 60, 75])('posiciona o quadril para %i° de flexão do joelho', (graus) => {
    const quadril = quadrilParaFlexao(graus);
    const e: Esqueleto = montarEsqueleto({
      quadril,
      tronco: 10,
      deslocamentoLateral: 0,
      inclinacaoLateral: 0,
      cabeca: 0,
      bracos: 'barras',
      maoZ: -0.05,
    });
    expect(flexaoDoJoelho(e)).toBeCloseTo(graus, 0);
  });
});

/* ---- 2. Miniagachamento com descarga simétrica (pesquisa, seção 2) ---- */
describe('miniagachamento simétrico', () => {
  const flexaoMaxima = (nivel: 1 | 2 | 3) => Math.max(...quadrosDe(animacaoDe('miniagachamento-simetrico', { nivel })!).map((q) => flexaoDoJoelho(q.esqueleto)));

  test('nível 1, pouca descida: joelho até ~35°', () => {
    expect(flexaoMaxima(1)).toBeGreaterThan(30);
    expect(flexaoMaxima(1)).toBeLessThan(40);
  });

  test('níveis 2 e 3, descida média: joelho até ~60° (marcador de carga na perna operada)', () => {
    for (const nivel of [2, 3] as const) {
      expect(flexaoMaxima(nivel)).toBeGreaterThan(55);
      expect(flexaoMaxima(nivel)).toBeLessThan(65);
    }
  });

  test('carga simétrica (50/50) e centro de pressão sem ir para a ponta o ciclo inteiro', () => {
    for (const { amostra } of quadrosDe(animacaoDe('miniagachamento-simetrico', { nivel: 2 })!)) {
      expect(amostra.carga.copML).toBe(0);
      expect(amostra.carga.copAP).toBeLessThanOrEqual(0.1);
    }
  });

  test('os dois pés ficam plantados o ciclo inteiro', () => {
    for (const { esqueleto } of quadrosDe(animacaoDe('miniagachamento-simetrico', { nivel: 2 })!)) {
      expect(esqueleto.lados.esquerdo.apoiado && esqueleto.lados.direito.apoiado).toBe(true);
    }
  });
});

/* ---- 3. Elevação de panturrilha unilateral (pesquisa, seção 3) ---- */
describe('panturrilha unilateral', () => {
  const quadros = (nivel: 1 | 2 | 3) => quadrosDe(animacaoDe('panturrilha-unilateral', { nivel })!);
  const alturaDoCalcanhar = (e: Esqueleto) => e.lados.esquerdo.calcanhar.y - TOPO_BASE;

  test('o calcanhar sobe ~5 cm no alto (altura de referência da pesquisa)', () => {
    for (const nivel of NIVEIS) {
      const maximo = Math.max(...quadros(nivel).map((q) => alturaDoCalcanhar(q.esqueleto)));
      expect(maximo, `nível ${nivel}`).toBeGreaterThan(0.04);
      expect(maximo, `nível ${nivel}`).toBeLessThan(0.07);
    }
  });

  test('a ponta do pé de apoio não sai do lugar (sobe girando na ponta, sem escorregar)', () => {
    const qs = quadros(2);
    const inicio = qs[0]!.esqueleto.lados.esquerdo.ponta;
    for (const { esqueleto, t } of qs) expect(distancia(esqueleto.lados.esquerdo.ponta, inicio), `t=${t.toFixed(2)}`).toBeLessThan(MM);
  });

  test('nível 1 usa os dois pés; níveis 2 e 3, só o esquerdo (o direito fica no ar)', () => {
    for (const { esqueleto } of quadros(1)) expect(esqueleto.lados.direito.apoiado).toBe(true);
    for (const nivel of [2, 3] as const) {
      for (const { esqueleto } of quadros(nivel)) {
        expect(esqueleto.lados.esquerdo.apoiado).toBe(true);
        expect(esqueleto.lados.direito.apoiado).toBe(false);
      }
    }
  });

  test('no alto o centro de pressão vai para a ponta; num pé só, todo o peso na esquerda', () => {
    const qs = quadros(2);
    expect(Math.max(...qs.map((q) => q.amostra.carga.copAP))).toBeGreaterThan(0.6);
    for (const { amostra } of qs) expect(amostra.carga.copML).toBe(1);
  });
});
