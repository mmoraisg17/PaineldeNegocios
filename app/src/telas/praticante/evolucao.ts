import type { Sessao } from '../../dominio';

/* Contas da tela Progresso (manual, seção 10), separadas da tela para ficarem
   testáveis sem React: agrupam as sessões em semanas e descrevem a tendência
   em palavras, que é o que o leitor de tela lê no lugar do gráfico. */

export const SEMANAS_NO_PROGRESSO = 6;

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_DA_SEMANA = 7;
const PORCENTAGEM = 100;
/* Abaixo disto a variação é ruído (a nota de cada sessão oscila alguns pontos),
   e dizer "subiu 1 ponto" seria promessa de progresso que não existe. */
const VARIACAO_MINIMA_PARA_NOTAR = 2;

export type SemanaResumida = {
  /* Último instante da semana (a janela é de 7 dias terminando aqui). */
  fim: Date;
  treinos: number;
  /* 0 a 100; nulo quando a semana não teve treino com exercícios medidos. */
  simetria: number | null;
  estabilidade: number | null;
  /* Em porcentagem (0 a 100); quanto menor, mais firme a pessoa está. */
  apoio: number | null;
};

function media(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((soma, valor) => soma + valor, 0) / valores.length);
}

/* Mesma regra de `semanaDeTreino` (domínio): janela móvel de 7 dias em que o
   instante de exatamente 7 dias atrás fica na semana anterior. */
function estaNaJanela(sessao: Sessao, inicio: number, fim: number): boolean {
  const quando = Date.parse(sessao.data);
  return quando > inicio && quando <= fim;
}

/* Média por sessão primeiro, depois entre as sessões: um treino com muitos
   exercícios não pesa mais que outro com poucos. */
function mediaDaMedida(sessoes: readonly Sessao[], medida: (sessao: Sessao) => readonly number[]): number | null {
  const porSessao = sessoes.flatMap((sessao) => {
    const valores = medida(sessao);
    return valores.length > 0 ? [valores.reduce((soma, valor) => soma + valor, 0) / valores.length] : [];
  });
  return media(porSessao);
}

/* Da semana mais antiga para a mais recente; a última termina em `agora`. */
export function resumirSemanas(sessoes: readonly Sessao[], agora: Date, semanas: number = SEMANAS_NO_PROGRESSO): SemanaResumida[] {
  return Array.from({ length: semanas }, (_, posicao) => {
    const fim = agora.getTime() - (semanas - 1 - posicao) * DIAS_DA_SEMANA * MS_POR_DIA;
    const inicio = fim - DIAS_DA_SEMANA * MS_POR_DIA;
    const daSemana = sessoes.filter((sessao) => estaNaJanela(sessao, inicio, fim));
    const apoio = mediaDaMedida(daSemana, (sessao) => sessao.exercicios.map((e) => e.apoioNasBarras * PORCENTAGEM));
    return {
      fim: new Date(fim),
      treinos: daSemana.length,
      simetria: mediaDaMedida(daSemana, (sessao) => sessao.exercicios.map((e) => e.simetria)),
      estabilidade: mediaDaMedida(daSemana, (sessao) => sessao.exercicios.map((e) => e.estabilidade)),
      apoio,
    };
  });
}

/* Semanas consecutivas com ao menos um treino, contando da mais recente. */
export function semanasSeguidas(semanas: readonly SemanaResumida[]): number {
  let seguidas = 0;
  for (let posicao = semanas.length - 1; posicao >= 0; posicao -= 1) {
    if ((semanas[posicao]?.treinos ?? 0) === 0) break;
    seguidas += 1;
  }
  return seguidas;
}

export function contarSemanasCompletas(semanas: readonly SemanaResumida[], planejadas: number): number {
  if (planejadas <= 0) return 0;
  return semanas.filter((semana) => semana.treinos >= planejadas).length;
}

type EntradaDaDescricao = {
  nome: string;
  valores: readonly (number | null)[];
  rotulos: readonly string[];
  unidade: 'pontos' | '%';
};

const escrever = (valor: number, unidade: EntradaDaDescricao['unidade']) => (unidade === '%' ? `${valor}%` : `${valor} pontos`);

/* Compara a primeira e a última semana COM treino: semanas vazias no meio não
   atrapalham a leitura e não viram "zero". */
export function descreverEvolucao({ nome, valores, rotulos, unidade }: EntradaDaDescricao): string {
  const comTreino = valores.flatMap((valor, posicao) => (valor === null ? [] : [{ valor, rotulo: rotulos[posicao] ?? '' }]));
  const primeira = comTreino[0];
  const ultima = comTreino.at(-1);
  if (!primeira || !ultima) return `${nome}: ainda não há treinos nestas semanas para mostrar.`;
  if (comTreino.length === 1) {
    return `${nome}: ${escrever(primeira.valor, unidade)} na semana até ${primeira.rotulo}. Com mais semanas de treino dá para comparar.`;
  }

  const diferenca = ultima.valor - primeira.valor;
  const tendencia =
    Math.abs(diferenca) < VARIACAO_MINIMA_PARA_NOTAR
      ? 'ficou estável'
      : `${diferenca > 0 ? 'subiu' : 'caiu'} ${Math.abs(diferenca)} pontos`;
  return `${nome}: de ${escrever(primeira.valor, unidade)} (semana até ${primeira.rotulo}) para ${escrever(ultima.valor, unidade)} (semana até ${ultima.rotulo}): ${tendencia}.`;
}
