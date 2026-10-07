import { describe, expect, test } from 'vitest';
import { type Animacao, amostrar } from './animacao';
import { sentarELevantar } from './animacoes/sentarELevantar';
import { CORPO, PLATAFORMA, TOPO_BASE } from './cenario';
import { type Pose, alturaEmPe, montarEsqueleto, tornozeloPadrao } from './corpo';
import { distancia } from './vetor';

/* Fase 6: cada pé pode se mover (tandem, degrau, abdução), subir o calcanhar
   (panturrilha), sair do chão (apoio num pé só) e a base pode inclinar. Fatos
   medidos, como nos testes do movimento. */

const MM = 0.001;
const EM_PE: Pose = {
  quadril: { y: alturaEmPe(0), z: 0 },
  tronco: 2,
  deslocamentoLateral: 0,
  inclinacaoLateral: 0,
  cabeca: 0,
  bracos: 'barras',
  maoZ: -0.05,
};
const comPes = (pes: Pose['pes'], extra: Partial<Pose> = {}): Pose => ({ ...EM_PE, ...extra, pes });
const ossosIntactos = (pose: Pose) => {
  const e = montarEsqueleto(pose);
  for (const lado of ['esquerdo', 'direito'] as const) {
    const l = e.lados[lado];
    expect(distancia(l.tornozelo, l.joelho)).toBeCloseTo(CORPO.canela, 3);
    expect(distancia(l.joelho, l.quadril)).toBeCloseTo(CORPO.coxa, 3);
  }
};

describe('pés', () => {
  test('sem ajuste nos pés, tudo como antes: tornozelos no lugar padrão e pés apoiados', () => {
    const e = montarEsqueleto(EM_PE);
    for (const lado of ['esquerdo', 'direito'] as const) {
      expect(distancia(e.lados[lado].tornozelo, tornozeloPadrao(lado))).toBeLessThan(MM);
      expect(e.lados[lado].apoiado).toBe(true);
      expect(e.lados[lado].ponta.y).toBeCloseTo(TOPO_BASE, 6);
      expect(e.lados[lado].calcanhar.y).toBeCloseTo(TOPO_BASE, 6);
    }
  });

  test('calcanhar a 25°: a ponta fica parada na base e o calcanhar sobe ~10 cm', () => {
    const plano = montarEsqueleto(EM_PE).lados.direito;
    const pose = comPes({ direito: { calcanhar: 25 } }, { quadril: { y: alturaEmPe(0) + 0.07, z: 0 } });
    const d = montarEsqueleto(pose).lados.direito;
    expect(distancia(d.ponta, plano.ponta)).toBeLessThan(MM);
    expect(d.calcanhar.y - TOPO_BASE).toBeCloseTo((CORPO.peFrente + CORPO.peTras) * Math.sin((25 * Math.PI) / 180), 3);
    expect(d.tornozelo.y).toBeGreaterThan(plano.tornozelo.y + 0.05);
    expect(d.apoiado).toBe(true);
    ossosIntactos(pose);
  });

  test('pé no ar (elevação 20 cm, dobrado para trás) deixa de contar como apoiado', () => {
    const pose = comPes({ direito: { elevacao: 0.2, dz: -0.15 } });
    const d = montarEsqueleto(pose).lados.direito;
    expect(d.apoiado).toBe(false);
    expect(Math.min(d.ponta.y, d.calcanhar.y)).toBeCloseTo(TOPO_BASE + 0.2, 3);
    ossosIntactos(pose);
  });

  test('pé fora da base (degrau) pisa no chão, não na base, e não é apoiado da base', () => {
    const dx = PLATAFORMA.largura / 2 + 0.06 - CORPO.meiaLarguraQuadril;
    const pose = comPes({ esquerdo: { dx } }, { quadril: { y: alturaEmPe(0) - 0.12, z: 0 } });
    const l = montarEsqueleto(pose).lados.esquerdo;
    expect(l.ponta.y).toBeCloseTo(0, 6);
    expect(l.apoiado).toBe(false);
  });

  test('base inclinada 10° (frente sobe): o pé acompanha a rampa, ponta mais alta que o calcanhar', () => {
    const pose = comPes(undefined, { inclinacaoDaBase: 10 });
    const d = montarEsqueleto(pose).lados.direito;
    const comprimento = CORPO.peFrente + CORPO.peTras;
    expect(d.ponta.y - d.calcanhar.y).toBeCloseTo(comprimento * Math.sin((10 * Math.PI) / 180), 3);
    expect(d.apoiado).toBe(true);
    ossosIntactos(pose);
  });
});

describe('animação com pés', () => {
  test('o deslocamento do pé é interpolado entre os quadros, como o resto da pose', () => {
    const base = sentarELevantar().quadros[0];
    if (!base) throw new Error('sem quadros');
    const animacao: Animacao = {
      id: 'teste',
      quadros: [
        { ...base, t: 0, pose: comPes({ direito: { dz: 0 } }) },
        { ...base, t: 1, pose: comPes({ direito: { dz: 0.2 } }) },
        { ...base, t: 2, pose: comPes({ direito: { dz: 0 } }) },
      ],
    };
    expect(amostrar(animacao, 1).pose.pes?.direito?.dz).toBeCloseTo(0.2, 6);
    const meio = amostrar(animacao, 0.5).pose.pes?.direito?.dz ?? 0;
    expect(meio).toBeGreaterThan(0.05);
    expect(meio).toBeLessThan(0.15);
  });

  test('a inclinação da base vem da animação e chega à pose amostrada', () => {
    const animacao: Animacao = { ...sentarELevantar(), inclinacaoDaBase: 5 };
    expect(amostrar(animacao, 1).pose.inclinacaoDaBase).toBe(5);
  });
});
