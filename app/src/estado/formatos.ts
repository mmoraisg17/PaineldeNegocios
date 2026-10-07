import type { Apoio, Dose, Firmeza, Objetivo, Percepcao, Trilha } from '../dominio';

/* Textos prontos, em português do Brasil, para as telas não reinventarem a
   mesma frase cada uma de um jeito. */

export function formatarDose(dose: Dose): string {
  const lado = dose.porLado ? ' por lado' : '';
  return dose.tipo === 'repeticoes' ? `${dose.repeticoes} vezes${lado}` : `${dose.segundos} s${lado}`;
}

export const ROTULO_DO_APOIO: Record<Apoio, string> = {
  'duas-maos': 'Com as duas mãos nas barras',
  'uma-mao': 'Com uma mão na barra',
  toque: 'Com um toque leve na barra',
  'sem-maos': 'Sem as mãos',
};

export const ROTULO_DA_TRILHA: Record<Trilha, string> = { equilibrio60: 'Equilíbrio 60+', fisio: 'Fisioterapia' };

export const ROTULO_DO_OBJETIVO: Record<Objetivo, string> = {
  equilibrio: 'Equilíbrio',
  fortalecimento: 'Fortalecimento',
  joelho: 'Joelho',
  tornozelo: 'Tornozelo',
};

export const ROTULO_DA_FIRMEZA: Record<Firmeza, string> = {
  'preciso-apoio': 'Preciso de apoio',
  'as-vezes': 'Às vezes me desequilibro',
  firme: 'Tenho firmeza',
};

export const ROTULO_DA_PERCEPCAO: Record<Percepcao, string> = { facil: 'Fácil', ok: 'Ok', dificil: 'Difícil' };

/* "07/10" ou "07/10/2026" (com ano), no fuso de Brasília. */
export function formatarData(iso: string, comAno = false): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(comAno ? { year: 'numeric' } : {}),
    timeZone: 'America/Sao_Paulo',
  });
}

export const primeiroNome = (nome: string): string => nome.trim().split(/\s+/)[0] ?? nome;
