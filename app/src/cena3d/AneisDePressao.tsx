import type { RefObject } from 'react';
import { Color, type Mesh, type MeshBasicMaterial } from 'three';
import { cargaDosPes, corDoEstado, raioDoAnel } from '../movimento/aneis';
import { type Esqueleto, alturaDaSuperficie } from '../movimento/corpo';
import { fatorDeAproximacao } from '../movimento/transicoes';
import type { CoresDaCena } from './cores';
import type { RelogioDaAnimacao } from './relogio';

/* Anel de pressão sob cada pé (auditoria visual, V5): o mapa de pressão
   levado para dentro da cena. Tamanho = peso naquele pé; cor = estado da
   avaliação. Um disco suave por dentro dá o "brilho" da referência. */

const LADOS = ['esquerdo', 'direito'] as const;
const FOLGA = 0.004; // logo acima da tampa, sem brigar com ela
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
          position={[0, 0, 0]}
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
          position={[0, 0, 0]}
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
    // Só sob pé apoiado na base: no ar ou no chão (degrau), os sensores não medem.
    const visivel = carga !== null && pe.apoiado;
    const y = alturaDaSuperficie(x, z, esqueleto.inclinacaoDaBase) + FOLGA;
    const inclinacao = (esqueleto.inclinacaoDaBase * Math.PI) / 180;
    [malhas[i * 2], malhas[i * 2 + 1]].forEach((malha, k) => {
      if (!malha) return;
      malha.visible = visivel;
      if (!visivel || !carga) return;
      malha.position.set(x, y - k * 0.001, z);
      malha.rotation.x = -Math.PI / 2 - inclinacao;
      const atual = malha.scale.x;
      const novo = atual + (raio - atual) * fator;
      malha.scale.set(novo, novo, 1);
      (malha.material as MeshBasicMaterial).color.lerp(corAlvo, fator);
    });
  });
}
