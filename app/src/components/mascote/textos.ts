import type { NivelDoMascote } from '../../dominio';

/* O nome nunca culpa: "cansado" convida a um treino leve, não cobra. */
export const NOME_DO_NIVEL: Record<NivelDoMascote, string> = {
  1: 'Cansado',
  2: 'Devagar',
  3: 'Em forma',
  4: 'Forte',
  5: 'Campeão',
};

export const FRASE_DO_NIVEL: Record<NivelDoMascote, string> = {
  1: 'Estou cansado. Um treino leve hoje me ajuda.',
  2: 'Estou devagar. Um treino me deixa mais animado.',
  3: 'Estou em forma. Vamos manter o ritmo!',
  4: 'Estou forte! Seus treinos me deixam assim.',
  5: 'Sou campeão! Você vem cumprindo a sua meta de treinos.',
};

export const COMO_SUBIR: Record<NivelDoMascote, string> = {
  1: 'Faça um treino para ele voltar a se animar.',
  2: 'Faça um treino nesta semana para ele voltar a ficar em forma.',
  3: 'Treine ao menos 2 vezes por semana (ou a sua meta, se for menor), em 3 de 4 semanas, para ele ficar forte.',
  4: 'Cumpra a sua meta de treinos em 4 semanas seguidas para ele virar campeão.',
  5: 'Continue assim. Ele fica campeão enquanto você cumprir a meta.',
};

export function descricaoDoMascote(nivel: NivelDoMascote): string {
  return `Mascote do app, um kettlebell sorridente. Hoje ele está ${NOME_DO_NIVEL[nivel].toLowerCase()}.`;
}
