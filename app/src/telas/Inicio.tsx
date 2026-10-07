import { Link } from 'react-router';
import { APP_NAME, APP_TAGLINE, AVISO_EDUCACIONAL } from '../config/app';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* A ilustração repete a da tela A1 do Figma (pessoa na plataforma, segurando as
   barras): é a primeira coisa que o avaliador vê, e ela já explica o produto. */
function IlustracaoPlataforma() {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-44 shrink-0" role="img" aria-label="Pessoa em pé na plataforma, segurando as barras de apoio">
      <circle cx="100" cy="100" r="96" className="fill-primaria-suave" />
      <rect x="40" y="148" width="120" height="16" rx="8" className="fill-texto-suave/60" />
      <path d="M52 148V90M148 148V90M46 90h12M142 90h12" className="stroke-texto-suave/60" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="62" r="13" className="fill-texto" />
      <path d="M100 76v36M100 112l-12 28M100 112l12 28" className="stroke-texto" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M56 90h88" className="stroke-primaria" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Inicio() {
  const tituloRef = useTituloDaTela(APP_NAME);
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-6">
      <IlustracaoPlataforma />
      <div className="mt-auto pt-6">
        <h1 ref={tituloRef} tabIndex={-1} className="text-4xl font-bold text-primaria outline-none">{APP_NAME}</h1>
        <p className="mt-3 text-xl text-texto">{APP_TAGLINE}</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/entrar/praticante"
            className="flex min-h-16 items-center justify-center rounded-botao bg-primaria px-4 text-center text-lg font-semibold text-sobre-primaria active:bg-primaria-escura"
          >
            Sou praticante
          </Link>
          <Link
            to="/entrar/acompanhante"
            className="flex min-h-16 items-center justify-center rounded-botao border-2 border-primaria bg-superficie px-4 text-center text-lg font-semibold text-primaria active:bg-primaria-suave"
          >
            Sou acompanhante
          </Link>
        </div>
        <p className="mt-2 text-center text-base text-texto-suave">Personal, fisioterapeuta ou familiar</p>

        <p className="mt-8 text-base font-medium text-texto-suave">{AVISO_EDUCACIONAL}</p>
      </div>
    </main>
  );
}
