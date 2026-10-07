import { useId } from 'react';

type Props = { rotulo: string; descricao?: string; ligado: boolean; aoMudar: (ligado: boolean) => void };

/* Liga/desliga em forma de botão grande (a linha inteira é o alvo de toque).
   O estado aparece em TEXTO ("Ligado"/"Desligado") e em ícone, além da cor, e
   o leitor de tela ouve "ligado/desligado" por aria-checked. O texto visual do
   estado fica fora do nome do botão para o nome ser só o rótulo. */
export function Interruptor({ rotulo, descricao, ligado, aoMudar }: Props) {
  const idDescricao = useId();
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-describedby={descricao ? idDescricao : undefined}
        onClick={() => aoMudar(!ligado)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-botao border-2 border-borda bg-superficie px-4 text-left"
      >
        <span className="text-lg font-semibold text-texto">{rotulo}</span>
        <span
          aria-hidden="true"
          className={`rounded-full px-3 py-1 text-base font-bold ${ligado ? 'bg-primaria text-sobre-primaria' : 'bg-fundo text-texto-suave'}`}
        >
          {ligado ? '✓ Ligado' : '○ Desligado'}
        </span>
      </button>
      {descricao ? (
        <p id={idDescricao} className="px-1 text-base text-texto-suave">
          {descricao}
        </p>
      ) : null}
    </div>
  );
}
