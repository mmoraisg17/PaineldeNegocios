/* Gráfico de linha em SVG puro (sem biblioteca de gráficos): são só três
   curvas de seis pontos. O gráfico em si não é lido por leitor de tela; quem
   usa um ouve o `resumo` e os valores de cada semana no nome da imagem. Para
   quem vê, o valor fica escrito em cada ponto, então nada depende só da cor
   ou da posição da linha. */

/* Fundo do cartão por categoria (Zepp: cada dado tem o seu tom). */
const FUNDO_DO_CARTAO = { 1: 'bg-cartao-1', 2: 'bg-cartao-2', 3: 'bg-cartao-3', 4: 'bg-cartao-4' } as const;

type Props = {
  cartao?: keyof typeof FUNDO_DO_CARTAO;
  titulo: string;
  /* Um valor de 0 a 100 por semana, da mais antiga para a mais recente.
     Nulo é semana sem treino. */
  valores: readonly (number | null)[];
  rotulos: readonly string[];
  unidade: 'pontos' | '%';
  resumo: string;
  dica?: string;
};

const LARGURA = 320;
const ALTURA = 160;
const MARGEM = { esquerda: 34, direita: 14, topo: 18, base: 30 };
const AREA_LARGURA = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_ALTURA = ALTURA - MARGEM.topo - MARGEM.base;
const ESCALA_MAXIMA = 100;
const LINHAS_DE_GRADE = [0, 50, 100] as const;
const RAIO_DO_PONTO = 4;
const DISTANCIA_DO_VALOR = 9;

type Ponto = { x: number; y: number; valor: number };

const posicaoY = (valor: number) => MARGEM.topo + AREA_ALTURA * (1 - valor / ESCALA_MAXIMA);
const posicaoX = (indice: number, total: number) =>
  total === 1 ? MARGEM.esquerda + AREA_LARGURA / 2 : MARGEM.esquerda + (AREA_LARGURA * indice) / (total - 1);

/* Semana sem treino quebra a linha em trechos: ligar os vizinhos sugeriria uma
   evolução gradual que não foi medida. */
function trechosContinuos(pontos: readonly (Ponto | null)[]): Ponto[][] {
  return pontos.reduce<Ponto[][]>((trechos, ponto) => {
    if (!ponto) return [...trechos, []];
    const ultimo = trechos.at(-1);
    return ultimo ? [...trechos.slice(0, -1), [...ultimo, ponto]] : [[ponto]];
  }, []);
}

function descricaoDosValores(valores: readonly (number | null)[], rotulos: readonly string[], unidade: Props['unidade']): string {
  return valores
    .map((valor, indice) => {
      const medida = valor === null ? 'sem treino' : unidade === '%' ? `${valor}%` : `${valor} pontos`;
      return `semana até ${rotulos[indice] ?? ''}: ${medida}`;
    })
    .join('; ');
}

export function GraficoSemanal({ cartao = 1, titulo, valores, rotulos, unidade, resumo, dica }: Props) {
  const pontos = valores.map((valor, indice) => (valor === null ? null : { x: posicaoX(indice, valores.length), y: posicaoY(valor), valor }));
  const trechos = trechosContinuos(pontos).filter((trecho) => trecho.length >= 2);
  const nomeDaImagem = `${titulo}. ${resumo} Valores: ${descricaoDosValores(valores, rotulos, unidade)}.`;

  return (
    <figure className={`rounded-cartao border border-borda p-4 ${FUNDO_DO_CARTAO[cartao]}`}>
      <figcaption>
        <h3 className="text-lg font-bold text-texto">{titulo}</h3>
        <p className="mt-1 text-base text-texto">{resumo}</p>
        {dica ? <p className="mt-1 text-base text-texto-suave">{dica}</p> : null}
      </figcaption>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="mt-3 w-full" role="img" aria-label={nomeDaImagem}>
        {LINHAS_DE_GRADE.map((valor) => (
          <g key={valor}>
            <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={posicaoY(valor)} y2={posicaoY(valor)} className="stroke-borda" strokeDasharray="4 4" />
            <text x={MARGEM.esquerda - 6} y={posicaoY(valor) + 4} textAnchor="end" className="fill-texto-suave text-[11px]">
              {valor}
            </text>
          </g>
        ))}
        {trechos.map((trecho) => (
          <polyline
            key={`${trecho[0]?.x}`}
            points={trecho.map((ponto) => `${ponto.x},${ponto.y}`).join(' ')}
            fill="none"
            className="stroke-dado"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {pontos.map((ponto, indice) =>
          ponto ? (
            <g key={indice}>
              <circle cx={ponto.x} cy={ponto.y} r={RAIO_DO_PONTO} className="fill-dado" />
              <text x={ponto.x} y={ponto.y - DISTANCIA_DO_VALOR} textAnchor="middle" className="fill-texto text-[11px] font-semibold">
                {ponto.valor}
              </text>
            </g>
          ) : null,
        )}
        {valores.map((_, indice) => (
          <text key={indice} x={posicaoX(indice, valores.length)} y={ALTURA - 8} textAnchor="middle" className="fill-texto-suave text-[10px]">
            {rotulos[indice] ?? ''}
          </text>
        ))}
      </svg>
    </figure>
  );
}
