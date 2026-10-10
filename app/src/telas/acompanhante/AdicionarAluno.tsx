import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { CARTAO, CORPO_DA_TELA, LINK_VOLTAR, TITULO_DA_TELA } from '../../components/acompanhante/estilos';
import { MENSAGEM_DE_ERRO_DO_CONVITE, type ErroDoConvite } from '../../components/acompanhante/mensagensDoConvite';
import { AlertaDoConvite, VincularAluno } from '../../components/acompanhante/VincularAluno';
import { CONTAS_DA_DEMO, SENHA_DA_DEMO, consultarConvite, type EstadoApp, type TipoAcompanhante } from '../../dominio';
import { useAcompanhanteAtual, useApp } from '../../estado/ContextoApp';
import { codigoDoTexto } from '../../estado/linkDoConvite';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';
import { Icone } from '../../components/Icone';

const EMAIL_DA_DEMO = CONTAS_DA_DEMO.find((conta) => conta.pessoaId === 'lucia')?.email ?? '';

type ConviteDoLink = { ok: true; aluno: string; tipo: TipoAcompanhante } | { ok: false; erro: ErroDoConvite };

/* Confere o código que veio no link ANTES de a pessoa aceitar. Não consome o
   convite: quem consome é o envio do formulário. */
function avaliarLink(estado: EstadoApp, codigo: string): ConviteDoLink | null {
  if (codigo === '') return null;
  const consulta = consultarConvite(codigo, estado.convites, new Date());
  if (!consulta.ok) return consulta;
  const aluno = consulta.convite.alunoId ? estado.praticantes[consulta.convite.alunoId]?.perfil.nome : undefined;
  return aluno ? { ok: true, aluno, tipo: consulta.convite.tipo } : { ok: false, erro: 'convite-sem-aluno' };
}

type AreaDoConviteProps = { codigoDoLink: string; acompanhanteId: string; aoEnviar: () => void };

/* A avaliação do link é feita uma vez, ao abrir (a tela tem `key` do código).
   Se fosse refeita a cada desenho, o convite recém-aceito, já consumido, viraria
   "não encontrado" e esconderia a mensagem de sucesso. */
function AreaDoConvite({ codigoDoLink, acompanhanteId, aoEnviar }: AreaDoConviteProps) {
  const { estado } = useApp();
  const [convite] = useState(() => avaliarLink(estado, codigoDoLink));

  return (
    <>
      {convite?.ok ? (
        <p className={`${CARTAO} text-lg font-semibold text-texto`}>
          {convite.aluno} convidou você para acompanhar os treinos como {convite.tipo}.
        </p>
      ) : null}
      {convite && !convite.ok ? (
        <AlertaDoConvite texto={MENSAGEM_DE_ERRO_DO_CONVITE[convite.erro]} />
      ) : null}
      <VincularAluno
        acompanhanteId={acompanhanteId}
        valorInicial={convite?.ok ? codigoDoLink : ''}
        rotuloDoBotao={convite?.ok ? 'Aceitar convite' : 'Enviar pedido'}
        aoEnviar={aoEnviar}
        esconderFormularioAposEnviar
      />
    </>
  );
}

/* Adicionar aluno (manual 12.1): o acompanhante usa o código, ou o link, que o
   aluno gerou em Perfil → Acompanhantes → Convidar. Quem chega pelo link vem
   com ?codigo= e só precisa aceitar. O pedido nasce pendente e só vale depois
   que o aluno autoriza. */
export function AdicionarAluno() {
  const tituloRef = useTituloDaTela('Adicionar aluno');
  const acompanhante = useAcompanhanteAtual();
  const [parametros] = useSearchParams();
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const codigoDoLink = codigoDoTexto(parametros.get('codigo') ?? '');

  if (!acompanhante) return <Navigate to="/" replace />;

  return (
    <div className={CORPO_DA_TELA}>
      <header className="flex flex-col gap-2">
        <Link to="/acompanhante/alunos" className={LINK_VOLTAR}>
          <Icone nome="voltar" /> Voltar
        </Link>
        <h1 ref={tituloRef} tabIndex={-1} className={TITULO_DA_TELA}>
          Adicionar aluno
        </h1>
        <p className="text-lg text-texto-suave">Use o código ou o link que o aluno enviou.</p>
      </header>

      <AreaDoConvite
        key={codigoDoLink}
        codigoDoLink={codigoDoLink}
        acompanhanteId={acompanhante.id}
        aoEnviar={() => setPedidoEnviado(true)}
      />

      {pedidoEnviado ? (
        <Link to="/acompanhante/alunos" className="flex min-h-12 w-fit items-center text-lg font-semibold text-marca underline">
          Ver meus alunos
        </Link>
      ) : null}

      <p className="rounded-botao bg-alerta-fundo p-3 text-base text-alerta-texto">
        Para testar: entre como {EMAIL_DA_DEMO} / {SENHA_DA_DEMO}, vá em Perfil → Acompanhantes → Convidar e copie o código ou
        o link.
      </p>
    </div>
  );
}
