import { useId, useState } from 'react';
import { type Sessao, buscarExercicio, ordenarSessoes } from '../../dominio';
import { formatarData, ROTULO_DA_PERCEPCAO } from '../../estado/formatos';
import { AbasAcessiveis } from '../evolucao/AbasAcessiveis';
import { descreverEvolucao, resumirSemanas, type SemanaResumida } from '../evolucao/evolucao';
import { evolucaoPorExercicio } from '../evolucao/evolucaoPorExercicio';
import { GraficoDeTreinos } from '../evolucao/GraficoDeTreinos';
import { GraficoSemanal } from '../evolucao/GraficoSemanal';
import { TabelaPorExercicio, TabelaSemanaASemana } from '../evolucao/TabelasDeEvolucao';
import { BOTAO_SECUNDARIO, CARTAO } from './estilos';

/* Mostrar tudo de uma vez alongaria a página em dezenas de treinos; os mais
   recentes são os que o profissional quer ver primeiro. */
const TREINOS_VISIVEIS = 5;
const SEM_TREINOS = 'Ainda não há treinos registrados.';
/* Os gráficos e a semana a semana olham só as últimas semanas; sem esta frase
   o profissional acharia que o aluno nunca treinou, enquanto a aba Treinos
   lista o histórico inteiro. */
const SEM_TREINOS_RECENTES = 'Nenhum treino nas últimas 6 semanas. Veja a aba Treinos para o histórico completo.';

const plural = (quantidade: number, singular: string, pluralDaPalavra: string) => (quantidade === 1 ? singular : pluralDaPalavra);

function TreinoDoHistorico({ sessao }: { sessao: Sessao }) {
  const idTitulo = useId();
  return (
    <li aria-labelledby={idTitulo} className="flex flex-col gap-1 rounded-botao border-2 border-borda p-3">
      <h3 id={idTitulo} className="text-lg font-bold text-texto">
        Treino de <time dateTime={sessao.data}>{formatarData(sessao.data, true)}</time>
      </h3>
      <p className="text-base font-semibold text-texto">Percepção: {ROTULO_DA_PERCEPCAO[sessao.percepcao]}</p>
      <ul className="flex flex-col gap-1">
        {sessao.exercicios.map((exercicio) => (
          <li key={exercicio.id} className="text-base text-texto">
            {buscarExercicio(exercicio.id)?.nome ?? exercicio.id} · nível {exercicio.nivel} · nota {Math.round(exercicio.nota)}
          </li>
        ))}
      </ul>
    </li>
  );
}

type PropsDosTreinos = { sessoes: readonly Sessao[] };
type PropsDaLista = PropsDosTreinos & {
  /* O estado mora em HistoricoDoAluno: o painel da aba desmonta ao trocar de
     aba, e a escolha de "Ver todos" se perderia junto. */
  mostrarTodos: boolean;
  aoAlternarMostrarTodos: () => void;
};

/* Do treino mais recente para o mais antigo, com exercícios, níveis, notas e
   a percepção (Fácil/Ok/Difícil) do aluno. */
function ListaDeTreinos({ sessoes, mostrarTodos, aoAlternarMostrarTodos }: PropsDaLista) {
  const maisRecentesPrimeiro = ordenarSessoes(sessoes).toReversed();
  const visiveis = mostrarTodos ? maisRecentesPrimeiro : maisRecentesPrimeiro.slice(0, TREINOS_VISIVEIS);

  if (maisRecentesPrimeiro.length === 0) return <p className="text-lg text-texto">{SEM_TREINOS}</p>;
  return (
    <>
      <ul className="flex flex-col gap-3">
        {visiveis.map((sessao) => (
          <TreinoDoHistorico key={sessao.data} sessao={sessao} />
        ))}
      </ul>
      {maisRecentesPrimeiro.length > TREINOS_VISIVEIS ? (
        <button type="button" aria-expanded={mostrarTodos} onClick={aoAlternarMostrarTodos} className={BOTAO_SECUNDARIO}>
          {mostrarTodos ? 'Mostrar só os mais recentes' : `Ver todos os treinos (${maisRecentesPrimeiro.length})`}
        </button>
      ) : null}
    </>
  );
}

type PropsDaEvolucao = { semanas: readonly SemanaResumida[]; planejadas: number };

function resumoDosTreinos(semanas: readonly SemanaResumida[], planejadas: number): string {
  const feitos = semanas.reduce((total, semana) => total + semana.treinos, 0);
  const previstos = planejadas * semanas.length;
  return `${feitos} de ${previstos} ${plural(previstos, 'treino', 'treinos')} nas últimas ${semanas.length} semanas.`;
}

function Graficos({ semanas, planejadas }: PropsDaEvolucao) {
  const rotulos = semanas.map((semana) => formatarData(semana.fim.toISOString()));
  const medidas = [
    { nome: 'Nota média', valores: semanas.map((semana) => semana.nota), unidade: 'pontos', dica: 'Nota é a qualidade da execução, de 0 a 100.' },
    { nome: 'Simetria', valores: semanas.map((semana) => semana.simetria), unidade: 'pontos', dica: 'Simetria é o quanto o peso se divide igual entre as pernas.' },
    { nome: 'Estabilidade', valores: semanas.map((semana) => semana.estabilidade), unidade: 'pontos', dica: 'Estabilidade é o quão pouco o corpo oscila.' },
    { nome: 'Apoio nas barras', valores: semanas.map((semana) => semana.apoio), unidade: '%', dica: 'Quanto menos apoio, mais firme o aluno está.' },
  ] as const;

  return (
    <>
      <GraficoDeTreinos
        titulo="Treinos por semana"
        feitos={semanas.map((semana) => semana.treinos)}
        planejadas={planejadas}
        rotulos={rotulos}
        resumo={resumoDosTreinos(semanas, planejadas)}
      />
      {medidas.map(({ nome, valores, unidade, dica }) => (
        <GraficoSemanal
          key={nome}
          titulo={nome}
          valores={valores}
          rotulos={rotulos}
          unidade={unidade}
          resumo={descreverEvolucao({ nome, valores, rotulos, unidade })}
          dica={dica}
        />
      ))}
    </>
  );
}

function Tabelas({ semanas, planejadas, sessoes, avisoSemRecentes }: PropsDaEvolucao & PropsDosTreinos & { avisoSemRecentes: boolean }) {
  return (
    <>
      {avisoSemRecentes ? <p className="text-lg text-texto">{SEM_TREINOS_RECENTES}</p> : null}
      <p className="text-base text-texto-suave">Se a tabela não couber na tela, deslize para o lado.</p>
      <TabelaSemanaASemana semanas={semanas} planejadas={planejadas} />
      <TabelaPorExercicio exercicios={evolucaoPorExercicio(sessoes)} />
    </>
  );
}

type Props = {
  sessoes: readonly Sessao[];
  /* Treinos combinados por semana na rotina atual do aluno. */
  planejadas: number;
  agora: Date;
};

/* Histórico (manual 12.3): gráficos e tabelas da evolução semana a semana e,
   na terceira aba, cada treino com exercícios, níveis, notas e percepção. */
export function HistoricoDoAluno({ sessoes, planejadas, agora }: Props) {
  const idTitulo = useId();
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const semanas = resumirSemanas(sessoes, agora);
  const temTreinos = sessoes.length > 0;
  const temEvolucao = semanas.some((semana) => semana.treinos > 0);
  const semTreinos = <p className="text-lg text-texto">{SEM_TREINOS}</p>;

  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Histórico de treinos
      </h2>
      <AbasAcessiveis
        rotulo="Como ver o histórico"
        abas={[
          {
            id: 'graficos',
            rotulo: 'Gráficos',
            conteudo: temEvolucao ? (
              <Graficos semanas={semanas} planejadas={planejadas} />
            ) : temTreinos ? (
              <p className="text-lg text-texto">{SEM_TREINOS_RECENTES}</p>
            ) : (
              semTreinos
            ),
          },
          {
            id: 'tabelas',
            rotulo: 'Tabelas',
            conteudo: temTreinos ? (
              <Tabelas semanas={semanas} planejadas={planejadas} sessoes={sessoes} avisoSemRecentes={!temEvolucao} />
            ) : (
              semTreinos
            ),
          },
          {
            id: 'treinos',
            rotulo: 'Treinos',
            conteudo: <ListaDeTreinos sessoes={sessoes} mostrarTodos={mostrarTodos} aoAlternarMostrarTodos={() => setMostrarTodos((atual) => !atual)} />,
          },
        ]}
      />
    </section>
  );
}
