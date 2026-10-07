import type { Pose, PoseDoPe } from './corpo';
import type { Musculo } from './musculos';

/* O que a plataforma deveria medir naquele instante, se a execução estiver
   certa. É a "verdade" que o simulador de sensores (fase 4) vai usar e
   perturbar para mostrar erros. Cada animação declara isso junto da pose,
   para o mapa de pressão e o boneco nunca contarem histórias diferentes. */
export type Carga = {
  readonly pes: number; // fração do peso corporal medida na base (pode passar de 1 no impulso)
  readonly copAP: number; // centro de pressão frente/trás: −1 calcanhar … +1 ponta dos pés
  readonly copML: number; // lateral: −1 todo na direita … +1 todo na esquerda; 0 = simétrico
  readonly maos: number; // fração do peso apoiada nas barras
};

export type Quadro = {
  readonly t: number; // segundos desde o início do ciclo
  readonly pose: Pose;
  readonly carga: Carga;
  readonly fase: string; // instrução curta mostrada na tela
};

export type Cadeira = { readonly assentoY: number; readonly frenteZ: number; readonly fundoZ: number };

export type Animacao = {
  readonly id: string;
  readonly quadros: readonly Quadro[]; // ordenados; o último repete o primeiro (ciclo)
  readonly cadeira?: Cadeira;
  /* Músculos que o exercício trabalha: acendem em ciano na demonstração (V4). */
  readonly musculos?: readonly Musculo[];
  /* Ângulo ideal para ver o exercício (V8). Sem isto, a câmera padrão 3/4. */
  readonly camera?: { readonly posicao: [number, number, number]; readonly alvo: [number, number, number] };
  /* Inclinação da base em graus (nível do seletor × 5°, fase 6). Constante no
     ciclo: o praticante ajusta o seletor antes de subir. */
  readonly inclinacaoDaBase?: number;
};

export type Amostra = { readonly pose: Pose; readonly carga: Carga; readonly fase: string; readonly indiceFase: number };

export const duracao = (animacao: Animacao): number => animacao.quadros.at(-1)?.t ?? 0;

/* Carga: aceleração e desaceleração suaves entre quadros (seno). É o que os
   sensores "medem", e o simulador e os testes de fatos contam com esse tempo. */
const suavizar = (u: number): number => 0.5 - 0.5 * Math.cos(Math.PI * u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/* Pose: curva cúbica monotônica (PCHIP) pelos quadros. O seno por trecho
   zerava a velocidade em TODO quadro, e o boneco freava em cada pose
   intermediária, como stop-motion (auditoria, A1). Aqui a velocidade é
   contínua e:
   - para sozinha onde o corpo deve parar: se um trecho vizinho é parado
     (sentado, em pé) ou o quadro é um pico (tronco mais inclinado);
   - nunca passa dos valores dos quadros vizinhos, então o quadril não
     atravessa o assento entre um quadro e outro. */
type Canal = (pose: Pose) => number;

/* Defasagem por parte do corpo, em segundos (+ = chega depois, − = adianta).
   Ao levantar da cadeira o tronco inclina antes de o quadril sair (fase de
   transferência de momento), e cabeça e braços se acomodam depois. Sem isso,
   tudo chega junto e o boneco parece marionete (auditoria, A2). Quadril e
   desvios laterais não são defasados: são eles que os sensores medem. */
export const DEFASAGEM_DAS_PARTES = { tronco: -0.15, cabeca: 0.1, maoZ: 0.18 } as const;

/* Inclinação da curva no quadro k (Fritsch–Carlson, a mesma do PCHIP). O
   último quadro repete o primeiro, então o anterior do quadro 0 é o penúltimo. */
function inclinacaoNoQuadro(quadros: readonly Quadro[], canal: Canal, k: number): number {
  const n = quadros.length - 1;
  const i = k >= n ? 0 : k;
  const atual = quadros[i];
  const proximo = quadros[i + 1];
  const anterior = i === 0 ? quadros[n - 1] : quadros[i - 1];
  if (!atual || !proximo || !anterior) return 0;
  const hAnterior = i === 0 ? (quadros[n]?.t ?? 0) - anterior.t : atual.t - anterior.t;
  const hProximo = proximo.t - atual.t;
  if (hAnterior <= 0 || hProximo <= 0) return 0;
  const dAnterior = (canal(atual.pose) - canal(anterior.pose)) / hAnterior;
  const dProximo = (canal(proximo.pose) - canal(atual.pose)) / hProximo;
  if (dAnterior * dProximo <= 0) return 0; // pico, vale ou trecho parado
  const w1 = 2 * hProximo + hAnterior;
  const w2 = hProximo + 2 * hAnterior;
  return (w1 + w2) / (w1 / dAnterior + w2 / dProximo);
}

function valorNaCurva(quadros: readonly Quadro[], canal: Canal, t: number): number {
  const i = indiceDoTrecho(quadros, t);
  const a = quadros[i];
  const b = quadros[i + 1] ?? a;
  if (!a || !b) return 0;
  const h = b.t - a.t;
  if (h <= 0) return canal(a.pose);
  const s = (t - a.t) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * canal(a.pose) +
    (s3 - 2 * s2 + s) * h * inclinacaoNoQuadro(quadros, canal, i) +
    (-2 * s3 + 3 * s2) * canal(b.pose) +
    (s3 - s2) * h * inclinacaoNoQuadro(quadros, canal, i + 1)
  );
}

const noCiclo = (total: number, tempo: number): number => {
  // Tempo inválido (NaN/infinito) viraria pose NaN e o boneco sumiria.
  const seguro = Number.isFinite(tempo) ? tempo : 0;
  return total > 0 ? ((seguro % total) + total) % total : 0;
};

function indiceDoTrecho(quadros: readonly Quadro[], t: number): number {
  return Math.max(
    0,
    quadros.findIndex((q, k) => k < quadros.length - 1 && t >= q.t && t < (quadros[k + 1]?.t ?? Infinity)),
  );
}

export function amostrar(animacao: Animacao, tempo: number): Amostra {
  const total = duracao(animacao);
  const t = noCiclo(total, tempo);
  const quadros = animacao.quadros;
  const i = indiceDoTrecho(quadros, t);
  const a = quadros[i];
  const b = quadros[i + 1] ?? a;
  if (!a || !b) throw new Error(`Animação ${animacao.id} sem quadros`);
  const u = b.t > a.t ? suavizar((t - a.t) / (b.t - a.t)) : 0;
  const pose = poseNaCurva(quadros, t, a.pose.bracos);
  const comBase = animacao.inclinacaoDaBase ? { ...pose, inclinacaoDaBase: animacao.inclinacaoDaBase } : pose;
  return { pose: comBase, carga: misturarCarga(a.carga, b.carga, u), fase: a.fase, indiceFase: i };
}

const LADOS = ['esquerdo', 'direito'] as const;
const CAMPOS_DO_PE = ['dx', 'dz', 'elevacao', 'calcanhar'] as const;

/* Pés como canais da mesma curva (fase 6). Só entram se algum quadro mexe
   nos pés: o sentar e levantar continua com a pose de antes, sem `pes`. */
function pesNaCurva(quadros: readonly Quadro[], curva: (canal: Canal) => number): Pose['pes'] {
  if (!quadros.some((q) => q.pose.pes)) return undefined;
  const pe = (lado: (typeof LADOS)[number]): PoseDoPe =>
    Object.fromEntries(CAMPOS_DO_PE.map((campo) => [campo, curva((p) => p.pes?.[lado]?.[campo] ?? 0)])) as PoseDoPe;
  return { esquerdo: pe('esquerdo'), direito: pe('direito') };
}

function poseNaCurva(quadros: readonly Quadro[], t: number, bracos: Pose['bracos']): Pose {
  const total = quadros.at(-1)?.t ?? 0;
  const curva = (canal: Canal, defasagem = 0) => valorNaCurva(quadros, canal, noCiclo(total, t - defasagem));
  const pes = pesNaCurva(quadros, curva);
  return {
    quadril: { y: curva((p) => p.quadril.y), z: curva((p) => p.quadril.z) },
    tronco: curva((p) => p.tronco, DEFASAGEM_DAS_PARTES.tronco),
    deslocamentoLateral: curva((p) => p.deslocamentoLateral),
    inclinacaoLateral: curva((p) => p.inclinacaoLateral),
    cabeca: curva((p) => p.cabeca, DEFASAGEM_DAS_PARTES.cabeca),
    bracos,
    maoZ: curva((p) => p.maoZ, DEFASAGEM_DAS_PARTES.maoZ),
    ...(pes ? { pes } : {}),
  };
}

function misturarCarga(a: Carga, b: Carga, u: number): Carga {
  return {
    pes: lerp(a.pes, b.pes, u),
    copAP: lerp(a.copAP, b.copAP, u),
    copML: lerp(a.copML, b.copML, u),
    maos: lerp(a.maos, b.maos, u),
  };
}
