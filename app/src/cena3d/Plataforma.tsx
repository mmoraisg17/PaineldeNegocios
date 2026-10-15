import { useLoader } from '@react-three/fiber';
import { useMemo } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import urlDaPlataforma from '../assets/modelos/plataforma.glb?url';
import { geometriasDoModelo } from './Banquinho';
import { Barras, PlataformaSimples, Tampa } from './Cenario';
import type { CoresDaCena } from './cores';
import { ModeloComReserva } from './ModeloComReserva';

/* Plataforma do projeto 3D do Gabriel (simulacao_estacao.dwg, escala 1:10):
   a bandeja de 0,60 × 1,00 × 0,13 m com os cantos arredondados, os quatro
   pinos das laterais e as duas alças em C. O arquivo está em metros reais, com
   a origem no centro da bandeja, no chão. A tampa dos sensores e as barras
   continuam sendo desenhadas aqui: a tampa marca a área que mede o peso e as
   barras são o que o boneco segura. */
function PlataformaCarregada({ cores }: { cores: CoresDaCena }) {
  const gltf = useLoader(GLTFLoader, urlDaPlataforma);
  const geometrias = useMemo(() => geometriasDoModelo(gltf.scene), [gltf]);
  const bandeja = geometrias.get('bandeja');
  const ferragens = ['pino_0', 'pino_1', 'pino_2', 'pino_3', 'alca_0', 'alca_1'];

  return (
    <group>
      {bandeja && (
        <mesh geometry={bandeja}>
          <meshStandardMaterial color={cores.base} roughness={0.6} />
        </mesh>
      )}
      {ferragens.map((nome) => {
        const geometria = geometrias.get(nome);
        return (
          geometria && (
            <mesh key={nome} geometry={geometria}>
              <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
            </mesh>
          )
        );
      })}
      <Tampa cores={cores} />
      <Barras cores={cores} />
    </group>
  );
}

export function Plataforma({ cores }: { cores: CoresDaCena }) {
  return (
    <ModeloComReserva reserva={<PlataformaSimples cores={cores} />}>
      <PlataformaCarregada cores={cores} />
    </ModeloComReserva>
  );
}

useLoader.preload(GLTFLoader, urlDaPlataforma);
