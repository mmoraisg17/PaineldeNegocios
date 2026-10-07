import type { Cadeira as CadeiraDaAnimacao } from '../movimento/animacao';
import { PLATAFORMA } from '../movimento/cenario';
import type { CoresDaCena } from './cores';

/* Plataforma modelada a partir do desenho da base de 06/10/2026: caixa com
   tampa (área dos sensores em destaque), abas laterais com dois furos onde
   entram os postes das barras, e quatro pés. Medidas em movimento/cenario.ts. */
export function Plataforma({ cores }: { cores: CoresDaCena }) {
  const { largura, profundidade, altura, alturaPes, margemTampa, barraX, pegadaAltura, pegadaZ } = PLATAFORMA;
  const corpoAltura = altura - alturaPes;
  const alturaPoste = pegadaAltura + altura - 0.06;
  const xPes = largura / 2 - 0.06;
  const zPes = profundidade / 2 - 0.06;

  return (
    <group>
      {/* Caixa da base */}
      <mesh position={[0, alturaPes + corpoAltura / 2, 0]}>
        <boxGeometry args={[largura, corpoAltura, profundidade]} />
        <meshStandardMaterial color={cores.base} roughness={0.6} />
      </mesh>
      {/* Tampa: área dos sensores */}
      <mesh position={[0, altura + 0.002, 0]}>
        <boxGeometry args={[largura - 2 * margemTampa, 0.004, profundidade - 2 * margemTampa]} />
        <meshStandardMaterial color={cores.sensores} roughness={0.9} />
      </mesh>
      {/* Pés antiderrapantes */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`pe${sx}${sz}`} position={[sx * xPes, alturaPes / 2, sz * zPes]}>
            <cylinderGeometry args={[0.03, 0.035, alturaPes, 16]} />
            <meshStandardMaterial color={cores.sapato} />
          </mesh>
        )),
      )}
      {/* Abas laterais + barras (dois postes por lado, como os dois furos da aba) */}
      {[-1, 1].map((sx) => (
        <group key={`barra${sx}`}>
          <mesh position={[sx * (largura / 2 + 0.045), altura - 0.04, (pegadaZ.de + pegadaZ.ate) / 2]}>
            <boxGeometry args={[0.09, 0.03, pegadaZ.ate - pegadaZ.de + 0.08]} />
            <meshStandardMaterial color={cores.base} roughness={0.6} />
          </mesh>
          {[pegadaZ.de, pegadaZ.ate].map((z) => (
            <mesh key={z} position={[sx * barraX, altura - 0.06 + alturaPoste / 2, z]}>
              <cylinderGeometry args={[0.018, 0.018, alturaPoste, 14]} />
              <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[sx * barraX, altura + pegadaAltura, (pegadaZ.de + pegadaZ.ate) / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, pegadaZ.ate - pegadaZ.de + 0.04, 14]} />
            <meshStandardMaterial color={cores.metal} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ))}
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
