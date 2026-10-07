import type { Carga } from '../movimento/animacao';

/* O que a plataforma mede num instante. No produto real vem das células de
   carga (base e barras) e do sensor de inclinação via Bluetooth; no protótipo
   vem do simulador. As telas só conhecem este formato: trocar simulação por
   hardware não muda nenhuma tela. */
export type Leitura = {
  readonly tempo: number; // segundos
  readonly pes: number; // fração do peso corporal na base
  readonly maos: number; // fração do peso nas barras
  readonly copAP: number; // centro de pressão frente/trás: −1 calcanhar … +1 ponta
  readonly copML: number; // lateral: −1 direita … +1 esquerda
  readonly cargaEsquerda: number; // fração da carga dos pés na perna esquerda (0–1)
  readonly oscilacao: number; // amplitude do balanço do corpo (0 parado … 1 desequilibrando)
  readonly variacaoPorSegundo: number; // velocidade de mudança da carga nos pés
  readonly inclinacao: number; // nível de inclinação lido pelo sensor da base (0–3)
  readonly distanciaDoAlvo: number; // distância do centro de pressão ao alvo (0 em cima, 1 longe)
};

/* O que se espera medir com a execução certa naquele instante. A carga vem
   da animação (a mesma que move o boneco), para o mapa de pressão e o 3D
   nunca contarem histórias diferentes. */
export type Esperado = Carga & {
  readonly inclinacao: number;
  readonly alvo?: { readonly ap: number; readonly ml: number };
  readonly cargaEsquerdaMeta?: number; // meta definida pelo profissional (ex.: 0,6 = 60% na esquerda)
};

/* Os desvios que a base consegue perceber. Cada correção do catálogo
   (src/dominio/catalogo.ts) aponta para um destes detectores. */
export type Desvio =
  | 'assimetria'
  | 'desvio-lateral'
  | 'apoio-excessivo'
  | 'apoio-total'
  | 'peso-na-ponta'
  | 'oscilacao'
  | 'perda-de-equilibrio'
  | 'brusco'
  | 'fora-do-alvo'
  | 'fora-da-base'
  | 'inclinacao-diferente'
  | 'firme-sem-apoio';

export type EstadoDaExecucao = 'ok' | 'dica' | 'atencao' | 'pare';
