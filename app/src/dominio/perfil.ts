import { limitar } from './numeros';
import type { Acessorio, Inclinacao, Nivel, Trilha } from './tipos';

export type Objetivo = 'equilibrio' | 'fortalecimento' | 'joelho' | 'tornozelo';

/* As três respostas de "Sua firmeza hoje" (manual, seção 4.3). */
export type Firmeza = 'preciso-apoio' | 'as-vezes' | 'firme';

export type Perfil = {
  nome: string;
  objetivo: Objetivo;
  firmeza: Firmeza;
  acessoriosEmCasa: Acessorio[];
  /* Até que nível o seletor da plataforma da pessoa chega (manual, 13.1). */
  inclinacaoMaxima: Inclinacao;
};

/* O que a avaliação de 10 segundos mede (manual, seção 4.3, passo 4). */
export type MedidasDaAvaliacao = {
  /* 0 a 1; quanto maior, mais instável. */
  oscilacao: number;
  /* Fração do peso que vai para as mãos, de 0 a 1. */
  apoioNasBarras: number;
};

/* Limiares da regra do nível inicial. São deliberadamente simples e ficam
   aqui, nomeados, para o grupo ajustar sem caçar números no código. A regra é
   assimétrica de propósito: errar para baixo custa um treino fácil demais;
   errar para cima custa uma queda. */
const OSCILACAO_QUE_EXIGE_NIVEL_1 = 0.6;
const APOIO_QUE_EXIGE_NIVEL_1 = 0.3;
const OSCILACAO_MAXIMA_PARA_NIVEL_3 = 0.3;
const APOIO_MAXIMO_PARA_NIVEL_3 = 0.1;

export function trilhaDoObjetivo(objetivo: Objetivo): Trilha {
  return objetivo === 'joelho' || objetivo === 'tornozelo' ? 'fisio' : 'equilibrio60';
}

function medidaInvalida(medidas: MedidasDaAvaliacao): boolean {
  return Number.isNaN(medidas.oscilacao) || Number.isNaN(medidas.apoioNasBarras);
}

/* Regra (a primeira que valer ganha):
   1. "Preciso de apoio", oscilação > 0,6 ou apoio > 0,3 -> nível 1.
   2. "Tenho firmeza" com oscilação < 0,3 e apoio < 0,1 -> nível 3.
   3. Qualquer outro caso -> nível 2.
   Só quem se declara firme E mede bem chega ao 3: a autoavaliação sozinha não
   basta, e a medição sozinha também não. Medida inválida (NaN) cai no nível 1
   porque "não sei medir" tem de ser tratado como "pode ser instável". */
export function nivelInicial(medidas: MedidasDaAvaliacao, firmeza: Firmeza): Nivel {
  if (medidaInvalida(medidas)) return 1;
  const oscilacao = limitar(medidas.oscilacao, 0, 1);
  const apoio = limitar(medidas.apoioNasBarras, 0, 1);

  const precisaDeApoio =
    firmeza === 'preciso-apoio' ||
    oscilacao > OSCILACAO_QUE_EXIGE_NIVEL_1 ||
    apoio > APOIO_QUE_EXIGE_NIVEL_1;
  if (precisaDeApoio) return 1;

  const medeMuitoBem = oscilacao < OSCILACAO_MAXIMA_PARA_NIVEL_3 && apoio < APOIO_MAXIMO_PARA_NIVEL_3;
  return firmeza === 'firme' && medeMuitoBem ? 3 : 2;
}
