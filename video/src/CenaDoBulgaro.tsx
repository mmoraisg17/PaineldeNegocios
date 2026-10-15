import { useLoader, useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { useLayoutEffect } from 'react';
import { useVideoConfig } from 'remotion';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import urlDoBanquinho from '../../app/src/assets/modelos/banquinho.glb?url';
import urlDaPlataforma from '../../app/src/assets/modelos/plataforma.glb?url';
import { Banquinho } from '../../app/src/cena3d/Banquinho';
import { Chao } from '../../app/src/cena3d/Cenario';
import { Plataforma } from '../../app/src/cena3d/Plataforma';
import type { CoresDaCena } from '../../app/src/cena3d/cores';
import type { Animacao, Carga } from '../../app/src/movimento/animacao';
import type { Pose } from '../../app/src/movimento/corpo';
import { BonecoNoQuadro } from './BonecoNoQuadro';

type Camera = NonNullable<Animacao['camera']>;

/* Câmera do vídeo. A animação do app declara uma vista lateral pensada para
   um cartão quase quadrado ([3.6, 1.45, -0.05] → [0, 0.85, -0.05], 38°). No
   vídeo em pé (9:16) a largura útil é pouca e o fundo e o rodapé ficam com os
   textos; por isso: mesma direção de vista (de lado, pela esquerda do
   praticante, sem girar), câmera um pouco mais longe e mais alta e alvo mais
   baixo, para boneco, banquinho e plataforma caberem inteiros entre o
   cabeçalho e o painel de dados. O campo de visão sobe de 38° para 40°
   pelo mesmo motivo do vídeo anterior (abrir em cima e embaixo sem mudar o
   ângulo). */
const CAMPO_DE_VISAO = 40;
export function cameraDoVideo(daAnimacao: Camera): Camera {
  const [, , z] = daAnimacao.alvo;
  return { posicao: [5.0, 1.3, z], alvo: [0, 0.66, z] };
}

/* Câmera parada; o app gira a câmera com o dedo (Orbita, no useFrame). */
function CameraFixa({ camera }: { camera: Camera }) {
  const cameraDaCena = useThree((estado) => estado.camera);
  useLayoutEffect(() => {
    cameraDaCena.position.set(...camera.posicao);
    cameraDaCena.lookAt(...camera.alvo);
    cameraDaCena.updateProjectionMatrix();
  }, [cameraDaCena, camera]);
  return null;
}

/* A Plataforma e o Banquinho do app mostram uma versão em caixas enquanto o
   GLB carrega (Suspense próprio, em ModeloComReserva). No vídeo isso faria os
   primeiros quadros saírem com a plataforma e o banquinho errados. Este
   componente pede os mesmos arquivos ao useLoader do R3F SEM Suspense
   próprio: a suspensão sobe até o ThreeCanvas do @remotion/three, que segura o
   render (delayRender) até os modelos chegarem; aí a Plataforma e o Banquinho
   já os encontram no cache do useLoader (mesma URL, mesmo loader) e não
   chegam a mostrar a reserva. Assim o Banquinho do app entra sem mudança. */
function EsperarModelos() {
  /* Uma chamada por arquivo, como fazem a Plataforma e o Banquinho: a chave do
     cache do useLoader é a lista de URLs, e uma chamada com as duas juntas
     guardaria os modelos numa entrada que eles não procuram. */
  useLoader(GLTFLoader, urlDaPlataforma);
  useLoader(GLTFLoader, urlDoBanquinho);
  return null;
}

export function CenaDoBulgaro({ animacao, pose, carga, cores }: { animacao: Animacao; pose: Pose; carga: Carga; cores: CoresDaCena }) {
  const { width, height } = useVideoConfig();
  const camera = cameraDoVideo(animacao.camera ?? { posicao: [3.6, 1.45, -0.05], alvo: [0, 0.85, -0.05] });
  return (
    <ThreeCanvas width={width} height={height} dpr={1} camera={{ position: camera.posicao, fov: CAMPO_DE_VISAO, near: 0.05, far: 20 }}>
      {/* Estúdio igual ao do app (cena3d/VisualizadorExercicio.tsx, V1): fundo
          escuro, névoa que funde o chão, luz principal pela frente e duas de
          recorte por trás. A névoa começa mais longe que no app porque a
          câmera também está mais longe. */}
      <color attach="background" args={[cores.fundo]} />
      <fog attach="fog" args={[cores.fundo, 5.6, 9.2]} />
      <hemisphereLight args={['#cfd8e3', cores.fundo, 0.55]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
      <directionalLight position={[-3, 3, -4]} intensity={2.6} />
      <directionalLight position={[3, 2.5, -4]} intensity={1.8} color="#bfe9ff" />
      <CameraFixa camera={camera} />
      <EsperarModelos />
      <Chao cores={cores} />
      {/* Plataforma sempre plana: inclinação fora deste vídeo (descartada). */}
      <Plataforma cores={cores} />
      {animacao.cadeira && <Banquinho cadeira={animacao.cadeira} cores={cores} />}
      <BonecoNoQuadro pose={pose} carga={carga} musculos={animacao.musculos} cores={cores} />
    </ThreeCanvas>
  );
}
