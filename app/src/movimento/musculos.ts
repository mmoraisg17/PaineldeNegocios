import type { Carga } from './animacao';
import type { Esqueleto } from './corpo';
import { anguloEntre, sub } from './vetor';

/* Músculos acesos na demonstração (auditoria visual, V4). Cada animação diz
   quais músculos o exercício trabalha; o brilho de cada um acompanha o
   esforço do instante, estimado com os mesmos dados que movem o boneco.
   É uma estimativa visual para ensinar, não uma medida de ativação. */

export type Musculo = 'quadriceps' | 'gluteos' | 'panturrilhas' | 'abdomen' | 'abdutores';

const limitar = (x: number) => Math.min(1, Math.max(0, x));

/* Ângulo de flexão do joelho esquerdo, em graus (0 = perna estendida). */
export function flexaoDoJoelho(e: Esqueleto): number {
  const l = e.lados.esquerdo;
  return 180 - anguloEntre(sub(l.tornozelo, l.joelho), sub(l.quadril, l.joelho));
}

/* Em pé e relaxado, o joelho fica levemente dobrado (~16° no boneco): essa
   flexão não pede esforço, então só conta o que passa dela. */
const FLEXAO_DE_REPOUSO = 15;

/* Esforço de 0 a 1:
   - quadríceps e glúteos: carga nos pés × seno da flexão do joelho (a
     alavanca dos extensores). Forte ao sair da cadeira, fraco em pé;
   - panturrilhas: carga nos pés, mais quando o peso vai para a ponta;
   - abdômen: segura o tronco; sobe com a carga e com o desvio lateral;
   - abdutores (glúteo médio): seguram a pelve; máximo apoiado num pé só. */
export function esforcoDoMusculo(musculo: Musculo, carga: Carga, flexaoJoelhoGraus: number): number {
  const alem = Math.min(Math.max(flexaoJoelhoGraus - FLEXAO_DE_REPOUSO, 0), 90);
  const alavanca = Math.sin((alem * Math.PI) / 180);
  switch (musculo) {
    case 'quadriceps':
    case 'gluteos':
      return limitar((carga.pes * alavanca) / 0.9);
    case 'panturrilhas':
      return limitar(carga.pes * (0.35 + 0.65 * Math.max(0, carga.copAP)));
    case 'abdomen':
      return limitar(0.35 * carga.pes + 0.65 * Math.abs(carga.copML));
    case 'abdutores': // glúteo médio: segura a pelve; máximo num pé só
      return limitar(0.45 + 0.55 * Math.abs(carga.copML));
    default:
      return 0;
  }
}

/* O músculo do exercício nunca apaga de todo: mesmo parado, mostra o que se
   trabalha; o esforço só aumenta o brilho. */
export const BRILHO_MINIMO = 0.3;
export const brilhoDoMusculo = (esforco: number): number => BRILHO_MINIMO + (1 - BRILHO_MINIMO) * limitar(esforco);

type Perfil = readonly (readonly [raio: number, altura: number])[];

/* Pedaço de um perfil [raio, altura 0..1] entre duas alturas, com o raio
   aumentado por `escala`: a "casca" do músculo, por fora do corpo. */
export function trechoDoPerfil(perfil: Perfil, de: number, ate: number, escala: number): [number, number][] {
  const raioEm = (y: number) => {
    const k = perfil.findIndex(([, altura]) => altura >= y);
    const b = perfil[Math.max(0, k)];
    const a = perfil[Math.max(0, k - 1)];
    if (!a || !b) return 0;
    if (b[1] === a[1]) return b[0];
    return a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
  };
  const meio = perfil.filter(([, y]) => y > de && y < ate).map(([r, y]): [number, number] => [r, y]);
  const pontos: [number, number][] = [[raioEm(de), de], ...meio, [raioEm(ate), ate]];
  return pontos.map(([r, y]) => [r * escala, y]);
}
