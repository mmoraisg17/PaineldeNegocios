import type { Animacao, Quadro } from '../animacao';
import { CORPO } from '../cenario';
import type { ModoBracos, Pose } from '../corpo';
import { EM_PE, NUM_PE_SO, carga, pesoNasMaos, pose } from './comum';

/* Elevação de panturrilha unilateral (trilha Fisioterapia, tornozelo).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 3):
   - O teste unilateral é a medida clínica que melhor se relaciona com a
     força de flexão plantar na marcha; altura de referência ~5 cm.
   - Idosos fazem em média ~12 repetições e têm dificuldade de equilíbrio
     num pé só: por isso o nível 1 usa os dois pés e as barras.
   - Catálogo: subir, segurar 1 s no alto, descer devagar.

   O pé gira em torno da ponta (Pose.pes.calcanhar). Nos níveis 2 e 3 o
   peso vai para o pé esquerdo (lado da mão na barra no nível 3) e o direito
   fica dobrado para trás, no ar. */

const CALCANHAR = 14; // graus: com o pé do boneco (23 cm), o calcanhar sobe ~5,6 cm
const radianos = (graus: number) => (graus * Math.PI) / 180;
// Quanto o tornozelo (e o corpo todo) sobe quando o calcanhar sobe.
const SUBIDA =
  CORPO.peFrente * Math.sin(radianos(CALCANHAR)) + CORPO.alturaTornozelo * (Math.cos(radianos(CALCANHAR)) - 1);

/* Num pé só, o centro do corpo vai para cima do pé de apoio (8,5 cm para a
   esquerda; o pé está a 9,5 cm); o pé livre fica atrás e no ar. */
const SOBRE_O_PE_ESQUERDO = 0.085;
const PE_LIVRE = { dx: 0.05, dz: -0.17, elevacao: 0.22 } as const;

export function panturrilha(bracos: ModoBracos, nivel: 1 | 2 | 3): Animacao {
  const umPe = nivel >= 2;
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const copML = umPe ? 1 : 0;
  const p = (calcanhar: number): Pose =>
    pose(
      {
        quadril: { y: (umPe ? NUM_PE_SO : EM_PE).y + (calcanhar ? SUBIDA : 0), z: EM_PE.z },
        deslocamentoLateral: umPe ? SOBRE_O_PE_ESQUERDO : 0,
        pes: umPe ? { esquerdo: { calcanhar }, direito: PE_LIVRE } : { esquerdo: { calcanhar }, direito: { calcanhar } },
      },
      bracos,
    );
  const apoio = umPe ? 'Apoiado no pé esquerdo, olhando para a frente' : 'Em pé, peso nos dois pés';

  const quadros: Quadro[] = [
    { t: 0, pose: p(0), carga: carga(1, 0, maos(0.05), copML), fase: apoio },
    { t: 1.0, pose: p(0), carga: carga(1, 0, maos(0.05), copML), fase: 'Suba na ponta do pé, devagar' },
    { t: 2.5, pose: p(CALCANHAR), carga: carga(1.02, 0.85, maos(0.07), copML), fase: 'Segure 1 segundo lá em cima' },
    { t: 3.5, pose: p(CALCANHAR), carga: carga(1, 0.85, maos(0.07), copML), fase: 'Desça devagar' },
    { t: 5.5, pose: p(0), carga: carga(0.98, 0, maos(0.05), copML), fase: apoio },
    { t: 6.5, pose: p(0), carga: carga(1, 0, maos(0.05), copML), fase: apoio },
  ];

  return {
    id: 'panturrilha-unilateral',
    quadros,
    musculos: ['panturrilhas'],
    // De lado, um pouco por trás: o calcanhar subindo e a panturrilha ficam à vista.
    camera: { posicao: [2.85, 1.78, -2.05], alvo: [0, 1.06, -0.05] },
  };
}
