/* Vocabulário do domínio. Só tipos (e a lista de ids): a lógica fica nos
   outros módulos. Nada aqui conhece React, relógio ou armazenamento, para o
   domínio poder ser testado sem navegador. */

export type Trilha = 'equilibrio60' | 'fisio';

export type Regiao = 'joelho' | 'tornozelo';

/* Só "elastico" e "cadeira" dependem do que a pessoa tem em casa; "barras" e
   "inclinacao" vêm com a plataforma (ver ACESSORIOS_DA_PLATAFORMA). */
export type Acessorio = 'barras' | 'elastico' | 'inclinacao' | 'cadeira';

export type Nivel = 1 | 2 | 3;

/* Níveis do seletor da plataforma (manual, seção 3.3): 0 é plano. */
export type Inclinacao = 0 | 1 | 2 | 3;

export type Apoio = 'duas-maos' | 'uma-mao' | 'toque' | 'sem-maos';

/* Fico com união discriminada em vez de { repeticoes?, segundos? } para o
   compilador impedir uma dose com os dois campos (ou nenhum). `porLado`
   significa que a dose vale para cada perna. */
export type Dose =
  | { tipo: 'repeticoes'; repeticoes: number; porLado?: boolean }
  | { tipo: 'tempo'; segundos: number; porLado?: boolean };

/* Resposta do botão "Como foi para você?" (manual, seção 8.1). */
export type Percepcao = 'facil' | 'ok' | 'dificil';

/* Lista fechada: assim um id digitado errado numa tela vira erro de
   compilação, e a persistência consegue descartar ids desconhecidos. */
export const IDS_DOS_EXERCICIOS = [
  'sentar-e-levantar',
  'pes-em-linha',
  'abducao-com-elastico',
  'transferencia-de-peso',
  'miniagachamento-simetrico',
  'descida-de-degrau',
  'panturrilha-unilateral',
  'equilibrio-com-inclinacao',
] as const;

export type IdExercicio = (typeof IDS_DOS_EXERCICIOS)[number];

export type ConfigNivel = {
  dose: Dose;
  apoio: Apoio;
  inclinacao: Inclinacao;
  descricao: string;
};

export type Correcao = {
  id: string;
  /* Curta e imperativa, em linguagem de treino: nunca diagnóstico. */
  mensagem: string;
  /* "atencao" é amarelo (ajuste pequeno); "pare" é vermelho (manual, seção 2). */
  gravidade: 'atencao' | 'pare';
};

export type Exercicio = {
  id: IdExercicio;
  nome: string;
  trilha: Trilha;
  regiao?: Regiao;
  paraQue: string;
  comoFazer: string[];
  acessorios: Acessorio[];
  oQueOAppCorrige: string;
  niveis: Record<Nivel, ConfigNivel>;
  correcoes: Correcao[];
};
