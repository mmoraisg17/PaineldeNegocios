import { CORPO, PLATAFORMA, TOPO_BASE } from './cenario';
import { ikDoisOssos } from './ik';
import { type Vec3, escala, misturar, normalizar, radianos, soma, sub, vec } from './vetor';

/* barras = duas mãos (nível 1); uma-mao = esquerda na barra, direita solta
   (nível 2); cruzados = sem apoio, braços no peito (nível 3); soltos = ao
   lado do corpo. */
export type ModoBracos = 'barras' | 'uma-mao' | 'cruzados' | 'soltos';
export type Lado = 'esquerdo' | 'direito';

/* Pose = o que a animação descreve. As pernas não têm ângulos próprios: o
   quadril é posicionado e a IK resolve joelho e canela a partir dos
   tornozelos fixos. Assim os pés nunca deslizam e o comprimento dos ossos é
   sempre o mesmo, os dois defeitos clássicos de animação feita à mão. */
export type Pose = {
  readonly quadril: { readonly y: number; readonly z: number };
  readonly tronco: number; // flexão à frente, graus a partir da vertical
  readonly deslocamentoLateral: number; // metros; + = para a esquerda do praticante
  readonly inclinacaoLateral: number; // graus; + = tronco para a esquerda
  readonly cabeca: number; // graus extras de flexão do pescoço
  readonly bracos: ModoBracos;
  readonly maoZ: number; // onde as mãos seguram a barra, ao longo dela
};

export type Esqueleto = {
  readonly pelve: Vec3;
  readonly pescoco: Vec3;
  readonly cabeca: Vec3;
  readonly lados: Record<Lado, LadoDoCorpo>;
  readonly maosNoAlvo: boolean;
  readonly quadrilAlcancavel: boolean;
};

export type LadoDoCorpo = {
  readonly tornozelo: Vec3;
  readonly joelho: Vec3;
  readonly quadril: Vec3;
  readonly ponta: Vec3;
  readonly calcanhar: Vec3;
  readonly ombro: Vec3;
  readonly cotovelo: Vec3;
  readonly mao: Vec3;
};

const SINAL: Record<Lado, number> = { esquerdo: 1, direito: -1 };
const FRENTE = vec(0, 0, 1);

export function tornozeloPadrao(lado: Lado): Vec3 {
  return vec(SINAL[lado] * CORPO.meiaLarguraQuadril, TOPO_BASE + CORPO.alturaTornozelo, 0);
}

/* Altura do quadril com as pernas (quase) retas e o quadril `z` metros à
   frente dos tornozelos. Usada pelas animações para a pose "em pé". */
export function alturaEmPe(z: number): number {
  const perna = (CORPO.canela + CORPO.coxa) * 0.99;
  return TOPO_BASE + CORPO.alturaTornozelo + Math.sqrt(perna * perna - z * z);
}

export function montarEsqueleto(pose: Pose): Esqueleto {
  const centroPedido = vec(pose.deslocamentoLateral, pose.quadril.y, pose.quadril.z);
  const pernas = (['esquerdo', 'direito'] as const).map((lado) => perna(lado, centroPedido));
  const [esq, dir] = pernas as [ReturnType<typeof perna>, ReturnType<typeof perna>];
  const pelve = misturar(esq.quadril, dir.quadril, 0.5);

  const direcaoTronco = normalizar(
    vec(Math.sin(radianos(pose.inclinacaoLateral)), Math.cos(radianos(pose.tronco)), Math.sin(radianos(pose.tronco))),
  );
  const pescoco = soma(pelve, escala(direcaoTronco, CORPO.tronco));
  // A cabeça acompanha o tronco só em parte: quem levanta da cadeira olha
  // para a frente, não para o chão.
  const anguloCabeca = radianos(pose.tronco * 0.4 + pose.cabeca);
  const direcaoCabeca = normalizar(vec(0, Math.cos(anguloCabeca), Math.sin(anguloCabeca)));
  const cabeca = soma(pescoco, escala(direcaoCabeca, CORPO.pescoco + CORPO.raioCabeca));

  const ombroDe = (lado: Lado) =>
    soma(sub(pescoco, escala(direcaoTronco, CORPO.quedaOmbro)), vec(SINAL[lado] * CORPO.meiaLarguraOmbros, 0, 0));
  const ombros = { esquerdo: ombroDe('esquerdo'), direito: ombroDe('direito') };
  const bracoE = braco('esquerdo', ombros, pose, direcaoTronco);
  const bracoD = braco('direito', ombros, pose, direcaoTronco);

  return {
    pelve,
    pescoco,
    cabeca,
    lados: {
      esquerdo: { ...esq, ombro: ombros.esquerdo, cotovelo: bracoE.meio, mao: bracoE.fim },
      direito: { ...dir, ombro: ombros.direito, cotovelo: bracoD.meio, mao: bracoD.fim },
    },
    maosNoAlvo: bracoE.alcancou && bracoD.alcancou,
    quadrilAlcancavel: esq.alcancou && dir.alcancou,
  };
}

function perna(lado: Lado, centroQuadril: Vec3) {
  const tornozelo = tornozeloPadrao(lado);
  const alvoQuadril = soma(centroQuadril, vec(SINAL[lado] * CORPO.meiaLarguraQuadril, 0, 0));
  const ik = ikDoisOssos(tornozelo, alvoQuadril, CORPO.canela, CORPO.coxa, FRENTE);
  const chao = TOPO_BASE;
  return {
    tornozelo,
    joelho: ik.meio,
    quadril: ik.fim,
    ponta: vec(tornozelo.x, chao, tornozelo.z + CORPO.peFrente),
    calcanhar: vec(tornozelo.x, chao, tornozelo.z - CORPO.peTras),
    alcancou: ik.alcancou,
  };
}

function braco(lado: Lado, ombros: Record<Lado, Vec3>, pose: Pose, direcaoTronco: Vec3) {
  const ombro = ombros[lado];
  /* Direção para onde o cotovelo aponta. Segurando as barras, ele aponta para
     trás e só um pouco para fora, como quem empurra o corpo para cima; com os
     braços cruzados, para baixo e à frente. Um polo muito lateral (a primeira
     versão) abria o braço na horizontal, o que a revisão visual mostrou. */
  const polo = pose.bracos === 'cruzados' ? vec(SINAL[lado] * 0.3, -1, 0.4) : vec(SINAL[lado] * 0.25, -0.3, -1);
  return ikDoisOssos(ombro, alvoDaMao(lado, ombros, pose, direcaoTronco), CORPO.braco, CORPO.antebracoAtePegada, polo);
}

function alvoDaMao(lado: Lado, ombros: Record<Lado, Vec3>, pose: Pose, direcaoTronco: Vec3): Vec3 {
  const naBarra = pose.bracos === 'barras' || (pose.bracos === 'uma-mao' && lado === 'esquerdo');
  if (naBarra) {
    const z = Math.min(Math.max(pose.maoZ, PLATAFORMA.pegadaZ.de), PLATAFORMA.pegadaZ.ate);
    return vec(SINAL[lado] * PLATAFORMA.barraX, TOPO_BASE + PLATAFORMA.pegadaAltura, z);
  }
  if (pose.bracos === 'cruzados') {
    // Mão no ombro oposto, um pouco à frente do peito (teste de levantar da
    // cadeira com os braços cruzados, STEADI/CDC).
    const oposto = ombros[lado === 'esquerdo' ? 'direito' : 'esquerdo'];
    return soma(soma(oposto, escala(direcaoTronco, -0.06)), escala(FRENTE, 0.08));
  }
  return soma(ombros[lado], vec(SINAL[lado] * 0.04, -0.6, 0.04));
}
