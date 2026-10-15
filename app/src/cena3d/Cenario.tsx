import type { Cadeira as CadeiraDaAnimacao } from '../movimento/animacao';
import { PLATAFORMA } from '../movimento/cenario';
import type { CoresDaCena } from './cores';

/* Tampa dos sensores: a área sensível em destaque sobre o topo plano da base.
   A superfície bate com alturaDaSuperficie (movimento/corpo.ts). */
export function Tampa({ cores }: { cores: CoresDaCena }) {
  const { largura, profundidade, altura, margemTampa } = PLATAFORMA;
  return (
    <mesh position={[0, altura + 0.002, 0]}>
      <boxGeometry args={[largura - 2 * margemTampa, 0.004, profundidade - 2 * margemTampa]} />
      <meshStandardMaterial color={cores.sensores} roughness={0.9} />
    </mesh>
  );
}

/* Barras: um poste sobre cada pino da lateral (no desenho, a 0,66 m um do
   outro) e a barra horizontal que liga os dois, na altura da pegada. */
export function Barras({ cores }: { cores: CoresDaCena }) {
  const { altura, barraX, pegadaAltura, postesZ } = PLATAFORMA;
  const baseDoPoste = altura - 0.01; // topo dos pinos
  const alturaPoste = altura + pegadaAltura - baseDoPoste;
  const comprimentoBarra = postesZ.ate - postesZ.de + 0.04;
  return (
    <>
      {[-1, 1].map((sx) => (
        <group key={`barra${sx}`}>
          {[postesZ.de, postesZ.ate].map((z) => (
            <mesh key={z} position={[sx * barraX, baseDoPoste + alturaPoste / 2, z]}>
              <cylinderGeometry args={[0.018, 0.018, alturaPoste, 14]} />
              <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[sx * barraX, altura + pegadaAltura, (postesZ.de + postesZ.ate) / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, comprimentoBarra, 14]} />
            <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* Plataforma em caixas: a reserva enquanto o modelo do desenho carrega (ou se
   ele falhar). Mesmas medidas da bandeja do desenho (movimento/cenario.ts). */
export function PlataformaSimples({ cores }: { cores: CoresDaCena }) {
  const { largura, profundidade, altura } = PLATAFORMA;
  return (
    <group>
      <mesh position={[0, altura / 2, 0]}>
        <boxGeometry args={[largura, altura, profundidade]} />
        <meshStandardMaterial color={cores.base} roughness={0.6} />
      </mesh>
      <Tampa cores={cores} />
      <Barras cores={cores} />
    </group>
  );
}

const LARGURA_ASSENTO = 0.46;
const ESPESSURA_ASSENTO = 0.04;
const ALTURA_ENCOSTO = 0.42;

export function Cadeira({ cadeira, cores }: { cadeira: CadeiraDaAnimacao; cores: CoresDaCena }) {
  const { assentoY, frenteZ, fundoZ } = cadeira;
  const profundidade = frenteZ - fundoZ;
  const zMeio = (frenteZ + fundoZ) / 2;
  const alturaPerna = assentoY - ESPESSURA_ASSENTO;
  const xPerna = LARGURA_ASSENTO / 2 - 0.03;

  return (
    <group>
      <mesh position={[0, assentoY - ESPESSURA_ASSENTO / 2, zMeio]}>
        <boxGeometry args={[LARGURA_ASSENTO, ESPESSURA_ASSENTO, profundidade]} />
        <meshStandardMaterial color={cores.madeira} roughness={0.8} />
      </mesh>
      <mesh position={[0, assentoY + ALTURA_ENCOSTO / 2, fundoZ + 0.015]}>
        <boxGeometry args={[LARGURA_ASSENTO, ALTURA_ENCOSTO, 0.03]} />
        <meshStandardMaterial color={cores.madeira} roughness={0.8} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [frenteZ - 0.03, fundoZ + 0.03].map((z) => (
          <mesh key={`${sx}${z}`} position={[sx * xPerna, alturaPerna / 2, z]}>
            <boxGeometry args={[0.03, alturaPerna, 0.03]} />
            <meshStandardMaterial color={cores.madeira} roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  );
}

/* Chão do estúdio: disco escuro que some no fundo pela névoa da cena, com um
   disco um pouco mais claro sob a plataforma, como um foco de luz (V1). */
export function Chao({ cores }: { cores: CoresDaCena }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.1, -0.001]}>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color={cores.chao} roughness={1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <circleGeometry args={[0.95, 48]} />
        <meshStandardMaterial color={cores.luzChao} roughness={1} />
      </mesh>
    </group>
  );
}
