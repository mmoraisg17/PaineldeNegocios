import type { Animacao, Quadro } from '../animacao';
import { CORPO } from '../cenario';
import type { ModoBracos, Pose, PoseDoPe } from '../corpo';
import { EM_PE, carga, pesoNasMaos, pose } from './comum';

/* Pés em linha / tandem (trilha Equilíbrio 60+).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 4):
   - Estágio do teste de 4 estágios: a oscilação aumenta conforme a base
     estreita (pés juntos → semi-tandem → tandem → um pé).
   - No tandem a base fica estreita no eixo lateral: o centro de pressão
     oscila mais para os lados; idosos com pior equilíbrio têm dificuldade
     nos ajustes rápidos do tornozelo.

   O pé direito vai para a frente do esquerdo, com o calcanhar encostado na
   ponta do de trás; o quadril se acomoda sobre a linha dos pés; parado ~6 s
   com oscilação lateral sutil e irregular (não um metrônomo); volta. */

const LINHA_X = CORPO.meiaLarguraQuadril; // os pés ficam na linha do pé esquerdo
// Calcanhar da frente na ponta do de trás: o tornozelo da frente fica um pé adiante.
const PE_DA_FRENTE: PoseDoPe = { dx: 2 * CORPO.meiaLarguraQuadril, dz: CORPO.peFrente + CORPO.peTras };
const NO_CAMINHO: PoseDoPe = { dx: CORPO.meiaLarguraQuadril, dz: 0.12, elevacao: 0.07 };
const PARADO: PoseDoPe = {};
// Com os pés em linha a base fica comprida: o quadril desce 2,5 cm para alcançar os dois.
const QUADRIL_NO_TANDEM = { y: EM_PE.y - 0.025, z: (CORPO.peFrente + CORPO.peTras) / 2 + EM_PE.z };

/* Oscilação lateral do quadril parado, em metros: irregular, de 0,5 a 1,2 cm. */
const OSCILACAO = [0, 0.011, -0.008, 0.006, -0.012, 0] as const;

export function pesEmLinha(bracos: ModoBracos): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  // O tronco acompanha só a oscilação (~1,4° a cada cm), não o deslocamento
  // do quadril para cima da linha dos pés.
  const emPe = (pe: PoseDoPe, lateral: number, quadril: { y: number; z: number } = EM_PE, oscila = 0): Pose =>
    pose({ quadril, deslocamentoLateral: lateral, inclinacaoLateral: oscila * 120, pes: { esquerdo: PARADO, direito: pe } }, bracos);
  const tandem = (oscila: number) => emPe(PE_DA_FRENTE, LINHA_X + oscila, QUADRIL_NO_TANDEM, oscila);
  // copML acompanha a oscilação do corpo (a base sente o balanço).
  const cargaParado = (oscila: number) => carga(1, 0.05, maos(0.06), oscila * 12);

  const quadros: Quadro[] = [
    { t: 0, pose: emPe(PARADO, 0), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, pés na largura do quadril' },
    { t: 1.0, pose: emPe(PARADO, 0), carga: carga(1, 0.02, maos(0.04)), fase: 'Leve o pé direito à frente do esquerdo' },
    { t: 1.8, pose: emPe(NO_CAMINHO, 0.06), carga: carga(1, 0.02, maos(0.06), 0.7), fase: 'Leve o pé direito à frente do esquerdo' },
    { t: 2.6, pose: tandem(OSCILACAO[0]), carga: cargaParado(OSCILACAO[0]), fase: 'Fique parado, olhando para a frente' },
    { t: 3.8, pose: tandem(OSCILACAO[1]), carga: cargaParado(OSCILACAO[1]), fase: 'Fique parado, olhando para a frente' },
    { t: 5.0, pose: tandem(OSCILACAO[2]), carga: cargaParado(OSCILACAO[2]), fase: 'Fique parado, olhando para a frente' },
    { t: 6.3, pose: tandem(OSCILACAO[3]), carga: cargaParado(OSCILACAO[3]), fase: 'Fique parado, olhando para a frente' },
    { t: 7.5, pose: tandem(OSCILACAO[4]), carga: cargaParado(OSCILACAO[4]), fase: 'Fique parado, olhando para a frente' },
    { t: 8.6, pose: tandem(OSCILACAO[5]), carga: cargaParado(OSCILACAO[5]), fase: 'Volte o pé para o lado' },
    { t: 9.4, pose: emPe(NO_CAMINHO, 0.06), carga: carga(1, 0.02, maos(0.06), 0.7), fase: 'Volte o pé para o lado' },
    { t: 10.2, pose: emPe(PARADO, 0), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, pés na largura do quadril' },
    { t: 11.0, pose: emPe(PARADO, 0), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, pés na largura do quadril' },
  ];

  // O tronco e os tornozelos seguram o corpo na base estreita.
  return { id: 'pes-em-linha', quadros, musculos: ['abdomen', 'panturrilhas'] };
}
