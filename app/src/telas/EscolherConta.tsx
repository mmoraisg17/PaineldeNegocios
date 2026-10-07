import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { TAMANHO_MAXIMO_DA_FUNCAO, TAMANHO_MAXIMO_DO_NOME, type TipoAcompanhante, trilhaDoObjetivo } from '../dominio';
import { criarAcompanhante, entrar } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { ROTULO_DA_TRILHA } from '../estado/formatos';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* Login simulado (PRD: "modo demonstração, sem senha"). As contas do manual
   (seção 17) entram com um toque; quem quiser ver o primeiro uso cria uma
   conta nova. Nada de senha: no protótipo os dados ficam só no aparelho. */
export function EscolherConta() {
  const { papel } = useParams();
  if (papel !== 'praticante' && papel !== 'acompanhante') return <Navigate to="/" replace />;
  return papel === 'praticante' ? <ContasDePraticante /> : <ContasDeAcompanhante />;
}

const cartao =
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-cartao border-2 border-borda bg-superficie px-4 py-3 text-left active:border-primaria';

function Cabecalho({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  const ref = useTituloDaTela(titulo);
  return (
    <header className="flex flex-col gap-2">
      <Link to="/" className="flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria">
        <span aria-hidden="true">‹</span> Voltar
      </Link>
      <h1 ref={ref} tabIndex={-1} className="text-3xl font-bold outline-none">
        {titulo}
      </h1>
      <p className="text-lg text-texto-suave">{subtitulo}</p>
    </header>
  );
}

function ContasDePraticante() {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  const praticantes = Object.values(estado.praticantes);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
      <Cabecalho titulo="Quem vai treinar?" subtitulo="Contas de demonstração: toque para entrar." />
      <ul className="flex flex-col gap-3">
        {praticantes.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={cartao}
              onClick={() => {
                atualizar((e) => entrar(e, { papel: 'praticante', id: p.id }));
                navegar('/praticante/hoje');
              }}
            >
              <span>
                <span className="block text-xl font-semibold">{p.perfil.nome}</span>
                <span className="block text-base text-texto-suave">{ROTULO_DA_TRILHA[trilhaDoObjetivo(p.perfil.objetivo)]}</span>
              </span>
              <span aria-hidden="true" className="text-2xl text-primaria">›</span>
            </button>
          </li>
        ))}
      </ul>
      <Link to="/primeiro-uso" className="flex min-h-16 items-center justify-center rounded-botao border-2 border-primaria text-lg font-semibold text-primaria">
        Começar do zero (primeiro uso)
      </Link>
    </div>
  );
}

const TIPOS: { valor: TipoAcompanhante; rotulo: string }[] = [
  { valor: 'profissional', rotulo: 'Profissional (personal, fisioterapeuta)' },
  { valor: 'familiar', rotulo: 'Familiar' },
];

function ContasDeAcompanhante() {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoAcompanhante>('profissional');
  const [funcao, setFuncao] = useState('');

  const entrarComo = (id: string) => {
    atualizar((e) => entrar(e, { papel: 'acompanhante', id }));
    navegar('/acompanhante/alunos');
  };

  const criar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!nome.trim()) return;
    const padrao = tipo === 'familiar' ? 'Familiar' : 'Profissional';
    const { estado: novo, id } = criarAcompanhante(estado, { nome: nome.trim(), tipo, funcao: funcao.trim() || padrao });
    atualizar(() => entrar(novo, { papel: 'acompanhante', id }));
    navegar('/acompanhante/alunos');
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
      <Cabecalho titulo="Quem vai acompanhar?" subtitulo="Personal, fisioterapeuta ou familiar. Toque para entrar." />
      <ul className="flex flex-col gap-3">
        {estado.acompanhantes.map((a) => (
          <li key={a.id}>
            <button type="button" className={cartao} onClick={() => entrarComo(a.id)}>
              <span>
                <span className="block text-xl font-semibold">{a.nome}</span>
                <span className="block text-base text-texto-suave">
                  {a.funcao} · {a.tipo === 'familiar' ? 'só acompanha' : 'acompanha e ajusta'}
                </span>
              </span>
              <span aria-hidden="true" className="text-2xl text-primaria">›</span>
            </button>
          </li>
        ))}
      </ul>

      {!criando ? (
        <button type="button" onClick={() => setCriando(true)} className="min-h-16 rounded-botao border-2 border-primaria text-lg font-semibold text-primaria">
          Sou um novo acompanhante
        </button>
      ) : (
        <form onSubmit={criar} className="flex flex-col gap-3 rounded-cartao bg-superficie p-4">
          <label className="flex flex-col gap-1 text-lg font-semibold">
            Seu nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={TAMANHO_MAXIMO_DO_NOME} required className="min-h-12 rounded-botao border-2 border-borda px-3 font-normal" />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-lg font-semibold">Você é</legend>
            {TIPOS.map((t) => (
              <label key={t.valor} className="flex min-h-12 items-center gap-3 text-lg">
                <input type="radio" name="tipo" value={t.valor} checked={tipo === t.valor} onChange={() => setTipo(t.valor)} className="size-6" />
                {t.rotulo}
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1 text-lg font-semibold">
            Função (opcional)
            <input value={funcao} onChange={(e) => setFuncao(e.target.value)} maxLength={TAMANHO_MAXIMO_DA_FUNCAO} placeholder="Ex.: Fisioterapeuta, Filho" className="min-h-12 rounded-botao border-2 border-borda px-3 font-normal" />
          </label>
          <button type="submit" className="min-h-14 rounded-botao bg-primaria text-lg font-semibold text-sobre-primaria">
            Entrar
          </button>
        </form>
      )}
    </div>
  );
}
