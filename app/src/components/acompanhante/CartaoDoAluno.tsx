import { Link } from 'react-router';
import { type DadosPraticante, trilhaDoObjetivo } from '../../dominio';
import { formatarData, ROTULO_DA_TRILHA } from '../../estado/formatos';
import type { ResumoDoAluno } from './resumoDoAluno';

/* Alerta dito em ícone E texto (nunca só cor), para quem não distingue cores
   e para o leitor de tela. */
function SeloDeAlertas({ quantidade }: { quantidade: number }) {
  const temAlerta = quantidade > 0;
  return (
    <span
      className={`flex w-fit items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${temAlerta ? 'bg-alerta-fundo text-alerta-texto' : 'bg-primaria-suave text-primaria-escura'}`}
    >
      <span aria-hidden="true">{temAlerta ? '!' : '✓'}</span>
      <span>{temAlerta ? `${quantidade} ${quantidade === 1 ? 'alerta' : 'alertas'}` : 'Sem alertas'}</span>
    </span>
  );
}

/* Um aluno na lista "Meus alunos": o cartão inteiro é o link para o
   relatório (alvo de toque grande). */
export function CartaoDoAluno({ praticante, resumo }: { praticante: DadosPraticante; resumo: ResumoDoAluno }) {
  const trilha = ROTULO_DA_TRILHA[trilhaDoObjetivo(praticante.perfil.objetivo)];
  const ultimoTreino = resumo.ultimaSessao ? formatarData(resumo.ultimaSessao.data) : '';
  return (
    <Link
      to={`/acompanhante/aluno/${praticante.id}`}
      className="flex min-h-14 flex-col gap-1 rounded-cartao border-2 border-borda bg-superficie p-4 active:border-primaria"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xl font-bold text-texto">{praticante.perfil.nome}</span>
        <span aria-hidden="true" className="text-2xl text-primaria">
          ›
        </span>
      </span>
      <span className="text-base text-texto-suave">{trilha}</span>
      <span className="text-base text-texto">{ultimoTreino ? `Último treino: ${ultimoTreino}` : 'Ainda sem treinos'}</span>
      <span className="text-base text-texto">
        {resumo.feitas} de {resumo.planejadas} nesta semana
      </span>
      <SeloDeAlertas quantidade={resumo.alertas.length} />
    </Link>
  );
}
