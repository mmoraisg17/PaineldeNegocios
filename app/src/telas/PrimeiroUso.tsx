import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TAMANHO_MAXIMO_DO_NOME, type Acessorio, type Firmeza, type Nivel, type Objetivo, nivelInicial } from '../dominio';
import { criarPraticante, entrar } from '../estado/acoes';
import { useApp } from '../estado/ContextoApp';
import { ROTULO_DA_FIRMEZA, ROTULO_DO_OBJETIVO } from '../estado/formatos';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* Primeiro uso do praticante (manual, seção 4.3): perfil em 3 perguntas →
   conectar a plataforma → calibração de 2 s → avaliação de 10 s → nível
   sugerido. A plataforma é simulada: conexão e medidas são encenadas, mas o
   nível sai da mesma regra do domínio (nivelInicial) que o app real usaria. */

type Passo = 'perfil' | 'conectar' | 'calibrar' | 'avaliar' | 'resultado';
const PASSOS: Passo[] = ['perfil', 'conectar', 'calibrar', 'avaliar', 'resultado'];

const DURACAO_CALIBRACAO = 2;
const DURACAO_AVALIACAO = 10;

/* Medidas simuladas da avaliação a partir da firmeza declarada: quem diz
   precisar de apoio oscila mais e se apoia mais nas barras. */
const MEDIDAS_SIMULADAS: Record<Firmeza, { oscilacao: number; apoioNasBarras: number }> = {
  'preciso-apoio': { oscilacao: 0.7, apoioNasBarras: 0.35 },
  'as-vezes': { oscilacao: 0.45, apoioNasBarras: 0.18 },
  firme: { oscilacao: 0.2, apoioNasBarras: 0.05 },
};

const OBJETIVOS: Objetivo[] = ['equilibrio', 'fortalecimento', 'joelho', 'tornozelo'];
const FIRMEZAS: Firmeza[] = ['preciso-apoio', 'as-vezes', 'firme'];
const ACESSORIOS_OPCIONAIS: { valor: Acessorio; rotulo: string }[] = [
  { valor: 'elastico', rotulo: 'Elástico' },
  { valor: 'cadeira', rotulo: 'Cadeira firme ou assento acoplável' },
];

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

export function PrimeiroUso() {
  const [passo, setPasso] = useState<Passo>('perfil');
  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo>('equilibrio');
  const [firmeza, setFirmeza] = useState<Firmeza>('as-vezes');
  const [acessorios, setAcessorios] = useState<Acessorio[]>(['cadeira']);
  const tituloRef = useTituloDaTela('Primeiro uso');
  const indice = PASSOS.indexOf(passo) + 1;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
      <header className="flex flex-col gap-2">
        <Link to="/entrar/praticante" className="flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria">
          <span aria-hidden="true">‹</span> Voltar
        </Link>
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
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={TAMANHO_MAXIMO_DO_NOME} placeholder="Ex.: Dona Maria" className="min-h-12 rounded-botao border-2 border-borda px-3 font-normal" />
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-lg font-semibold">3. O que você tem em casa</legend>
            {ACESSORIOS_OPCIONAIS.map((a) => {
              const marcado = acessorios.includes(a.valor);
              return (
                <button
                  key={a.valor}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => setAcessorios((lista) => (marcado ? lista.filter((x) => x !== a.valor) : [...lista, a.valor]))}
                  className={opcao(marcado)}
                >
                  {marcado ? '☑ ' : '☐ '}
                  {a.rotulo}
                </button>
              );
            })}
          </fieldset>
          <button type="submit" className="min-h-16 rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria">
            Continuar
          </button>
        </form>
      )}

      {passo === 'conectar' && <Conectar aoConcluir={() => setPasso('calibrar')} />}
      {passo === 'calibrar' && <Medicao titulo="Calibração" instrucao="Suba na plataforma com os dois pés na área dos sensores, um ao lado do outro. Segure as barras se quiser e fique parado." segundos={DURACAO_CALIBRACAO} rotuloBotao="Estou em cima da plataforma" fim="Pronto! Seu peso foi registrado." aoConcluir={() => setPasso('avaliar')} />}
      {passo === 'avaliar' && <Medicao titulo="Avaliação" instrucao="Fique em pé, olhando para a frente, o mais parado possível." segundos={DURACAO_AVALIACAO} rotuloBotao="Começar a avaliação" fim="Avaliação concluída." aoConcluir={() => setPasso('resultado')} />}
      {passo === 'resultado' && <Resultado perfil={{ nome: nome.trim() || 'Você', objetivo, firmeza, acessoriosEmCasa: acessorios, inclinacaoMaxima: 3 }} />}
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

function Resultado({ perfil }: { perfil: { nome: string; objetivo: Objetivo; firmeza: Firmeza; acessoriosEmCasa: Acessorio[]; inclinacaoMaxima: 3 } }) {
  const { estado, atualizar } = useApp();
  const navegar = useNavigate();
  // Duplo toque (comum no público 60+) criaria dois praticantes.
  const concluido = useRef(false);
  const sugerido = nivelInicial(MEDIDAS_SIMULADAS[perfil.firmeza], perfil.firmeza);
  const [escolhido, setEscolhido] = useState<Nivel>(sugerido);
  const tituloRef = useFocoAoMontar<HTMLHeadingElement>();

  const concluir = () => {
    if (concluido.current) return;
    concluido.current = true;
    // Fora do updater: criarPraticante gera id aleatório e o updater deve ser puro.
    const { estado: novo, id } = criarPraticante(estado, perfil, escolhido);
    atualizar(() => entrar(novo, { papel: 'praticante', id }));
    navegar('/praticante/hoje');
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={tituloRef} tabIndex={-1} className={TITULO_DO_PASSO}>
        Seu nível inicial
      </h2>
      <p className="text-lg">
        Pela avaliação, sugerimos começar no <strong>nível {sugerido}</strong>. Você pode aceitar ou escolher um nível mais fácil.
      </p>
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
