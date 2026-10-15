import { type Amostra, type Animacao, amostrar } from '../../app/src/movimento/animacao';
import { saltoComContramovimento, temposDoSalto } from '../../app/src/movimento/animacoes/saltoComContramovimento';

/* Roteiro do vídeo: qual instante da animação do app aparece em cada quadro.

   É uma função pura do número do quadro, sem relógio: o Remotion renderiza
   os quadros fora de ordem e em paralelo, e qualquer estado acumulado (como
   o `relogio.tempo += delta` do app) daria um vídeo diferente a cada render.
   O teste (roteiro.test.ts) confere isso. */

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;

export type Nivel = 1 | 2 | 3;
export type ParametrosDoVideo = { nivel: Nivel; velocidadeLenta: number };
export const PADRAO: ParametrosDoVideo = { nivel: 3, velocidadeLenta: 0.5 };

/* Durações em segundos de vídeo. A abertura mostra o título; o fecho, o aviso. */
const ABERTURA = 2;
const FECHO = 1.8;
/* Janela da animação que o vídeo mostra, em torno do salto: começa um pouco
   antes do contramovimento e termina quando o atleta já está levantando. Os
   2 s parado do fim do ciclo do app ficam de fora: no vídeo seriam tempo morto. */
const ANTES_DA_DESCIDA = 0.2;
const DEPOIS_DO_POUSO = 1.3;

export type IdDoTrecho = 'abertura' | 'lenta' | 'real' | 'fecho';
export type Trecho = {
  readonly id: IdDoTrecho;
  readonly de: number; // primeiro quadro do trecho
  readonly ate: number; // primeiro quadro DEPOIS do trecho
  readonly tempoInicial: number; // segundos da animação no quadro `de`
  readonly velocidade: number; // segundos de animação por segundo de vídeo
};

export type Roteiro = {
  readonly animacao: Animacao;
  readonly trechos: readonly Trecho[];
  readonly duracaoEmQuadros: number;
  readonly tempos: ReturnType<typeof temposDoSalto>;
};

const quadros = (segundos: number) => Math.round(segundos * FPS);

export function montarRoteiro({ nivel, velocidadeLenta }: ParametrosDoVideo): Roteiro {
  // 'barras' é o que o app usa; nos níveis 2 e 3 a animação cruza os braços sozinha.
  const animacao = saltoComContramovimento('barras', nivel);
  const tempos = temposDoSalto(nivel);
  const inicio = tempos.tFundo - 0.5 - ANTES_DA_DESCIDA; // 0,5 s = descida do contramovimento
  const fim = tempos.tPouso + DEPOIS_DO_POUSO;
  const janela = fim - inicio;

  const trechos: Trecho[] = [];
  const somar = (id: IdDoTrecho, duracao: number, tempoInicial: number, velocidade: number) => {
    const de = trechos.at(-1)?.ate ?? 0;
    trechos.push({ id, de, ate: de + duracao, tempoInicial, velocidade });
  };
  /* Na abertura o tempo já corre (1×) e chega em `inicio` no fim dela: o
     boneco respira parado em pé, e a câmera lenta começa sem salto. Antes de
     zero o ciclo dá a volta e cai no "em pé" do fim, que é a mesma pose. */
  somar('abertura', quadros(ABERTURA), inicio - quadros(ABERTURA) / FPS, 1);
  somar('lenta', quadros(janela / velocidadeLenta), inicio, velocidadeLenta);
  somar('real', quadros(janela), inicio, 1);
  // O fecho continua de onde o trecho real parou de fato (o arredondamento
  // para quadros inteiros faria o tempo pular um pouco na emenda).
  somar('fecho', quadros(FECHO), inicio + quadros(janela) / FPS, 1);
  return { animacao, trechos, duracaoEmQuadros: trechos.at(-1)?.ate ?? 0, tempos };
}

export function trechoNoQuadro(roteiro: Roteiro, quadro: number): Trecho {
  const trechos = roteiro.trechos;
  const achado = trechos.find((t) => quadro >= t.de && quadro < t.ate);
  // Fora da duração (o Studio deixa arrastar até o fim): o último trecho segura.
  return achado ?? (quadro < 0 ? trechos[0] : trechos.at(-1))!;
}

/* Segundos da animação do app mostrados no quadro. */
export function tempoNoQuadro(roteiro: Roteiro, quadro: number): number {
  const trecho = trechoNoQuadro(roteiro, quadro);
  return trecho.tempoInicial + ((quadro - trecho.de) / FPS) * trecho.velocidade;
}

/* O inverso: em que quadro do trecho a animação passa pelo instante `tempo`. */
export function quadroDoTempo(roteiro: Roteiro, tempo: number, id: IdDoTrecho): number {
  const trecho = roteiro.trechos.find((t) => t.id === id);
  if (!trecho) throw new Error(`Trecho ${id} não existe no roteiro`);
  return trecho.de + Math.round(((tempo - trecho.tempoInicial) / trecho.velocidade) * FPS);
}

export function amostraNoQuadro(roteiro: Roteiro, quadro: number): Amostra {
  return amostrar(roteiro.animacao, tempoNoQuadro(roteiro, quadro));
}

/* Quadros desde que a legenda de fase mudou (para o texto novo aparecer
   esmaecendo). Olha para trás quadro a quadro: sem estado guardado, o
   resultado não depende da ordem em que o Remotion renderiza. */
export function quadrosDesdeATrocaDeFase(roteiro: Roteiro, quadro: number, limite = 15): number {
  const fase = amostraNoQuadro(roteiro, quadro).fase;
  for (let k = 1; k <= limite; k++) {
    if (quadro - k < 0 || amostraNoQuadro(roteiro, quadro - k).fase !== fase) return k - 1;
  }
  return limite;
}

/* Quadro do pôster: o ápice do voo (~2,0 s da animação no nível 3) na
   câmera lenta. O script `npm run poster` usa este número; o teste confere. */
export function quadroDoPoster(roteiro: Roteiro): number {
  const { tDecola, tPouso } = roteiro.tempos;
  return quadroDoTempo(roteiro, (tDecola + tPouso) / 2, 'lenta');
}
