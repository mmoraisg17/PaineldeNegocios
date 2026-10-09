/* Classes repetidas nas telas de acesso. Alvos de toque com no mínimo 48 px
   (os botões principais têm 56 px) e só tokens do tema, nunca cor escrita à
   mão. */

export const BOTAO_PRINCIPAL =
  'flex min-h-14 w-full items-center justify-center rounded-botao bg-primaria px-6 text-center text-lg font-semibold text-sobre-primaria active:bg-primaria-escura disabled:opacity-70';

export const LINK_SECUNDARIO =
  'flex min-h-14 w-full items-center justify-center rounded-botao border-2 border-primaria bg-superficie px-6 text-center text-lg font-semibold text-primaria active:bg-primaria-suave';

export const LINK_VOLTAR = 'flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria';

/* Borda de campo com contraste de 3:1 ou mais (WCAG 1.4.11) e placeholder na
   cor suave, porque o cinza padrão do navegador some para quem enxerga pouco. */
export const CAMPO =
  'min-h-12 w-full rounded-botao border-2 border-borda-campo bg-superficie px-3 text-lg text-texto placeholder:text-texto-suave';

/* Campo com erro: borda e texto em vermelho, mas a mensagem sempre vem escrita
   (nunca só a cor, por causa do daltonismo). */
export const CAMPO_COM_ERRO = 'border-perigo';

export const ROTULO = 'text-lg font-semibold text-texto';

export const DICA = 'text-base text-texto-suave';

export const MENSAGEM_DE_ERRO = 'rounded-botao bg-perigo-fundo px-3 py-2 text-base font-semibold text-perigo';
