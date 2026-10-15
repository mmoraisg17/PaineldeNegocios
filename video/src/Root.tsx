import { Composition } from 'remotion';
import { Salto } from './Salto';
import { ALTURA, FPS, LARGURA, PADRAO, type ParametrosDoVideo, montarRoteiro } from './roteiro';

/* Duração calculada do roteiro: mudar o nível (tempo de voo) ou a velocidade
   da câmera lenta muda o tamanho do vídeo sem editar número à mão. */
export function Raiz() {
  return (
    <Composition
      id="Salto"
      component={Salto}
      width={LARGURA}
      height={ALTURA}
      fps={FPS}
      durationInFrames={montarRoteiro(PADRAO).duracaoEmQuadros}
      defaultProps={PADRAO}
      calculateMetadata={({ props }: { props: ParametrosDoVideo }) => ({ durationInFrames: montarRoteiro(props).duracaoEmQuadros })}
    />
  );
}
