/* Medidas do banquinho retrátil, tiradas do desenho do Gabriel
   (banquinho_retrátil.dwg, modelo 3D). O desenho está em milímetros e em
   escala 1:10: o aro de baixo tem 43,4 no desenho e o assento 45, ou seja,
   0,434 m e 0,45 m de verdade. A escala foi conferida contra o app: o assento
   fica a ~0,53 m do chão e a cadeira da animação tem 0,42 m de fundo, o que
   bate com o assento de 0,45 m e com 14 dos 17 aros empilhados. */
export const ESCALA_DO_DESENHO = 10;

export const BANQUINHO = {
  /* Aros telescópicos: 17, do mais largo (embaixo) ao mais estreito. Cada um
     tem 5 mm no desenho (0,05 m) e o primeiro começa 3 mm acima do chão. */
  aneis: 17,
  alturaDoAnel: 0.05,
  alturaDoPrimeiroAnel: 0.03,
  passoDoAnel: 0.03, // distância entre dois aros: eles se sobrepõem 2 mm no desenho
  /* Assento: bandeja de 45 mm × 5,25 mm no desenho, pousada no último aro. */
  alturaDoAssento: 0.0525,
  diametroDoAssento: 0.45,
} as const;

export type PilhaDoBanquinho = {
  /* Quantos aros aparecem, do mais largo ao mais estreito. */
  readonly aneis: number;
  /* Altura do fundo de cada aro (m), do primeiro ao último. */
  readonly alturaDosAneis: readonly number[];
  /* Altura do fundo do assento, no topo do último aro. */
  readonly alturaDoAssento: number;
};

/* O banquinho é retrátil: o número de aros define a altura. Aqui ele estica
   até o assento ficar na altura que a animação pede (`assentoY`, topo do
   assento). Com a quantidade inteira de aros mais próxima, o passo entre eles
   se ajusta (cerca de 1 mm), então o assento fica exatamente onde o quadril do
   boneco espera e nenhum aro se separa do outro. */
export function pilhaDoBanquinho(assentoY: number): PilhaDoBanquinho {
  const { aneis, alturaDoAnel, alturaDoPrimeiroAnel, passoDoAnel, alturaDoAssento } = BANQUINHO;
  const topoDoUltimoAnel = assentoY - alturaDoAssento;
  const ideal = (topoDoUltimoAnel - alturaDoAnel - alturaDoPrimeiroAnel) / passoDoAnel + 1;
  const quantos = Math.min(aneis, Math.max(2, Math.round(ideal)));
  const passo = (topoDoUltimoAnel - alturaDoAnel - alturaDoPrimeiroAnel) / (quantos - 1);
  return {
    aneis: quantos,
    alturaDosAneis: Array.from({ length: quantos }, (_, k) => alturaDoPrimeiroAnel + k * passo),
    alturaDoAssento: topoDoUltimoAnel,
  };
}
