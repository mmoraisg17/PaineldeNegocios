import { useId } from 'react';
import { adesao } from '../../dominio';
import { CARTAO } from './estilos';
import { TREINOS_NO_RESUMO, type MediasDoAluno, type ResumoDoAluno } from './resumoDoAluno';

const SEM_DADOS = 'Sem dados';

const inteiro = (valor: number): number => Math.round(valor);

/* Resumo do relatório (manual 12.3): adesão, nota média, simetria,
   estabilidade e apoio nas barras. As médias vêm dos últimos treinos; sem
   treinos mostra "Sem dados" em vez de um zero que pareceria nota ruim. */
export function ResumoDoRelatorio({ resumo, medias }: { resumo: ResumoDoAluno; medias: MediasDoAluno | undefined }) {
  const idTitulo = useId();
  const porcentagem = inteiro(adesao(resumo.feitas, resumo.planejadas) * 100);
  const itens = [
    { rotulo: 'Adesão da semana', valor: `${resumo.feitas} de ${resumo.planejadas} treinos (${porcentagem}%)` },
    { rotulo: 'Nota média', valor: medias ? `${inteiro(medias.nota)} de 100` : SEM_DADOS },
    { rotulo: 'Simetria', valor: medias ? `${inteiro(medias.simetria)}%` : SEM_DADOS },
    { rotulo: 'Estabilidade', valor: medias ? `${inteiro(medias.estabilidade)}%` : SEM_DADOS },
    { rotulo: 'Apoio nas barras', valor: medias ? `${inteiro(medias.apoio * 100)}% do peso` : SEM_DADOS },
  ];
  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Resumo
      </h2>
      <dl className="grid grid-cols-2 gap-3">
        {itens.map(({ rotulo, valor }) => (
          <div key={rotulo} className="flex flex-col rounded-botao bg-fundo p-3 first:col-span-2">
            <dt className="text-base text-texto-suave">{rotulo}</dt>
            <dd className="text-xl font-bold text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="text-base text-texto-suave">
        Médias dos últimos {TREINOS_NO_RESUMO} treinos. Quanto menos apoio nas barras, mais firmeza.
      </p>
    </section>
  );
}
