/* Barras simples em SVG puro: treinos feitos em cada semana contra a meta
   semanal. Como em GraficoSemanal, quem usa leitor de tela ouve o resumo e os
   valores no nome da imagem, e quem vê encontra o número escrito em cada barra
   (nada depende só da cor ou da altura). A meta é uma linha tracejada, que se
   distingue pelo traço e não pela cor. */

type Props = {
  titulo: string;
  /* Treinos feitos em cada semana, da mais antiga para a mais recente. */
  feitos: readonly number[];
  planejadas: number;
  rotulos: readonly string[];
  resumo: string;
};

const LARGURA = 320;
const ALTURA = 160;
const MARGEM = { esquerda: 14, direita: 14, topo: 22, base: 30 };
const AREA_LARGURA = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_ALTURA = ALTURA - MARGEM.topo - MARGEM.base;
const LARGURA_MAXIMA_DA_BARRA = 34;
const PROPORCAO_DA_BARRA = 0.55;
const DISTANCIA_DO_VALOR = 6;
const CANTO_DA_BARRA = 3;

const centroDaColuna = (indice: number, total: number) => MARGEM.esquerda + (AREA_LARGURA / total) * (indice + 0.5);

function descricaoDosValores(feitos: readonly number[], planejadas: number, rotulos: readonly string[]): string {
  return feitos.map((valor, indice) => `semana até ${rotulos[indice] ?? ''}: ${valor} de ${planejadas}`).join('; ');
}

export function GraficoDeTreinos({ titulo, feitos, planejadas, rotulos, resumo }: Props) {
  // A escala cabe a meta e também semanas que passaram dela; no mínimo 1 para não dividir por zero.
  const escalaMaxima = Math.max(planejadas, ...feitos, 1);
  const posicaoY = (valor: number) => MARGEM.topo + AREA_ALTURA * (1 - valor / escalaMaxima);
  const larguraDaBarra = Math.min((AREA_LARGURA / Math.max(feitos.length, 1)) * PROPORCAO_DA_BARRA, LARGURA_MAXIMA_DA_BARRA);
  const nomeDaImagem = `${titulo}. ${resumo} Valores: ${descricaoDosValores(feitos, planejadas, rotulos)}.`;

  return (
    <figure className="rounded-cartao border border-borda bg-superficie p-4">
      <figcaption>
        <h3 className="text-lg font-bold text-texto">{titulo}</h3>
        <p className="mt-1 text-base text-texto">{resumo}</p>
        {planejadas > 0 ? (
          <p className="mt-1 text-base text-texto-suave">
            A linha tracejada marca os {planejadas} {planejadas === 1 ? 'treino' : 'treinos'} por semana combinados na rotina.
          </p>
        ) : null}
      </figcaption>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="mt-3 w-full" role="img" aria-label={nomeDaImagem}>
        <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={posicaoY(0)} y2={posicaoY(0)} className="stroke-borda" />
        {planejadas > 0 ? (
          <line
            x1={MARGEM.esquerda}
            x2={LARGURA - MARGEM.direita}
            y1={posicaoY(planejadas)}
            y2={posicaoY(planejadas)}
            className="meta stroke-texto-suave"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        ) : null}
        {feitos.map((valor, indice) => {
          const centro = centroDaColuna(indice, feitos.length);
          return (
            <g key={indice}>
              {valor > 0 ? (
                <rect
                  x={centro - larguraDaBarra / 2}
                  y={posicaoY(valor)}
                  width={larguraDaBarra}
                  height={posicaoY(0) - posicaoY(valor)}
                  rx={CANTO_DA_BARRA}
                  className="fill-dado"
                />
              ) : null}
              <text x={centro} y={posicaoY(valor) - DISTANCIA_DO_VALOR} textAnchor="middle" className="valor fill-texto text-[12px] font-semibold">
                {valor}
              </text>
              <text x={centro} y={ALTURA - 8} textAnchor="middle" className="fill-texto-suave text-[10px]">
                {rotulos[indice] ?? ''}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
