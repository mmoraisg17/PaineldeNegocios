import type { Animacao, Quadro } from '../animacao';
import { CORPO, PLATAFORMA, TOPO_BASE } from '../cenario';
import type { ModoBracos, Pose, PoseDoPe } from '../corpo';
import { NUM_PE_SO, carga, pesoNasMaos, pose } from './comum';

/* Abdução de quadril com elástico (trilha Equilíbrio 60+).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 6):
   - Glúteo médio: segura a pelve; fraco, a pelve cai do lado oposto
     (Trendelenburg) e aumenta o risco de queda de lado.
   - Forma recomendada para idosos: abertura curta e "limpa" para o lado,
     pelve nivelada e tronco parado; ~20–30° (30° com a maior ativação).

   Apoio na perna esquerda, mão esquerda na barra (catálogo: uma mão em todos
   os níveis); a perna direita abre ~22° para o lado, reta, puxando o
   elástico preso na base da barra esquerda; volta devagar. 22° mantém o pé
   dentro da base (meia largura 0,35 m). */

const ABDUCAO = 22; // graus
const radianos = (graus: number) => (graus * Math.PI) / 180;
const PE_DE_APOIO_X = CORPO.meiaLarguraQuadril; // esquerdo, no lugar
const CENTRO_X = PE_DE_APOIO_X - 0.02; // centro do corpo sobre o pé de apoio
const QUADRIL_DIREITO_X = CENTRO_X - CORPO.meiaLarguraQuadril;
// "Reta" no boneco: o IK nunca estica além de 99,5% (movimento/ik.ts), o que
// já deixa ~11,5° de joelho. 99,3% dá ~14°, mais reta que em pé (~16°), com
// folga para a perna não passar do alcance entre um quadro e outro.
const PERNA = (CORPO.canela + CORPO.coxa) * 0.993;
const TORNOZELO_PADRAO_Y = TOPO_BASE + CORPO.alturaTornozelo;
const EM_Z = NUM_PE_SO.z; // o pé livre fica sob o quadril, sem ir à frente

/* Pé direito com a perna aberta `graus` para o lado, reta, a partir do quadril. */
function peAberto(graus: number): PoseDoPe {
  const x = QUADRIL_DIREITO_X - PERNA * Math.sin(radianos(graus));
  const y = NUM_PE_SO.y - PERNA * Math.cos(radianos(graus));
  return { dx: x + CORPO.meiaLarguraQuadril, dz: EM_Z, elevacao: Math.max(0, y - TORNOZELO_PADRAO_Y) };
}

export function abducao(bracos: ModoBracos): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const p = (pe: PoseDoPe): Pose =>
    pose({ quadril: NUM_PE_SO, deslocamentoLateral: CENTRO_X, pes: { esquerdo: {}, direito: pe } }, bracos);
  const junto = peAberto(4); // pé de leve no chão, joelho relaxado
  const saindo = peAberto(13); // o pé sai do chão e a perna se estica
  const meio = peAberto(17.5); // quadros no arco: o pé não corta caminho
  const aberto = peAberto(ABDUCAO);
  // Todo o peso no pé esquerdo (copML 1).
  const quadros: Quadro[] = [
    { t: 0, pose: p(junto), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Apoiado na perna esquerda, mão na barra' },
    { t: 1.0, pose: p(junto), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Abra a perna direita para o lado, devagar' },
    { t: 1.6, pose: p(saindo), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Abra a perna direita para o lado, devagar' },
    { t: 2.1, pose: p(meio), carga: carga(1, 0.02, maos(0.07), 1), fase: 'Abra a perna direita para o lado, devagar' },
    { t: 2.6, pose: p(aberto), carga: carga(1, 0.02, maos(0.07), 1), fase: 'Segure, tronco parado' },
    { t: 3.2, pose: p(aberto), carga: carga(1, 0.02, maos(0.07), 1), fase: 'Volte devagar, controlando o elástico' },
    { t: 3.9, pose: p(meio), carga: carga(1, 0.02, maos(0.07), 1), fase: 'Volte devagar, controlando o elástico' },
    { t: 4.5, pose: p(saindo), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Volte devagar, controlando o elástico' },
    { t: 5.2, pose: p(junto), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Apoiado na perna esquerda, mão na barra' },
    { t: 6.0, pose: p(junto), carga: carga(1, 0.02, maos(0.06), 1), fase: 'Apoiado na perna esquerda, mão na barra' },
  ];

  return {
    id: 'abducao-com-elastico',
    quadros,
    musculos: ['abdutores'],
    prumo: 'apoio',
    // Base do poste da frente da barra esquerda.
    elastico: { ancora: [PLATAFORMA.barraX, TOPO_BASE + 0.02, PLATAFORMA.pegadaZ.ate], lado: 'direito' },
    // De frente: a perna abrindo para o lado e o tronco parado à vista.
    camera: { posicao: [0.5, 1.72, 3.3], alvo: [-0.05, 1.07, 0] },
  };
}
