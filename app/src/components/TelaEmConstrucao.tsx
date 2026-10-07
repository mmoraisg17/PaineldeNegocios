import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* Marcador das telas que ainda serão construídas (fase 5 do PRD). Fica claro
   para quem abrir o link no meio do desenvolvimento que a tela existe no plano,
   não que está quebrada. */
export function TelaEmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  const tituloRef = useTituloDaTela(titulo);
  return (
    <section aria-labelledby="titulo-tela" className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
      <h1 id="titulo-tela" ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        {titulo}
      </h1>
      <p className="text-lg text-texto-suave">{descricao}</p>
      <p className="rounded-cartao bg-alerta-fundo px-4 py-3 text-alerta-texto">Em construção: esta tela chega numa próxima etapa.</p>
    </section>
  );
}
