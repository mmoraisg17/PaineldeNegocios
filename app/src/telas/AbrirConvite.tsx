import { Navigate, useParams } from 'react-router';
import { contaConectadaValida } from '../components/acesso/contaConectada';
import { enderecoDoInicio } from '../components/acesso/enderecos';
import { destinoDepoisDeEntrar } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { codigoDoTexto } from '../estado/linkDoConvite';

/* Porta de entrada do link do convite (#/convite/ABC234). Só decide para onde
   ir, por isso não desenha nada. O destino nunca vem da URL: são caminhos
   fixos mais o código já reduzido a letras e dígitos (`codigoDoTexto`), então
   o link não serve para mandar a pessoa a outro endereço. */
export function AbrirConvite() {
  const { codigo: bruto } = useParams();
  const { estado } = useApp();
  const codigo = codigoDoTexto(bruto ?? '');
  if (!codigo) return <Navigate to="/" replace />;

  const conta = contaConectadaValida(estado);
  if (conta?.papel === 'acompanhante') {
    return <Navigate to={destinoDepoisDeEntrar(estado, conta, codigo)} replace />;
  }
  return <Navigate to={enderecoDoInicio('acompanhante', codigo)} replace />;
}
