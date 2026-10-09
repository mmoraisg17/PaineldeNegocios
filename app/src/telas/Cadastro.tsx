import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { CampoDeSenha } from '../components/acesso/CampoDeSenha';
import { CampoDeTexto } from '../components/acesso/CampoDeTexto';
import { enderecoDoInicio, papelDoTexto } from '../components/acesso/enderecos';
import { BOTAO_PRINCIPAL, LINK_VOLTAR, MENSAGEM_DE_ERRO, ROTULO } from '../components/acesso/estilos';
import { ManterConectado } from '../components/acesso/ManterConectado';
import {
  TAMANHO_MAXIMO_DA_FUNCAO,
  TAMANHO_MAXIMO_DA_SENHA,
  TAMANHO_MAXIMO_DO_EMAIL,
  TAMANHO_MAXIMO_DO_NOME,
  TAMANHO_MINIMO_DA_SENHA,
  criarCredencial,
  novoId,
  type PapelDaConta,
  type TipoAcompanhante,
} from '../dominio';
import {
  type ErroDoCadastro,
  cadastrarAcompanhante,
  cadastrarPraticante,
  destinoDepoisDeEntrar,
  validarCadastro,
} from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { codigoDoTexto } from '../estado/linkDoConvite';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

type Campo = 'nome' | 'email' | 'senha';
type Erros = Partial<Record<Campo, string>>;

const CAMPO_DO_ERRO: Record<ErroDoCadastro, Campo> = {
  'email-invalido': 'email',
  'email-em-uso': 'email',
  'senha-curta': 'senha',
  'senha-longa': 'senha',
};

function mensagemDoErro(erro: ErroDoCadastro, papel: PapelDaConta): string {
  switch (erro) {
    case 'email-invalido':
      return 'Digite um e-mail válido, como nome@exemplo.com.';
    case 'senha-curta':
      return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`;
    case 'senha-longa':
      return `A senha pode ter no máximo ${TAMANHO_MAXIMO_DA_SENHA} caracteres.`;
    case 'email-em-uso':
      return `Já existe uma conta de ${papel} com este e-mail. Volte e toque em Entrar.`;
  }
}

const AVISO_SEM_CRIPTOGRAFIA =
  'Não foi possível criar a conta neste aparelho. Abra o app por um endereço seguro (https) ou em outro navegador.';

const TIPOS: { valor: TipoAcompanhante; rotulo: string }[] = [
  { valor: 'profissional', rotulo: 'Profissional (personal, fisioterapeuta)' },
  { valor: 'familiar', rotulo: 'Familiar' },
];

export function Cadastro() {
  const papel = papelDoTexto(useParams().papel);
  return papel ? <FormularioDeCadastro papel={papel} /> : <Navigate to="/" replace />;
}

function FormularioDeCadastro({ papel }: { papel: PapelDaConta }) {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const convite = papel === 'acompanhante' ? codigoDoTexto(parametros.get('convite') ?? '') : '';
  const titulo = `Criar conta de ${papel}`;
  const tituloRef = useTituloDaTela(titulo);

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoAcompanhante>('profissional');
  const [funcao, setFuncao] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const campoDoNome = useRef<HTMLInputElement>(null);
  const campoDoEmail = useRef<HTMLInputElement>(null);
  const campoDaSenha = useRef<HTMLInputElement>(null);
  const travado = useRef(false);
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  /* Tudo o que dá para conferir sem gastar os ~0,4 s do hash. */
  const conferirCampos = (): Erros => {
    const encontrados: Erros = {};
    if (papel === 'acompanhante' && !nome.trim()) encontrados.nome = 'Digite o seu nome.';
    const erro = validarCadastro(estado, { email, senha, papel });
    if (erro) encontrados[CAMPO_DO_ERRO[erro]] = mensagemDoErro(erro, papel);
    return encontrados;
  };

  const focarPrimeiroInvalido = (encontrados: Erros) => {
    const alvo = encontrados.nome ? campoDoNome : encontrados.email ? campoDoEmail : campoDaSenha;
    alvo.current?.focus();
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (travado.current) return;
    const encontrados = conferirCampos();
    setErros(encontrados);
    setAviso(null);
    if (Object.keys(encontrados).length > 0) {
      focarPrimeiroInvalido(encontrados);
      return;
    }

    travado.current = true;
    setCriando(true);
    try {
      const credencial = await criarCredencial({ email, papel, pessoaId: novoId(), senha }, new Date());
      if (!montado.current) return;
      if (papel === 'praticante') {
        atualizar((atual) => cadastrarPraticante(atual, credencial, manterConectado));
        navegar('/primeiro-uso');
      } else {
        atualizar((atual) => cadastrarAcompanhante(atual, { nome, tipo, funcao }, credencial, manterConectado));
        navegar(destinoDepoisDeEntrar(estado, { papel, id: credencial.pessoaId }, convite));
      }
    } catch {
      if (montado.current) setAviso(AVISO_SEM_CRIPTOGRAFIA);
    } finally {
      travado.current = false;
      if (montado.current) setCriando(false);
    }
  };

  const voltarAoInicio = enderecoDoInicio(papel, convite);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
      <header className="flex flex-col gap-2">
        <Link to={voltarAoInicio} className={LINK_VOLTAR}>
          <span aria-hidden="true">‹</span> Voltar
        </Link>
        <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
          {titulo}
        </h1>
      </header>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {papel === 'acompanhante' && (
          <>
            <CampoDeTexto
              ref={campoDoNome}
              rotulo="Nome"
              autoComplete="name"
              maxLength={TAMANHO_MAXIMO_DO_NOME}
              valor={nome}
              aoMudar={setNome}
              erro={erros.nome}
            />
            <fieldset className="flex flex-col gap-1">
              <legend className={ROTULO}>Você é</legend>
              {TIPOS.map((opcao) => (
                <label key={opcao.valor} className="flex min-h-12 items-center gap-3 text-lg text-texto">
                  <input
                    type="radio"
                    name="tipo"
                    value={opcao.valor}
                    checked={tipo === opcao.valor}
                    onChange={() => setTipo(opcao.valor)}
                    className="size-6 shrink-0 accent-primaria"
                  />
                  {opcao.rotulo}
                </label>
              ))}
            </fieldset>
            <CampoDeTexto
              rotulo="Função (opcional)"
              maxLength={TAMANHO_MAXIMO_DA_FUNCAO}
              placeholder="Ex.: Fisioterapeuta, Filho"
              valor={funcao}
              aoMudar={setFuncao}
            />
          </>
        )}

        <CampoDeTexto
          ref={campoDoEmail}
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={TAMANHO_MAXIMO_DO_EMAIL}
          valor={email}
          aoMudar={setEmail}
          erro={erros.email}
        />
        <CampoDeSenha
          ref={campoDaSenha}
          rotulo="Senha"
          autoComplete="new-password"
          maxLength={TAMANHO_MAXIMO_DA_SENHA}
          dica={`Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres. Crie uma senha só para este app: não use a senha do seu e-mail ou do banco.`}
          valor={senha}
          aoMudar={setSenha}
          erro={erros.senha}
        />
        <ManterConectado marcado={manterConectado} aoMudar={setManterConectado} />

        {aviso && (
          <p role="alert" className={MENSAGEM_DE_ERRO}>
            {aviso}
          </p>
        )}
        <button type="submit" disabled={criando} className={BOTAO_PRINCIPAL}>
          {criando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="text-lg text-texto">
        Já tem conta?{' '}
        <Link to={voltarAoInicio} className="inline-flex min-h-12 items-center font-semibold text-primaria underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
