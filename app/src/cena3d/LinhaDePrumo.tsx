import type { RefObject } from 'react';
import { Color, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { alinhamentoLateral, meioDosPes } from '../movimento/alinhamento';
import { corDoEstado } from '../movimento/aneis';
import { TOPO_BASE } from '../movimento/cenario';
import type { Esqueleto } from '../movimento/corpo';
import { fatorDeAproximacao } from '../movimento/transicoes';
import type { CoresDaCena } from './cores';
import type { RelogioDaAnimacao } from './relogio';

/* Fio de prumo (auditoria visual, V7): uma linha do quadril até a base e um
   alvo no meio dos pés. Alinhado, a linha fica verde e discreta; fora do
   meio, acende na cor do estado e o praticante vê a distância entre o fim
   da linha e o alvo. */

const OPACIDADE_ALINHADO = 0.45;
const OPACIDADE_FORA = 0.95;
const TAXA = 10;

export function LinhaDePrumo({ grupo }: { grupo: RefObject<Group | null> }) {
  return (
    <group ref={grupo}>
      {/* Linha: cilindro de altura 1, esticado a cada quadro. */}
      <mesh renderOrder={4}>
        <cylinderGeometry args={[0.008, 0.008, 1, 10]} />
        <meshBasicMaterial transparent opacity={OPACIDADE_ALINHADO} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Ponta da linha, sobre a base. */}
      <mesh renderOrder={4}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshBasicMaterial transparent opacity={OPACIDADE_ALINHADO} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Alvo: meio dos pés. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <ringGeometry args={[0.024, 0.036, 28]} />
        <meshBasicMaterial transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const corAlvo = new Color();

export function atualizarPrumo(
  grupo: Group | null,
  esqueleto: Esqueleto,
  sensores: RelogioDaAnimacao['sensores'],
  cores: CoresDaCena,
  delta: number,
) {
  if (!grupo) return;
  const [linha, ponta, alvo] = grupo.children as Mesh[];
  if (!linha || !ponta || !alvo) return;
  const { pelve } = esqueleto;
  const chao = TOPO_BASE + 0.005;
  const altura = Math.max(pelve.y - chao, 0.01);
  linha.position.set(pelve.x, chao + altura / 2, pelve.z);
  linha.scale.set(1, altura, 1);
  ponta.position.set(pelve.x, chao, pelve.z);
  const meio = meioDosPes(esqueleto);
  alvo.position.set(meio.x, chao, meio.z);

  const { alinhado } = alinhamentoLateral(esqueleto);
  // Fora do meio sem o app ter acusado ainda: âmbar (atenção).
  const estado = sensores?.estado ?? 'ok';
  corAlvo.set(alinhado ? cores.certo : cores[corDoEstado(estado === 'ok' || estado === 'dica' ? 'atencao' : estado)]);
  const fator = fatorDeAproximacao(delta, TAXA);
  [linha, ponta].forEach((m) => {
    const material = m.material as MeshBasicMaterial;
    material.color.lerp(corAlvo, fator);
    material.opacity += ((alinhado ? OPACIDADE_ALINHADO : OPACIDADE_FORA) - material.opacity) * fator;
  });
  (alvo.material as MeshBasicMaterial).color.lerp(corAlvo, fator);
}
