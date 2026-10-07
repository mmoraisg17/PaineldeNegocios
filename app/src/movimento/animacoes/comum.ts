import type { Carga } from '../animacao';
import { CORPO, GRAUS_POR_NIVEL_DE_INCLINACAO, PLATAFORMA, TOPO_BASE } from '../cenario';
import { type ModoBracos, type Pose, alturaEmPe } from '../corpo';

/* Peças comuns das animações da fase 6. */

/* Onde as mãos seguram a barra, um pouco à frente do quadril (o mesmo ponto
   do sentar e levantar). */
export const MAO_Z = -0.05;

/* Em pé, relaxado: quadril 2 cm atrás dos tornozelos, joelho levemente
   dobrado (~16°). */
export const QUADRIL_EM_PE_Z = -0.02;
export const EM_PE = { y: alturaEmPe(QUADRIL_EM_PE_Z), z: QUADRIL_EM_PE_Z } as const;
/* Num pé só, o centro do corpo vai para cima do pé de apoio e a perna fica
   levemente inclinada: o quadril desce 1 cm (joelho um pouco mais dobrado). */
export const NUM_PE_SO = { y: EM_PE.y - 0.01, z: EM_PE.z } as const;

const radianos = (graus: number) => (graus * Math.PI) / 180;

/* Posição do quadril para uma flexão de joelho, com os tornozelos no lugar
   padrão: a canela inclina para a frente e a coxa para trás (quadril para
   trás, como quem vai sentar). `canela` é a fração da flexão que vem da
   canela (0,45: o joelho passa um pouco da ponta do pé só em flexões fundas). */
export function quadrilParaFlexao(grausDeJoelho: number, canela = 0.45): { y: number; z: number } {
  const beta = radianos(grausDeJoelho * canela); // canela à frente
  const teta = radianos(grausDeJoelho * (1 - canela)); // coxa para trás
  const tornozeloY = TOPO_BASE + CORPO.alturaTornozelo;
  return {
    y: tornozeloY + CORPO.canela * Math.cos(beta) + CORPO.coxa * Math.cos(teta),
    z: CORPO.canela * Math.sin(beta) - CORPO.coxa * Math.sin(teta),
  };
}

/* Pose com os valores neutros que quase toda animação usa. */
export function pose(campos: Partial<Pose> & Pick<Pose, 'quadril'>, bracos: ModoBracos): Pose {
  return { tronco: 2, deslocamentoLateral: 0, inclinacaoLateral: 0, cabeca: 0, maoZ: MAO_Z, ...campos, bracos };
}

export const carga = (pes: number, copAP: number, maos: number, copML = 0): Carga => ({ pes, copAP, copML, maos });

/* Quanto o tornozelo (no lugar padrão) sobe com a base inclinada no nível
   do seletor: a tampa sobe na frente, e o pé apoiado na rampa leva o
   tornozelo junto. As animações sobem o quadril o mesmo tanto, para o
   joelho não dobrar além do pedido (motor: movimento/corpo.ts). */
export function subidaDoTornozeloNaRampa(nivelDoSeletor: number): number {
  const a = radianos(nivelDoSeletor * GRAUS_POR_NIVEL_DE_INCLINACAO);
  const zPonta = CORPO.peFrente;
  const superficie = TOPO_BASE + (zPonta + PLATAFORMA.profundidade / 2) * Math.tan(a);
  const tornozeloY = superficie + CORPO.alturaTornozelo * Math.cos(a) - CORPO.peFrente * Math.sin(a);
  return tornozeloY - (TOPO_BASE + CORPO.alturaTornozelo);
}

/* Com as barras, parte do peso vai para as mãos. */
export const pesoNasMaos = (bracos: ModoBracos, valor: number) => (bracos === 'barras' || bracos === 'uma-mao' ? valor : 0);
