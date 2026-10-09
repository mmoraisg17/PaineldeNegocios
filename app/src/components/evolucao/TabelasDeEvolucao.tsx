import type { ReactNode } from 'react';
import { formatarData } from '../../estado/formatos';
import type { SemanaResumida } from './evolucao';
import type { EvolucaoDoExercicio } from './evolucaoPorExercicio';

/* Tabelas da evolução. Os mesmos números dos gráficos, em texto: quem usa
   leitor de tela percorre célula a célula, e quem enxerga mal compara linhas
   sem depender de cor. Em tela estreita a tabela rola na horizontal dentro de
   uma região que o teclado alcança (tabIndex 0); o texto das células não
   quebra, para o número nunca se separar da unidade. */

const CABECALHO = 'whitespace-nowrap px-3 py-2 text-left text-base font-bold text-texto';
const CELULA = 'whitespace-nowrap px-3 py-3 text-base text-texto';
const CELULA_DE_LINHA = 'px-3 py-3 text-left text-base font-semibold text-texto';
const LINHA = 'border-t border-borda';

type PropsDaTabela = { legenda: string; larguraMinima: string; children: ReactNode };

function TabelaRolavel({ legenda, larguraMinima, children }: PropsDaTabela) {
  return (
    <div
      role="region"
      aria-label={`${legenda}: tabela que rola para o lado`}
      // Sem tabIndex o teclado não rola a tabela larga (WCAG 2.1.1): a região é o alvo de foco.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto rounded-cartao border border-borda bg-superficie"
    >
      <table className={`w-full border-collapse ${larguraMinima}`}>
        <caption className="px-3 pt-3 pb-1 text-left text-lg font-bold text-texto">{legenda}</caption>
        {children}
      </table>
    </div>
  );
}

/* O "—" é só para os olhos; o leitor de tela ouve "sem treino". */
function SemTreino() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">sem treino</span>
    </>
  );
}

const medidaOuVazio = (valor: number | null, sufixo = ''): ReactNode => (valor === null ? <SemTreino /> : `${valor}${sufixo}`);

type PropsDaSemanaASemana = { semanas: readonly SemanaResumida[]; planejadas: number };

export function TabelaSemanaASemana({ semanas, planejadas }: PropsDaSemanaASemana) {
  return (
    <TabelaRolavel legenda="Semana a semana" larguraMinima="min-w-[30rem]">
      <thead>
        <tr>
          {['Semana até', 'Treinos', 'Nota', 'Simetria', 'Estabilidade', 'Apoio'].map((titulo) => (
            <th key={titulo} scope="col" className={CABECALHO}>
              {titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {semanas.map((semana) => (
          <tr key={semana.fim.getTime()} className={LINHA}>
            <th scope="row" className={CELULA_DE_LINHA}>
              {formatarData(semana.fim.toISOString())}
            </th>
            <td className={CELULA}>
              {semana.treinos} de {planejadas}
            </td>
            <td className={CELULA}>{medidaOuVazio(semana.nota)}</td>
            <td className={CELULA}>{medidaOuVazio(semana.simetria)}</td>
            <td className={CELULA}>{medidaOuVazio(semana.estabilidade)}</td>
            <td className={CELULA}>{medidaOuVazio(semana.apoio, '%')}</td>
          </tr>
        ))}
      </tbody>
    </TabelaRolavel>
  );
}

/* Sinal escrito (+ ou −) e a palavra "pontos": a direção da mudança não pode
   depender de cor nem de seta. O sinal de menos é o matemático (U+2212), que o
   leitor de tela lê como "menos". */
function descreverVariacao(variacao: number): string {
  const sinal = variacao > 0 ? '+' : variacao < 0 ? '−' : '';
  const absoluta = Math.abs(variacao);
  return `${sinal}${absoluta} ${absoluta === 1 ? 'ponto' : 'pontos'}`;
}

function DeParaPara({ de, para }: { de: number; para: number }) {
  return (
    <>
      <span aria-hidden="true">
        {de} → {para}
      </span>
      <span className="sr-only">
        de {de} para {para}
      </span>
    </>
  );
}

export function TabelaPorExercicio({ exercicios }: { exercicios: readonly EvolucaoDoExercicio[] }) {
  return (
    <TabelaRolavel legenda="Por exercício" larguraMinima="min-w-[32rem]">
      <thead>
        <tr>
          {['Exercício', 'Treinos', 'Nível (início → agora)', 'Nota (primeiro → último)', 'Variação'].map((titulo) => (
            <th key={titulo} scope="col" className={CABECALHO}>
              {titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {exercicios.map((exercicio) => (
          <tr key={exercicio.id} className={LINHA}>
            <th scope="row" className={`${CELULA_DE_LINHA} min-w-40`}>
              {exercicio.nome}
            </th>
            <td className={CELULA}>{exercicio.treinos}</td>
            <td className={CELULA}>
              {exercicio.nivelInicial === exercicio.nivelAtual ? (
                `${exercicio.nivelAtual} (igual)`
              ) : (
                <DeParaPara de={exercicio.nivelInicial} para={exercicio.nivelAtual} />
              )}
            </td>
            <td className={CELULA}>
              <DeParaPara de={exercicio.notaInicial} para={exercicio.notaAtual} />
            </td>
            <td className={`${CELULA} font-semibold`}>{descreverVariacao(exercicio.variacaoDaNota)}</td>
          </tr>
        ))}
      </tbody>
    </TabelaRolavel>
  );
}
