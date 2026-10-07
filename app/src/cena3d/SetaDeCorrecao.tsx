import type { RefObject } from 'react';
import { Color, type Group, type Mesh, type MeshBasicMaterial, Quaternion, Vector3 } from 'three';
import { corDoEstado } from '../movimento/aneis';
import { TOPO_BASE } from '../movimento/cenario';
import type { Esqueleto } from '../movimento/corpo';
import { setaDaCorrecao } from '../movimento/setas';
import type { Desvio } from '../sensores/tipos';
import type { CoresDaCena } from './cores';
import type { RelogioDaAnimacao } from './relogio';

/* Seta de correção (auditoria visual, V6): aparece só quando o app pede
   atenção ou para, apontando para onde levar o corpo. Desenhada por cima de
   tudo (sem teste de profundidade), para nunca ficar escondida atrás do
   boneco, e balançando de leve na direção da correção. */

const HASTE = 0.15;
const PONTA = 0.065;
const AFASTAMENTO = 0.16; // m: começa um pouco fora do corpo
const ALTURA_SOBRE_OS_PES = 0.38;
const BALANCO = { metros: 0.025, hz: 1.1 } as const;

export function SetaDeCorrecao({ grupo }: { grupo: RefObject<Group | null> }) {
  return (
    <group ref={grupo} visible={false} renderOrder={10}>
      <mesh position={[0, HASTE / 2, 0]} renderOrder={10}>
        <cylinderGeometry args={[0.013, 0.013, HASTE, 12]} />
        <meshBasicMaterial depthTest={false} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, HASTE + PONTA / 2, 0]} renderOrder={10}>
        <coneGeometry args={[0.034, PONTA, 16]} />
        <meshBasicMaterial depthTest={false} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

const CIMA = new Vector3(0, 1, 0);
const tmpDirecao = new Vector3();
const tmpQ = new Quaternion();
const cor = new Color();

export function atualizarSeta(
  grupo: Group | null,
  esqueleto: Esqueleto,
  desvio: Desvio | null,
  sensores: RelogioDaAnimacao['sensores'],
  cores: CoresDaCena,
  tempo: number,
  menosMovimento: boolean,
) {
  if (!grupo) return;
  const seta = setaDaCorrecao(desvio);
  const pedeCorrecao = sensores?.estado === 'atencao' || sensores?.estado === 'pare';
  grupo.visible = seta !== null && pedeCorrecao;
  if (!seta || !sensores || !grupo.visible) return;

  tmpDirecao.set(seta.direcao.x, seta.direcao.y, seta.direcao.z);
  const balanco = menosMovimento ? 0 : BALANCO.metros * Math.sin(2 * Math.PI * BALANCO.hz * tempo);
  if (seta.ancora === 'pelve') {
    const { pelve } = esqueleto;
    grupo.position.set(pelve.x, pelve.y, pelve.z).addScaledVector(tmpDirecao, AFASTAMENTO + balanco);
  } else {
    const { esquerdo, direito } = esqueleto.lados;
    const x = (esquerdo.tornozelo.x + direito.tornozelo.x) / 2;
    const z = (esquerdo.tornozelo.z + direito.tornozelo.z) / 2;
    // Aponta para baixo: a ponta fica sobre os pés, a haste acima.
    grupo.position.set(x, TOPO_BASE + ALTURA_SOBRE_OS_PES + HASTE + PONTA, z).addScaledVector(tmpDirecao, balanco);
  }
  grupo.quaternion.copy(tmpQ.setFromUnitVectors(CIMA, tmpDirecao));
  cor.set(cores[corDoEstado(sensores.estado)]);
  grupo.children.forEach((filho) => ((filho as Mesh).material as MeshBasicMaterial).color.copy(cor));
}
