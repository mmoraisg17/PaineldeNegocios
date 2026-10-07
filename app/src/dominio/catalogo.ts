import { congelarProfundo } from './imutavel';
import type { Acessorio, Dose, Exercicio, Trilha } from './tipos';

/* Conteúdo transcrito do manual de uso, seção 7. O manual é a fonte: se um
   texto mudar lá, muda aqui (e o teste de catálogo acusa a divergência de
   dose, apoio e inclinação). Onde o manual não diz a dose ou o apoio de um
   nível, a escolha segue a regra geral da seção 7: subir de nível = mais
   repetição ou tempo, menos apoio nas barras e mais inclinação. */

/* Acessórios que vêm com a plataforma: a pessoa nunca "deixa de ter" barras
   ou inclinação, então eles não entram no filtro da rotina. */
export const ACESSORIOS_DA_PLATAFORMA: readonly Acessorio[] = ['barras', 'inclinacao'];

const repeticoes = (quantidade: number, porLado = false): Dose =>
  porLado
    ? { tipo: 'repeticoes', repeticoes: quantidade, porLado }
    : { tipo: 'repeticoes', repeticoes: quantidade };

const tempo = (segundos: number, porLado = false): Dose =>
  porLado ? { tipo: 'tempo', segundos, porLado } : { tipo: 'tempo', segundos };

/* A ordem deste vetor é a ordem do manual e a ordem em que a Biblioteca
   lista os exercícios dentro de cada trilha. */
const EXERCICIOS: Exercicio[] = [
  {
    id: 'sentar-e-levantar',
    nome: 'Sentar e levantar',
    trilha: 'equilibrio60',
    paraQue: 'Força nas pernas para levantar da cadeira, da cama e do vaso sanitário.',
    comoFazer: [
      'Sente-se na cadeira firme encostada atrás da plataforma (ou no assento acoplável), com os pés sobre a base.',
      'Incline o tronco um pouco para a frente.',
      'Levante-se usando as duas pernas.',
      'Sente-se devagar.',
    ],
    acessorios: ['barras', 'cadeira'],
    oQueOAppCorrige: 'O lado que faz mais força (simetria) e o quanto você empurra as barras.',
    niveis: {
      1: { dose: repeticoes(8), apoio: 'duas-maos', inclinacao: 0, descricao: 'Com as duas mãos nas barras.' },
      2: { dose: repeticoes(10), apoio: 'uma-mao', inclinacao: 0, descricao: 'Com uma mão na barra.' },
      3: { dose: repeticoes(12), apoio: 'sem-maos', inclinacao: 0, descricao: 'Sem as mãos, com os braços cruzados.' },
    },
    correcoes: [
      { id: 'perna-dominante', mensagem: 'Use as duas pernas para levantar', gravidade: 'atencao' },
      { id: 'apoio-nas-barras', mensagem: 'Solte um pouco as barras', gravidade: 'atencao' },
      { id: 'apoio-total-nas-barras', mensagem: 'Pare e descanse, segurando firme nas barras', gravidade: 'pare' },
    ],
  },
  {
    id: 'pes-em-linha',
    nome: 'Pés em linha (tandem)',
    trilha: 'equilibrio60',
    paraQue: 'Equilíbrio para andar em lugares estreitos.',
    comoFazer: [
      'Coloque um pé na frente do outro, encostando o calcanhar na ponta do pé de trás.',
      'Fique parado, olhando para a frente.',
    ],
    acessorios: ['barras'],
    oQueOAppCorrige: 'A oscilação do corpo e quando já dá para soltar uma mão.',
    niveis: {
      1: { dose: tempo(10), apoio: 'duas-maos', inclinacao: 0, descricao: 'Duas mãos nas barras, 10 segundos.' },
      2: { dose: tempo(20), apoio: 'uma-mao', inclinacao: 0, descricao: 'Uma mão na barra, 20 segundos.' },
      3: { dose: tempo(30), apoio: 'toque', inclinacao: 0, descricao: 'Toque leve com um dedo, 30 segundos.' },
    },
    correcoes: [
      { id: 'oscilacao-alta', mensagem: 'Olhe para a frente e fique parado', gravidade: 'atencao' },
      { id: 'pronto-para-soltar', mensagem: 'Você está firme: tente soltar uma mão', gravidade: 'atencao' },
      { id: 'oscilacao-extrema', mensagem: 'Pare e segure nas duas barras', gravidade: 'pare' },
    ],
  },
  {
    id: 'abducao-com-elastico',
    nome: 'Abdução de quadril com elástico',
    trilha: 'equilibrio60',
    paraQue: 'Força na lateral do quadril, importante para não cair de lado.',
    comoFazer: [
      'Prenda o elástico na base da barra e no tornozelo de fora.',
      'Segure a barra e fique apoiado na outra perna.',
      'Afaste a perna para o lado, devagar, sem inclinar o tronco.',
      'Volte devagar.',
    ],
    acessorios: ['barras', 'elastico'],
    oQueOAppCorrige: 'A perna de apoio não pode balançar: o peso deve ficar firme nela.',
    niveis: {
      1: { dose: repeticoes(8, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Elástico leve, 8 vezes.' },
      2: { dose: repeticoes(12, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Elástico leve, 12 vezes.' },
      3: { dose: repeticoes(12, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Elástico mais forte, 12 vezes.' },
    },
    correcoes: [
      { id: 'apoio-balancando', mensagem: 'Firme a perna de apoio', gravidade: 'atencao' },
      { id: 'tronco-inclinado', mensagem: 'Mantenha o peso sobre a perna de apoio', gravidade: 'atencao' },
      { id: 'perda-de-equilibrio', mensagem: 'Pare e segure nas duas barras', gravidade: 'pare' },
    ],
  },
  {
    id: 'transferencia-de-peso',
    nome: 'Transferência de peso com alvos',
    trilha: 'equilibrio60',
    paraQue: 'Controle do corpo para alcançar objetos e mudar de direção.',
    comoFazer: [
      'Fique com os pés afastados na largura do quadril.',
      'Leve o peso devagar para os alvos que aparecem na tela (frente, trás, lados).',
      'Não tire os pés da base.',
    ],
    acessorios: ['barras', 'inclinacao'],
    oQueOAppCorrige: 'Se o ponto chegou ao alvo e se o movimento foi controlado.',
    niveis: {
      1: { dose: repeticoes(8), apoio: 'duas-maos', inclinacao: 0, descricao: 'Plano, com os alvos perto.' },
      2: { dose: repeticoes(10), apoio: 'uma-mao', inclinacao: 1, descricao: 'Inclinação 1, com os alvos mais longe.' },
      3: { dose: repeticoes(12), apoio: 'uma-mao', inclinacao: 2, descricao: 'Inclinação 2.' },
    },
    correcoes: [
      { id: 'fora-do-alvo', mensagem: 'Leve o ponto até o alvo', gravidade: 'atencao' },
      { id: 'movimento-brusco', mensagem: 'Vá mais devagar, com controle', gravidade: 'atencao' },
      { id: 'pe-saindo-da-base', mensagem: 'Mantenha os dois pés dentro da base', gravidade: 'pare' },
    ],
  },
  {
    id: 'miniagachamento-simetrico',
    nome: 'Miniagachamento com descarga simétrica',
    trilha: 'fisio',
    regiao: 'joelho',
    paraQue: 'Voltar a usar as duas pernas por igual depois de lesão ou cirurgia no joelho.',
    comoFazer: [
      'Fique com os pés na largura do quadril, segurando as barras.',
      'Dobre um pouco os joelhos, como se fosse sentar.',
      'Volte devagar.',
    ],
    acessorios: ['barras'],
    oQueOAppCorrige:
      'A porcentagem do peso em cada perna (meta padrão de 50/50 ou a que o seu profissional definir) e o peso no calcanhar, não na ponta.',
    niveis: {
      1: { dose: repeticoes(8), apoio: 'duas-maos', inclinacao: 0, descricao: 'Pouca descida, 8 vezes.' },
      2: { dose: repeticoes(12), apoio: 'duas-maos', inclinacao: 0, descricao: 'Descida média, 12 vezes.' },
      3: { dose: repeticoes(12), apoio: 'uma-mao', inclinacao: 0, descricao: 'Descida média com uma mão, 12 vezes.' },
    },
    correcoes: [
      { id: 'peso-so-numa-perna', mensagem: 'Divida o peso entre as duas pernas', gravidade: 'atencao' },
      { id: 'peso-na-ponta', mensagem: 'Jogue o peso para o calcanhar', gravidade: 'atencao' },
      { id: 'perda-de-equilibrio', mensagem: 'Pare e segure nas duas barras', gravidade: 'pare' },
    ],
  },
  {
    id: 'descida-de-degrau',
    nome: 'Descida de degrau (step-down)',
    trilha: 'fisio',
    regiao: 'joelho',
    paraQue: 'Controle do joelho para descer escadas.',
    comoFazer: [
      'Fique em pé sobre a base, de lado para a borda.',
      'Desça devagar o pé de fora até tocar o chão com o calcanhar.',
      'Volte. O joelho de apoio aponta para a frente.',
    ],
    acessorios: ['barras'],
    oQueOAppCorrige: 'A descida controlada (sem despencar) e o peso sem fugir para dentro ou para fora.',
    niveis: {
      1: { dose: repeticoes(6, true), apoio: 'duas-maos', inclinacao: 0, descricao: 'Duas mãos, 6 vezes por perna.' },
      2: { dose: repeticoes(10, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Uma mão, 10 vezes por perna.' },
      3: { dose: repeticoes(10, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Uma mão, descendo mais devagar.' },
    },
    correcoes: [
      { id: 'descida-sem-controle', mensagem: 'Desça mais devagar', gravidade: 'atencao' },
      { id: 'desvio-lateral', mensagem: 'Mantenha o peso reto, sem fugir para o lado', gravidade: 'atencao' },
      { id: 'perda-de-equilibrio', mensagem: 'Pare e segure nas duas barras', gravidade: 'pare' },
    ],
  },
  {
    id: 'panturrilha-unilateral',
    nome: 'Elevação de panturrilha unilateral',
    trilha: 'fisio',
    regiao: 'tornozelo',
    paraQue: 'Força e estabilidade do tornozelo.',
    comoFazer: [
      'Fique em pé numa perna só, segurando as barras.',
      'Suba na ponta do pé e segure 1 segundo.',
      'Desça devagar.',
    ],
    acessorios: ['barras'],
    oQueOAppCorrige: 'Subir reto, sem o pé rolar para fora (posição de risco para torção).',
    niveis: {
      1: { dose: repeticoes(10), apoio: 'duas-maos', inclinacao: 0, descricao: 'Com os dois pés, 10 vezes.' },
      2: { dose: repeticoes(8, true), apoio: 'duas-maos', inclinacao: 0, descricao: 'Um pé, com as duas mãos, 8 vezes.' },
      3: { dose: repeticoes(12, true), apoio: 'uma-mao', inclinacao: 0, descricao: 'Um pé, com uma mão, 12 vezes.' },
    },
    correcoes: [
      { id: 'pe-rolando-para-fora', mensagem: 'Suba reto, sem rolar o pé para fora', gravidade: 'pare' },
      { id: 'apoio-nas-barras', mensagem: 'Solte um pouco as barras', gravidade: 'atencao' },
      { id: 'subida-apressada', mensagem: 'Suba e desça devagar', gravidade: 'atencao' },
    ],
  },
  {
    id: 'equilibrio-com-inclinacao',
    nome: 'Equilíbrio num pé só com inclinação',
    trilha: 'fisio',
    regiao: 'tornozelo',
    paraQue: 'Recuperar o equilíbrio do tornozelo depois de uma torção.',
    comoFazer: [
      'Fique numa perna só, com o joelho levemente dobrado.',
      'Olhe para a frente.',
    ],
    acessorios: ['barras', 'inclinacao'],
    oQueOAppCorrige: 'A oscilação do corpo e o momento de usar as barras.',
    niveis: {
      1: { dose: tempo(15), apoio: 'duas-maos', inclinacao: 0, descricao: 'Plano, 15 segundos.' },
      2: { dose: tempo(20), apoio: 'uma-mao', inclinacao: 1, descricao: 'Inclinação 1, 20 segundos.' },
      3: { dose: tempo(30), apoio: 'toque', inclinacao: 2, descricao: 'Inclinação 2, 30 segundos.' },
    },
    correcoes: [
      { id: 'oscilacao-alta', mensagem: 'Olhe para a frente e respire fundo', gravidade: 'atencao' },
      { id: 'inclinacao-diferente', mensagem: 'Confira a inclinação da plataforma', gravidade: 'atencao' },
      { id: 'hora-de-usar-as-barras', mensagem: 'Segure nas barras agora', gravidade: 'pare' },
    ],
  },
];

/* Congelado: o catálogo é compartilhado por todas as telas, e uma tela que o
   alterasse sem querer mudaria os textos de todas as outras. */
export const CATALOGO: readonly Exercicio[] = congelarProfundo(EXERCICIOS);

export function buscarExercicio(id: string): Exercicio | undefined {
  return CATALOGO.find((exercicio) => exercicio.id === id);
}

export function exerciciosDaTrilha(trilha: Trilha): Exercicio[] {
  return CATALOGO.filter((exercicio) => exercicio.trilha === trilha);
}
