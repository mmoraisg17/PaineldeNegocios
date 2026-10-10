import { Navigate, useSearchParams } from 'react-router';
import { AbasDeAcesso } from '../components/acesso/AbasDeAcesso';
import { contaConectadaValida } from '../components/acesso/contaConectada';
import { papelDoTexto } from '../components/acesso/enderecos';
import { PainelDeAcesso } from '../components/acesso/PainelDeAcesso';
import mascote from '../assets/mascote.png';
import { APP_NAME, APP_TAGLINE, AVISO_DE_DADOS, AVISO_EDUCACIONAL } from '../config/app';
import type { PapelDaConta } from '../dominio';
import { destinoDepoisDeEntrar } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { codigoDoTexto } from '../estado/linkDoConvite';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* O mascote (kettlebell, rodada 2 de 09/10/2026) abre a tela de entrada no
   lugar da ilustração da pessoa na plataforma. A imagem já traz o próprio fundo
   azul-céu, por isso só ganha cantos arredondados. */
function Mascote() {
  return (
    <img
      src={mascote}
      alt="Mascote do app: um kettlebell sorridente"
      width={128}
      height={128}
      className="mx-auto size-32 shrink-0 rounded-cartao"
    />
  );
}

/* Início = entrada do app. A aba e o convite moram no endereço (?papel=…&convite=…):
   assim o link do convite, o botão "voltar" e o recarregar da página caem no mesmo
   lugar. Sem ?papel=, o convite abre a aba do acompanhante (é para quem ele serve);
   um ?papel= explícito sempre vale, para a pessoa poder sair dela. */
export function Inicio() {
  const tituloRef = useTituloDaTela(APP_NAME);
  const { estado } = useApp();
  const [parametros, setParametros] = useSearchParams();
  const convite = codigoDoTexto(parametros.get('convite') ?? '');
  const papel: PapelDaConta = papelDoTexto(parametros.get('papel')) ?? (convite ? 'acompanhante' : 'praticante');

  const trocarDeAba = (novo: PapelDaConta) =>
    setParametros(
      (atuais) => {
        const proximos = new URLSearchParams(atuais);
        proximos.set('papel', novo);
        return proximos;
      },
      { replace: true },
    );

  // Já conectado: não pede senha de novo. Exceção: o praticante que abre um
  // convite precisa poder trocar para a conta de acompanhante.
  const conta = contaConectadaValida(estado);
  if (conta && !(convite && conta.papel === 'praticante')) {
    return <Navigate to={destinoDepoisDeEntrar(estado, conta, convite)} replace />;
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-6">
      <Mascote />
      <h1 ref={tituloRef} tabIndex={-1} className="mt-4 text-4xl font-bold text-marca outline-none">{APP_NAME}</h1>
      <p className="mt-2 text-xl text-texto">{APP_TAGLINE}</p>

      <div className="mt-6">
        <AbasDeAcesso papel={papel} aoTrocar={trocarDeAba}>
          <PainelDeAcesso key={papel} papel={papel} convite={convite} />
        </AbasDeAcesso>
      </div>

      <p className="mt-8 text-base font-medium text-texto-suave">{AVISO_EDUCACIONAL}</p>
      <p className="mt-2 text-base text-texto-suave">{AVISO_DE_DADOS}</p>
    </main>
  );
}
