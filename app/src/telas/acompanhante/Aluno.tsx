import { Link, Navigate, useParams } from 'react-router';
import { AjustarRotina } from '../../components/acompanhante/AjustarRotina';
import { AlertasDoAluno } from '../../components/acompanhante/AlertasDoAluno';
import { EnviarRecado } from '../../components/acompanhante/EnviarRecado';
import { CARTAO, CORPO_DA_TELA, LINK_VOLTAR, TITULO_DA_TELA } from '../../components/acompanhante/estilos';
import { HistoricoDoAluno } from '../../components/acompanhante/HistoricoDoAluno';
import { ResumoDoRelatorio } from '../../components/acompanhante/ResumoDoRelatorio';
import { mediasRecentes, resumoDoAluno } from '../../components/acompanhante/resumoDoAluno';
import { type Acompanhante, type DadosPraticante, type Vinculo, permissoesDoVinculo, trilhaDoObjetivo } from '../../dominio';
import { vinculoEntre } from '../../estado/acoes';
import { useAcompanhanteAtual, useApp } from '../../estado/ContextoApp';
import { ROTULO_DA_TRILHA, ROTULO_DO_OBJETIVO } from '../../estado/formatos';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';

/* Relatório do aluno (manual 12.3 a 12.5). A porta de entrada é o vínculo
   autorizado: sem ele não se mostra nenhum dado, nem o nome. Quem abre o
   endereço de um aluno que não o autorizou (ou que não existe) vê a mesma
   mensagem, para a tela não revelar quais contas existem. */
export function Aluno() {
  const { id = '' } = useParams();
  const { estado } = useApp();
  const acompanhante = useAcompanhanteAtual();

  if (!acompanhante) return <Navigate to="/" replace />;

  const vinculo = vinculoEntre(estado, acompanhante.id, id);
  const aluno = estado.praticantes[id];
  if (!vinculo || !aluno) return <SemAcesso />;
  return <Relatorio key={id} aluno={aluno} acompanhante={acompanhante} vinculo={vinculo} />;
}

function SemAcesso() {
  const tituloRef = useTituloDaTela('Sem acesso a este aluno');
  return (
    <div className={CORPO_DA_TELA}>
      <h1 ref={tituloRef} tabIndex={-1} className={TITULO_DA_TELA}>
        Você não tem acesso a este aluno
      </h1>
      <p className="text-lg text-texto">Só vê os dados de treino quem foi autorizado pelo próprio aluno.</p>
      <Link to="/acompanhante/alunos" className={LINK_VOLTAR}>
        <span aria-hidden="true">‹</span> Meus alunos
      </Link>
    </div>
  );
}

type PropsDoRelatorio = { aluno: DadosPraticante; acompanhante: Acompanhante; vinculo: Vinculo };

function Relatorio({ aluno, acompanhante, vinculo }: PropsDoRelatorio) {
  const { estado } = useApp();
  const tituloRef = useTituloDaTela(`Relatório de ${aluno.perfil.nome}`);
  const permitido = permissoesDoVinculo(vinculo);
  const resumo = resumoDoAluno(estado, aluno.id, new Date());

  return (
    <div className={CORPO_DA_TELA}>
      <header className="flex flex-col gap-1">
        <Link to="/acompanhante/alunos" className={LINK_VOLTAR}>
          <span aria-hidden="true">‹</span> Meus alunos
        </Link>
        <h1 ref={tituloRef} tabIndex={-1} className={TITULO_DA_TELA}>
          {aluno.perfil.nome}
        </h1>
        <p className="text-lg text-texto-suave">
          {ROTULO_DA_TRILHA[trilhaDoObjetivo(aluno.perfil.objetivo)]} · {ROTULO_DO_OBJETIVO[aluno.perfil.objetivo]}
        </p>
      </header>

      {resumo ? (
        <>
          <ResumoDoRelatorio resumo={resumo} medias={mediasRecentes(aluno.sessoes)} />
          <AlertasDoAluno alertas={resumo.alertas} />
        </>
      ) : null}

      {permitido.ajustarRotina ? <AjustarRotina aluno={aluno} acompanhante={acompanhante} /> : null}
      {permitido.enviarRecados ? <EnviarRecado aluno={aluno} acompanhante={acompanhante} /> : null}
      {!permitido.ajustarRotina && !permitido.enviarRecados ? (
        <p className={`${CARTAO} text-lg text-texto`}>Como familiar, você acompanha os relatórios, mas não altera a rotina.</p>
      ) : null}

      <HistoricoDoAluno sessoes={aluno.sessoes} />
    </div>
  );
}
