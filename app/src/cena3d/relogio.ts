import type { Desvio } from '../sensores/tipos';

/* Estado compartilhado entre a cena 3D (que avança o tempo a cada quadro) e a
   simulação dos sensores (que lê esse tempo para saber em que fase do
   movimento a pessoa está). Fica num ref, e não em estado do React, porque
   muda 60 vezes por segundo. Este arquivo não importa three.js: a tela pode
   usá-lo sem baixar o pacote 3D. */
export type RelogioDaAnimacao = {
  tempo: number;
  velocidade: number;
  pausado: boolean;
  desvio: Desvio | null;
  /* Movimento reduzido: a cena começa pausada e as transições visuais (fade
     do destaque, rampa de pausa, respiração) viram troca direta. */
  menosMovimento: boolean;
};

export const novoRelogio = (menosMovimento = false): RelogioDaAnimacao => ({
  tempo: 0,
  velocidade: 1,
  pausado: menosMovimento,
  desvio: null,
  menosMovimento,
});
