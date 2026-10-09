/* Sem WebCrypto (app aberto por http fora de localhost) não dá para criar
   nem conferir senhas. Mesmo texto que Cadastro.tsx mostra (lá a constante é
   local; esta cópia deixa o login avisar igual, sem editar aquele arquivo).
   Se um dia mudar o texto, mude nos dois lugares. */
export const AVISO_SEM_CRIPTOGRAFIA =
  'Não foi possível criar a conta neste aparelho. Abra o app por um endereço seguro (https) ou em outro navegador.';
