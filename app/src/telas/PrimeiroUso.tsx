import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { TAMANHO_MAXIMO_DO_NOME, type Firmeza, type Nivel, type Objetivo, type Perfil, nivelPelaFirmeza, precisaDoPrimeiroUso } from '../dominio';
import { criarPraticante, entrar, sair } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { ROTULO_DA_FIRMEZA, ROTULO_DO_OBJETIVO } from '../estado/formatos';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* Primeiro uso do praticante (manual, seção 4.3), logo depois do cadastro:
   perfil em 2 perguntas → conectar a plataforma → calibração de 2 s → nível
   sugerido. A plataforma é simulada: conexão e calibração são encenadas.
   Não há avaliação de 10 s nem pergunta de acessórios: o produto já vem com
   elástico e assento, e o nível inicial vem só das respostas (nivelPelaFirmeza).
   Se ele ficar alto ou baixo, a progressão corrige depois, treino a treino. */

type Passo = 'perfil' | 'conectar' | 'calibrar' | 'resultado';
const PASSOS: Passo[] = ['perfil', 'conectar', 'calibrar', 'resultado'];

const DURACAO_CALIBRACAO = 2;

const OBJETIVOS: Objetivo[] = ['equilibrio', 'fortalecimento', 'joelho', 'tornozelo'];
const FIRMEZAS: Firmeza[] = ['preciso-apoio', 'as-vezes', 'firme'];

/* Cada passo troca os botões de lugar; sem mover o foco, teclado e leitor de
   tela voltariam ao topo. O título do passo recebe o foco quando ele aparece. */
function useFocoAoMontar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

const TITULO_DO_PASSO = 'text-2xl font-bold outline-none';

const opcao = (ativa: boolean) =>
  `min-h-14 rounded-botao border-2 px-4 text-left text-lg font-semibold ${ativa ? 'border-primaria bg-primaria-suave text-primaria-escura' : 'border-borda bg-superficie'}`;

/* A triagem só existe para quem acabou de criar a conta e ainda não tem dados.
   Quem já treina vai para o Hoje; quem não entrou volta para o início. A guarda
   fica num componente à parte para os hooks da triagem não rodarem à toa. */
export function PrimeiroUso() {
  const { estado } = useApp();
  if (precisaDoPrimeiroUso(estado)) return <Triagem />;
  const conta = estado.contaAtual;
  const jaTemDados = conta?.papel === 'praticante' && Object.hasOwn(estado.praticantes, conta.id);
  return <Navigate to={jaTemDados ? '/praticante/hoje' : '/?papel=praticante'} replace />;
}

function Triagem() {
  const { atualizar } = useApp();
  const navegar = useNavigate();
  const [passo, setPasso] = useState<Passo>('perfil');
  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo>('equilibrio');
  const [firmeza, setFirmeza] = useState<Firmeza>('as-vezes');
  const tituloRef = useTituloDaTela('Primeiro uso');
  const indice = PASSOS.indexOf(passo) + 1;

  // A conta continua criada: ao entrar de novo, a pessoa volta para esta triagem.
  const sairDaTriagem = () => {
    atualizar(sair);
    navegar('/?papel=praticante');
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
      <header className="flex flex-col gap-2">
        <button type="button" onClick={sairDaTriagem} className="flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria">
          <span aria-hidden="true">‹</span> Sair
        </button>
        <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
          Primeiro uso
        </h1>
        <p className="text-base text-texto-suave">
          Passo {indice} de {PASSOS.length}
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {PASSOS.map((p, i) => (
            <span key={p} className={`h-2 flex-1 rounded-full ${i < indice ? 'bg-primaria' : 'bg-borda'}`} />
          ))}
        </div>
      </header>

      {passo === 'perfil' && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPasso('conectar');
          }}
        >
          <label className="flex flex-col gap-1 text-lg font-semibold">
            Como quer ser chamado?
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={TAMANHO_MAXIMO_DO_NOME} placeholder="Ex.: Dona Maria" className="min-h-12 rounded-botao border-2 border-borda-campo px-3 font-normal placeholder:text-texto-suave" />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-lg font-semibold">1. Seu objetivo</legend>
            {OBJETIVOS.map((o) => (
              <button key={o} type="button" aria-pressed={objetivo === o} onClick={() => setObjetivo(o)} className={opcao(objetivo === o)}>
                {ROTULO_DO_OBJETIVO[o]}
                {(o === 'joelho' || o === 'tornozelo') && <span className="block text-sm font-normal text-texto-suave">Trilha Fisioterapia, com orientação profissional</span>}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-lg font-semibold">2. Sua firmeza hoje</legend>
            {FIRMEZAS.map((f) => (
              <button key={f} type="button" aria-pressed={firmeza === f} onClick={() => setFirmeza(f)} className={opcao(firmeza === f)}>
                {ROTULO_DA_FIRMEZA[f]}
              </button>
            ))}
          </fieldset>
          <button type="submit" className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
            Continuar
          </button>
        </form>
      )}

      {passo === 'conectar' && <Conectar aoConcluir={() => setPasso('calibrar')} />}
      {passo === 'calibrar' && <Medicao titulo="Calibração" instrucao="Suba na plataforma com os dois pés na área dos sensores, um ao lado do outro. Segure as barras se quiser e fique parado." segundos={DURACAO_CALIBRACAO} rotuloBotao="Estou em cima da plataforma" fim="Pronto! Seu peso foi registrado." aoConcluir={() => setPasso('resultado')} />}
      {passo === 'resultado' && <Resultado perfil={{ nome: nome.trim() || 'Você', objetivo, firmeza, inclinacaoMaxima: 3 }} />}
    </div>
  );
}

function Conectar({ aoConcluir }: { aoConcluir: () => void }) {
  const [estado, setEstado] = useState<'parado' | 'buscando' | 'conectada'>('parado');
  const tituloRef = useFocoAoMontar<HTMLHeadingElement>();
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (estado !== 'buscando') return undefined;
    const id = window.setTimeout(() => setEstado('conectada'), 1200);
    return () => window.clearTimeout(id);
  }, [estado]);
  // O botão "Conectar" some ao conectar: o foco vai para o aviso.
  useEffect(() => {
    if (estado === 'conectada') statusRef.current?.focus();
  }, [estado]);

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={tituloRef} tabIndex={-1} className={TITULO_DO_PASSO}>
        Conectar a plataforma
      </h2>
      <p className="text-lg">Ligue a plataforma (luz azul piscando) e toque em conectar.</p>
      <p ref={statusRef} tabIndex={-1} aria-live="polite" className="rounded-cartao bg-superficie p-4 text-lg font-semibold outline-none">
        {estado === 'parado' && '🔵 Plataforma ligada, esperando o app'}
        {estado === 'buscando' && '🔎 Procurando a plataforma…'}
        {estado === 'conectada' && '✓ Conectada (luz azul fixa)'}
      </p>
      {estado !== 'conectada' ? (
        <button type="button" disabled={estado === 'buscando'} onClick={() => setEstado('buscando')} className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria disabled:opacity-60">
          Conectar plataforma
        </button>
      ) : (
        <button type="button" onClick={aoConcluir} className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
          Continuar
        </button>
      )}
      <p className="text-sm text-texto-suave">Demonstração: a conexão Bluetooth é simulada.</p>
    </section>
  );
}

function Medicao(props: { titulo: string; instrucao: string; segundos: number; rotuloBotao: string; fim: string; aoConcluir: () => void }) {
  const [restante, setRestante] = useState<number | null>(null);
  const tituloRef = useFocoAoMontar<HTMLHeadingElement>();
  const contagemRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (restante === null || restante <= 0) return undefined;
    const id = window.setTimeout(() => setRestante((r) => (r === null ? r : r - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [restante]);
  const terminou = restante === 0;
  // "Pular" e a contagem somem no fim: o foco vai para o resultado.
  useEffect(() => {
    if (terminou) contagemRef.current?.focus();
  }, [terminou]);

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={tituloRef} tabIndex={-1} className={TITULO_DO_PASSO}>
        {props.titulo}
      </h2>
      <p className="text-lg">{props.instrucao}</p>
      {/* role="timer" sem aria-live: anunciar cada segundo atrapalharia. Só o
          fim é anunciado, pela região de status logo abaixo. */}
      <p ref={contagemRef} role="timer" tabIndex={-1} className="flex min-h-24 items-center justify-center rounded-cartao bg-superficie text-3xl font-bold tabular outline-none">
        {restante === null ? `${props.segundos} s` : terminou ? `✓ ${props.fim}` : `${restante} s`}
      </p>
      <p role="status" className="sr-only">
        {terminou ? props.fim : ''}
      </p>
      {restante === null && (
        <button type="button" onClick={() => setRestante(props.segundos)} className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
          {props.rotuloBotao}
        </button>
      )}
      {terminou && (
        <button type="button" onClick={props.aoConcluir} className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
          Continuar
        </button>
      )}
      {!terminou && restante !== null && (
        <button type="button" onClick={() => setRestante(0)} className="min-h-12 text-base font-semibold text-primaria underline">
          Pular (demonstração)
        </button>
      )}
    </section>
  );
}

function Resultado({ perfil }: { perfil: Perfil }) {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  // Duplo toque (comum no público 60+) criaria dois praticantes.
  const concluido = useRef(false);
  const sugerido = nivelPelaFirmeza(perfil.firmeza);
  const [escolhido, setEscolhido] = useState<Nivel>(sugerido);
  const tituloRef = useFocoAoMontar<HTMLHeadingElement>();

  const concluir = () => {
    const conta = estado.contaAtual;
    if (concluido.current || !conta) return;
    concluido.current = true;
    // Fora do updater, que deve ser puro. O praticante nasce com o id da conta
    // criada no cadastro; `entrar` mantém a escolha de "manter conectado".
    const { estado: novo } = criarPraticante(estado, perfil, escolhido, () => conta.id);
    atualizar(() => entrar(novo, conta));
    navegar('/praticante/hoje');
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={tituloRef} tabIndex={-1} className={TITULO_DO_PASSO}>
        Seu nível inicial
      </h2>
      <p className="text-lg">
        Pelas suas respostas, sugerimos começar no <strong>nível {sugerido}</strong>.
      </p>
      <p className="text-lg">Você pode aceitar ou escolher um nível mais fácil. O app sobe o nível quando os seus treinos forem bem.</p>
      <div className="flex gap-2" role="group" aria-label="Nível inicial">
        {([1, 2, 3] as const)
          .filter((n) => n <= sugerido)
          .map((n) => (
            <button key={n} type="button" aria-pressed={escolhido === n} onClick={() => setEscolhido(n)} className={`${opcao(escolhido === n)} flex-1 text-center`}>
              Nível {n}
            </button>
          ))}
      </div>
      <button type="button" onClick={concluir} className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
        Ver meu treino de hoje
      </button>
    </section>
  );
}
