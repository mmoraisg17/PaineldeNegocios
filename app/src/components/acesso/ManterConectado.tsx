import { useId } from 'react';
import { DICA } from './estilos';

/* Desmarcado por padrão: quem entra num aparelho emprestado (de um familiar,
   do consultório) não deve ficar conectado sem querer. Desmarcado, a conta
   vale só até fechar a aba. */
export function ManterConectado({ marcado, aoMudar }: { marcado: boolean; aoMudar: (marcado: boolean) => void }) {
  const idDaDica = useId();
  return (
    <div className="flex flex-col">
      <label className="flex min-h-12 items-center gap-3 text-lg font-semibold text-texto">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(evento) => aoMudar(evento.target.checked)}
          aria-describedby={idDaDica}
          className="size-6 shrink-0 accent-primaria"
        />
        Manter conectado
      </label>
      <p id={idDaDica} className={`${DICA} pl-9`}>
        Só marque no seu próprio aparelho
      </p>
    </div>
  );
}
