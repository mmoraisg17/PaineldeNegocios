import { useLoader, useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { useLayoutEffect } from 'react';
import { useVideoConfig } from 'remotion';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import urlDaPlataforma from '../../app/src/assets/modelos/plataforma.glb?url';
import { Chao } from '../../app/src/cena3d/Cenario';
import { Plataforma } from '../../app/src/cena3d/Plataforma';
import type { CoresDaCena } from '../../app/src/cena3d/cores';
import type { Animacao, Carga } from '../../app/src/movimento/animacao';
import type { Pose } from '../../app/src/movimento/corpo';
import { BonecoNoQuadro } from './BonecoNoQuadro';

/* Campo de visão vertical. O app usa 38° num cartão quase quadrado; no vídeo
   em pé (9:16), com a mesma posição e alvo da câmera da animação, 38° corta a
   cabeça no ápice do salto e não sobra chão para a legenda. 46° abre o quadro
   em cima e embaixo sem mudar o ângulo de vista. */
const CAMPO_DE_VISAO = 46;

/* Câmera parada na posição e no alvo que a animação declara (vista lateral do
   salto). O app gira a câmera com o dedo (Orbita, no useFrame); aqui ela é fixa. */
function CameraDaAnimacao({ camera }: { camera: NonNullable<Animacao['camera']> }) {
  const cameraDaCena = useThree((estado) => estado.camera);
  useLayoutEffect(() => {
    cameraDaCena.position.set(...camera.posicao);
    cameraDaCena.lookAt(...camera.alvo);
    cameraDaCena.updateProjectionMatrix();
  }, [cameraDaCena, camera]);
  return null;
}

/* A Plataforma do app mostra uma versão em caixas enquanto o modelo GLB
   carrega (Suspense próprio). No vídeo isso faria os primeiros quadros saírem
   com a plataforma errada. Este componente pede o mesmo arquivo SEM Suspense
   próprio: a suspensão sobe até o ThreeCanvas, que segura o render
   (delayRender) até o modelo chegar; aí a Plataforma já o encontra no cache. */
function EsperarModelo() {
  useLoader(GLTFLoader, urlDaPlataforma);
  return null;
}

export function CenaDoSalto({
  animacao,
  pose,
  carga,
  cores,
}: {
  animacao: Animacao;
  pose: Pose;
  carga: Carga;
  cores: CoresDaCena;
}) {
  const { width, height } = useVideoConfig();
  const camera = animacao.camera ?? { posicao: [4, 1.75, 0.3], alvo: [0, 1.2, 0] };
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      camera={{ position: camera.posicao, fov: CAMPO_DE_VISAO, near: 0.05, far: 20 }}
    >
      {/* Estúdio igual ao do app (cena3d/VisualizadorExercicio.tsx, V1): fundo
          escuro, névoa que funde o chão, luz principal pela frente e duas de
          recorte por trás. */}
      <color attach="background" args={[cores.fundo]} />
      <fog attach="fog" args={[cores.fundo, 4.2, 7.5]} />
      <hemisphereLight args={['#cfd8e3', cores.fundo, 0.55]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
      <directionalLight position={[-3, 3, -4]} intensity={2.6} />
      <directionalLight position={[3, 2.5, -4]} intensity={1.8} color="#bfe9ff" />
      <CameraDaAnimacao camera={camera} />
      <EsperarModelo />
      <Chao cores={cores} />
      <Plataforma cores={cores} inclinacao={animacao.inclinacaoDaBase ?? 0} />
      <BonecoNoQuadro pose={pose} carga={carga} musculos={animacao.musculos} cores={cores} />
    </ThreeCanvas>
  );
}
