import { useLayoutEffect, useMemo, useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import { JUNTAS, SEGMENTOS, achatamento } from '../../app/src/cena3d/Boneco';
import { MaterialManequim } from '../../app/src/cena3d/MaterialManequim';
import { CascasDosMusculos, atualizarMusculos } from '../../app/src/cena3d/Musculos';
import type { CoresDaCena } from '../../app/src/cena3d/cores';
import { LADOS_DA_REVOLUCAO, pontosDoPerfil, posicionarSegmento } from '../../app/src/cena3d/malhas';
import type { Carga } from '../../app/src/movimento/animacao';
import { type Pose, montarEsqueleto } from '../../app/src/movimento/corpo';
import type { Musculo } from '../../app/src/movimento/musculos';

/* O boneco do app (cena3d/Boneco.tsx) desenhado a partir de uma pose pronta.

   O Boneco do app avança o próprio relógio no useFrame (tempo += delta), o
   que no Remotion é proibido: cada quadro do vídeo é renderizado isolado, fora
   de ordem, e o delta não existe. Aqui a pose chega por props (calculada do
   número do quadro) e os meshes são posicionados num useLayoutEffect, que roda
   antes de o ThreeCanvas desenhar o quadro. As peças (SEGMENTOS, JUNTAS,
   perfis, material, cascas dos músculos) são as mesmas do app, importadas. */

/* Segundos "passados" para a transição de brilho dos músculos. Com o brilho
   zerado antes e um delta grande, o resultado é o alvo do instante (99,97%),
   igual em qualquer ordem de render, em vez de depender do quadro anterior. */
const DELTA_DO_BRILHO = 1;

export function BonecoNoQuadro({
  pose,
  carga,
  musculos,
  cores,
}: {
  pose: Pose;
  carga: Carga;
  musculos?: readonly Musculo[];
  cores: CoresDaCena;
}) {
  const segmentos = useRef<(Mesh | null)[]>([]);
  const juntas = useRef<(Mesh | null)[]>([]);
  const cascas = useRef<(Mesh | null)[]>([]);
  const esqueleto = useMemo(() => montarEsqueleto(pose), [pose]);

  useLayoutEffect(() => {
    SEGMENTOS.forEach((s, i) => {
      const mesh = segmentos.current[i];
      if (mesh) posicionarSegmento(mesh, s.de(esqueleto), s.ate(esqueleto), achatamento(s, esqueleto));
    });
    JUNTAS.forEach((j, i) => {
      const p = j.em(esqueleto);
      juntas.current[i]?.position.set(p.x, p.y, p.z);
    });
    if (musculos) {
      for (const casca of cascas.current) if (casca) (casca.material as MeshBasicMaterial).opacity = 0;
      atualizarMusculos(cascas.current, esqueleto, carga, DELTA_DO_BRILHO);
    }
  }, [esqueleto, carga, musculos]);

  return (
    <group>
      {SEGMENTOS.map((s, i) => (
        <mesh key={`s${i}`} ref={(m) => void (segmentos.current[i] = m)}>
          {s.perfil ? (
            <latheGeometry args={[pontosDoPerfil(s.perfil), LADOS_DA_REVOLUCAO]} />
          ) : (
            <cylinderGeometry args={[s.raio, s.raio, 1, 14]} />
          )}
          <MaterialManequim cor={cores[s.cor]} borda={cores.borda} />
        </mesh>
      ))}
      {JUNTAS.map((j, i) => (
        <mesh key={`j${i}`} ref={(m) => void (juntas.current[i] = m)}>
          <sphereGeometry args={[j.raio, 18, 14]} />
          <MaterialManequim cor={cores[j.cor]} borda={cores.borda} />
        </mesh>
      ))}
      {musculos && <CascasDosMusculos musculos={musculos} cor={cores.musculo} malhas={cascas} />}
    </group>
  );
}
