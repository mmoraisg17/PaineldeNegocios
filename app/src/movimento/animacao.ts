import type { Pose } from './corpo';

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
};

export type Amostra = { readonly pose: Pose; readonly carga: Carga; readonly fase: string; readonly indiceFase: number };

export const duracao = (animacao: Animacao): number => animacao.quadros.at(-1)?.t ?? 0;

/* Aceleração e desaceleração suaves entre quadros (seno). Movimento humano
   não começa nem para de golpe; interpolação linear pareceria robótica. */
const suavizar = (u: number): number => 0.5 - 0.5 * Math.cos(Math.PI * u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export function amostrar(animacao: Animacao, tempo: number): Amostra {
  const total = duracao(animacao);
  // Tempo inválido (NaN/infinito) viraria pose NaN e o boneco sumiria.
  const seguro = Number.isFinite(tempo) ? tempo : 0;
  const t = total > 0 ? ((seguro % total) + total) % total : 0;
  const quadros = animacao.quadros;
  const i = Math.max(
    0,
    quadros.findIndex((q, k) => k < quadros.length - 1 && t >= q.t && t < (quadros[k + 1]?.t ?? Infinity)),
  );
  const a = quadros[i];
  const b = quadros[i + 1] ?? a;
  if (!a || !b) throw new Error(`Animação ${animacao.id} sem quadros`);
  const u = b.t > a.t ? suavizar((t - a.t) / (b.t - a.t)) : 0;
  return { pose: misturarPose(a.pose, b.pose, u), carga: misturarCarga(a.carga, b.carga, u), fase: a.fase, indiceFase: i };
}

function misturarPose(a: Pose, b: Pose, u: number): Pose {
  return {
    quadril: { y: lerp(a.quadril.y, b.quadril.y, u), z: lerp(a.quadril.z, b.quadril.z, u) },
    tronco: lerp(a.tronco, b.tronco, u),
    deslocamentoLateral: lerp(a.deslocamentoLateral, b.deslocamentoLateral, u),
    inclinacaoLateral: lerp(a.inclinacaoLateral, b.inclinacaoLateral, u),
    cabeca: lerp(a.cabeca, b.cabeca, u),
    bracos: a.bracos,
    maoZ: lerp(a.maoZ, b.maoZ, u),
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
