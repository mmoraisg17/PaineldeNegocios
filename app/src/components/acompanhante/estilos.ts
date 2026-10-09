/* Classes repetidas nas telas do acompanhante. Alvos de toque com 56 px nos
   botões principais (mínimo recomendado: 48 px) e só tokens do tema, nunca
   cor escrita à mão. */

export const BOTAO_PRINCIPAL =
  'flex min-h-14 items-center justify-center rounded-botao bg-primaria px-6 text-center text-lg font-semibold text-sobre-primaria active:bg-primaria-escura';

export const BOTAO_SECUNDARIO =
  'flex min-h-14 items-center justify-center rounded-botao border-2 border-primaria bg-superficie px-6 text-center text-lg font-semibold text-primaria active:bg-primaria-suave';

export const LINK_VOLTAR = 'flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria';

/* Borda de campo com contraste de 3:1 ou mais (WCAG 1.4.11) e placeholder na
   cor suave, porque o cinza padrão do navegador some para quem enxerga pouco. */
export const CAMPO =
  'min-h-12 w-full rounded-botao border-2 border-borda-campo bg-superficie px-3 text-lg text-texto placeholder:text-texto-suave';

export const CARTAO = 'rounded-cartao bg-superficie p-4';

export const TITULO_DA_TELA = 'text-3xl font-bold text-texto outline-none';

/* Rolagem dentro da tela (o <main> do layout não rola) e respiro para a área
   segura do aparelho. */
export const CORPO_DA_TELA = 'flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]';
