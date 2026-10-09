import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { TAMANHO_MAXIMO_DA_SENHA, TAMANHO_MAXIMO_DO_EMAIL, type PapelDaConta } from '../../dominio';
import { destinoDepoisDeEntrar, entrar, entrarComSenha } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { CampoDeSenha } from './CampoDeSenha';
import { CampoDeTexto } from './CampoDeTexto';
import { BOTAO_PRINCIPAL, MENSAGEM_DE_ERRO } from './estilos';
import { ManterConectado } from './ManterConectado';
import { AVISO_SEM_CRIPTOGRAFIA } from './mensagens';

type Props = {
  papel: PapelDaConta;
  convite?: string;
  email: string;
  senha: string;
  aoMudarEmail: (email: string) => void;
  aoMudarSenha: (senha: string) => void;
};

/* Um único aviso para e-mail inexistente e senha errada: dizer qual dos dois
   falhou ensinaria a descobrir quem tem conta. */
const AVISO_DE_CREDENCIAIS = 'E-mail ou senha incorretos.';
const AVISO_DE_CAMPO_VAZIO = 'Digite o e-mail e a senha.';

export function FormularioDeLogin({ papel, convite, email, senha, aoMudarEmail, aoMudarSenha }: Props) {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  const [manterConectado, setManterConectado] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const campoDeEmail = useRef<HTMLInputElement>(null);
  const campoDeSenha = useRef<HTMLInputElement>(null);
  // O estado `entrando` só muda no próximo desenho; a trava vale já no segundo toque.
  const travado = useRef(false);
  // Se a pessoa trocar de aba durante o hash (~0,4 s), a resposta antiga é descartada.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (travado.current) return;
    if (!email.trim() || !senha) {
      setAviso(AVISO_DE_CAMPO_VAZIO);
      (email.trim() ? campoDeSenha : campoDeEmail).current?.focus();
      return;
    }
    travado.current = true;
    setEntrando(true);
    setAviso(null);
    try {
      const resultado = await entrarComSenha(estado, { email, senha, papel, manterConectado });
      if (!montado.current) return;
      if (!resultado.ok) {
        // Sem WebCrypto a senha nem foi conferida: "incorretos" faria quem digitou certo tentar em vão.
        setAviso(resultado.erro === 'sem-criptografia' ? AVISO_SEM_CRIPTOGRAFIA : AVISO_DE_CREDENCIAIS);
        return;
      }
      atualizar((atual) => entrar(atual, resultado.conta));
      navegar(destinoDepoisDeEntrar(estado, resultado.conta, convite));
    } catch {
      if (montado.current) setAviso(AVISO_DE_CREDENCIAIS);
    } finally {
      travado.current = false;
      if (montado.current) setEntrando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoDeTexto
        ref={campoDeEmail}
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        maxLength={TAMANHO_MAXIMO_DO_EMAIL}
        valor={email}
        aoMudar={aoMudarEmail}
      />
      <CampoDeSenha
        ref={campoDeSenha}
        rotulo="Senha"
        autoComplete="current-password"
        maxLength={TAMANHO_MAXIMO_DA_SENHA}
        valor={senha}
        aoMudar={aoMudarSenha}
      />
      <ManterConectado marcado={manterConectado} aoMudar={setManterConectado} />
      {aviso && (
        <p role="alert" className={MENSAGEM_DE_ERRO}>
          {aviso}
        </p>
      )}
      <button type="submit" disabled={entrando} className={BOTAO_PRINCIPAL}>
        {entrando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
