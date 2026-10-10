import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  CATALOGO,
  rotinaDoPraticante,
  trilhaDoObjetivo,
  type Acessorio,
  type Exercicio,
  type ItemRotina,
  type Nivel,
  type Trilha,
} from '../../dominio';
import { usePraticanteAtual, useApp } from '../../estado/ContextoApp';
import { ROTULO_DA_TRILHA, ROTULO_DO_APOIO, formatarDose } from '../../estado/formatos';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';
import { exerciciosAnimados } from '../../movimento/animacoes';
import { Icone } from '../../components/Icone';

/* Biblioteca (manual, seção 9): todos os exercícios, mesmo os que não estão na
   rotina de hoje. "Experimentar agora" abre o exercício fora do treino, então
   não conta para a evolução do nível. */

const TRILHAS: readonly Trilha[] = ['equilibrio60', 'fisio'];
const NIVEIS: readonly Nivel[] = [1, 2, 3];
const ACESSORIOS: readonly Acessorio[] = ['barras', 'elastico', 'inclinacao', 'cadeira'];
const ROTULO_DO_ACESSORIO: Record<Acessorio, string> = {
  barras: 'Barras',
  elastico: 'Elástico',
  inclinacao: 'Inclinação',
  cadeira: 'Cadeira',
};
const NIVEL_PADRAO: Nivel = 1;

const idDaAba = (trilha: Trilha) => `aba-${trilha}`;
const ID_DO_PAINEL = 'painel-da-biblioteca';

export function Biblioteca() {
  const praticante = usePraticanteAtual();
  const { estado } = useApp();
  const tituloRef = useTituloDaTela('Biblioteca');
  const rotina = praticante ? rotinaDoPraticante(estado, praticante.id) : undefined;
  const [trilha, setTrilha] = useState<Trilha>(() => (praticante ? trilhaDoObjetivo(praticante.perfil.objetivo) : 'equilibrio60'));
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [acessorio, setAcessorio] = useState<Acessorio | null>(null);

  const exercicios = CATALOGO.filter((e) => e.trilha === trilha && (acessorio === null || e.acessorios.includes(acessorio)));
  const animados = exerciciosAnimados();

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Biblioteca
      </h1>

      <AbasDeTrilha ativa={trilha} aoEscolher={setTrilha} />

      <div className="flex flex-col gap-3">
        <GrupoDeFiltros rotulo="Filtrar por nível">
          {NIVEIS.map((n) => (
            <Chip key={n} marcado={nivel === n} aoAlternar={() => setNivel(nivel === n ? null : n)}>
              Nível {n}
            </Chip>
          ))}
        </GrupoDeFiltros>
        <GrupoDeFiltros rotulo="Filtrar por acessório">
          {ACESSORIOS.map((a) => (
            <Chip key={a} marcado={acessorio === a} aoAlternar={() => setAcessorio(acessorio === a ? null : a)}>
              {ROTULO_DO_ACESSORIO[a]}
            </Chip>
          ))}
        </GrupoDeFiltros>
      </div>

      <div id={ID_DO_PAINEL} role="tabpanel" aria-labelledby={idDaAba(trilha)} className="flex flex-col gap-3">
        {trilha === 'fisio' ? (
          <p className="rounded-cartao bg-alerta-fundo px-4 py-3 text-base text-alerta-texto">
            Estes exercícios são feitos com a orientação de um profissional.
          </p>
        ) : null}
        <p role="status" className="text-base text-texto-suave">
          {exercicios.length === 1 ? '1 exercício' : `${exercicios.length} exercícios`}
        </p>
        {exercicios.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-cartao bg-superficie p-4">
            <p className="text-lg">Nenhum exercício desta trilha combina com o filtro escolhido.</p>
            <button
              type="button"
              onClick={() => {
                setNivel(null);
                setAcessorio(null);
              }}
              className="min-h-12 rounded-botao border-2 border-marca px-5 text-lg font-semibold text-marca active:bg-primaria-suave"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {exercicios.map((exercicio) => (
              <li key={exercicio.id}>
                <CartaoDoExercicio
                  exercicio={exercicio}
                  itemDaRotina={rotina?.itens.find((item) => item.exercicioId === exercicio.id)}
                  nivelDoFiltro={nivel}
                  nivelSalvo={praticante?.niveis[exercicio.id]}
                  animado={animados.includes(exercicio.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Padrão de abas do WAI-ARIA: só a aba ativa entra na ordem do Tab, e as
   setas (Home/End também) trocam de aba já ativando, como no leitor de tela. */
function AbasDeTrilha({ ativa, aoEscolher }: { ativa: Trilha; aoEscolher: (trilha: Trilha) => void }) {
  const abas = useRef<Partial<Record<Trilha, HTMLButtonElement | null>>>({});

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>) {
    const posicao = TRILHAS.indexOf(ativa);
    const destino: Partial<Record<string, number>> = {
      ArrowRight: (posicao + 1) % TRILHAS.length,
      ArrowLeft: (posicao - 1 + TRILHAS.length) % TRILHAS.length,
      Home: 0,
      End: TRILHAS.length - 1,
    };
    const novo = TRILHAS[destino[evento.key] ?? -1];
    if (!novo) return;
    evento.preventDefault();
    aoEscolher(novo);
    abas.current[novo]?.focus();
  }

  return (
    <div role="tablist" aria-label="Trilhas de exercícios" className="grid grid-cols-2 gap-1 rounded-botao bg-primaria-suave p-1">
      {TRILHAS.map((trilha) => {
        const selecionada = trilha === ativa;
        return (
          <button
            key={trilha}
            ref={(elemento) => {
              abas.current[trilha] = elemento;
            }}
            id={idDaAba(trilha)}
            type="button"
            role="tab"
            aria-selected={selecionada}
            aria-controls={ID_DO_PAINEL}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => aoEscolher(trilha)}
            onKeyDown={aoTeclar}
            className={`min-h-12 rounded-botao px-2 text-lg ${
              selecionada ? 'bg-superficie font-bold text-marca shadow-sm' : 'font-semibold text-texto-suave'
            }`}
          >
            {ROTULO_DA_TRILHA[trilha]}
          </button>
        );
      })}
    </div>
  );
}

function GrupoDeFiltros({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

/* O chip ligado ganha um ✓ além da cor: o estado nunca depende só dela. */
function Chip({ marcado, aoAlternar, children }: { marcado: boolean; aoAlternar: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      onClick={aoAlternar}
      className={`flex min-h-12 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold ${
        marcado ? 'border-marca bg-primaria text-sobre-primaria' : 'border-borda bg-superficie text-texto'
      }`}
    >
      {marcado ? <Icone nome="certo" className="size-4" /> : null}
      {children}
    </button>
  );
}

type PropsDoCartao = {
  exercicio: Exercicio;
  itemDaRotina: ItemRotina | undefined;
  nivelDoFiltro: Nivel | null;
  nivelSalvo: Nivel | undefined;
  animado: boolean;
};

function CartaoDoExercicio({ exercicio, itemDaRotina, nivelDoFiltro, nivelSalvo, animado }: PropsDoCartao) {
  const idTitulo = `exercicio-${exercicio.id}`;
  // Abre no nível do filtro; sem filtro, no que a pessoa já treina; senão, no mais leve.
  const nivelParaAbrir = nivelDoFiltro ?? itemDaRotina?.nivel ?? nivelSalvo ?? NIVEL_PADRAO;
  const configDoFiltro = nivelDoFiltro ? exercicio.niveis[nivelDoFiltro] : undefined;

  return (
    <article aria-labelledby={idTitulo} className="flex flex-col gap-2 rounded-cartao bg-superficie p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 id={idTitulo} className="text-xl font-bold text-texto">
          {exercicio.nome}
        </h2>
        {animado ? (
          <span className="shrink-0 rounded-full bg-primaria-suave px-3 py-1 text-sm font-bold text-primaria-escura">Animação 3D</span>
        ) : null}
      </div>
      <p className="text-lg text-texto">{exercicio.paraQue}</p>

      <ul aria-label="Acessórios" className="flex flex-wrap gap-2">
        {exercicio.acessorios.map((acessorio) => (
          <li key={acessorio} className="rounded-full border border-borda px-3 py-1 text-base text-texto-suave">
            {ROTULO_DO_ACESSORIO[acessorio]}
          </li>
        ))}
      </ul>

      {configDoFiltro && nivelDoFiltro ? (
        <p className="rounded-botao bg-fundo px-3 py-2 text-base text-texto">
          Nível {nivelDoFiltro}: {formatarDose(configDoFiltro.dose)} · {ROTULO_DO_APOIO[configDoFiltro.apoio]}
        </p>
      ) : null}

      <p className="text-base font-semibold text-texto-suave">{itemDaRotina ? `Seu nível atual: ${itemDaRotina.nivel}` : 'Não está na sua rotina'}</p>

      <Link
        to={`/praticante/exercicio/${exercicio.id}?nivel=${nivelParaAbrir}`}
        className="mt-1 flex min-h-14 items-center justify-center rounded-botao bg-primaria px-4 text-lg font-semibold text-sobre-primaria active:bg-primaria-pressionada"
      >
        Experimentar agora<span className="sr-only">: {exercicio.nome}</span>
      </Link>
    </article>
  );
}
