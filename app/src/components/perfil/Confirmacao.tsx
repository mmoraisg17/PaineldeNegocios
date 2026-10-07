import { useEffect, useId, useRef, type RefObject } from 'react';
import { BOTAO_DE_PERIGO, BOTAO_SECUNDARIO } from './estilos';

type Props = {
  pergunta: string;
  detalhe?: string;
  textoConfirmar: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  /* Botão que abriu a confirmação: o foco volta para ele ao desistir. */
  gatilho: RefObject<HTMLElement | null>;
};

/* Confirmação no próprio lugar (em vez de um <dialog> por cima da tela): para
   ações sem volta, como remover um acesso ou apagar os dados. O foco já vai
   para "Cancelar", a opção segura, e Esc também desiste. Quem usa leitor de
   tela ouve a pergunta na hora (alertdialog). */
export function Confirmacao({ pergunta, detalhe, textoConfirmar, aoConfirmar, aoCancelar, gatilho }: Props) {
  const idPergunta = useId();
  const idDetalhe = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelarRef.current?.focus();
  }, []);

  const desistir = () => {
    aoCancelar();
    gatilho.current?.focus();
  };

  return (
    <div
      role="alertdialog"
      aria-labelledby={idPergunta}
      aria-describedby={detalhe ? idDetalhe : undefined}
      onKeyDown={(evento) => {
        if (evento.key !== 'Escape') return;
        evento.stopPropagation();
        desistir();
      }}
      className="flex flex-col gap-3 rounded-cartao border-2 border-perigo bg-perigo-fundo p-4"
    >
      <p id={idPergunta} className="text-lg font-bold text-texto">
        {pergunta}
      </p>
      {detalhe ? (
        <p id={idDetalhe} className="text-base text-texto">
          {detalhe}
        </p>
      ) : null}
      <button type="button" onClick={aoConfirmar} className={BOTAO_DE_PERIGO}>
        {textoConfirmar}
      </button>
      <button ref={cancelarRef} type="button" onClick={desistir} className={BOTAO_SECUNDARIO}>
        Cancelar
      </button>
    </div>
  );
}
