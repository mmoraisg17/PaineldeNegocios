import { useId, useState, type Ref } from 'react';
import { CAMPO, CAMPO_COM_ERRO, DICA, MENSAGEM_DE_ERRO, ROTULO } from './estilos';

type Props = {
  id?: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  autoComplete: 'current-password' | 'new-password';
  dica?: string;
  erro?: string;
  maxLength?: number;
  ref?: Ref<HTMLInputElement>;
};

function IconeDoOlho({ riscado }: { riscado: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {riscado && <path d="M4 4l16 16" />}
    </svg>
  );
}

/* Quem tem 60 anos ou mais costuma errar a senha num teclado pequeno e não
   enxerga o que digitou; o olho deixa conferir. O campo é o mesmo nos dois
   estados (só muda o `type`), então o valor e o cursor não se perdem. */
export function CampoDeSenha({ id, rotulo, valor, aoMudar, autoComplete, dica, erro, maxLength, ref }: Props) {
  const idGerado = useId();
  const idDoCampo = id ?? idGerado;
  const idDaDica = `${idDoCampo}-dica`;
  const idDoErro = `${idDoCampo}-erro`;
  const [visivel, setVisivel] = useState(false);
  const descricao = [dica ? idDaDica : null, erro ? idDoErro : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idDoCampo} className={ROTULO}>
        {rotulo}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={idDoCampo}
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao || undefined}
          className={`${CAMPO} pr-14 ${erro ? CAMPO_COM_ERRO : ''}`}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-controls={idDoCampo}
          className="absolute inset-y-0 right-0 flex min-h-12 min-w-12 items-center justify-center rounded-botao text-primaria active:bg-primaria-suave"
        >
          <IconeDoOlho riscado={visivel} />
        </button>
      </div>
      {dica && (
        <p id={idDaDica} className={DICA}>
          {dica}
        </p>
      )}
      {erro && (
        <p id={idDoErro} className={MENSAGEM_DE_ERRO}>
          {erro}
        </p>
      )}
    </div>
  );
}
