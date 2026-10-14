import { useLoader } from '@react-three/fiber';
import { useMemo } from 'react';
import type { BufferGeometry, Mesh, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import urlDoBanquinho from '../assets/modelos/banquinho.glb?url';
import type { Cadeira as CadeiraDaAnimacao } from '../movimento/animacao';
import { TOPO_BASE } from '../movimento/cenario';
import { Cadeira } from './Cenario';
import { ModeloComReserva } from './ModeloComReserva';
import type { CoresDaCena } from './cores';
import { pilhaDoBanquinho } from './banquinho';

/* Banquinho retrátil do projeto 3D do Gabriel no lugar da cadeira da
   animação de sentar e levantar. As malhas vêm do desenho (banquinho.glb, em
   metros reais, origem no centro da base de cada peça); a posição dos aros é
   calculada em banquinho.ts a partir da altura do assento da animação. */

/* Acha a geometria de cada peça pelo nome do nó (anel_00…anel_16, assento). */
export function geometriasDoModelo(raiz: Object3D): Map<string, BufferGeometry> {
  const mapa = new Map<string, BufferGeometry>();
  raiz.traverse((obj) => {
    const malha = obj as Mesh;
    if (!malha.isMesh) return;
    for (const nome of [malha.name, malha.parent?.name]) if (nome && !mapa.has(nome)) mapa.set(nome, malha.geometry);
  });
  return mapa;
}

function BanquinhoCarregado({ cadeira, cores }: { cadeira: CadeiraDaAnimacao; cores: CoresDaCena }) {
  const gltf = useLoader(GLTFLoader, urlDoBanquinho);
  const geometrias = useMemo(() => geometriasDoModelo(gltf.scene), [gltf]);
  const pilha = useMemo(() => pilhaDoBanquinho(cadeira.assentoY, TOPO_BASE), [cadeira.assentoY]);
  const zMeio = (cadeira.frenteZ + cadeira.fundoZ) / 2;
  const assento = geometrias.get('assento');
  // O banquinho fica em cima da plataforma, na parte de trás (pilha começa em TOPO_BASE).

  return (
    <group position={[0, 0, zMeio]}>
      {pilha.alturaDosAneis.map((y, k) => {
        const geometria = geometrias.get(`anel_${String(k).padStart(2, '0')}`);
        return (
          geometria && (
            <mesh key={k} geometry={geometria} position={[0, y, 0]}>
              <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
            </mesh>
          )
        );
      })}
      {assento && (
        <mesh geometry={assento} position={[0, pilha.alturaDoAssento, 0]}>
          <meshStandardMaterial color={cores.base} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

export function Banquinho({ cadeira, cores }: { cadeira: CadeiraDaAnimacao; cores: CoresDaCena }) {
  /* Reserva: a cadeira simples, também em cima da plataforma. */
  const reserva = (
    <group position={[0, TOPO_BASE, 0]}>
      <Cadeira cadeira={{ ...cadeira, assentoY: cadeira.assentoY - TOPO_BASE }} cores={cores} />
    </group>
  );
  return (
    <ModeloComReserva reserva={reserva}>
      <BanquinhoCarregado cadeira={cadeira} cores={cores} />
    </ModeloComReserva>
  );
}

useLoader.preload(GLTFLoader, urlDoBanquinho);
