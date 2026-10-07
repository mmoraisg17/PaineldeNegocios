import { useId, useState, type FormEvent } from 'react';
import type { Acompanhante, DadosPraticante } from '../../dominio';
import { TAMANHO_MAXIMO_DO_RECADO, enviarRecado } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { BOTAO_PRINCIPAL, CAMPO, CARTAO } from './estilos';

/* Mesmo limite que `enviarRecado` aplica (acoes.ts): a tela já o impõe no
   campo e mostra o contador, em vez de cortar o texto em silêncio ao enviar. */
const LIMITE_DO_RECADO = TAMANHO_MAXIMO_DO_RECADO;

type Retorno = { tipo: 'ok' | 'erro'; texto: string };

/* Enviar recado (manual 12.5, só profissional): mensagem de mão única que o
   aluno lê na tela Hoje. */
export function EnviarRecado({ aluno, acompanhante }: { aluno: DadosPraticante; acompanhante: Acompanhante }) {
  const { estado, atualizar } = useApp();
  const [texto, setTexto] = useState('');
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const idTitulo = useId();
  const idCampo = useId();
  const idContador = useId();

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!texto.trim()) {
      setRetorno({ tipo: 'erro', texto: 'Escreva o recado antes de enviar.' });
      return;
    }
    const resultado = enviarRecado(estado, acompanhante.id, aluno.id, texto, new Date());
    if (!resultado.ok) {
      setRetorno({ tipo: 'erro', texto: 'Não foi possível enviar. Seu acesso a este aluno mudou.' });
      return;
    }
    atualizar(() => resultado.estado);
    setTexto('');
    setRetorno({ tipo: 'ok', texto: `Recado enviado. ${aluno.perfil.nome} vai ler na tela Hoje.` });
  };

  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Enviar recado
      </h2>
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        <label htmlFor={idCampo} className="text-lg font-semibold text-texto">
          Recado para {aluno.perfil.nome}
        </label>
        <textarea
          id={idCampo}
          value={texto}
          maxLength={LIMITE_DO_RECADO}
          rows={4}
          aria-describedby={idContador}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setRetorno(null);
          }}
          className={`${CAMPO} py-2`}
        />
        <p id={idContador} className="text-base text-texto-suave">
          {texto.length} de {LIMITE_DO_RECADO} caracteres
        </p>
        <p className="text-base text-texto-suave">É uma mensagem de mão única: o aluno lê, mas não responde por aqui.</p>
        <button type="submit" className={BOTAO_PRINCIPAL}>
          Enviar recado
        </button>
      </form>
      {retorno ? (
        <p
          role={retorno.tipo === 'ok' ? 'status' : 'alert'}
          className={`rounded-botao p-3 text-lg font-semibold ${retorno.tipo === 'ok' ? 'bg-primaria-suave text-primaria-escura' : 'bg-perigo-fundo text-perigo'}`}
        >
          <span aria-hidden="true">{retorno.tipo === 'ok' ? '✓ ' : '! '}</span>
          {retorno.texto}
        </p>
      ) : null}
    </section>
  );
}
