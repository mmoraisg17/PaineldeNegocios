import type { PapelDaConta } from '../../dominio';
import { codigoDoTexto } from '../../estado/linkDoConvite';

/* Endereços fixos das telas de acesso. O código do convite sempre passa por
   `codigoDoTexto` (só letras e dígitos), então nada digitado pela pessoa ou
   vindo da URL chega ao endereço: nem "&", nem "#", nem outro site. O convite
   só tem sentido para o acompanhante; para o praticante ele é descartado. */

function codigoDoPapel(papel: PapelDaConta, convite: string | undefined): string {
  return papel === 'acompanhante' ? codigoDoTexto(convite ?? '') : '';
}

export function enderecoDoInicio(papel: PapelDaConta, convite?: string): string {
  const codigo = codigoDoPapel(papel, convite);
  return codigo ? `/?papel=${papel}&convite=${codigo}` : `/?papel=${papel}`;
}

export function enderecoDoCadastro(papel: PapelDaConta, convite?: string): string {
  const codigo = codigoDoPapel(papel, convite);
  return codigo ? `/cadastro/${papel}?convite=${codigo}` : `/cadastro/${papel}`;
}

export function papelDoTexto(texto: string | null | undefined): PapelDaConta | null {
  return texto === 'praticante' || texto === 'acompanhante' ? texto : null;
}
