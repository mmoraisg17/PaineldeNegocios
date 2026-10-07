/* Silhueta do manequim (auditoria visual, V2). Cada parte do corpo é uma
   superfície de revolução: um perfil [raio, altura] girado em torno do eixo
   do osso. A altura vai de 0 (início do osso) a 1 (fim), e a malha é esticada
   ao comprimento real a cada quadro, então o esqueleto, o IK e os testes de
   fatos não mudam: só a "pele" fica com forma de gente.

   Raios em metros, para um adulto de ~1,65 m (movimento/cenario.ts, CORPO).
   Os perfis começam e terminam em raio ~0 para a malha sair fechada. */

export type Perfil = readonly (readonly [raio: number, altura: number])[];

const FECHADO = 0.0005;

/* Coxa: larga no quadril, afina até o joelho. */
export const COXA: Perfil = [
  [FECHADO, 0],
  [0.07, 0.02],
  [0.078, 0.18],
  [0.072, 0.45],
  [0.058, 0.78],
  [0.048, 0.96],
  [FECHADO, 1],
];

/* Canela: volume da panturrilha no terço de cima, tornozelo fino. */
export const CANELA: Perfil = [
  [FECHADO, 0],
  [0.046, 0.03],
  [0.054, 0.22],
  [0.05, 0.4],
  [0.036, 0.75],
  [0.03, 0.96],
  [FECHADO, 1],
];

/* Pé: calcanhar arredondado, peito do pé e ponta mais baixa. */
export const PE: Perfil = [
  [FECHADO, 0],
  [0.032, 0.06],
  [0.04, 0.35],
  [0.036, 0.75],
  [0.026, 0.95],
  [FECHADO, 1],
];

/* Braço: deltoide no ombro, afina até o cotovelo. */
export const BRACO: Perfil = [
  [FECHADO, 0],
  [0.046, 0.05],
  [0.047, 0.25],
  [0.04, 0.6],
  [0.032, 0.95],
  [FECHADO, 1],
];

/* Antebraço: volume perto do cotovelo, punho fino. */
export const ANTEBRACO: Perfil = [
  [FECHADO, 0],
  [0.034, 0.05],
  [0.036, 0.25],
  [0.027, 0.75],
  [0.022, 0.96],
  [FECHADO, 1],
];

/* Tronco, da pelve ao pescoço: quadril, cintura mais fina, peito e ombros.
   Raio base; a malha é achatada na profundidade (LARGURA × PROFUNDIDADE). */
export const TRONCO: Perfil = [
  [FECHADO, 0],
  [0.1, 0.03],
  [0.112, 0.12],
  [0.098, 0.32],
  [0.1, 0.45],
  [0.115, 0.62],
  [0.122, 0.78],
  [0.1, 0.92],
  [0.05, 0.99],
  [FECHADO, 1],
];
export const TRONCO_LARGURA = 1.22;
export const TRONCO_PROFUNDIDADE = 0.72;
