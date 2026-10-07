import { describe, expect, test } from 'vitest';
import { CATALOGO, type Exercicio, type Nivel } from '../dominio';
import { amostrar, duracao } from '../movimento/animacao';
import { animacaoDe } from '../movimento/animacoes';
import { alvoDaTransferencia, esperadoDoExercicio } from './esperado';
import { ESPERA_PROBLEMA, atualizarFeedback, desvioDoModoAutomatico, iniciarFeedback } from './feedback';
import { avaliar, desviosSimulaveis, detectar, metricas } from './regras';
import { CARGA_EM_PE, simularLeitura } from './simulador';
import type { Desvio, Leitura } from './tipos';

const PASSO = 0.1; // a tela amostra os sensores a 10 Hz

/* Roda a simulação como a tela roda: leitura a cada 0,1 s, avaliação e
   filtro de feedback. Devolve o que apareceu na tela a cada instante. */
function simular(exercicio: Exercicio, nivel: Nivel, segundos: number, desvio: (t: number) => Desvio | null) {
  const animacao = animacaoDe(exercicio.id);
  let anterior: Leitura | undefined;
  let feedback;
  const exibidos: { t: number; id: string | null; estado: string }[] = [];
  for (let t = 0; t <= segundos + 1e-9; t += PASSO) {
    const carga = animacao ? amostrar(animacao, t).carga : CARGA_EM_PE;
    const esperado = esperadoDoExercicio(exercicio, nivel, carga, t);
    const leitura = simularLeitura(esperado, desvio(t), t, anterior);
    anterior = leitura;
    const avaliacao = avaliar(exercicio, leitura, esperado);
    feedback = feedback ? atualizarFeedback(feedback, avaliacao, t) : iniciarFeedback(avaliacao, t);
    exibidos.push({ t, id: feedback.exibido.correcao?.id ?? null, estado: feedback.exibido.estado });
  }
  return exibidos;
}

describe.each(CATALOGO.map((e) => [e.id, e] as const))('%s', (_id, exercicio) => {
  test.each([1, 2, 3] as const)('execução certa no nível %i nunca mostra aviso de problema', (nivel) => {
    const segundos = Math.max(12, duracao(animacaoDe(exercicio.id) ?? { id: '', quadros: [] }) * 2);
    const problemas = simular(exercicio, nivel, segundos, () => null).filter((x) => x.estado === 'atencao' || x.estado === 'pare');
    expect(problemas).toEqual([]);
  });

  test.each(desviosSimulaveis(exercicio).map((d) => [d.desvio, d.correcao.id] as const))(
    'o erro "%s" aparece como a correção "%s" em até 0,5 s',
    (desvio, idCorrecao) => {
      const inicio = 3; // erro injetado depois de 3 s de execução certa
      const exibidos = simular(exercicio, 1, inicio + 2, (t) => (t >= inicio ? desvio : null));
      const primeiro = exibidos.find((x) => x.t >= inicio && x.id === idCorrecao);
      expect(primeiro, `nunca exibiu ${idCorrecao}`).toBeDefined();
      expect(primeiro!.t - inicio).toBeLessThanOrEqual(ESPERA_PROBLEMA + PASSO + 1e-9);
    },
  );
});

describe('regras', () => {
  const exercicio = CATALOGO.find((e) => e.id === 'miniagachamento-simetrico')!;
  const esperado = esperadoDoExercicio(exercicio, 1, CARGA_EM_PE, 0);

  test('respeita a meta de simetria definida pelo profissional', () => {
    const comMeta = esperadoDoExercicio(exercicio, 1, CARGA_EM_PE, 0, 0.6);
    const leitura = simularLeitura(comMeta, null, 0);
    // Simétrica (50/50) é desvio quando a meta é 60/40…
    expect(detectar('assimetria', { ...leitura, cargaEsquerda: 0.5 }, comMeta)).toBe(false);
    expect(detectar('assimetria', { ...leitura, cargaEsquerda: 0.45 }, comMeta)).toBe(true);
    // …e 60/40 é o certo.
    expect(detectar('assimetria', { ...leitura, cargaEsquerda: 0.6 }, comMeta)).toBe(false);
  });

  test('"pare" tem prioridade sobre ajustes', () => {
    const leitura = simularLeitura(esperado, 'perda-de-equilibrio', 1);
    expect(avaliar(exercicio, leitura, esperado).estado).toBe('pare');
  });

  test('notas de simetria e estabilidade: 100 na execução perfeita, caem com o desvio', () => {
    const perfeita = { ...simularLeitura(esperado, null, 0), cargaEsquerda: 0.5, oscilacao: 0 };
    expect(metricas(perfeita, esperado)).toEqual({ simetria: 100, estabilidade: 100 });
    const torta = { ...perfeita, cargaEsquerda: 0.3, oscilacao: 0.25 };
    expect(metricas(torta, esperado)).toEqual({ simetria: 60, estabilidade: 50 });
  });

  test('elogia quem está firme sem apoio no tandem', () => {
    const tandem = CATALOGO.find((e) => e.id === 'pes-em-linha')!;
    const esp = esperadoDoExercicio(tandem, 3, { ...CARGA_EM_PE, maos: 0 }, 0);
    const leitura = simularLeitura(esp, 'firme-sem-apoio', 0);
    expect(avaliar(tandem, leitura, esp)).toMatchObject({ estado: 'dica', correcao: { id: 'pronto-para-soltar' } });
  });
});

describe('feedback', () => {
  const exercicio = CATALOGO.find((e) => e.id === 'sentar-e-levantar')!;
  const ok = { estado: 'ok', correcao: null, simetria: 100, estabilidade: 100 } as const;
  const problema = { estado: 'atencao', correcao: exercicio.correcoes[0]!, simetria: 60, estabilidade: 90 } as const;
  const pare = { estado: 'pare', correcao: exercicio.correcoes[2]!, simetria: 60, estabilidade: 20 } as const;

  test('um problema rápido (balanço de 0,2 s) não chega à tela', () => {
    let f = iniciarFeedback(ok, 0);
    f = atualizarFeedback(f, problema, 2.0);
    f = atualizarFeedback(f, ok, 2.2);
    f = atualizarFeedback(f, ok, 3.0);
    expect(f.exibido.estado).toBe('ok');
  });

  test('"pare" aparece na hora', () => {
    const f = atualizarFeedback(iniciarFeedback(ok, 0), pare, 5);
    expect(f.exibido.estado).toBe('pare');
  });

  test('um aviso fica pelo menos 1,2 s na tela', () => {
    let f = iniciarFeedback(ok, 0);
    f = atualizarFeedback(f, problema, 2.0);
    f = atualizarFeedback(f, problema, 2.5); // aparece
    f = atualizarFeedback(f, ok, 2.6);
    f = atualizarFeedback(f, ok, 3.5); // ok maduro, mas aviso ainda não completou 1,2 s
    expect(f.exibido.estado).toBe('atencao');
    f = atualizarFeedback(f, ok, 3.8);
    expect(f.exibido.estado).toBe('ok');
  });
});

describe('modo automático e alvos', () => {
  test('alterna execução certa e os dois primeiros erros num ciclo de 24 s', () => {
    const desvios: Desvio[] = ['assimetria', 'apoio-excessivo'];
    expect(desvioDoModoAutomatico(desvios, 2)).toBeNull();
    expect(desvioDoModoAutomatico(desvios, 9)).toBe('assimetria');
    expect(desvioDoModoAutomatico(desvios, 15)).toBeNull();
    expect(desvioDoModoAutomatico(desvios, 19)).toBe('apoio-excessivo');
    expect(desvioDoModoAutomatico(desvios, 24 + 9)).toBe('assimetria');
    expect(desvioDoModoAutomatico([], 9)).toBeNull();
  });

  test('o alvo da transferência de peso percorre frente, direita, trás e esquerda', () => {
    expect(alvoDaTransferencia(2, 0)).toEqual({ ap: 0.5, ml: 0 });
    expect(alvoDaTransferencia(2, 4)).toEqual({ ap: 0, ml: -0.5 });
    expect(alvoDaTransferencia(2, 8)).toEqual({ ap: -0.5, ml: 0 });
    expect(alvoDaTransferencia(2, 12)).toEqual({ ap: 0, ml: 0.5 });
    expect(alvoDaTransferencia(1, 0).ap).toBeLessThan(alvoDaTransferencia(3, 0).ap);
  });
});
