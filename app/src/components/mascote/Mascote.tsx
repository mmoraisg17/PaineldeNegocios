import { useId } from 'react';
import type { NivelDoMascote } from '../../dominio';
import './mascote.css';
import { Rosto } from './Rosto';

export type PoseDoMascote = 'andar' | 'parado' | 'acenar' | 'comemorar';

/* Alça mais grossa = mais forte: o kettlebell fica mais "pesado", sem ganhar
   braço, perna ou qualquer peça nova. */
const ESPESSURA_DA_ALCA: Record<NivelDoMascote, number> = { 1: 21, 2: 22, 3: 23, 4: 25, 5: 27 };

const CAMINHO_DA_ALCA = 'M64 82 L64 54 Q64 23 96 23 L104 23 Q136 23 136 54 L136 82';

function Brilhos() {
  const estrela = 'M0 -10 Q1.8 -1.8 10 0 Q1.8 1.8 0 10 Q-1.8 1.8 -10 0 Q-1.8 -1.8 0 -10Z';
  return (
    <g fill="var(--m-rosto)">
      <path className="m-brilho m-brilho-a" d={estrela} transform="translate(22 56)" />
      <path className="m-brilho m-brilho-b" d={estrela} transform="translate(180 40) scale(.75)" />
    </g>
  );
}

type Props = {
  nivel: NivelDoMascote;
  pose?: PoseDoMascote;
  /* Largura e altura em px (o desenho é quadrado). */
  tamanho?: number;
  /* Sem descrição, o desenho é decorativo e some para o leitor de tela. */
  descricao?: string;
  className?: string;
};

/* Mascote (kettlebell) solto, sem fundo: o mesmo desenho do ícone original, em
   SVG. Corpo e alça com um degradê bem leve, dois olhos e um sorriso. O que
   muda entre os níveis e as poses é só o movimento (mascote.css), a postura e
   a expressão. Ver docs/mascote/plano-animacao.md. */
export function Mascote({ nivel, pose = 'parado', tamanho = 96, descricao, className = '' }: Props) {
  const idDoDegrade = useId();
  return (
    <svg
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      className={`mascote ${className}`.trim()}
      data-nivel={nivel}
      data-pose={pose}
      role={descricao ? 'img' : undefined}
      aria-label={descricao}
      aria-hidden={descricao ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={idDoDegrade} gradientUnits="userSpaceOnUse" x1="50" y1="30" x2="150" y2="200">
          <stop offset="0" style={{ stopColor: 'var(--m-corpo-claro)' }} />
          <stop offset="1" style={{ stopColor: 'var(--m-corpo)' }} />
        </linearGradient>
      </defs>
      <ellipse className="m-sombra" cx="100" cy="196" rx="62" ry="6" fill="var(--m-sombra)" />
      <g className="m-todo">
        <g className="m-postura">
          <path
            className="m-alca"
            d={CAMINHO_DA_ALCA}
            fill="none"
            stroke={`url(#${idDoDegrade})`}
            strokeWidth={ESPESSURA_DA_ALCA[nivel]}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse cx="100" cy="124" rx="80" ry="72" fill={`url(#${idDoDegrade})`} />
          <Rosto nivel={nivel} />
        </g>
      </g>
      {nivel === 5 && <Brilhos />}
    </svg>
  );
}
