import { useId } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { CartaoDoAluno } from '../../components/acompanhante/CartaoDoAluno';
import { BOTAO_SECUNDARIO, CARTAO, CORPO_DA_TELA, TITULO_DA_TELA } from '../../components/acompanhante/estilos';
import { resumoDoAluno } from '../../components/acompanhante/resumoDoAluno';
import { VincularAluno } from '../../components/acompanhante/VincularAluno';
import { alunosDe, sair } from '../../estado/acoes';
import { useAcompanhanteAtual, useApp } from '../../estado/ContextoApp';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';

/* Meus alunos (manual 12.2): só aparecem os que autorizaram este
   acompanhante, com o essencial de cada um para decidir quem olhar primeiro. */
export function Alunos() {
  const tituloRef = useTituloDaTela('Meus alunos');
  const { estado, atualizar } = useApp();
  const acompanhante = useAcompanhanteAtual();
  const navegar = useNavigate();
  const idAdicionar = useId();

  /* Sessão encerrada (ou conta que não existe mais): volta ao início. */
  if (!acompanhante) return <Navigate to="/" replace />;

  const agora = new Date();
  const alunos = alunosDe(estado, acompanhante.id);
  const aguardando = estado.vinculos
    .filter((vinculo) => vinculo.acompanhanteId === acompanhante.id && vinculo.status === 'pendente')
    .flatMap((vinculo) => {
      const nome = estado.praticantes[vinculo.alunoId]?.perfil.nome;
      return nome ? [{ id: vinculo.id, nome }] : [];
    });

  return (
    <div className={CORPO_DA_TELA}>
      <header className="flex flex-col gap-1">
        <h1 ref={tituloRef} tabIndex={-1} className={TITULO_DA_TELA}>
          Meus alunos
        </h1>
        <p className="text-lg text-texto-suave">
          {acompanhante.nome} · {acompanhante.funcao}
        </p>
      </header>

      <section aria-labelledby={idAdicionar} className={`${CARTAO} flex flex-col gap-3`}>
        <h2 id={idAdicionar} className="text-xl font-bold text-texto">
          Adicionar aluno
        </h2>
        <p className="text-lg text-texto-suave">Cole o código ou o link que o aluno enviou.</p>
        <VincularAluno acompanhanteId={acompanhante.id} />
      </section>

      {alunos.length === 0 ? (
        <div className={`${CARTAO} flex flex-col gap-2`}>
          <p className="text-lg font-semibold text-texto">Você ainda não tem alunos.</p>
          <p className="text-lg text-texto">
            Peça para o aluno abrir Perfil → Acompanhantes → Convidar, gerar o código ou o link e enviar para você. Depois cole
            aqui em cima e aguarde a autorização.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {alunos.map(({ praticante }) => {
            const resumo = resumoDoAluno(estado, praticante.id, agora);
            return resumo ? (
              <li key={praticante.id}>
                <CartaoDoAluno praticante={praticante} resumo={resumo} />
              </li>
            ) : null;
          })}
        </ul>
      )}

      {aguardando.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {aguardando.map(({ id, nome }) => (
            <li key={id} className="text-base text-texto-suave">
              <span aria-hidden="true">⏳ </span>
              Aguardando autorização: {nome}
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => {
          atualizar(sair);
          navegar('/');
        }}
        className={`${BOTAO_SECUNDARIO} mt-auto`}
      >
        Sair
      </button>
    </div>
  );
}
