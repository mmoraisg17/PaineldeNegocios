import type { NivelDoMascote } from '../../dominio';

/* O rosto do ícone original: dois olhos redondos rosados e um sorriso pequeno.
   Só a expressão muda com a força (olhos mais cerrados e boca reta quando
   cansado, olhos grandes e sorriso aberto quando forte). Nada de sobrancelha,
   bochecha ou brilho: o desenho continua o mesmo, só o jeito dele muda. */
const OLHO_X = { esquerdo: 71, direito: 129 } as const;
const OLHO_Y = 128;

const RAIO_DO_OLHO: Record<NivelDoMascote, { rx: number; ry: number }> = {
  1: { rx: 9, ry: 4.5 },
  2: { rx: 9, ry: 7 },
  3: { rx: 9.5, ry: 9.5 },
  4: { rx: 10, ry: 10 },
  5: { rx: 10.5, ry: 10.5 },
};

const TRACO = { fill: 'none', stroke: 'var(--m-rosto)', strokeWidth: 5, strokeLinecap: 'round' } as const;

function Boca({ nivel }: { nivel: NivelDoMascote }) {
  if (nivel === 1) return <path {...TRACO} d="M91 148 Q100 145 109 148" />;
  if (nivel === 2) return <path {...TRACO} d="M91 144 Q100 148 109 144" />;
  if (nivel === 3) return <path fill="var(--m-rosto)" d="M90 141 Q100 154 110 141 Q100 146 90 141Z" />;
  if (nivel === 4) return <path fill="var(--m-rosto)" d="M87 140 Q100 158 113 140 Q100 147 87 140Z" />;
  return <path fill="var(--m-rosto)" d="M86 139 Q100 166 114 139Z" />;
}

export function Rosto({ nivel }: { nivel: NivelDoMascote }) {
  const { rx, ry } = RAIO_DO_OLHO[nivel];
  return (
    <>
      <g className="m-olhos" fill="var(--m-rosto)">
        <ellipse cx={OLHO_X.esquerdo} cy={OLHO_Y} rx={rx} ry={ry} />
        <ellipse cx={OLHO_X.direito} cy={OLHO_Y} rx={rx} ry={ry} />
      </g>
      <Boca nivel={nivel} />
    </>
  );
}
