import { useId, type HTMLInputAutoCompleteAttribute, type HTMLAttributes, type Ref } from 'react';
import { CAMPO, CAMPO_COM_ERRO, DICA, MENSAGEM_DE_ERRO, ROTULO } from './estilos';

type Props = {
  id?: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  type?: 'text' | 'email';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  placeholder?: string;
  dica?: string;
  erro?: string;
  ref?: Ref<HTMLInputElement>;
};

/* Campo de uma linha com rótulo visível, dica e erro ligados por aria. O erro
   aparece escrito abaixo do campo, e o campo recebe aria-invalid. */
export function CampoDeTexto({
  id, rotulo, valor, aoMudar, type = 'text', autoComplete, inputMode, maxLength, placeholder, dica, erro, ref,
}: Props) {
  const idGerado = useId();
  const idDoCampo = id ?? idGerado;
  const idDaDica = `${idDoCampo}-dica`;
  const idDoErro = `${idDoCampo}-erro`;
  const descricao = [dica ? idDaDica : null, erro ? idDoErro : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idDoCampo} className={ROTULO}>
        {rotulo}
      </label>
      <input
        ref={ref}
        id={idDoCampo}
        type={type}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        autoCapitalize={type === 'email' ? 'none' : undefined}
        autoCorrect={type === 'email' ? 'off' : undefined}
        spellCheck={type === 'email' ? false : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao || undefined}
        className={`${CAMPO} ${erro ? CAMPO_COM_ERRO : ''}`}
      />
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
