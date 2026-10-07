import type { RefObject } from 'react';
import type { Mesh } from 'three';
import type { Animacao } from '../movimento/animacao';
import type { Esqueleto } from '../movimento/corpo';
import { posicionarSegmento } from './malhas';

/* Faixa elástica da abdução (fase 6): presa na base da barra e no tornozelo
   que abre. Afina conforme estica, para o praticante ver a resistência. */

const RAIO = 0.011;
const COMPRIMENTO_SOLTO = 0.45; // m: abaixo disso a faixa não afina

export function Elastico({ malha, cor }: { malha: RefObject<Mesh | null>; cor: string }) {
  return (
    <mesh ref={malha} renderOrder={2}>
      <cylinderGeometry args={[1, 1, 1, 10]} />
      <meshStandardMaterial color={cor} roughness={0.6} />
    </mesh>
  );
}

export function atualizarElastico(malha: Mesh | null, elastico: Animacao['elastico'], esqueleto: Esqueleto) {
  if (!malha || !elastico) return;
  const [x, y, z] = elastico.ancora;
  const tornozelo = esqueleto.lados[elastico.lado].tornozelo;
  posicionarSegmento(malha, { x, y, z }, tornozelo);
  const comprimento = malha.scale.y;
  const raio = RAIO * Math.sqrt(Math.min(1, COMPRIMENTO_SOLTO / Math.max(comprimento, 0.01)));
  malha.scale.set(raio, comprimento, raio);
}
