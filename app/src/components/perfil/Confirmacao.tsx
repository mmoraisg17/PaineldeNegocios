import { useEffect, useId, useRef, type KeyboardEvent, type RefObject } from 'react';
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

  // Esc cancela; o foco está sempre num dos dois botões (começa em "Cancelar").
  const aoApertarEsc = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape') return;
    evento.stopPropagation();
    desistir();
  };

  return (
    /* Confirmação inline, não modal: "group" rotulado em vez de "alertdialog",
       que prometeria ao leitor de tela um diálogo com foco preso (revisão M4). */
    <div
      role="group"
      aria-labelledby={idPergunta}
      aria-describedby={detalhe ? idDetalhe : undefined}
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
      <button type="button" onClick={aoConfirmar} onKeyDown={aoApertarEsc} className={BOTAO_DE_PERIGO}>
        {textoConfirmar}
      </button>
      <button ref={cancelarRef} type="button" onClick={desistir} onKeyDown={aoApertarEsc} className={BOTAO_SECUNDARIO}>
        Cancelar
      </button>
    </div>
  );
}
