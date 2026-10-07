/* Classes repetidas na tela Perfil. Alvos de toque com 56 px nos botões
   principais (mínimo recomendado: 48 px) e só tokens do tema. */

export const BOTAO_PRINCIPAL =
  'flex min-h-14 w-full items-center justify-center rounded-botao bg-primaria px-6 text-center text-lg font-semibold text-sobre-primaria active:bg-primaria-escura';

export const BOTAO_SECUNDARIO =
  'flex min-h-14 w-full items-center justify-center rounded-botao border-2 border-primaria bg-superficie px-6 text-center text-lg font-semibold text-primaria active:bg-primaria-suave';

/* Ação que desfaz algo (remover acesso, apagar dados): vermelho E texto
   explícito, nunca só a cor. */
export const BOTAO_DE_PERIGO =
  'flex min-h-14 w-full items-center justify-center rounded-botao border-2 border-perigo bg-superficie px-6 text-center text-lg font-semibold text-perigo active:bg-perigo-fundo';

export const CARTAO = 'rounded-cartao bg-superficie p-4';
