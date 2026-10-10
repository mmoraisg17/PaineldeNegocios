import { useId, useState } from 'react';
import {
  type Acompanhante,
  type DadosPraticante,
  buscarExercicio,
  nivelMaximoCompativel,
} from '../../dominio';
import { salvarAjuste } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import {
  EXERCICIO_DA_META,
  FREQUENCIA_MAXIMA,
  FREQUENCIA_MINIMA,
  ajusteDoFormulario,
  formularioInicial,
  type ItemDoFormulario,
} from './ajusteDaRotina';
import { CampoDaMeta } from './CampoDaMeta';
import { BOTAO_PRINCIPAL, CAMPO, CARTAO } from './estilos';
import { LinhaDoExercicio } from './LinhaDoExercicio';
import { Icone } from '../Icone';

type Retorno = { tipo: 'ok' | 'erro'; texto: string };

const OPCOES_DE_FREQUENCIA = Array.from({ length: FREQUENCIA_MAXIMA - FREQUENCIA_MINIMA + 1 }, (_, i) => FREQUENCIA_MINIMA + i);

/* Ajustar rotina (manual 12.4, só profissional): incluir/remover exercícios,
   nível e fixação, meta de simetria e frequência. O formulário começa do que
   vale hoje para o aluno, e "Salvar rotina" grava tudo de uma vez em
   `salvarAjuste`, que ainda confere o vínculo e a permissão. */
export function AjustarRotina({ aluno, acompanhante }: { aluno: DadosPraticante; acompanhante: Acompanhante }) {
  const { estado, atualizar } = useApp();
  const [formulario, setFormulario] = useState(() => formularioInicial(estado, aluno.id));
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const idTitulo = useId();
  const idFrequencia = useId();

  if (!formulario) return null;

  const mudarItem = (exercicioId: string, mudanca: Partial<ItemDoFormulario>) => {
    setFormulario((atual) =>
      atual && { ...atual, itens: atual.itens.map((item) => (item.exercicioId === exercicioId ? { ...item, ...mudanca } : item)) },
    );
    setRetorno(null);
  };

  const salvar = () => {
    const resultado = salvarAjuste(estado, acompanhante.id, aluno.id, ajusteDoFormulario(formulario, aluno));
    if (!resultado.ok) {
      setRetorno({ tipo: 'erro', texto: 'Não foi possível salvar. Seu acesso a este aluno mudou.' });
      return;
    }
    atualizar(() => resultado.estado);
    setRetorno({ tipo: 'ok', texto: `Rotina ajustada. ${aluno.perfil.nome} verá o selo "Ajustado por ${acompanhante.nome}"` });
  };

  const metaDisponivel = formulario.itens.some((item) => item.exercicioId === EXERCICIO_DA_META && item.incluido);

  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-4`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Ajustar rotina
      </h2>
      <p className="text-base text-texto-suave">
        As sugestões automáticas do app não substituem a sua avaliação. Você é responsável pelas metas que definir.
      </p>

      <ul className="flex flex-col gap-3">
        {formulario.itens.flatMap((item) => {
          const exercicio = buscarExercicio(item.exercicioId);
          if (!exercicio) return [];
          return [
            <LinhaDoExercicio
              key={item.exercicioId}
              exercicio={exercicio}
              item={item}
              nivelMaximo={nivelMaximoCompativel(exercicio, aluno.perfil.inclinacaoMaxima)}
              aoMudar={(mudanca) => mudarItem(item.exercicioId, mudanca)}
            />,
          ];
        })}
      </ul>

      {metaDisponivel ? (
        <CampoDaMeta
          usar={formulario.usarMeta}
          valor={formulario.metaEsquerda}
          aoMudarUsar={(usarMeta) => {
            setFormulario({ ...formulario, usarMeta });
            setRetorno(null);
          }}
          aoMudarValor={(metaEsquerda) => {
            setFormulario({ ...formulario, metaEsquerda });
            setRetorno(null);
          }}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={idFrequencia} className="text-lg font-semibold text-texto">
          Treinos por semana
        </label>
        <select
          id={idFrequencia}
          value={formulario.frequencia}
          onChange={(evento) => {
            setFormulario({ ...formulario, frequencia: Number(evento.target.value) });
            setRetorno(null);
          }}
          className={CAMPO}
        >
          {OPCOES_DE_FREQUENCIA.map((vezes) => (
            <option key={vezes} value={vezes}>
              {vezes} vezes por semana
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={salvar} className={BOTAO_PRINCIPAL}>
        Salvar rotina
      </button>
      {retorno ? (
        <p
          role={retorno.tipo === 'ok' ? 'status' : 'alert'}
          className={`rounded-botao p-3 text-lg font-semibold ${retorno.tipo === 'ok' ? 'bg-primaria-suave text-primaria-escura' : 'bg-perigo-fundo text-perigo'}`}
        >
          <Icone nome={retorno.tipo === 'ok' ? 'certo' : 'alerta'} className="mr-1 inline size-5 align-text-bottom" />
          {retorno.texto}
        </p>
      ) : null}
    </section>
  );
}
