import { useEffect, useId, useRef, useState } from 'react';
import type { NivelDoMascote } from '../../dominio';
import { Mascote } from './Mascote';
import { COMO_SUBIR, FRASE_DO_NIVEL, NOME_DO_NIVEL } from './textos';

const TAMANHO_DO_MASCOTE = 60;

/* O mascote mora no meio da barra de abas, entre Biblioteca e Progresso. Fica
   parado (só respira e pisca). Tocar nele abre um balão com como ele está e o
   que fazer para ele progredir. O balão fecha por novo toque, Esc, toque fora
   ou ao sair do foco; não some sozinho, porque a leitura pode levar tempo.
   Vai dentro do <ul> da barra, por isso é um <li>; o balão se posiciona em
   relação ao <nav> (position: relative), acima da barra. */
export function MascoteDaBarra({ nivel }: { nivel: NivelDoMascote }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLLIElement>(null);
  const idDoBalao = useId();

  useEffect(() => {
    if (!aberto) return undefined;
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    const aoTocarFora = (evento: PointerEvent) => {
      if (evento.target instanceof Node && !raiz.current?.contains(evento.target)) setAberto(false);
    };
    // Foco que sai do conjunto (Tab, ou toque em outro controle) fecha o balão.
    const aoSairDoFoco = (evento: FocusEvent) => {
      if (!(evento.relatedTarget instanceof Node && elemento?.contains(evento.relatedTarget))) setAberto(false);
    };
    const elemento = raiz.current;
    document.addEventListener('keydown', aoApertar);
    document.addEventListener('pointerdown', aoTocarFora);
    elemento?.addEventListener('focusout', aoSairDoFoco);
    return () => {
      document.removeEventListener('keydown', aoApertar);
      document.removeEventListener('pointerdown', aoTocarFora);
      elemento?.removeEventListener('focusout', aoSairDoFoco);
    };
  }, [aberto]);

  return (
    <li ref={raiz} className="flex justify-center">
      {/* A região viva existe sempre e só o texto entra: avisos que aparecem junto com a região nem sempre são lidos.
          Sem role="status" de propósito: as telas já têm as suas. */}
      <div
        id={idDoBalao}
        aria-live="polite"
        aria-atomic="true"
        // Focável só ao tocar (tabIndex -1): tocar no texto do balão não tira o foco do conjunto e não o fecha.
        tabIndex={aberto ? -1 : undefined}
        className={
          aberto
            ? 'absolute inset-x-3 bottom-full z-20 mb-3 rounded-cartao border-2 border-borda-campo bg-superficie p-4 text-texto shadow-lg outline-none'
            : 'sr-only'
        }
      >
        {aberto ? (
          <>
            <p className="text-base font-bold text-marca">{NOME_DO_NIVEL[nivel]}</p>
            <p className="mt-1 text-lg font-semibold">{FRASE_DO_NIVEL[nivel]}</p>
            <p className="mt-3 text-base font-bold">Para ele progredir</p>
            <p className="mt-1 text-lg">{COMO_SUBIR[nivel]}</p>
          </>
        ) : null}
      </div>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idDoBalao}
        aria-label={`Mascote, ${NOME_DO_NIVEL[nivel].toLowerCase()}. Toque para saber como ele está e como fazê-lo progredir.`}
        onClick={() => setAberto((atual) => !atual)}
        className="relative -top-3 flex h-16 w-16 items-center justify-center rounded-full"
      >
        <Mascote nivel={nivel} pose={aberto ? 'acenar' : 'parado'} tamanho={TAMANHO_DO_MASCOTE} className="mascote-na-barra" />
      </button>
    </li>
  );
}
