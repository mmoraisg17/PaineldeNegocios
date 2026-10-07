import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { BOTAO_PRINCIPAL, CAMPO, CORPO_DA_TELA, LINK_VOLTAR, TITULO_DA_TELA } from '../../components/acompanhante/estilos';
import { CODIGO_DO_CONVITE_TAMANHO, VALIDADE_DO_CONVITE_EM_HORAS } from '../../dominio';
import { type ResultadoDoCodigo, usarCodigo } from '../../estado/acoes';
import { useAcompanhanteAtual, useApp } from '../../estado/ContextoApp';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';

const MENSAGEM_DE_ERRO: Record<Extract<ResultadoDoCodigo, { ok: false }>['erro'], string> = {
  'nao-encontrado': 'Não encontramos esse código. Confira as letras e os números com o aluno.',
  expirado: `Esse código venceu (ele vale ${VALIDADE_DO_CONVITE_EM_HORAS} horas). Peça ao aluno para gerar um novo.`,
  'convite-sem-aluno': 'Esse convite não está ligado a nenhum aluno. Peça ao aluno para gerar um código novo.',
};

type Retorno = { tipo: 'ok' | 'erro'; texto: string };

/* Quem digita não vê diferença entre "ab c2" e "ABC2", e o convite usa só
   maiúsculas: normalizar já no campo evita um erro que a pessoa não entenderia. */
const normalizar = (texto: string): string => texto.replace(/\s+/g, '').toUpperCase();

/* Adicionar aluno (manual 12.1): o acompanhante digita o código que o aluno
   gerou em Perfil → Acompanhantes → Convidar. O pedido nasce pendente e só
   vale depois que o aluno autoriza. */
export function AdicionarAluno() {
  const tituloRef = useTituloDaTela('Adicionar aluno');
  const { estado, atualizar } = useApp();
  const acompanhante = useAcompanhanteAtual();
  const [codigo, setCodigo] = useState('');
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const idCampo = useId();
  const idRetorno = useId();

  if (!acompanhante) return <Navigate to="/" replace />;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (codigo.length !== CODIGO_DO_CONVITE_TAMANHO) {
      setRetorno({ tipo: 'erro', texto: `Digite os ${CODIGO_DO_CONVITE_TAMANHO} caracteres do código.` });
      return;
    }
    /* Mesmo no erro o estado volta com os convites vencidos já limpos. */
    const { estado: novo, resultado } = usarCodigo(estado, codigo, acompanhante.id, new Date());
    atualizar(() => novo);
    if (!resultado.ok) {
      setRetorno({ tipo: 'erro', texto: MENSAGEM_DE_ERRO[resultado.erro] });
      return;
    }
    const aluno = estado.praticantes[resultado.vinculo.alunoId]?.perfil.nome ?? 'O aluno';
    setCodigo('');
    setRetorno({
      tipo: 'ok',
      texto:
        resultado.vinculo.status === 'autorizado'
          ? `Você já acompanha ${aluno}.`
          : `Pedido enviado. Agora ${aluno} precisa autorizar no app.`,
    });
  };

  return (
    <div className={CORPO_DA_TELA}>
      <header className="flex flex-col gap-2">
        <Link to="/acompanhante/alunos" className={LINK_VOLTAR}>
          <span aria-hidden="true">‹</span> Voltar
        </Link>
        <h1 ref={tituloRef} tabIndex={-1} className={TITULO_DA_TELA}>
          Adicionar aluno
        </h1>
        <p className="text-lg text-texto-suave">Digite o código de 6 caracteres que o aluno enviou.</p>
      </header>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
        <label htmlFor={idCampo} className="text-lg font-semibold text-texto">
          Código do aluno
        </label>
        <input
          id={idCampo}
          type="text"
          value={codigo}
          maxLength={CODIGO_DO_CONVITE_TAMANHO}
          autoComplete="off"
          autoCapitalize="characters"
          inputMode="text"
          spellCheck={false}
          aria-invalid={retorno?.tipo === 'erro'}
          aria-describedby={retorno ? idRetorno : undefined}
          onChange={(evento) => {
            setCodigo(normalizar(evento.target.value));
            setRetorno(null);
          }}
          className={`${CAMPO} min-h-16 text-center text-3xl font-bold tracking-[0.3em]`}
        />
        <button type="submit" className={BOTAO_PRINCIPAL}>
          Enviar pedido
        </button>
      </form>

      {retorno ? (
        <p
          id={idRetorno}
          role={retorno.tipo === 'ok' ? 'status' : 'alert'}
          className={`rounded-botao p-3 text-lg font-semibold ${retorno.tipo === 'ok' ? 'bg-primaria-suave text-primaria-escura' : 'bg-perigo-fundo text-perigo'}`}
        >
          <span aria-hidden="true">{retorno.tipo === 'ok' ? '✓ ' : '! '}</span>
          {retorno.texto}
        </p>
      ) : null}

      <p className="rounded-botao bg-alerta-fundo p-3 text-base text-alerta-texto">
        Para testar: entre como Dona Lúcia, vá em Perfil → Acompanhantes → Convidar e digite o código aqui.
      </p>
    </div>
  );
}
