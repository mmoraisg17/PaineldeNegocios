import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../estado/ContextoApp';
import { Confirmacao } from './Confirmacao';
import { BOTAO_DE_PERIGO } from './estilos';
import { Secao } from './Secao';

/* Privacidade (manual 13.2): o que o app guarda, quem vê, e como recomeçar. */
export function PrivacidadeDoPerfil() {
  const { reiniciarDemonstracao } = useApp();
  const navegar = useNavigate();
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const [confirmando, setConfirmando] = useState(false);

  const apagar = () => {
    reiniciarDemonstracao();
    navegar('/');
  };

  return (
    <Secao titulo="Privacidade">
      <p className="text-lg text-texto">Os dados de treino são dados de saúde. Só você e as pessoas que você autorizou podem vê-los.</p>
      <p className="text-lg text-texto">No protótipo, os dados ficam apenas neste aparelho: nada é enviado para a internet.</p>
      <button
        ref={gatilhoRef}
        type="button"
        aria-expanded={confirmando}
        onClick={() => setConfirmando(true)}
        className={BOTAO_DE_PERIGO}
      >
        Apagar meus dados e recomeçar
      </button>
      {confirmando ? (
        <Confirmacao
          pergunta="Apagar tudo e recomeçar?"
          detalhe="Treinos, acompanhantes e ajustes saem deste aparelho e o app volta ao início, como no primeiro uso. Não dá para desfazer."
          textoConfirmar="Sim, apagar tudo"
          aoConfirmar={apagar}
          aoCancelar={() => setConfirmando(false)}
          gatilho={gatilhoRef}
        />
      ) : null}
    </Secao>
  );
}
