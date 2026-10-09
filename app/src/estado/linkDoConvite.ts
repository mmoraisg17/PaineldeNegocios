import { CODIGO_DO_CONVITE_TAMANHO } from '../dominio';

/* O app usa rota com "#" (createHashRouter) porque o GitHub Pages não sabe
   responder a /convite/ABC234 direto. Por isso o link do convite é o endereço
   do site + "#/convite/CÓDIGO". */
export const ROTA_DO_CONVITE = '/convite';

/* Pedaço do link depois de "convite/", até a próxima barra, interrogação,
   hash ou espaço. Pega o código mesmo com barra final ou consulta. */
const TRECHO_DO_LINK = /convite\/\s*([^/?#\s]*)/i;
const NAO_ALFANUMERICO = /[^a-zA-Z0-9]/g;

/* `enderecoAtual` costuma ser `window.location.href`: tudo depois do "#" (a
   tela em que a pessoa está) sai, e entra a rota do convite. */
export function linkDoConvite(enderecoAtual: string, codigo: string): string {
  const base = enderecoAtual.split('#')[0] ?? '';
  return `${base}#${ROTA_DO_CONVITE}/${codigo}`;
}

/* Aceita o código digitado, ditado ("abc 234") ou um link colado inteiro.
   O alfabeto do código é só ASCII, então letras acentuadas não contam. */
export function codigoDoTexto(texto: string): string {
  const doLink = TRECHO_DO_LINK.exec(texto);
  const bruto = doLink ? (doLink[1] ?? '') : texto;
  return bruto.replace(NAO_ALFANUMERICO, '').toUpperCase().slice(0, CODIGO_DO_CONVITE_TAMANHO);
}
