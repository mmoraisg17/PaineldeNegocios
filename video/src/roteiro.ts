import { type Amostra, type Animacao, amostrar } from '../../app/src/movimento/animacao';
import { temposDoBulgaro } from '../../app/src/movimento/animacoes/agachamentoBulgaroExplosivo';
import { animacaoDe } from '../../app/src/movimento/animacoes/index';

/* Roteiro do vídeo: qual instante da animação do app aparece em cada quadro.

   É uma função pura do número do quadro, sem relógio: o Remotion renderiza
   os quadros fora de ordem e em paralelo, e qualquer estado acumulado (como
   o `relogio.tempo += delta` do app) daria um vídeo diferente a cada render.
   O teste (roteiro.test.ts) confere isso. */

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;

export const ID_DO_EXERCICIO = 'agachamento-bulgaro-explosivo';

export type Nivel = 1 | 2 | 3;
export type ParametrosDoVideo = { nivel: Nivel; velocidadeLenta: number };
export const PADRAO: ParametrosDoVideo = { nivel: 3, velocidadeLenta: 0.5 };

/* Durações em segundos de vídeo. A abertura mostra o título; o fecho, o aviso. */
const ABERTURA = 2;
const FECHO = 1.6;
/* Janela da animação que o vídeo mostra: do começo da descida até logo depois
   de o atleta voltar a ficar em pé. A pausa parada do início e o "firme no
   fim" do ciclo do app ficam quase todos de fora: no vídeo seriam tempo morto,
   e a câmera lenta dobra tudo o que entra na janela. */
const ANTES_DA_DESCIDA = 0.1;
const DEPOIS_DO_TOPO = 0.3;

export type IdDoTrecho = 'abertura' | 'lenta' | 'real' | 'fecho';
export type Trecho = {
  readonly id: IdDoTrecho;
  readonly de: number; // primeiro quadro do trecho
  readonly ate: number; // primeiro quadro DEPOIS do trecho
  readonly tempoInicial: number; // segundos da animação no quadro `de`
  readonly velocidade: number; // segundos de animação por segundo de vídeo
};

/* Instantes do ciclo (segundos da animação). `inicioDaDescida` não é exportado
   pelo app; vem do quadro-chave anterior ao fundo (é ali que a pose começa a
   mudar), para o vídeo não carregar uma cópia da constante DESCIDA. */
export type TemposDoCiclo = ReturnType<typeof temposDoBulgaro> & {
  readonly inicioDaDescida: number;
  readonly descida: number; // s, do começo da descida ao fundo
  readonly subida: number; // s, do fim da pausa no fundo até em pé
};

export type Roteiro = {
  readonly animacao: Animacao;
  readonly trechos: readonly Trecho[];
  readonly duracaoEmQuadros: number;
  readonly tempos: TemposDoCiclo;
};

const quadros = (segundos: number) => Math.round(segundos * FPS);

export function temposDoCiclo(animacao: Animacao, nivel: Nivel): TemposDoCiclo {
  const tempos = temposDoBulgaro(nivel);
  const anteriores = animacao.quadros.filter((q) => q.t < tempos.tFundo - 1e-9);
  const inicioDaDescida = anteriores.at(-1)?.t ?? 0;
  return { ...tempos, inicioDaDescida, descida: tempos.tFundo - inicioDaDescida, subida: tempos.tTopo - tempos.tComeca };
}

export function montarRoteiro({ nivel, velocidadeLenta }: ParametrosDoVideo): Roteiro {
  /* Braços cruzados no peito: no nível 3 o búlgaro é sem as mãos, e as
     barras só poluiriam a vista lateral. Inclinação 0 de propósito: a ideia de
     inclinar a plataforma neste vídeo foi descartada (o teste confere). */
  const animacao = animacaoDe(ID_DO_EXERCICIO, { nivel, bracos: 'cruzados' });
  if (!animacao) throw new Error(`O app não tem animação para ${ID_DO_EXERCICIO}`);
  const tempos = temposDoCiclo(animacao, nivel);
  const inicio = tempos.inicioDaDescida - ANTES_DA_DESCIDA;
  const fim = tempos.tTopo + DEPOIS_DO_TOPO;
  const janela = fim - inicio;

  const trechos: Trecho[] = [];
  const somar = (id: IdDoTrecho, duracao: number, tempoInicial: number, velocidade: number) => {
    const de = trechos.at(-1)?.ate ?? 0;
    trechos.push({ id, de, ate: de + duracao, tempoInicial, velocidade });
  };
  /* Na abertura o tempo anda de 0 até `inicio`, mais devagar que 1×: o
     boneco respira parado em pé (pausa inicial do ciclo) e a câmera lenta
     começa sem pulo. Não dá para começar antes de zero: o ciclo é curto
     (5,6 s) e a volta cairia no meio da subida. */
  somar('abertura', quadros(ABERTURA), 0, inicio / ABERTURA);
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

/* Cronômetro do exercício no instante `tempo`: em que parte do movimento o
   atleta está e há quanto tempo (segundos da animação, não do vídeo: na
   câmera lenta ele anda na metade da velocidade, e a subida continua "0,6 s"). */
export type Cronometro = { readonly etapa: 'parado' | 'descida' | 'fundo' | 'subida' | 'topo'; readonly descida: number; readonly subida: number };

export function cronometroNoTempo(tempos: TemposDoCiclo, tempo: number): Cronometro {
  const { inicioDaDescida, tFundo, tComeca, tTopo, descida, subida } = tempos;
  const entre = (de: number, ate: number) => Math.min(Math.max(tempo - de, 0), ate - de);
  const etapa =
    tempo < inicioDaDescida ? 'parado' : tempo < tFundo ? 'descida' : tempo < tComeca ? 'fundo' : tempo < tTopo ? 'subida' : 'topo';
  // Antes da descida os dois zeram (o ciclo recomeça); depois, cada um para no total.
  if (etapa === 'parado') return { etapa, descida: 0, subida: 0 };
  return { etapa, descida: Math.min(entre(inicioDaDescida, tFundo), descida), subida: Math.min(entre(tComeca, tTopo), subida) };
}

/* Quadro do pôster: o meio da subida explosiva na câmera lenta. O script
   `npm run poster` usa este número; o teste confere. */
export function quadroDoPoster(roteiro: Roteiro): number {
  const { tComeca, tTopo } = roteiro.tempos;
  return quadroDoTempo(roteiro, (tComeca + tTopo) / 2, 'lenta');
}
