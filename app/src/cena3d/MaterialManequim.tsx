import { useMemo } from 'react';
import { Color, type WebGLProgramParametersWithUniforms } from 'three';

/* Material do manequim (auditoria visual, V3): corpo claro e liso, com uma
   borda de luz nas silhuetas, o "fresnel" da referência. É o material padrão
   do three.js com um trecho a mais no shader: quanto mais a superfície fica
   de lado para a câmera, mais ela brilha. Sem pós-processamento e sem
   dependência nova; o custo é uma conta por pixel. */

const POTENCIA_DA_BORDA = 2.6; // maior = borda mais fina
const INTENSIDADE_DA_BORDA = 0.85;
/* Fora do componente: uma função nova a cada render seria reatribuída ao material. */
const chaveDoPrograma = () => 'manequim-fresnel';

export function MaterialManequim({ cor, borda }: { cor: string; borda: string }) {
  const corDaBorda = useMemo(() => new Color(borda), [borda]);
  const aoCompilar = useMemo(
    () => (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms['uCorDaBorda'] = { value: corDaBorda };
      shader.uniforms['uPotenciaDaBorda'] = { value: POTENCIA_DA_BORDA };
      shader.uniforms['uIntensidadeDaBorda'] = { value: INTENSIDADE_DA_BORDA };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main() {',
          'uniform vec3 uCorDaBorda;\nuniform float uPotenciaDaBorda;\nuniform float uIntensidadeDaBorda;\nvoid main() {',
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float fresnel = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), uPotenciaDaBorda);
          totalEmissiveRadiance += uCorDaBorda * fresnel * uIntensidadeDaBorda;`,
        );
    },
    [corDaBorda],
  );

  return (
    <meshStandardMaterial
      color={cor}
      roughness={0.5}
      metalness={0}
      onBeforeCompile={aoCompilar}
      // Programa próprio: sem isso o three reaproveitaria o shader de outro
      // meshStandardMaterial (plataforma) e a borda sumiria ou vazaria.
      customProgramCacheKey={chaveDoPrograma}
    />
  );
}
