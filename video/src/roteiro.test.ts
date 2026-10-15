import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { temposDoBulgaro } from '../../app/src/movimento/animacoes/agachamentoBulgaroExplosivo';
import { montarEsqueleto } from '../../app/src/movimento/corpo';
import {
  FPS,
  PADRAO,
  amostraNoQuadro,
  cronometroNoTempo,
  montarRoteiro,
  quadroDoPoster,
  quadroDoTempo,
  tempoNoQuadro,
  trechoNoQuadro,
} from './roteiro';

const roteiro = montarRoteiro(PADRAO);
const todos = Array.from({ length: roteiro.duracaoEmQuadros }, (_, q) => q);
const alturaDoQuadril = (quadro: number) => montarEsqueleto(amostraNoQuadro(roteiro, quadro).pose).pelve.y;
const trecho = (id: string) => roteiro.trechos.find((t) => t.id === id)!;

describe('roteiro do vídeo do búlgaro explosivo', () => {
  test('frame → tempo é determinístico, em qualquer ordem de render', () => {
    const emOrdem = todos.map((q) => tempoNoQuadro(roteiro, q));
    // Fora de ordem e com um roteiro montado de novo, como faz cada aba do render paralelo.
    const outro = montarRoteiro(PADRAO);
    const embaralhado = [...todos].reverse().map((q) => [q, tempoNoQuadro(outro, q)] as const);
    for (const [q, t] of embaralhado) expect(t).toBe(emOrdem[q]);
    // E a pose também: mesma entrada, mesmo esqueleto.
    expect(montarEsqueleto(amostraNoQuadro(outro, 200).pose)).toEqual(montarEsqueleto(amostraNoQuadro(roteiro, 200).pose));
  });

  test('14–16 s, com a câmera lenta a 0,5× e depois a velocidade real', () => {
    expect(roteiro.duracaoEmQuadros / FPS).toBeGreaterThanOrEqual(14);
    expect(roteiro.duracaoEmQuadros / FPS).toBeLessThanOrEqual(16);
    const lenta = trecho('lenta');
    const real = trecho('real');
    // A mesma janela da animação, mostrada no dobro do tempo.
    expect(lenta.ate - lenta.de).toBe(2 * (real.ate - real.de));
    expect(lenta.tempoInicial).toBe(real.tempoInicial);
    expect(tempoNoQuadro(roteiro, lenta.de + FPS) - tempoNoQuadro(roteiro, lenta.de)).toBeCloseTo(0.5);
    expect(tempoNoQuadro(roteiro, real.de + FPS) - tempoNoQuadro(roteiro, real.de)).toBeCloseTo(1);
    // A janela pega o ciclo inteiro: começa parado antes da descida e termina em pé.
    const { inicioDaDescida, tTopo } = roteiro.tempos;
    expect(lenta.tempoInicial).toBeLessThan(inicioDaDescida);
    expect(tempoNoQuadro(roteiro, real.ate - 1)).toBeGreaterThan(tTopo);
  });

  test('o tempo não pula nas emendas (exceto a volta da lenta para a real)', () => {
    for (const [a, b] of [['abertura', 'lenta'], ['real', 'fecho']] as const) {
      const t = trecho(b);
      expect(trechoNoQuadro(roteiro, t.de - 1).id).toBe(a);
      const passo = tempoNoQuadro(roteiro, t.de) - tempoNoQuadro(roteiro, t.de - 1);
      expect(passo).toBeGreaterThan(0);
      expect(passo).toBeLessThanOrEqual(1 / FPS + 1e-9);
    }
    // A abertura nunca dá a volta no ciclo (cairia no meio da subida).
    for (let q = 0; q < trecho('abertura').ate; q++) expect(amostraNoQuadro(roteiro, q).fase).toMatch(/^Em pé|^Desça/);
  });

  test('no fundo o quadril fica mais baixo que em pé', () => {
    const { tFundo, tTopo } = roteiro.tempos;
    for (const id of ['lenta', 'real'] as const) {
      const emPe = trecho(id).de;
      const fundo = quadroDoTempo(roteiro, tFundo + 0.25, id);
      const topo = quadroDoTempo(roteiro, tTopo, id);
      expect(alturaDoQuadril(fundo)).toBeLessThan(alturaDoQuadril(emPe) - 0.15);
      expect(alturaDoQuadril(topo)).toBeCloseTo(alturaDoQuadril(emPe), 2);
    }
  });

  test('a subida e a descida do roteiro batem com temposDoBulgaro(3)', () => {
    const app = temposDoBulgaro(3);
    const { tFundo, tComeca, tTopo, descida, subida } = roteiro.tempos;
    expect([tFundo, tComeca, tTopo]).toEqual([app.tFundo, app.tComeca, app.tTopo]);
    expect(subida).toBeCloseTo(app.tTopo - app.tComeca, 9);
    expect(subida).toBeCloseTo(0.6, 9);
    expect(descida).toBeCloseTo(2.5, 9);
    // Em quadros: na lenta a subida dura o dobro da real (36 × 18 quadros).
    expect(quadroDoTempo(roteiro, tTopo, 'lenta') - quadroDoTempo(roteiro, tComeca, 'lenta')).toBe(Math.round((2 * subida) * FPS));
    expect(quadroDoTempo(roteiro, tTopo, 'real') - quadroDoTempo(roteiro, tComeca, 'real')).toBe(Math.round(subida * FPS));
    // O cronômetro para nos totais e zera antes da descida.
    expect(cronometroNoTempo(roteiro.tempos, tTopo + 0.2)).toMatchObject({ etapa: 'topo', descida: descida, subida: subida });
    expect(cronometroNoTempo(roteiro.tempos, 0.5)).toEqual({ etapa: 'parado', descida: 0, subida: 0 });
    expect(cronometroNoTempo(roteiro.tempos, (tComeca + tTopo) / 2).subida).toBeCloseTo(subida / 2, 9);
  });

  test('a plataforma do vídeo é a do app, plana: sem nenhuma opção de inclinação (que o app removeu)', () => {
    const cena = readFileSync(new URL('./CenaDoBulgaro.tsx', import.meta.url), 'utf8');
    expect(cena).toMatch(/<Plataforma cores=\{cores\} \/>/);
    expect(JSON.stringify(roteiro.animacao)).not.toMatch(/inclinacaoDaBase/);
  });

  test('a carga nos pés cabe no medidor (até 2×) e o banquinho está na animação', () => {
    for (const q of todos) expect(amostraNoQuadro(roteiro, q).carga.pes).toBeLessThanOrEqual(2);
    expect(roteiro.animacao.cadeira).toBeDefined();
  });

  test('o pôster é o meio da subida na câmera lenta, e o script usa esse quadro', () => {
    const poster = quadroDoPoster(roteiro);
    expect(trechoNoQuadro(roteiro, poster).id).toBe('lenta');
    expect(cronometroNoTempo(roteiro.tempos, tempoNoQuadro(roteiro, poster)).etapa).toBe('subida');
    const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(pacote.scripts.poster).toContain(`--frame=${poster}`);
  });
});
