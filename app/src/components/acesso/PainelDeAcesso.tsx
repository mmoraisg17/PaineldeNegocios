import { useState } from 'react';
import { Link } from 'react-router';
import type { PapelDaConta } from '../../dominio';
import { ContasDaDemo } from './ContasDaDemo';
import { enderecoDoCadastro } from './enderecos';
import { LINK_SECUNDARIO } from './estilos';
import { FormularioDeLogin } from './FormularioDeLogin';

/* Conteúdo da aba ativa: aviso do convite (se houver), login, criação de conta
   e contas de demonstração. O e-mail e a senha ficam aqui, e não no
   formulário, para o botão "Usar" das contas de demonstração poder
   preenchê-los. Quem usa este painel dá `key={papel}` para trocar de aba
   começar com campos limpos (a senha de um papel não vai para o outro). */
export function PainelDeAcesso({ papel, convite }: { papel: PapelDaConta; convite: string }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const conviteDoPapel = papel === 'acompanhante' ? convite : '';

  return (
    <>
      {conviteDoPapel && (
        <p className="rounded-cartao bg-alerta-fundo px-4 py-3 text-lg font-semibold text-alerta-texto">
          {`Você recebeu um convite de acompanhamento (código ${conviteDoPapel}). Entre ou crie sua conta para aceitar.`}
        </p>
      )}
      {papel === 'acompanhante' && <p className="text-lg text-texto-suave">Personal, fisioterapeuta ou familiar</p>}

      <FormularioDeLogin
        papel={papel}
        convite={conviteDoPapel}
        email={email}
        senha={senha}
        aoMudarEmail={setEmail}
        aoMudarSenha={setSenha}
      />

      <div className="flex flex-col gap-2">
        <p className="text-lg text-texto">Ainda não tem conta?</p>
        <Link to={enderecoDoCadastro(papel, conviteDoPapel)} className={LINK_SECUNDARIO}>
          Criar conta
        </Link>
      </div>

      <ContasDaDemo
        papel={papel}
        aoUsar={(emailDaConta, senhaDaConta) => {
          setEmail(emailDaConta);
          setSenha(senhaDaConta);
        }}
      />
    </>
  );
}
