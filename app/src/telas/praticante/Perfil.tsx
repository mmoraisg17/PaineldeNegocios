import { Navigate, useNavigate } from 'react-router';
import { AcompanhantesDoPerfil } from '../../components/perfil/AcompanhantesDoPerfil';
import { AjustesDoApp } from '../../components/perfil/AjustesDoApp';
import { DadosDoPerfil } from '../../components/perfil/DadosDoPerfil';
import { PrivacidadeDoPerfil } from '../../components/perfil/PrivacidadeDoPerfil';
import { BOTAO_SECUNDARIO } from '../../components/perfil/estilos';
import { sair } from '../../estado/acoes';
import { useApp, usePraticanteAtual } from '../../estado/ContextoApp';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';

/* Perfil do praticante (manual, seções 11 e 13): dados, acompanhantes, ajustes
   de acessibilidade e privacidade. A maior parte do trabalho está nos
   componentes de components/perfil; aqui só se monta a tela. */
export function Perfil() {
  const tituloRef = useTituloDaTela('Perfil');
  const praticante = usePraticanteAtual();
  const { atualizar } = useApp();
  const navegar = useNavigate();

  /* Conta apagada ou sessão encerrada: não há perfil para mostrar. */
  if (!praticante) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-6">
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Perfil
      </h1>
      <DadosDoPerfil praticante={praticante} />
      <AcompanhantesDoPerfil praticanteId={praticante.id} />
      <AjustesDoApp />
      <PrivacidadeDoPerfil />
      <button
        type="button"
        onClick={() => {
          atualizar(sair);
          navegar('/');
        }}
        className={BOTAO_SECUNDARIO}
      >
        Sair
      </button>
    </div>
  );
}
