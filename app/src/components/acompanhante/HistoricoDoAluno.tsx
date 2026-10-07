import { useId, useState } from 'react';
import { type Sessao, buscarExercicio, ordenarSessoes } from '../../dominio';
import { formatarData, ROTULO_DA_PERCEPCAO } from '../../estado/formatos';
import { BOTAO_SECUNDARIO, CARTAO } from './estilos';

/* Mostrar tudo de uma vez alongaria a página em dezenas de treinos; os mais
   recentes são os que o profissional quer ver primeiro. */
const TREINOS_VISIVEIS = 5;

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

/* Histórico (manual 12.3): do treino mais recente para o mais antigo, com
   exercícios, níveis, notas e a percepção (Fácil/Ok/Difícil) do aluno. */
export function HistoricoDoAluno({ sessoes }: { sessoes: readonly Sessao[] }) {
  const idTitulo = useId();
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const maisRecentesPrimeiro = ordenarSessoes(sessoes).toReversed();
  const visiveis = mostrarTodos ? maisRecentesPrimeiro : maisRecentesPrimeiro.slice(0, TREINOS_VISIVEIS);

  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Histórico de treinos
      </h2>
      {maisRecentesPrimeiro.length === 0 ? (
        <p className="text-lg text-texto">Ainda não há treinos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visiveis.map((sessao) => (
            <TreinoDoHistorico key={sessao.data} sessao={sessao} />
          ))}
        </ul>
      )}
      {maisRecentesPrimeiro.length > TREINOS_VISIVEIS ? (
        <button type="button" aria-expanded={mostrarTodos} onClick={() => setMostrarTodos((atual) => !atual)} className={BOTAO_SECUNDARIO}>
          {mostrarTodos ? 'Mostrar só os mais recentes' : `Ver todos os treinos (${maisRecentesPrimeiro.length})`}
        </button>
      ) : null}
    </section>
  );
}
