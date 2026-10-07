import type { Animacao, Quadro } from '../animacao';
import type { ModoBracos } from '../corpo';
import { EM_PE, carga, pesoNasMaos, pose, quadrilParaFlexao } from './comum';

/* Miniagachamento com descarga simétrica (trilha Fisioterapia, joelho).

   Pesquisa (docs/pesquisa/exercicios/02-a-08, seção 2):
   - Após lesão ou cirurgia no joelho a pessoa apoia mais na perna boa; o
     feedback da carga de cada perna é usado para buscar simetria (IJSPT).
   - Agachamentos a 30° e 60° de flexão do joelho discriminam dificuldade
     funcional; 60° é marcador de carga na perna operada.
   - Pede controle excêntrico: descer e subir devagar.

   Nível 1 "pouca descida": joelho a ~35° (o boneco já fica com ~16° em pé).
   Níveis 2 e 3 "descida média": ~60°. Peso 50/50 e centro de pressão no
   meio do pé ou levemente no calcanhar (o erro é jogar o peso na ponta). */

const FLEXAO: Record<1 | 2 | 3, number> = { 1: 35, 2: 60, 3: 60 };
const TRONCO: Record<1 | 2 | 3, number> = { 1: 12, 2: 22, 3: 22 };

export function miniagachamento(bracos: ModoBracos, nivel: 1 | 2 | 3): Animacao {
  const maos = (v: number) => pesoNasMaos(bracos, v);
  const embaixo = quadrilParaFlexao(FLEXAO[nivel]);
  const p = (quadril: { y: number; z: number }, tronco: number) => pose({ quadril, tronco }, bracos);

  const quadros: Quadro[] = [
    { t: 0, pose: p(EM_PE, 3), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, pés na largura do quadril' },
    { t: 1.0, pose: p(EM_PE, 3), carga: carga(1, 0.02, maos(0.04)), fase: 'Desça devagar, quadril para trás' },
    { t: 3.2, pose: p(embaixo, TRONCO[nivel]), carga: carga(0.97, -0.08, maos(0.07)), fase: 'Segure embaixo, peso nas duas pernas' },
    { t: 4.2, pose: p(embaixo, TRONCO[nivel]), carga: carga(0.97, -0.08, maos(0.07)), fase: 'Suba devagar' },
    { t: 6.4, pose: p(EM_PE, 3), carga: carga(1.03, 0.02, maos(0.04)), fase: 'Em pé, firme' },
    { t: 7.4, pose: p(EM_PE, 3), carga: carga(1, 0.02, maos(0.04)), fase: 'Em pé, pés na largura do quadril' },
  ];

  // Extensores do joelho e do quadril: os que controlam a descida e a subida.
  return { id: 'miniagachamento-simetrico', quadros, musculos: ['quadriceps', 'gluteos'] };
}
