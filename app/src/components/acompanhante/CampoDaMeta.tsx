import { useId } from 'react';
import { META_MAXIMA, META_MINIMA } from './ajusteDaRotina';

type Props = { usar: boolean; valor: number; aoMudarUsar: (usar: boolean) => void; aoMudarValor: (valor: number) => void };

/* A meta é dita em frase ("55% do peso na perna esquerda e 45% na direita"),
   porque "55" sozinho não diz de que lado é nem o que sobra para o outro. */
export const descreverMeta = (esquerda: number): string => `${esquerda}% do peso na perna esquerda e ${100 - esquerda}% na direita`;

/* Meta de simetria do miniagachamento (manual 12.4): quanto do peso deve ir
   para a perna esquerda durante a recuperação. Desligada, não há meta e o app
   não gera alerta de simetria. */
export function CampoDaMeta({ usar, valor, aoMudarUsar, aoMudarValor }: Props) {
  const idControle = useId();
  const idValor = useId();
  return (
    <div className="flex flex-col gap-2 rounded-botao border-2 border-borda p-3">
      <label className="flex min-h-12 items-center gap-3 text-lg font-semibold text-texto">
        <input
          type="checkbox"
          checked={usar}
          onChange={(evento) => aoMudarUsar(evento.target.checked)}
          className="size-6 shrink-0 accent-primaria"
        />
        Usar meta de simetria
      </label>
      <label htmlFor={idControle} className="text-base font-semibold text-texto-suave">
        Meta de simetria no miniagachamento: perna esquerda
      </label>
      <input
        id={idControle}
        type="range"
        min={META_MINIMA}
        max={META_MAXIMA}
        step={1}
        value={valor}
        disabled={!usar}
        aria-valuetext={descreverMeta(valor)}
        aria-describedby={idValor}
        onChange={(evento) => aoMudarValor(Number(evento.target.value))}
        className="h-12 w-full accent-primaria disabled:opacity-50"
      />
      <p id={idValor} className="text-lg font-semibold text-texto">
        {descreverMeta(valor)}
      </p>
      <p className="text-base text-texto-suave">
        De {META_MINIMA}% a {META_MAXIMA}%. 50% é o peso dividido igualmente.
      </p>
    </div>
  );
}
