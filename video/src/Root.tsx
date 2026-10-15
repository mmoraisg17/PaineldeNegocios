import { Composition } from 'remotion';
import { Bulgaro } from './Bulgaro';
import { LucasEDiego } from './LucasEDiego';
import { ALTURA, FPS, LARGURA, PADRAO, type ParametrosDoVideo, montarRoteiro } from './roteiro';
import { montarRoteiroLucasEDiego } from './roteiroLucasEDiego';

/* Duração calculada do roteiro: mudar o nível (tempo da subida) ou a velocidade
   da câmera lenta muda o tamanho do vídeo sem editar número à mão. */
export function Raiz() {
  return (
    <>
      <Composition
        id="Bulgaro"
        component={Bulgaro}
        width={LARGURA}
        height={ALTURA}
        fps={FPS}
        durationInFrames={montarRoteiro(PADRAO).duracaoEmQuadros}
        defaultProps={PADRAO}
        calculateMetadata={({ props }: { props: ParametrosDoVideo }) => ({ durationInFrames: montarRoteiro(props).duracaoEmQuadros })}
      />
      {/* Lucas e Diego (contas de demonstração): sem props, os dados vêm do
          estado de demonstração do app numa data fixa (dadosDaDemo.ts). */}
      <Composition
        id="LucasEDiego"
        component={LucasEDiego}
        width={LARGURA}
        height={ALTURA}
        fps={FPS}
        durationInFrames={montarRoteiroLucasEDiego().duracaoEmQuadros}
      />
    </>
  );
}
