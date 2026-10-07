import type { Animacao, Carga, Quadro } from '../animacao';
import { QUADRIL_ACIMA_DO_ASSENTO } from '../cenario';
import { type ModoBracos, type Pose, alturaEmPe } from '../corpo';

/* Sentar e levantar (trilha Equilíbrio 60+).

   Pesquisa (07/10/2026), resumida no relatório da fase 3:
   - Fases: flexão do tronco → transferência de momento (o quadril sai da
     cadeira) → extensão → estabilização (PMC12404020).
   - Tronco a ~40–60° de flexão na saída da cadeira (estratégia de flexão
     completa: 58,8 ± 17,9°); joelho a ~85–100° numa cadeira de ~40 cm.
   - Pés na largura do quadril e um pouco atrás dos joelhos; nível sem apoio
     com braços cruzados no peito (teste de levantar da cadeira, STEADI/CDC).
   - Idosos são mais lentos em todas as fases; a descida (sentar) deve ser
     controlada, sem "despencar" na cadeira.
   - O que a base mede: o peso nos pés sobe de ~30% sentado para um pico acima
     de 100% no impulso, e o centro de pressão anda do calcanhar para a frente
     até a saída da cadeira. Assimetria de carga aparece antes mesmo de sair
     da cadeira (PMC3976795): é o erro principal que o app corrige aqui.

   Tempo total do ciclo: 8,8 s, devagar de propósito (demonstração para 60+).
   A `fase` de cada quadro é a instrução mostrada enquanto o boneco vai DELE
   até o próximo quadro. */

const QUADRIL_SENTADO = { y: 0.625, z: -0.33 };
const QUADRIL_EM_PE_Z = -0.02;

export const CADEIRA_SENTAR = {
  assentoY: QUADRIL_SENTADO.y - QUADRIL_ACIMA_DO_ASSENTO,
  frenteZ: -0.26,
  fundoZ: -0.68,
} as const;

/* Onde as mãos seguram a barra: um pouco à frente do quadril em pé. Sentada,
   a pessoa alcança à frente; em pé, a mão fica ao lado do quadril. As mãos não
   escorregam pela barra durante o movimento, então o ponto é o mesmo sempre. */
const MAO_Z = -0.05;

function pose(quadril: { y: number; z: number }, tronco: number, bracos: ModoBracos, maoZ = MAO_Z): Pose {
  return { quadril, tronco, deslocamentoLateral: 0, inclinacaoLateral: 0, cabeca: 0, bracos, maoZ };
}

const carga = (pes: number, copAP: number, maos: number): Carga => ({ pes, copAP, copML: 0, maos });

export function sentarELevantar(bracos: ModoBracos = 'barras'): Animacao {
  const comBarras = bracos === 'barras' || bracos === 'uma-mao';
  // Com as barras, parte do impulso vai para as mãos: os pés medem menos no
  // pico, e pés + mãos somam ~120% do peso na saída (o impulso para subir).
  const maos = (valor: number) => (comBarras ? valor : 0);
  const emPe = { y: alturaEmPe(QUADRIL_EM_PE_Z), z: QUADRIL_EM_PE_Z };

  const quadros: Quadro[] = [
    { t: 0, pose: pose(QUADRIL_SENTADO, 8, bracos), carga: carga(0.3, -0.35, maos(0.05)), fase: 'Sentado, pés firmes na base' },
    { t: 1.0, pose: pose(QUADRIL_SENTADO, 8, bracos), carga: carga(0.3, -0.35, maos(0.05)), fase: 'Incline o tronco à frente' },
    { t: 2.2, pose: pose(QUADRIL_SENTADO, 48, bracos), carga: carga(0.55, 0.0, maos(0.1)), fase: 'Empurre com as duas pernas' },
    {
      t: 2.8,
      pose: pose({ y: QUADRIL_SENTADO.y + 0.015, z: -0.27 }, 52, bracos),
      carga: carga(comBarras ? 1.05 : 1.15, 0.3, maos(0.15)),
      fase: 'Estenda joelhos e quadril',
    },
    { t: 3.9, pose: pose({ y: 0.86, z: -0.11 }, 28, bracos), carga: carga(comBarras ? 0.96 : 1.02, 0.12, maos(0.08)), fase: 'Fique em pé, firme' },
    { t: 4.8, pose: pose(emPe, 2, bracos), carga: carga(1.0, 0.02, maos(0.03)), fase: 'Em pé, firme' },
    { t: 5.8, pose: pose(emPe, 2, bracos), carga: carga(1.0, 0.02, maos(0.03)), fase: 'Sente devagar, quadril para trás' },
    { t: 7.0, pose: pose({ y: 0.83, z: -0.14 }, 34, bracos), carga: carga(0.98, 0.08, maos(0.1)), fase: 'Controle a descida' },
    {
      t: 8.0,
      pose: pose({ y: QUADRIL_SENTADO.y + 0.01, z: -0.31 }, 40, bracos),
      carga: carga(0.6, -0.05, maos(0.12)),
      fase: 'Apoie-se na cadeira',
    },
    { t: 8.8, pose: pose(QUADRIL_SENTADO, 8, bracos), carga: carga(0.3, -0.35, maos(0.05)), fase: 'Sentado, pés firmes na base' },
  ];

  return { id: 'sentar-e-levantar', quadros, cadeira: CADEIRA_SENTAR };
}
