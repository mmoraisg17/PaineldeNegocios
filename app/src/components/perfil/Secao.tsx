import { useId, type ReactNode, type Ref } from 'react';
import { CARTAO } from './estilos';

/* Bloco da tela Perfil: um título (h2) que nomeia a região, para o leitor de
   tela listar as partes da tela e o usuário pular direto para a que quer.
   `tituloRef` deixa quem usa levar o foco ao título depois de uma ação que
   remove o botão clicado. */
export function Secao({ titulo, tituloRef, children }: { titulo: string; tituloRef?: Ref<HTMLHeadingElement>; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={id} ref={tituloRef} tabIndex={-1} className="text-2xl font-bold text-texto outline-none">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
