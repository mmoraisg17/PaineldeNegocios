import { APP_NAME } from '../../config/app';

/* Logo do Nivela: a palavra em letras de traço grosso e ponta redonda (a mesma
   linguagem do mascote) e, no ponto do "i", a bolha de um nível de bolha: o
   produto "nivela" o equilíbrio. Só duas cores: a tinta do tema (currentColor,
   vira a cor de texto) e o rosa da marca na bolha.
   As letras são desenhadas à mão e vivem aqui como caminhos SVG (nada de fonte
   para carregar). Fonte do desenho e das variações: laboratorio-visual/logo-nivela. */

const ESPESSURA_DO_TRACO = 17;

/* Cada letra: posição x e caminhos (grade: linha de base y 100, altura-x y 34,
   ascendente y 0). */
const LETRAS: ReadonlyArray<{ x: number; caminhos: readonly string[] }> = [
  { x: 0, caminhos: ['M8.5 91.5 V42.5', 'M8.5 64 C8.5 50 19 42.5 31.5 42.5 C45 42.5 54.5 51 54.5 64 V91.5'] },
  { x: 78, caminhos: ['M8.5 91.5 V42.5'] },
  { x: 110, caminhos: ['M8.5 42.5 L31.5 91.5 L54.5 42.5'] },
  { x: 188, caminhos: ['M8.5 67 H57.5 A24.5 24.5 0 1 0 51.8 82.7'] },
  { x: 269, caminhos: ['M8.5 8.5 V91.5'] },
  { x: 301, caminhos: ['M33 42.5 A24.5 24.5 0 1 0 33 91.5 A24.5 24.5 0 1 0 33 42.5 Z', 'M57.5 42.5 V91.5'] },
];

/* A bolha fica sobre o "i" (x 78 + metade do traço). */
const BOLHA = { cx: 86.5, cy: 10, r: 12 } as const;

/* Proporção do desenho: 375 × 118. Dê só a altura (ex.: className="h-14") e a
   largura acompanha. */
export function LogoNivela({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="-4 -8 375 118"
      role="img"
      aria-label={APP_NAME}
      className={`block w-auto ${className}`.trim()}
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth={ESPESSURA_DO_TRACO} strokeLinecap="round" strokeLinejoin="round">
        {LETRAS.map(({ x, caminhos }) => (
          <g key={x} transform={`translate(${x} 0)`}>
            {caminhos.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        ))}
      </g>
      <circle cx={BOLHA.cx} cy={BOLHA.cy} r={BOLHA.r} fill="var(--color-primaria)" />
    </svg>
  );
}
