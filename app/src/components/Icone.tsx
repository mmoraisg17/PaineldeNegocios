import type { ReactNode } from 'react';

/* Ícones do app em SVG próprio (sem biblioteca e sem requisição extra), no
   lugar dos glifos de texto e dos emoji (`‹ › ✓ ★ ❚❚ 🙂`). Motivo: o glifo muda
   de forma de um sistema para outro e o emoji ignora a paleta; o SVG tem o
   mesmo desenho em todo aparelho e herda a cor do texto (`currentColor`), então
   segue qualquer paleta. Traço único de 2,25 e pontas redondas, na grade de
   24 px, para os ícones parecerem da mesma família.

   Todos nascem escondidos do leitor de tela (`aria-hidden`): quem precisa de
   nome usa o texto ao lado, como o app já fazia com os glifos. */

const CHEIO = { fill: 'currentColor', stroke: 'none' } as const;

const FORMAS = {
  voltar: <path d="M15 5l-7 7 7 7" />,
  avancar: <path d="M9 5l7 7-7 7" />,
  certo: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  alerta: <path d="M12 6v8M12 18v.01" />,
  pare: (
    <>
      <path d="M8.5 3.5h7l5 5v7l-5 5h-7l-5-5v-7z" />
      <path d="M8 12h8" />
    </>
  ),
  estrela: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  sobe: <path d="M12 19V5M6 11l6-6 6 6" />,
  desce: <path d="M12 5v14M6 13l6 6 6-6" />,
  mantem: <path d="M5 12h14" />,
  pausa: (
    <>
      <rect x="6.5" y="5" width="3.8" height="14" rx="1.2" {...CHEIO} />
      <rect x="13.7" y="5" width="3.8" height="14" rx="1.2" {...CHEIO} />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" {...CHEIO} strokeLinejoin="round" />,
  som: (
    <>
      <path d="M4 10v4h3.5L12 18V6l-4.5 4z" {...CHEIO} strokeLinejoin="round" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18.3 6.3a8 8 0 0 1 0 11.4" />
    </>
  ),
  'som-baixo': (
    <>
      <path d="M4 10v4h3.5L12 18V6l-4.5 4z" {...CHEIO} strokeLinejoin="round" />
      <path d="M15.5 9.5a3.2 3.2 0 0 1 0 5" />
    </>
  ),
  marcado: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" {...CHEIO} />
    </>
  ),
  desmarcado: <circle cx="12" cy="12" r="8.5" />,
  ponto: <circle cx="12" cy="12" r="6" {...CHEIO} />,
  busca: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  ampulheta: (
    <>
      <path d="M7 4h10M7 20h10" />
      <path d="M8 4c0 4 4 4 4 8s-4 4-4 8M16 4c0 4-4 4-4 8s4 4 4 8" />
    </>
  ),
  'rosto-facil': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" strokeWidth="3" />
      <path d="M8.3 14.3a4.5 4 0 0 0 7.4 0" />
    </>
  ),
  'rosto-ok': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" strokeWidth="3" />
      <path d="M9 15.2h6" />
    </>
  ),
  'rosto-dificil': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" strokeWidth="3" />
      <path d="M8.5 16.6a4.5 4 0 0 1 7 0" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeDoIcone = keyof typeof FORMAS;

/* `className` define o tamanho (size-5, size-6...) e a cor (text-...). */
export function Icone({ nome, className = 'size-5' }: { nome: NomeDoIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {FORMAS[nome]}
    </svg>
  );
}
