import { ALCANCE_POR_NIVEL, DIRECOES_DOS_ALVOS, TEMPO_POR_ALVO } from '../../sensores/esperado';
import type { Animacao, Quadro } from '../animacao';
import type { ModoBracos, Pose } from '../corpo';
import { EM_PE, carga, pesoNasMaos, pose, subidaDoTornozeloNaRampa } from './comum';

/* Transferência de peso com alvos (trilha Equilíbrio 60+).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 8):
   - Treinar os limites de estabilidade (levar o peso longe sem tirar os
     pés) com feedback visual do centro de pressão aumenta esses limites.
   - Deslocamentos pequenos usam a estratégia do TORNOZELO: o corpo inteiro
     inclina como um pêndulo, sem dobrar o quadril.

   Segue os alvos dos sensores (sensores/esperado.ts): frente, direita,
   trás, esquerda, 4 s cada, alcance pelo nível. Em cada alvo: vai em
   0,9 s, segura 2,2 s, volta ao centro em 0,9 s. Pés fixos. */

const IDA = 0.9;
const VOLTA = 0.9;
// Deslocamento do quadril (m) por unidade de alcance do centro de pressão.
const METROS_FRENTE_TRAS = 0.12;
const METROS_LADOS = 0.14;
const ALTURA_DO_CORPO = 1.0; // m: do tornozelo ao centro do corpo, para o ângulo da inclinação
// Joelhos destravados ao inclinar (1 cm): o corpo alcança o alvo sem esticar demais.
const JOELHOS_SOLTOS = 0.008;

const FRASES = { frente: 'Leve o peso para a frente', direita: 'Leve o peso para a direita', tras: 'Leve o peso para trás', esquerda: 'Leve o peso para a esquerda' };
const NOME = (ap: number, ml: number): keyof typeof FRASES => (ap > 0 ? 'frente' : ap < 0 ? 'tras' : ml < 0 ? 'direita' : 'esquerda');
const graus = (radianos: number) => (radianos * 180) / Math.PI;

export function transferenciaDePeso(bracos: ModoBracos, nivel: 1 | 2 | 3, nivelDoSeletor: number): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const alcance = ALCANCE_POR_NIVEL[nivel];
  const subida = subidaDoTornozeloNaRampa(nivelDoSeletor);

  /* Corpo inclinado inteiro (estratégia do tornozelo): o quadril desloca e o
     tronco inclina o mesmo ângulo das pernas, sem dobrar no quadril. */
  const inclinado = (ap: number, ml: number): Pose => {
    const dz = ap * alcance * METROS_FRENTE_TRAS;
    const dx = ml * alcance * METROS_LADOS;
    const solto = ap !== 0 || ml !== 0 ? JOELHOS_SOLTOS : 0;
    return pose(
      {
        quadril: { y: EM_PE.y + subida - solto, z: EM_PE.z + dz },
        deslocamentoLateral: dx,
        tronco: 2 + graus(Math.atan2(dz, ALTURA_DO_CORPO)),
        inclinacaoLateral: graus(Math.atan2(dx, ALTURA_DO_CORPO)),
      },
      bracos,
    );
  };
  const noCentro = inclinado(0, 0);

  const quadros: Quadro[] = DIRECOES_DOS_ALVOS.flatMap((d, k): Quadro[] => {
    const s = k * TEMPO_POR_ALVO;
    const alvo = carga(1, d.ap * alcance, maos(0.05), d.ml * alcance);
    return [
      { t: s, pose: noCentro, carga: alvo, fase: FRASES[NOME(d.ap, d.ml)] },
      { t: s + IDA, pose: inclinado(d.ap, d.ml), carga: alvo, fase: 'Segure no alvo, pés firmes' },
      { t: s + TEMPO_POR_ALVO - VOLTA, pose: inclinado(d.ap, d.ml), carga: alvo, fase: 'Volte devagar para o centro' },
    ];
  });
  const fim = DIRECOES_DOS_ALVOS.length * TEMPO_POR_ALVO;
  const primeiro = quadros[0]!;
  quadros.push({ ...primeiro, t: fim });

  return {
    id: 'transferencia-de-peso',
    quadros,
    // Tornozelos (frente/trás) e quadril (lados) levam o peso aos alvos.
    musculos: ['panturrilhas', 'abdutores'],
    prumo: 'apoio',
  };
}
