import { useMemo, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router';
import {
  FREQUENCIA_SEMANAL_PADRAO,
  IDS_DEMO,
  exerciciosDaTrilha,
  rotinaDoPraticante,
  trilhaDoObjetivo,
  type DadosPraticante,
  type ItemRotina,
  type Nivel,
} from '../../dominio';
import { GraficoSemanal } from '../../components/evolucao/GraficoSemanal';
import { useApp, usePraticanteAtual } from '../../estado/ContextoApp';
import { formatarData } from '../../estado/formatos';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';
import {
  contarSemanasCompletas,
  descreverEvolucao,
  resumirSemanas,
  semanasSeguidas,
  type SemanaResumida,
} from '../../components/evolucao/evolucao';

/* Progresso (manual, seção 10): adesão, evolução semana a semana, nível de
   cada exercício e conquistas simples. */

const ROLAGEM = 'flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]';
const NIVEL_MAXIMO = 3;
const NIVEL_PADRAO: Nivel = 1;
const PORCENTAGEM = 100;
const CONTAS_DE_EXEMPLO: readonly string[] = [IDS_DEMO.lucia, IDS_DEMO.rafael];

type RefDoTitulo = RefObject<HTMLHeadingElement | null>;

const plural = (quantidade: number, singular: string, pluralDaPalavra: string) => (quantidade === 1 ? singular : pluralDaPalavra);

export function Progresso() {
  const praticante = usePraticanteAtual();
  const tituloRef = useTituloDaTela('Progresso');
  if (!praticante) return <SemDados tituloRef={tituloRef} />;
  return <EvolucaoDoPraticante praticante={praticante} tituloRef={tituloRef} />;
}

function SemDados({ tituloRef }: { tituloRef: RefDoTitulo }) {
  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Progresso
      </h1>
      <p className="rounded-cartao bg-superficie p-4 text-lg">Não encontramos os seus dados. Volte ao início e entre de novo.</p>
      <Link to="/" className="flex min-h-14 w-fit items-center rounded-botao bg-primaria px-6 text-lg font-semibold text-sobre-primaria">
        Voltar ao início
      </Link>
    </div>
  );
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xl font-bold text-texto">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function EvolucaoDoPraticante({ praticante, tituloRef }: { praticante: DadosPraticante; tituloRef: RefDoTitulo }) {
  const { estado } = useApp();
  const rotina = rotinaDoPraticante(estado, praticante.id);
  // A frequência vigente vale para todas as semanas mostradas: o app não guarda o histórico dela.
  const planejadas = rotina?.frequenciaSemanal ?? FREQUENCIA_SEMANAL_PADRAO;
  const agora = useMemo(() => new Date(), []);
  const semanas = useMemo(() => resumirSemanas(praticante.sessoes, agora), [praticante.sessoes, agora]);
  const rotulos = semanas.map((semana) => formatarData(semana.fim.toISOString()));
  const totalDeTreinos = semanas.reduce((total, semana) => total + semana.treinos, 0);
  const niveis = niveisDosExercicios(praticante, rotina?.itens ?? []);
  const ehExemplo = CONTAS_DE_EXEMPLO.includes(praticante.id);

  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Progresso
      </h1>

      {ehExemplo ? (
        <p role="note" className="flex items-center gap-3 rounded-cartao bg-alerta-fundo px-4 py-3 text-base font-semibold text-alerta-texto">
          <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-superficie/70 font-black">
            i
          </span>
          Dados de exemplo para demonstração
        </p>
      ) : null}

      <Secao id="titulo-adesao" titulo="Adesão">
        <Adesao semanas={semanas} planejadas={planejadas} />
      </Secao>

      <Secao id="titulo-evolucao" titulo="Sua evolução">
        {totalDeTreinos === 0 ? (
          <p className="rounded-cartao bg-superficie p-4 text-lg">
            Quando você fizer os primeiros treinos, os gráficos de simetria, estabilidade e apoio nas barras aparecem aqui.
          </p>
        ) : (
          <Graficos semanas={semanas} rotulos={rotulos} />
        )}
      </Secao>

      <Secao id="titulo-niveis" titulo="Nível de cada exercício">
        <NiveisDosExercicios niveis={niveis} />
      </Secao>

      <Secao id="titulo-conquistas" titulo="Conquistas">
        <Conquistas semanas={semanas} planejadas={planejadas} niveis={niveis} total={totalDeTreinos} />
      </Secao>
    </div>
  );
}

function Adesao({ semanas, planejadas }: { semanas: readonly SemanaResumida[]; planejadas: number }) {
  const feitos = semanas.reduce((total, semana) => total + semana.treinos, 0);
  const previstos = planejadas * semanas.length;
  const porcentagem = previstos > 0 ? Math.min(Math.round((feitos / previstos) * PORCENTAGEM), PORCENTAGEM) : 0;
  return (
    <>
      <p className="text-lg font-semibold">
        {feitos} de {previstos} {plural(previstos, 'treino', 'treinos')} nas últimas {semanas.length} semanas ({porcentagem}%)
      </p>
      <ul className="flex flex-col gap-2">
        {semanas.map((semana, posicao) => {
          const completa = planejadas > 0 && semana.treinos >= planejadas;
          const largura = planejadas > 0 ? Math.min(semana.treinos / planejadas, 1) * PORCENTAGEM : 0;
          const ehAtual = posicao === semanas.length - 1;
          return (
            <li key={semana.fim.getTime()} className="rounded-botao bg-superficie px-4 py-3">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-base">
                <span className="font-semibold">{ehAtual ? 'Esta semana' : `Semana até ${formatarData(semana.fim.toISOString())}`}</span>
                <span className="text-texto-suave">
                  {semana.treinos} de {planejadas}
                  {completa ? ' · completa' : ''}
                </span>
              </p>
              {/* Reforço visual: os números ao lado já dizem o mesmo. */}
              <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded-full bg-primaria-suave">
                <div className="h-full rounded-full bg-primaria" style={{ width: `${Math.round(largura)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Graficos({ semanas, rotulos }: { semanas: readonly SemanaResumida[]; rotulos: readonly string[] }) {
  const simetria = semanas.map((semana) => semana.simetria);
  const estabilidade = semanas.map((semana) => semana.estabilidade);
  const apoio = semanas.map((semana) => semana.apoio);
  return (
    <>
      <GraficoSemanal
        titulo="Simetria"
        valores={simetria}
        rotulos={rotulos}
        unidade="pontos"
        resumo={descreverEvolucao({ nome: 'Simetria', valores: simetria, rotulos, unidade: 'pontos' })}
        dica="Simetria é o quanto o peso se divide igual entre as pernas."
      />
      <GraficoSemanal
        titulo="Estabilidade"
        valores={estabilidade}
        rotulos={rotulos}
        unidade="pontos"
        resumo={descreverEvolucao({ nome: 'Estabilidade', valores: estabilidade, rotulos, unidade: 'pontos' })}
        dica="Estabilidade é o quão pouco o corpo oscila."
      />
      <GraficoSemanal
        titulo="Apoio nas barras"
        valores={apoio}
        rotulos={rotulos}
        unidade="%"
        resumo={descreverEvolucao({ nome: 'Apoio nas barras', valores: apoio, rotulos, unidade: '%' })}
        dica="Quanto menos apoio, mais firme você está."
      />
    </>
  );
}

type NivelDoExercicio = { id: string; nome: string; nivel: Nivel };

/* O nível da rotina vale mais que o salvo: ele já respeita o nível fixado
   pelo profissional e a inclinação máxima da plataforma da pessoa. */
function niveisDosExercicios(praticante: DadosPraticante, itensDaRotina: readonly ItemRotina[]): NivelDoExercicio[] {
  return exerciciosDaTrilha(trilhaDoObjetivo(praticante.perfil.objetivo)).map((exercicio) => ({
    id: exercicio.id,
    nome: exercicio.nome,
    nivel: itensDaRotina.find((item) => item.exercicioId === exercicio.id)?.nivel ?? praticante.niveis[exercicio.id] ?? NIVEL_PADRAO,
  }));
}

function NiveisDosExercicios({ niveis }: { niveis: readonly NivelDoExercicio[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {niveis.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-botao bg-superficie px-4 py-3">
          <span className="min-w-0 text-lg font-semibold">{item.nome}</span>
          <span className="flex shrink-0 items-center gap-2">
            {/* Três degraus; os preenchidos são o nível. O texto repete o número. */}
            <span aria-hidden="true" className="flex gap-1">
              {Array.from({ length: NIVEL_MAXIMO }, (_, degrau) => (
                <span key={degrau} className={`h-5 w-3 rounded-sm ${degrau < item.nivel ? 'bg-primaria' : 'bg-primaria-suave'}`} />
              ))}
            </span>
            <span className="text-base font-semibold text-primaria">
              Nível {item.nivel} de {NIVEL_MAXIMO}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type PropsDasConquistas = { semanas: readonly SemanaResumida[]; planejadas: number; niveis: readonly NivelDoExercicio[]; total: number };

function Conquistas({ semanas, planejadas, niveis, total }: PropsDasConquistas) {
  const seguidas = semanasSeguidas(semanas);
  const completas = contarSemanasCompletas(semanas, planejadas);
  const noTopo = niveis.filter((item) => item.nivel === NIVEL_MAXIMO);
  const conquistas = [
    ...(seguidas > 0 ? [`${seguidas} ${plural(seguidas, 'semana seguida', 'semanas seguidas')} treinando`] : []),
    ...(total > 0 ? [`${total} ${plural(total, 'treino concluído', 'treinos concluídos')}`] : []),
    ...(completas > 0 ? [`${completas} ${plural(completas, 'semana com todos os treinos feitos', 'semanas com todos os treinos feitos')}`] : []),
    ...noTopo.map((item) => `Nível ${NIVEL_MAXIMO} em ${item.nome}`),
  ];

  if (conquistas.length === 0) {
    return <p className="rounded-cartao bg-superficie p-4 text-lg">As suas conquistas aparecem aqui conforme você treina.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {conquistas.map((texto) => (
        <li key={texto} className="flex items-center gap-3 rounded-botao bg-primaria-suave px-4 py-3 text-lg font-semibold text-primaria-escura">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primaria text-base text-sobre-primaria">
            ★
          </span>
          {texto}
        </li>
      ))}
    </ul>
  );
}
