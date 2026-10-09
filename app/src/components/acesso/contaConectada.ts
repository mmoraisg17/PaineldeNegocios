import { type ContaAtual, type EstadoApp, precisaDoPrimeiroUso } from '../../dominio';

/* A conta guardada só vale se a pessoa ainda existe no estado: o aparelho pode
   ter dados antigos ou editados à mão. Praticante vale com dados ou à espera da
   triagem (acabou de se cadastrar); acompanhante vale se estiver na lista. */
export function contaConectadaValida(estado: EstadoApp): ContaAtual | null {
  const conta = estado.contaAtual;
  if (!conta) return null;
  if (conta.papel === 'acompanhante') {
    return estado.acompanhantes.some((pessoa) => pessoa.id === conta.id) ? conta : null;
  }
  return Object.hasOwn(estado.praticantes, conta.id) || precisaDoPrimeiroUso(estado) ? conta : null;
}
