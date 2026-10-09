import { Navigate, useSearchParams } from 'react-router';
import { AbasDeAcesso } from '../components/acesso/AbasDeAcesso';
import { contaConectadaValida } from '../components/acesso/contaConectada';
import { papelDoTexto } from '../components/acesso/enderecos';
import { PainelDeAcesso } from '../components/acesso/PainelDeAcesso';
import { APP_NAME, APP_TAGLINE, AVISO_DE_DADOS, AVISO_EDUCACIONAL } from '../config/app';
import type { PapelDaConta } from '../dominio';
import { destinoDepoisDeEntrar } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { codigoDoTexto } from '../estado/linkDoConvite';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* A ilustração repete a da tela A1 do Figma (pessoa na plataforma, segurando as
   barras): é a primeira coisa que o avaliador vê, e ela já explica o produto. */
function IlustracaoPlataforma() {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-32 shrink-0" role="img" aria-label="Pessoa em pé na plataforma, segurando as barras de apoio">
      <circle cx="100" cy="100" r="96" className="fill-primaria-suave" />
      <rect x="40" y="148" width="120" height="16" rx="8" className="fill-texto-suave/60" />
      <path d="M52 148V90M148 148V90M46 90h12M142 90h12" className="stroke-texto-suave/60" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="62" r="13" className="fill-texto" />
      <path d="M100 76v36M100 112l-12 28M100 112l12 28" className="stroke-texto" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M56 90h88" className="stroke-primaria" strokeWidth="7" strokeLinecap="round" />
    </svg>
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
      <IlustracaoPlataforma />
      <h1 ref={tituloRef} tabIndex={-1} className="mt-4 text-4xl font-bold text-primaria outline-none">{APP_NAME}</h1>
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
