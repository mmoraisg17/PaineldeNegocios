import { semanaDeTreino, type Sessao } from './sessao';

/* Força do mascote, de 1 (cansado) a 5 (campeão). Só depende dos treinos e da
   data de hoje, para ser testada sem tela e sem relógio. */
export type NivelDoMascote = 1 | 2 | 3 | 4 | 5;

export const NIVEL_MINIMO: NivelDoMascote = 1;
export const NIVEL_MAXIMO: NivelDoMascote = 5;

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_DA_SEMANA = 7;
const SEMANAS_OBSERVADAS = 4;
/* Treinos por semana que já contam como "boa semana", mesmo com meta maior. */
const TREINOS_DA_BOA_SEMANA = 2;
const BOAS_SEMANAS_PARA_FORTE = 3;

/* Sem treino nenhum o mascote começa em 2, não em 1: quem acabou de chegar
   não parou de treinar, e um mascote "cansado" na primeira tela desanima. */
const NIVEL_SEM_HISTORICO: NivelDoMascote = 2;
const NIVEL_COM_TREINO_RECENTE: NivelDoMascote = 3;

function limitar(nivel: number): NivelDoMascote {
  return Math.min(NIVEL_MAXIMO, Math.max(NIVEL_MINIMO, Math.round(nivel))) as NivelDoMascote;
}

function treinosValidos(sessoes: readonly Sessao[], agora: Date): Sessao[] {
  return sessoes.filter((sessao) => {
    const quando = Date.parse(sessao.data);
    return !Number.isNaN(quando) && quando <= agora.getTime();
  });
}

function ultimoTreino(sessoes: readonly Sessao[]): number {
  return sessoes.reduce((maior, sessao) => Math.max(maior, Date.parse(sessao.data)), Number.NEGATIVE_INFINITY);
}

/* Constância medida nas 4 janelas de 7 dias que terminam em `referencia`:
   forte = 2 treinos (ou a meta, se menor) em 3 das 4; campeão = meta em todas. */
function nivelPelaConstancia(sessoes: readonly Sessao[], meta: number, referencia: number): NivelDoMascote {
  const minimoDaBoaSemana = Math.min(TREINOS_DA_BOA_SEMANA, meta);
  let boas = 0;
  let comMeta = 0;
  for (let semana = 0; semana < SEMANAS_OBSERVADAS; semana += 1) {
    const fim = new Date(referencia - semana * DIAS_DA_SEMANA * MS_POR_DIA);
    const { feitas } = semanaDeTreino(sessoes, meta, fim);
    if (feitas >= minimoDaBoaSemana) boas += 1;
    if (feitas >= meta) comMeta += 1;
  }
  if (comMeta === SEMANAS_OBSERVADAS) return 5;
  if (boas >= BOAS_SEMANAS_PARA_FORTE) return 4;
  return NIVEL_COM_TREINO_RECENTE;
}

/* O nível sobe com a constância e cai um degrau por semana sem treinar (o
   nível é medido no dia do último treino e perde 1 a cada 7 dias de pausa).
   A volta é rápida: um treino novo já leva o mascote a 3, porque as janelas
   passam a ser contadas a partir dele. Treino com data inválida ou no
   futuro não conta. */
export function forcaDoMascote(sessoes: readonly Sessao[], planejadasPorSemana: number, agora: Date): NivelDoMascote {
  const validos = treinosValidos(sessoes, agora);
  if (validos.length === 0) return NIVEL_SEM_HISTORICO;

  const meta = Math.max(1, Math.round(planejadasPorSemana));
  const ultimo = ultimoTreino(validos);
  const nivelNoUltimoTreino = nivelPelaConstancia(validos, meta, ultimo);
  const semanasParado = Math.floor((agora.getTime() - ultimo) / (DIAS_DA_SEMANA * MS_POR_DIA));
  return limitar(nivelNoUltimoTreino - semanasParado);
}
