import type { RefObject } from 'react';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import type { Carga } from '../movimento/animacao';
import type { Esqueleto } from '../movimento/corpo';
import { type Musculo, brilhoDoMusculo, esforcoDoMusculo, flexaoDoJoelho, trechoDoPerfil } from '../movimento/musculos';
import { fatorDeAproximacao } from '../movimento/transicoes';
import { type Vec3, sub } from '../movimento/vetor';
import { LADOS_DA_REVOLUCAO, pontosDoPerfil, posicionarSegmento } from './malhas';
import { CANELA, COXA, type Perfil, TRONCO, TRONCO_LARGURA, TRONCO_PROFUNDIDADE } from './perfisDoCorpo';

/* Músculos acesos em ciano (auditoria visual, V4; estilo do LYFTA). Cada
   músculo é uma "casca": um pedaço do perfil do membro, um pouco maior que
   ele, cobrindo só o lado certo (frente da coxa, costas da panturrilha…),
   semitransparente. O brilho acompanha o esforço estimado (movimento/musculos.ts). */

type Casca = {
  musculo: Musculo;
  de: (e: Esqueleto) => Vec3;
  ate: (e: Esqueleto) => Vec3;
  perfil: Perfil;
  trecho: readonly [number, number];
  /* Ângulo do centro da casca em torno do osso (0 = +Z local; ver malhas.ts:
     no tronco +Z é a frente, nos membros +Z são as costas). */
  centro: number;
  abertura: number; // graus cobertos
  lateral: (e: Esqueleto) => Vec3;
  achatado?: boolean; // tronco: mesma largura × profundidade do corpo
};

const ESCALA_DA_CASCA = 1.07;
const TAXA_DO_BRILHO = 8; // 1/s: o brilho segue o esforço sem piscar
/* Mistura normal (não aditiva): sobre o corpo claro, a cor aditiva virava
   quase branco e o ciano sumia (verificado no Chrome). */
const OPACIDADE_MAXIMA = 0.88;

const LATERAL_DO_QUADRIL = (e: Esqueleto) => sub(e.lados.esquerdo.quadril, e.lados.direito.quadril);
const LATERAL_DOS_OMBROS = (e: Esqueleto) => sub(e.lados.esquerdo.ombro, e.lados.direito.ombro);
const FRENTE_DA_PERNA = Math.PI;
const COSTAS_DA_PERNA = 0;
const FRENTE_DO_TRONCO = 0;
const COSTAS_DO_TRONCO = Math.PI;

const pernas = (lado: 'esquerdo' | 'direito'): Casca[] => [
  {
    musculo: 'quadriceps',
    de: (e) => e.lados[lado].quadril,
    ate: (e) => e.lados[lado].joelho,
    perfil: COXA,
    trecho: [0.12, 0.82],
    centro: FRENTE_DA_PERNA,
    abertura: 130,
    lateral: LATERAL_DO_QUADRIL,
  },
  {
    musculo: 'panturrilhas',
    de: (e) => e.lados[lado].joelho,
    ate: (e) => e.lados[lado].tornozelo,
    perfil: CANELA,
    trecho: [0.08, 0.55],
    centro: COSTAS_DA_PERNA,
    abertura: 150,
    lateral: LATERAL_DO_QUADRIL,
  },
];

export const CASCAS: readonly Casca[] = [
  ...pernas('esquerdo'),
  ...pernas('direito'),
  {
    musculo: 'gluteos',
    de: (e) => e.pelve,
    ate: (e) => e.pescoco,
    perfil: TRONCO,
    trecho: [0.02, 0.22],
    centro: COSTAS_DO_TRONCO,
    abertura: 160,
    lateral: LATERAL_DOS_OMBROS,
    achatado: true,
  },
  {
    musculo: 'abdomen',
    de: (e) => e.pelve,
    ate: (e) => e.pescoco,
    perfil: TRONCO,
    trecho: [0.25, 0.58],
    centro: FRENTE_DO_TRONCO,
    abertura: 100,
    lateral: LATERAL_DOS_OMBROS,
    achatado: true,
  },
];

const radianos = (graus: number) => (graus * Math.PI) / 180;

/* As malhas das cascas dos músculos que o exercício trabalha. */
export function CascasDosMusculos({
  musculos,
  cor,
  malhas,
}: {
  musculos: readonly Musculo[];
  cor: string;
  malhas: RefObject<(Mesh | null)[]>;
}) {
  return (
    <>
      {CASCAS.map((c, i) =>
        musculos.includes(c.musculo) ? (
          <mesh
            key={`m${i}`}
            ref={(m) => {
              if (malhas.current) malhas.current[i] = m;
            }}
            renderOrder={2}
          >
            <latheGeometry
              args={[
                pontosDoPerfil(trechoDoPerfil(c.perfil, c.trecho[0], c.trecho[1], ESCALA_DA_CASCA)),
                LADOS_DA_REVOLUCAO,
                c.centro - radianos(c.abertura) / 2,
                radianos(c.abertura),
              ]}
            />
            <meshBasicMaterial
              color={cor}
              transparent
              opacity={0}
              depthWrite={false}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ) : null,
      )}
    </>
  );
}

/* Chamado no useFrame do boneco, logo depois do esqueleto: posiciona as
   cascas e aproxima o brilho do esforço do instante. */
export function atualizarMusculos(malhas: (Mesh | null)[], esqueleto: Esqueleto, carga: Carga, delta: number) {
  const flexao = flexaoDoJoelho(esqueleto);
  const fator = fatorDeAproximacao(delta, TAXA_DO_BRILHO);
  CASCAS.forEach((c, i) => {
    const malha = malhas[i];
    if (!malha) return;
    const lateral = c.lateral(esqueleto);
    posicionarSegmento(
      malha,
      c.de(esqueleto),
      c.ate(esqueleto),
      c.achatado ? { lateral, largura: TRONCO_LARGURA, profundidade: TRONCO_PROFUNDIDADE } : { lateral, largura: 1, profundidade: 1 },
    );
    const material = malha.material as MeshBasicMaterial;
    const alvo = OPACIDADE_MAXIMA * brilhoDoMusculo(esforcoDoMusculo(c.musculo, carga, flexao));
    material.opacity += (alvo - material.opacity) * fator;
  });
}
