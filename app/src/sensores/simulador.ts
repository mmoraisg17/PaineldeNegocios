import type { Carga } from '../movimento/animacao';
import type { Desvio, Esperado, Leitura } from './tipos';

/* Simulador da plataforma. Parte do que a execução certa produziria naquele
   instante (Esperado), soma o balanço natural do corpo e, se pedido, um
   desvio. Determinístico (função do tempo), para os testes e para a
   demonstração serem reproduzíveis. */

/* Balanço natural: duas senóides lentas por eixo (0,3–0,9 Hz, faixa típica
   da oscilação postural em pé). Amplitude pequena o bastante para nunca
   disparar aviso numa execução certa. */
const BALANCO = 0.035;
const OSCILACAO_NATURAL = 0.05;

function balanco(tempo: number, amplitude: number) {
  const tau = 2 * Math.PI;
  return {
    ap: amplitude * (Math.sin(tau * 0.35 * tempo) + 0.5 * Math.sin(tau * 0.9 * tempo + 0.7)),
    ml: amplitude * (Math.sin(tau * 0.27 * tempo + 1.1) + 0.4 * Math.sin(tau * 0.8 * tempo)),
  };
}

type Perturbacao = Partial<{
  copML: number;
  copAP: number;
  maos: number;
  pes: number;
  amplitude: number;
  oscilacao: number;
  variacao: number;
  inclinacao: number;
  distanciaDoAlvo: number;
}>;

/* Como cada desvio aparece nos sensores. Valores bem acima dos limiares de
   regras.ts, para a demonstração ser inequívoca. */
const PERTURBACAO: Readonly<Record<Desvio, Perturbacao>> = {
  assimetria: { copML: -0.5 },
  'desvio-lateral': { copML: 0.55 },
  'apoio-excessivo': { maos: 0.28, pes: -0.28 },
  'apoio-total': { maos: 0.6, pes: -0.6 },
  'peso-na-ponta': { copAP: 0.55 },
  oscilacao: { amplitude: 5, oscilacao: 0.22 },
  'perda-de-equilibrio': { amplitude: 9, oscilacao: 0.45, maos: 0.3, pes: -0.3 },
  brusco: { variacao: 2 },
  'fora-do-alvo': { distanciaDoAlvo: 0.6 },
  'fora-da-base': { copML: 0.98 },
  'inclinacao-diferente': { inclinacao: 1 },
  'firme-sem-apoio': { oscilacao: -0.03 },
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function simularLeitura(esperado: Esperado, desvio: Desvio | null, tempo: number, anterior?: Leitura): Leitura {
  const p: Perturbacao = desvio ? PERTURBACAO[desvio] : {};
  const b = balanco(tempo, BALANCO * (p.amplitude ?? 1));
  const copML = limitar(esperado.copML + b.ml + (p.copML ?? 0), -1, 1);
  const copAP = limitar(esperado.copAP + b.ap + (p.copAP ?? 0), -1, 1);
  const pes = Math.max(0, esperado.pes + (p.pes ?? 0));
  const dt = anterior ? tempo - anterior.tempo : 0;
  const variacao = dt > 0 && anterior ? (pes - anterior.pes) / dt : 0;
  const alvo = esperado.alvo;

  return {
    tempo,
    pes,
    maos: limitar(esperado.maos + (p.maos ?? 0), 0, 1),
    copAP,
    copML,
    cargaEsquerda: (1 + copML) / 2,
    oscilacao: Math.max(0, OSCILACAO_NATURAL + (p.oscilacao ?? 0)),
    variacaoPorSegundo: variacao + (p.variacao ?? 0),
    inclinacao: esperado.inclinacao + (p.inclinacao ?? 0),
    distanciaDoAlvo: alvo ? Math.min(1, Math.hypot(copAP - alvo.ap, copML - alvo.ml) + (p.distanciaDoAlvo ?? 0)) : 0,
  };
}

/* Carga de quem está parado em pé, simétrico, com as mãos de leve nas
   barras: o "esperado" dos exercícios que ainda não têm animação. */
export const CARGA_EM_PE: Carga = { pes: 0.97, copAP: 0, copML: 0, maos: 0.03 };
