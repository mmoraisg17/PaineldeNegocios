import { useEffect, useRef, useState } from 'react';
import type { Exercicio, Nivel } from '../dominio';
import type { RelogioDaAnimacao } from '../cena3d/relogio';
import { type Animacao, amostrar } from '../movimento/animacao';
import {
  type Avaliacao,
  CARGA_EM_PE,
  type Desvio,
  type Esperado,
  type EstadoDoFeedback,
  type Leitura,
  atualizarFeedback,
  avaliar,
  desvioDoModoAutomatico,
  desviosSimulaveis,
  esperadoDoExercicio,
  iniciarFeedback,
  simularLeitura,
} from '../sensores';

/* A tela lê os sensores 10 vezes por segundo: rápido o bastante para o ponto
   do mapa andar suave, devagar o bastante para não pesar no celular. */
const INTERVALO_MS = 100;

/* cargaEsquerda: % média do peso dos pés na perna esquerda, comparada com a
   meta de simetria do profissional no relatório. */
export type MediasDaExecucao = { simetria: number; estabilidade: number; apoioNasBarras: number; cargaEsquerda: number; amostras: number };

export type SimulacaoDeSensores = {
  leitura: Leitura;
  esperado: Esperado;
  avaliacao: Avaliacao;
  desvioAtivo: Desvio | null;
  medias: MediasDaExecucao;
};

type Opcoes = {
  exercicio: Exercicio;
  nivel: Nivel;
  animacao: Animacao | undefined;
  relogio: React.MutableRefObject<RelogioDaAnimacao>;
  desvioForcado: Desvio | null;
  automatico: boolean;
  cargaEsquerdaMeta?: number;
  aoMudarDesvio?: () => void;
};

/* Junta a animação (o que a pessoa está fazendo), o simulador (o que a base
   mede) e as regras (o que o app diz). O tempo do movimento vem do relógio
   da cena 3D; o balanço natural e o modo automático usam o relógio de
   parede, para o mapa continuar "vivo" mesmo com a animação pausada, como
   uma pessoa parada em cima da base real. */
export function useSimulacaoDeSensores(opcoes: Opcoes): SimulacaoDeSensores {
  const ref = useRef(opcoes);
  ref.current = opcoes;
  const [estado, setEstado] = useState<SimulacaoDeSensores>(() => calcularInicial(opcoes));

  useEffect(() => {
    const inicio = performance.now();
    let anterior: Leitura | undefined;
    let feedback: EstadoDoFeedback | undefined;
    let desvioAnterior: Desvio | null = null;
    const soma = { simetria: 0, estabilidade: 0, apoioNasBarras: 0, cargaEsquerda: 0, amostras: 0 };

    const passo = () => {
      const o = ref.current;
      const parede = (performance.now() - inicio) / 1000;
      const esperado = esperadoAgora(o, parede);
      const desvios = desviosSimulaveis(o.exercicio).map((d) => d.desvio);
      const desvio = o.desvioForcado ?? (o.automatico ? desvioDoModoAutomatico(desvios, parede) : null);
      if (desvio !== desvioAnterior) {
        desvioAnterior = desvio;
        o.relogio.current.desvio = desvio;
        o.aoMudarDesvio?.();
      }
      const leitura = simularLeitura(esperado, desvio, parede, anterior);
      anterior = leitura;
      const avaliacao = avaliar(o.exercicio, leitura, esperado);
      feedback = feedback ? atualizarFeedback(feedback, avaliacao, parede) : iniciarFeedback(avaliacao, parede);
      o.relogio.current.sensores = { pes: leitura.pes, cargaEsquerda: leitura.cargaEsquerda, estado: feedback.exibido.estado };
      soma.simetria += avaliacao.simetria;
      soma.estabilidade += avaliacao.estabilidade;
      soma.apoioNasBarras += leitura.maos;
      soma.cargaEsquerda += leitura.cargaEsquerda * 100;
      soma.amostras += 1;
      setEstado({ leitura, esperado, avaliacao: feedback.exibido, desvioAtivo: desvio, medias: medias(soma) });
    };

    const id = window.setInterval(passo, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, []);

  return estado;
}

function esperadoAgora(o: Opcoes, parede: number): Esperado {
  const carga = o.animacao ? amostrar(o.animacao, o.relogio.current.tempo).carga : cargaSemAnimacao(o.exercicio, o.nivel);
  return esperadoDoExercicio(o.exercicio, o.nivel, carga, parede, o.cargaEsquerdaMeta);
}

/* Sem animação, a "pessoa" está parada no exercício; quem não usa as mãos
   no nível dela não tem peso nas barras. */
function cargaSemAnimacao(exercicio: Exercicio, nivel: Nivel) {
  const semMaos = exercicio.niveis[nivel].apoio === 'sem-maos';
  return semMaos ? { ...CARGA_EM_PE, pes: 1, maos: 0 } : CARGA_EM_PE;
}

function medias(s: Omit<MediasDaExecucao, never>): MediasDaExecucao {
  const n = Math.max(1, s.amostras);
  return {
    simetria: Math.round(s.simetria / n),
    estabilidade: Math.round(s.estabilidade / n),
    apoioNasBarras: s.apoioNasBarras / n,
    cargaEsquerda: Math.round(s.cargaEsquerda / n),
    amostras: s.amostras,
  };
}

function calcularInicial(o: Opcoes): SimulacaoDeSensores {
  const esperado = esperadoAgora(o, 0);
  const leitura = simularLeitura(esperado, null, 0);
  return { leitura, esperado, avaliacao: avaliar(o.exercicio, leitura, esperado), desvioAtivo: null, medias: { simetria: 0, estabilidade: 0, apoioNasBarras: 0, cargaEsquerda: 50, amostras: 0 } };
}
