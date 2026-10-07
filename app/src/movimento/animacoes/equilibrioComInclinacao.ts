import type { Animacao, Quadro } from '../animacao';
import { CORPO } from '../cenario';
import type { ModoBracos, Pose, PoseDoPe } from '../corpo';
import { EM_PE, carga, pesoNasMaos, pose, quadrilParaFlexao, subidaDoTornozeloNaRampa } from './comum';

/* Equilíbrio num pé só com inclinação (trilha Fisioterapia, tornozelo).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 7):
   - Apoio unipodal em superfície instável ou inclinada melhora o equilíbrio
     e reduz novas torções; o controle vem do tornozelo (pequenos ajustes,
     músculos fibulares).
   - Progressão: firme por 30 s → dificultar a superfície (aqui, inclinar).

   Apoio no pé esquerdo com o joelho levemente dobrado (~22°), pé direito
   dobrado para trás no ar; micro-oscilações irregulares do tornozelo; a
   base inclina conforme o nível do seletor (0°, 5°, 10°). */

const CENTRO_X = CORPO.meiaLarguraQuadril - 0.02; // centro do corpo sobre o pé esquerdo
const PE_LIVRE: PoseDoPe = { dx: 0.05, dz: -0.17, elevacao: 0.22 };

/* Micro-oscilações do quadril parado (m), irregulares: lado e frente/trás. */
const LADO = [0, 0.004, -0.003, 0.005, -0.004, 0.002, 0] as const;
const FRENTE = [0, -0.003, 0.004, -0.002, 0.003, -0.004, 0] as const;
const TEMPOS_PARADO = [2.6, 3.7, 4.8, 5.9, 7.0, 8.0, 8.8] as const;

export function equilibrioComInclinacao(bracos: ModoBracos, nivelDoSeletor: number): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const subida = subidaDoTornozeloNaRampa(nivelDoSeletor);
  const emPe = { y: EM_PE.y + subida, z: EM_PE.z };
  const apoio = quadrilParaFlexao(22);
  const numPeSo = (lado = 0, frente = 0) => ({ y: apoio.y + subida, z: apoio.z + frente, lateral: CENTRO_X + lado });

  const p = (quadril: { y: number; z: number }, lateral: number, peDireito: PoseDoPe, tronco = 3): Pose =>
    pose({ quadril, tronco, deslocamentoLateral: lateral, pes: { esquerdo: {}, direito: peDireito } }, bracos);
  const firme = (i: number) => {
    const q = numPeSo(LADO[i], FRENTE[i]);
    return p({ y: q.y, z: q.z }, q.lateral, PE_LIVRE);
  };
  const cargaFirme = (i: number) => carga(1, FRENTE[i]! * 40, maos(0.06), 1);
  const preparado = numPeSo();

  const parados: Quadro[] = TEMPOS_PARADO.map((t, i) => ({
    t,
    pose: firme(i),
    carga: cargaFirme(i),
    fase: i === TEMPOS_PARADO.length - 1 ? 'Apoie o pé direito' : 'Olhe para a frente e fique firme',
  }));

  const quadros: Quadro[] = [
    { t: 0, pose: p(emPe, 0, {}), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, com a base no nível indicado' },
    { t: 1.0, pose: p(emPe, 0, {}), carga: carga(1, 0.02, maos(0.04)), fase: 'Passe o peso para o pé esquerdo' },
    { t: 1.8, pose: p({ y: preparado.y, z: preparado.z }, CENTRO_X, {}), carga: carga(1, 0.02, maos(0.05), 1), fase: 'Tire o pé direito do chão' },
    ...parados,
    { t: 9.6, pose: p({ y: preparado.y, z: preparado.z }, CENTRO_X, {}), carga: carga(1, 0.02, maos(0.05), 1), fase: 'Volte o peso para o meio' },
    { t: 10.4, pose: p(emPe, 0, {}), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, com a base no nível indicado' },
    { t: 11.2, pose: p(emPe, 0, {}), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, com a base no nível indicado' },
  ];

  return {
    id: 'equilibrio-com-inclinacao',
    quadros,
    // Tornozelo (panturrilha) e quadril (glúteo médio) seguram o apoio num pé só.
    musculos: ['panturrilhas', 'abdutores'],
    prumo: 'apoio',
    // De lado: a rampa da base e o tornozelo de apoio à vista.
    camera: { posicao: [3.15, 1.88, 1.15], alvo: [0, 1.13, 0] },
  };
}
