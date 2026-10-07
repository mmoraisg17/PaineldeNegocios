import type { Correcao, Exercicio } from '../dominio';
import type { Desvio, Esperado, EstadoDaExecucao, Leitura } from './tipos';

/* Limiares de detecção. São valores de projeto para a simulação, escolhidos
   para que a execução certa (com o balanço natural do corpo) nunca dispare
   aviso e cada erro injetado dispare. Com a plataforma real, viram parâmetros
   de calibração. */
export const LIMIAR = {
  assimetria: 0.12, // 12 pontos percentuais fora da meta (ex.: 38/62 numa meta 50/50)
  desvioLateral: 0.35,
  apoioAMais: 0.15, // 15% do peso a mais nas barras do que o esperado no momento
  apoioTotal: 0.5,
  pontaAMais: 0.35,
  oscilacao: 0.15,
  perdaDeEquilibrio: 0.35,
  variacaoBrusca: 1.2, // fração do peso por segundo
  foraDoAlvo: 0.3,
  borda: 0.92,
  firme: 0.06,
  semApoio: 0.08,
} as const;

/* Correção do catálogo → detector. Ids iguais em exercícios diferentes
   (ex.: perda-de-equilibrio) usam o mesmo detector. */
export const DETECTOR_DA_CORRECAO: Readonly<Record<string, Desvio>> = {
  'perna-dominante': 'assimetria',
  'peso-so-numa-perna': 'assimetria',
  'desvio-lateral': 'desvio-lateral',
  'pe-rolando-para-fora': 'desvio-lateral',
  'tronco-inclinado': 'desvio-lateral',
  'apoio-nas-barras': 'apoio-excessivo',
  'apoio-total-nas-barras': 'apoio-total',
  'peso-na-ponta': 'peso-na-ponta',
  'oscilacao-alta': 'oscilacao',
  'apoio-balancando': 'oscilacao',
  'oscilacao-extrema': 'perda-de-equilibrio',
  'perda-de-equilibrio': 'perda-de-equilibrio',
  'hora-de-usar-as-barras': 'perda-de-equilibrio',
  'descida-sem-controle': 'brusco',
  'subida-apressada': 'brusco',
  'movimento-brusco': 'brusco',
  'fora-do-alvo': 'fora-do-alvo',
  'pe-saindo-da-base': 'fora-da-base',
  'inclinacao-diferente': 'inclinacao-diferente',
  'pronto-para-soltar': 'firme-sem-apoio',
};

export function detectar(desvio: Desvio, l: Leitura, e: Esperado): boolean {
  switch (desvio) {
    case 'assimetria':
      return Math.abs(l.cargaEsquerda - (e.cargaEsquerdaMeta ?? (1 + e.copML) / 2)) > LIMIAR.assimetria;
    case 'desvio-lateral':
      return Math.abs(l.copML - e.copML) > LIMIAR.desvioLateral;
    case 'apoio-excessivo':
      return l.maos - e.maos > LIMIAR.apoioAMais;
    case 'apoio-total':
      return l.maos > LIMIAR.apoioTotal;
    case 'peso-na-ponta':
      return l.copAP - e.copAP > LIMIAR.pontaAMais;
    case 'oscilacao':
      return l.oscilacao > LIMIAR.oscilacao;
    case 'perda-de-equilibrio':
      return l.oscilacao > LIMIAR.perdaDeEquilibrio;
    case 'brusco':
      return Math.abs(l.variacaoPorSegundo) > LIMIAR.variacaoBrusca;
    case 'fora-do-alvo':
      return e.alvo !== undefined && l.distanciaDoAlvo > LIMIAR.foraDoAlvo;
    case 'fora-da-base':
      return Math.abs(l.copML) > LIMIAR.borda || Math.abs(l.copAP) > LIMIAR.borda;
    case 'inclinacao-diferente':
      return Math.round(l.inclinacao) !== e.inclinacao;
    case 'firme-sem-apoio':
      return l.oscilacao < LIMIAR.firme && l.maos < LIMIAR.semApoio;
  }
}

export type Avaliacao = {
  readonly estado: EstadoDaExecucao;
  readonly correcao: Correcao | null;
  readonly simetria: number; // 0–100
  readonly estabilidade: number; // 0–100
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* Nota de simetria e de estabilidade do instante, no formato que a progressão
   de nível (dominio/progressao.ts) consome. */
export function metricas(l: Leitura, e: Esperado): { simetria: number; estabilidade: number } {
  const alvo = e.cargaEsquerdaMeta ?? (1 + e.copML) / 2;
  return {
    simetria: Math.round(limitar(100 - Math.abs(l.cargaEsquerda - alvo) * 200, 0, 100)),
    estabilidade: Math.round(limitar(100 - l.oscilacao * 200, 0, 100)),
  };
}

/* Avalia a leitura contra as correções do exercício. A ordem importa: o que
   manda parar vem antes do que pede ajuste, e o elogio ("você está firme")
   só aparece quando não há nada a corrigir. */
export function avaliar(exercicio: Exercicio, l: Leitura, e: Esperado): Avaliacao {
  const m = metricas(l, e);
  const comDetector = exercicio.correcoes.flatMap((c) => {
    const d = DETECTOR_DA_CORRECAO[c.id];
    return d ? [{ correcao: c, desvio: d }] : [];
  });
  const positivas = comDetector.filter((x) => x.desvio === 'firme-sem-apoio');
  const negativas = comDetector.filter((x) => x.desvio !== 'firme-sem-apoio');
  const ordenadas = [...negativas.filter((x) => x.correcao.gravidade === 'pare'), ...negativas.filter((x) => x.correcao.gravidade !== 'pare')];

  const problema = ordenadas.find((x) => detectar(x.desvio, l, e));
  if (problema) return { estado: problema.correcao.gravidade === 'pare' ? 'pare' : 'atencao', correcao: problema.correcao, ...m };
  const elogio = positivas.find((x) => detectar(x.desvio, l, e));
  if (elogio) return { estado: 'dica', correcao: elogio.correcao, ...m };
  return { estado: 'ok', correcao: null, ...m };
}

/* Os erros que o painel do avaliador oferece para cada exercício: um por
   detector, sem o elogio. */
export function desviosSimulaveis(exercicio: Exercicio): { desvio: Desvio; correcao: Correcao }[] {
  const vistos = new Set<Desvio>();
  return exercicio.correcoes.flatMap((c) => {
    const d = DETECTOR_DA_CORRECAO[c.id];
    if (!d || d === 'firme-sem-apoio' || vistos.has(d)) return [];
    vistos.add(d);
    return [{ desvio: d, correcao: c }];
  });
}

export const ROTULO_DO_DESVIO: Readonly<Record<Desvio, string>> = {
  assimetria: 'Peso numa perna só',
  'desvio-lateral': 'Peso fugindo para o lado',
  'apoio-excessivo': 'Apoio demais nas barras',
  'apoio-total': 'Quase todo o peso nas barras',
  'peso-na-ponta': 'Peso na ponta dos pés',
  oscilacao: 'Corpo oscilando',
  'perda-de-equilibrio': 'Perda de equilíbrio',
  brusco: 'Movimento rápido demais',
  'fora-do-alvo': 'Longe do alvo',
  'fora-da-base': 'Pé saindo da base',
  'inclinacao-diferente': 'Inclinação errada',
  'firme-sem-apoio': 'Firme, sem apoio',
};
