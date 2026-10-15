import { TREINOS_NO_RESUMO, mediasRecentes } from '../../app/src/components/acompanhante/resumoDoAluno';
import { adesaoDoPeriodo, resumirSemanas } from '../../app/src/components/evolucao/evolucao';
import { ajusteVigente, rotinaDoPraticante, type EstadoApp } from '../../app/src/dominio';
import { criarEstadoDemo } from '../../app/src/dominio/demo';
import { ID_DO_EXERCICIO } from './roteiro';

/* Números dos cartões do vídeo "LucasEDiego", tirados do estado de
   demonstração do app pelas mesmas funções das telas: as médias são as do
   resumo do relatório do profissional (mediasRecentes, arredondadas como em
   ResumoDoRelatorio), os treinos feitos são os da tela Progresso
   (resumirSemanas + adesaoDoPeriodo) e o recado é o de `estado.recados`.
   Nada aqui é digitado à mão; o teste confere que o vídeo só repete o estado.

   A data é a mesma dos testes do app (fixa): a demo gera o histórico
   relativo a ela e, com outra data, o vídeo mudaria a cada render. */
export const AGORA_DA_DEMO = new Date('2026-10-07T15:30:00.000Z');

export type IdDoAtleta = 'lucas' | 'diego';
export const ATLETAS: readonly IdDoAtleta[] = ['lucas', 'diego'];

export type CartaoDoAtleta = {
  readonly id: IdDoAtleta;
  readonly nome: string;
  readonly idade: number;
  /* "Treina por conta própria" ou "Acompanhado por Renata, preparadora física". */
  readonly acompanhamento: string;
  /* Quem ajustou a rotina (vínculo autorizado); sem ajuste, o próprio app. */
  readonly ajustadoPor: string | undefined;
  readonly nivelDoBulgaro: number;
  readonly nivelFixado: boolean;
  readonly treinosPorSemana: number;
  /* Médias dos últimos TREINOS_NO_RESUMO treinos, inteiras como no relatório. */
  readonly medias: { readonly nota: number; readonly simetria: number; readonly estabilidade: number; readonly apoio: number };
  readonly treinosNoResumo: number;
  readonly treinos: { readonly feitos: number; readonly previstos: number; readonly semanas: number; readonly porcentagem: number };
  readonly recado: { readonly texto: string; readonly de: string } | undefined;
};

export function cartaoDoAtleta(estado: EstadoApp, id: IdDoAtleta, agora: Date): CartaoDoAtleta {
  const praticante = estado.praticantes[id];
  const rotina = rotinaDoPraticante(estado, id);
  const bulgaro = rotina?.itens.find((item) => item.exercicioId === ID_DO_EXERCICIO);
  const medias = praticante ? mediasRecentes(praticante.sessoes) : undefined;
  if (!praticante?.idade || !rotina || !bulgaro || !medias) throw new Error(`A demo do app não tem o búlgaro de ${id} com treinos`);

  const ajuste = ajusteVigente(estado, id);
  const profissional = estado.acompanhantes.find((acompanhante) => acompanhante.id === ajuste?.autorId);
  const planejadas = rotina.frequenciaSemanal;
  // O recado mais recente para o atleta (a demo tem um só, o da Renata para o Diego).
  const recado = estado.recados
    .filter((r) => r.paraId === id)
    .sort((a, b) => Date.parse(b.enviadoEm) - Date.parse(a.enviadoEm))[0];
  const autorDoRecado = estado.acompanhantes.find((acompanhante) => acompanhante.id === recado?.deId);

  return {
    id,
    nome: praticante.perfil.nome,
    idade: praticante.idade,
    acompanhamento: profissional
      ? `Acompanhado por ${profissional.nome}, ${profissional.funcao.toLowerCase()}`
      : 'Treina por conta própria',
    ajustadoPor: rotina.ajustadoPor,
    nivelDoBulgaro: bulgaro.nivel,
    nivelFixado: bulgaro.fixadoPor !== undefined,
    treinosPorSemana: planejadas,
    medias: {
      nota: Math.round(medias.nota),
      simetria: Math.round(medias.simetria),
      estabilidade: Math.round(medias.estabilidade),
      apoio: Math.round(medias.apoio * 100),
    },
    treinosNoResumo: TREINOS_NO_RESUMO,
    treinos: adesaoDoPeriodo(resumirSemanas(praticante.sessoes, agora), planejadas),
    recado: recado && autorDoRecado ? { texto: recado.texto, de: autorDoRecado.nome } : undefined,
  };
}

/* Os dois cartões, calculados uma vez por aba do render (a demo simula 6
   semanas de treino de 4 pessoas; é rápido, mas não precisa ser por quadro). */
export function cartoesDaDemo(agora: Date = AGORA_DA_DEMO): Record<IdDoAtleta, CartaoDoAtleta> {
  const estado = criarEstadoDemo(agora);
  return { lucas: cartaoDoAtleta(estado, 'lucas', agora), diego: cartaoDoAtleta(estado, 'diego', agora) };
}
