import { type Mesh, Matrix4, Quaternion, Vector2, Vector3 } from 'three';
import type { Vec3 } from '../movimento/vetor';

/* Posicionamento das malhas do corpo e dos músculos (auditoria visual, V2 e
   V4). Toda malha tem altura 1, de −0,5 (início do osso) a 0,5 (fim), e é
   esticada entre dois pontos do esqueleto a cada quadro. */

export const LADOS_DA_REVOLUCAO = 18;

type Perfil = readonly (readonly [raio: number, altura: number])[];

/* Perfil [raio, 0..1] → pontos do LatheGeometry, centrados na altura. */
export const pontosDoPerfil = (perfil: Perfil) => perfil.map(([raio, altura]) => new Vector2(raio, altura - 0.5));

export type Orientacao = { lateral: Vec3; largura: number; profundidade: number };

const CIMA = new Vector3(0, 1, 0);
const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpX = new Vector3();
const tmpZ = new Vector3();
const tmpQ = new Quaternion();
const tmpM = new Matrix4();

/* Estica a malha entre `de` e `ate`. Com `orientacao`, gira a malha em torno
   do osso para o X local apontar para a esquerda do corpo (`lateral`) e
   escala largura × profundidade. Assim o Z local tem sentido anatômico:
   no tronco (osso para cima) +Z é a frente; nos membros (osso para baixo)
   +Z são as costas. Os músculos (V4) usam isso para ficar do lado certo. */
export function posicionarSegmento(mesh: Mesh, de: Vec3, ate: Vec3, orientacao?: Orientacao) {
  tmpA.set(de.x, de.y, de.z);
  tmpB.set(ate.x, ate.y, ate.z);
  const comprimento = Math.max(tmpA.distanceTo(tmpB), 1e-4);
  mesh.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
  tmpB.sub(tmpA).normalize();
  if (!orientacao) {
    mesh.quaternion.copy(tmpQ.setFromUnitVectors(CIMA, tmpB));
    mesh.scale.set(1, comprimento, 1);
    return;
  }
  // X = lateral sem a componente ao longo do osso; Z completa a base.
  tmpX.set(orientacao.lateral.x, orientacao.lateral.y, orientacao.lateral.z);
  tmpX.addScaledVector(tmpB, -tmpX.dot(tmpB)).normalize();
  tmpZ.crossVectors(tmpX, tmpB).normalize();
  mesh.quaternion.setFromRotationMatrix(tmpM.makeBasis(tmpX, tmpB, tmpZ));
  mesh.scale.set(orientacao.largura, comprimento, orientacao.profundidade);
}
