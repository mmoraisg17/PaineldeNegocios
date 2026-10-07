import type { RefObject } from 'react';
import { Color, type Mesh, type MeshBasicMaterial } from 'three';
import { cargaDosPes, corDoEstado, raioDoAnel } from '../movimento/aneis';
import { TOPO_BASE } from '../movimento/cenario';
import type { Esqueleto } from '../movimento/corpo';
import { fatorDeAproximacao } from '../movimento/transicoes';
import type { CoresDaCena } from './cores';
import type { RelogioDaAnimacao } from './relogio';

/* Anel de pressão sob cada pé (auditoria visual, V5): o mapa de pressão
   levado para dentro da cena. Tamanho = peso naquele pé; cor = estado da
   avaliação. Um disco suave por dentro dá o "brilho" da referência. */

const LADOS = ['esquerdo', 'direito'] as const;
const ALTURA = TOPO_BASE + 0.004; // logo acima da tampa, sem brigar com ela
const TAXA = 10; // 1/s: o anel acompanha a leitura de 10 Hz sem saltar
const OPACIDADE_DO_DISCO = 0.22;

export function AneisDePressao({ malhas }: { malhas: RefObject<(Mesh | null)[]> }) {
  return (
    <>
      {LADOS.flatMap((lado, i) => [
        <mesh
          key={`anel-${lado}`}
          ref={(m) => {
            if (malhas.current) malhas.current[i * 2] = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, ALTURA, 0]}
          renderOrder={3}
          visible={false}
        >
          <ringGeometry args={[0.82, 1, 48]} />
          <meshBasicMaterial transparent opacity={0.95} depthWrite={false} toneMapped={false} />
        </mesh>,
        <mesh
          key={`disco-${lado}`}
          ref={(m) => {
            if (malhas.current) malhas.current[i * 2 + 1] = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, ALTURA - 0.001, 0]}
          renderOrder={3}
          visible={false}
        >
          <circleGeometry args={[0.82, 48]} />
          <meshBasicMaterial transparent opacity={OPACIDADE_DO_DISCO} depthWrite={false} toneMapped={false} />
        </mesh>,
      ])}
    </>
  );
}

const corAlvo = new Color();

/* No useFrame do boneco: centra cada anel no pé, ajusta o raio pela carga e
   aproxima a cor do estado. Sem leitura (antes do 1º passo do simulador), some. */
export function atualizarAneis(
  malhas: (Mesh | null)[],
  esqueleto: Esqueleto,
  sensores: RelogioDaAnimacao['sensores'],
  cores: CoresDaCena,
  delta: number,
) {
  const fator = fatorDeAproximacao(delta, TAXA);
  const carga = sensores ? cargaDosPes(sensores) : null;
  if (sensores) corAlvo.set(cores[corDoEstado(sensores.estado)]);
  LADOS.forEach((lado, i) => {
    const pe = esqueleto.lados[lado];
    const x = (pe.calcanhar.x + pe.ponta.x) / 2;
    const z = (pe.calcanhar.z + pe.ponta.z) / 2;
    const raio = carga ? raioDoAnel(carga[lado]) : 0;
    [malhas[i * 2], malhas[i * 2 + 1]].forEach((malha) => {
      if (!malha) return;
      malha.visible = carga !== null;
      if (!carga) return;
      malha.position.x = x;
      malha.position.z = z;
      const atual = malha.scale.x;
      const novo = atual + (raio - atual) * fator;
      malha.scale.set(novo, novo, 1);
      (malha.material as MeshBasicMaterial).color.lerp(corAlvo, fator);
    });
  });
}
