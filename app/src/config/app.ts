/* Identidade do produto num lugar só.

   O nome do produto é Nivela (decidido pelo grupo em 12/10/2026). Nenhum outro
   arquivo do app pode ter o nome escrito por extenso: trocar o produto de nome
   tem que ser trocar esta linha (e a logo, em components/marca/LogoNivela.tsx,
   que desenha a palavra). Não dá para conferir isso com um teste de busca de
   texto: "equilíbrio" também é uma palavra do domínio, como na trilha
   "Equilíbrio 60+". */
export const APP_NAME = 'Nivela';

export const APP_TAGLINE = 'Treinos de equilíbrio e força em casa, com a sua plataforma.';

/* Exigência de posicionamento, não enfeite: o produto é de treino e
   acompanhamento. Prometer diagnóstico ou reabilitação o enquadraria como
   dispositivo médico (ANVISA). O mesmo texto abre o manual de uso. */
export const AVISO_EDUCACIONAL = 'Protótipo educacional. Não substitui a orientação de um profissional de saúde.';

/* Os dados ficam em texto no próprio aparelho (localStorage), sem servidor:
   ninguém deve digitar dado de saúde real no protótipo (revisão de segurança,
   fase 8). */
export const AVISO_DE_DADOS = 'Use dados fictícios: tudo fica só neste aparelho, nada vai para a internet.';
