import { type Vec3, comprimento, escala, normalizar, ponto, soma, sub, vec } from './vetor';

/* Margem para nunca esticar a corrente por completo: com o membro 100% reto o
   cálculo do joelho/cotovelo fica instável (divisão perto de zero). 0,5% do
   comprimento é invisível na tela. */
const FOLGA_EXTENSAO = 0.995;

export type ResultadoIK = { readonly meio: Vec3; readonly fim: Vec3; readonly alcancou: boolean };

/* IK analítica de dois ossos (coxa-canela, braço-antebraço).

   Recebe a raiz (tornozelo ou ombro), o alvo (quadril ou mão), os dois
   comprimentos e uma direção de "polo" para onde a articulação do meio deve
   apontar (joelho para a frente, cotovelo para fora e para trás). Os
   comprimentos dos ossos são sempre preservados: se o alvo está longe demais,
   o membro estica na direção dele e `alcancou` vira false. */
export function ikDoisOssos(raiz: Vec3, alvo: Vec3, osso1: number, osso2: number, polo: Vec3): ResultadoIK {
  const paraAlvo = sub(alvo, raiz);
  const direcao = normalizar(paraAlvo);
  const alcanceMax = (osso1 + osso2) * FOLGA_EXTENSAO;
  const alcanceMin = Math.abs(osso1 - osso2) + 1e-4;
  const d = Math.min(Math.max(comprimento(paraAlvo), alcanceMin), alcanceMax);

  // Lei dos cossenos: a = projeção do meio sobre a reta raiz→alvo, h = altura.
  const a = (osso1 * osso1 - osso2 * osso2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(osso1 * osso1 - a * a, 0));

  const perpendicular = direcaoDoPolo(direcao, polo);
  const meio = soma(soma(raiz, escala(direcao, a)), escala(perpendicular, h));
  const fim = soma(raiz, escala(direcao, d));
  return { meio, fim, alcancou: comprimento(paraAlvo) <= alcanceMax + 1e-6 };
}

/* Parte do polo perpendicular à direção do membro. Se o polo for paralelo à
   direção (caso degenerado), usa um eixo qualquer perpendicular. */
function direcaoDoPolo(direcao: Vec3, polo: Vec3): Vec3 {
  const p = sub(polo, escala(direcao, ponto(polo, direcao)));
  if (comprimento(p) > 1e-6) return normalizar(p);
  const reserva = Math.abs(direcao.x) < 0.9 ? vec(1, 0, 0) : vec(0, 0, 1);
  return normalizar(sub(reserva, escala(direcao, ponto(reserva, direcao))));
}
