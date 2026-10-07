import type { Animacao, Quadro } from '../animacao';
import { CORPO } from '../cenario';
import type { ModoBracos, Pose } from '../corpo';
import { NUM_PE_SO, carga, pesoNasMaos, pose, quadrilParaFlexao } from './comum';

/* Descida de degrau lateral / step-down (trilha Fisioterapia, joelho).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 5):
   - Teste lateral de descida de degrau (15–20 cm): pelve nivelada, joelho
     de apoio apontando para a frente, tronco sem cair para o lado. Erros:
     joelho para dentro, quadril aduzindo, pelve caindo do lado livre.
   - O degrau é a própria base (12 cm no modelo; manual: 10–15 cm).

   Apoio no pé direito, perto da borda esquerda; a perna esquerda fica
   pendurada para fora da base, entre os dois postes da barra; o joelho de
   apoio dobra até o calcanhar livre tocar o chão e volta. A mão esquerda
   segura a barra desse mesmo lado. Nível 3 "descendo mais devagar". */

const PE_DE_APOIO_X = 0.15; // pé direito, perto da borda esquerda da base (meia largura 0,35)
const PE_LIVRE_X = 0.44; // fora da base, entre os postes da barra (x 0,38)
const DX_APOIO = PE_DE_APOIO_X + CORPO.meiaLarguraQuadril; // o direito sai de −0,095
const DX_LIVRE = PE_LIVRE_X - CORPO.meiaLarguraQuadril;
// Num pé só, o centro do corpo fica sobre o pé de apoio (2 cm para o lado
// livre); a perna livre sai um pouco aberta para fora da base.
const CENTRO_X = PE_DE_APOIO_X + 0.02;
// Joelho a 70°: o bastante para a perna livre alcançar o chão, 12 cm abaixo.
const EMBAIXO = quadrilParaFlexao(70);
const PE_LIVRE_NO_AR = 0.15; // m acima do chão: um pouco acima da base, pendurado
const LENTO = 1.5;

export function descidaDeDegrau(bracos: ModoBracos, nivel: 1 | 2 | 3): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const ritmo = nivel === 3 ? LENTO : 1;
  const p = (quadril: { y: number; z: number }, tronco: number, elevacaoLivre: number): Pose =>
    pose(
      {
        quadril,
        tronco,
        deslocamentoLateral: CENTRO_X,
        pes: { direito: { dx: DX_APOIO }, esquerdo: { dx: DX_LIVRE, dz: -0.03, elevacao: elevacaoLivre } },
      },
      bracos,
    );
  const emCima = p(NUM_PE_SO, 3, PE_LIVRE_NO_AR);
  const tocando = p(EMBAIXO, 14, 0);
  const t = (s: number) => s * ritmo;
  // Todo o peso no pé direito (copML −1); embaixo, um pouco vai para o chão.
  const quadros: Quadro[] = [
    { t: 0, pose: emCima, carga: carga(1, 0.03, maos(0.05), -1), fase: 'Em pé na base, perna esquerda para fora' },
    { t: t(1.0), pose: emCima, carga: carga(1, 0.03, maos(0.05), -1), fase: 'Dobre o joelho direito devagar' },
    { t: t(3.2), pose: tocando, carga: carga(0.88, -0.02, maos(0.08), -1), fase: 'Toque o chão de leve com o calcanhar' },
    { t: t(3.7), pose: tocando, carga: carga(0.88, -0.02, maos(0.08), -1), fase: 'Volte devagar, joelho para a frente' },
    { t: t(5.9), pose: emCima, carga: carga(1.03, 0.03, maos(0.05), -1), fase: 'Em pé na base, perna esquerda para fora' },
    { t: t(6.7), pose: emCima, carga: carga(1, 0.03, maos(0.05), -1), fase: 'Em pé na base, perna esquerda para fora' },
  ];

  return {
    id: 'descida-de-degrau',
    quadros,
    musculos: ['quadriceps', 'gluteos'],
    // De frente, um pouco de lado: o joelho de apoio e a pelve à vista.
    camera: { posicao: [1.0, 1.6, 2.95], alvo: [0.2, 0.92, 0] },
  };
}
