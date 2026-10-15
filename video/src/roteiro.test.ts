import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { montarEsqueleto } from '../../app/src/movimento/corpo';
import { FPS, PADRAO, amostraNoQuadro, montarRoteiro, quadroDoPoster, tempoNoQuadro, trechoNoQuadro } from './roteiro';

const roteiro = montarRoteiro(PADRAO);
const alturaDoQuadril = (quadro: number) => montarEsqueleto(amostraNoQuadro(roteiro, quadro).pose).pelve.y;

describe('roteiro do vídeo do salto', () => {
  test('frame → tempo é determinístico, em qualquer ordem de render', () => {
    const todos = Array.from({ length: roteiro.duracaoEmQuadros }, (_, q) => q);
    const emOrdem = todos.map((q) => tempoNoQuadro(roteiro, q));
    // Fora de ordem e com um roteiro montado de novo, como faz cada aba do render paralelo.
    const outro = montarRoteiro(PADRAO);
    const embaralhado = [...todos].reverse().map((q) => [q, tempoNoQuadro(outro, q)] as const);
    for (const [q, t] of embaralhado) expect(t).toBe(emOrdem[q]);
    // E a pose também: mesma entrada, mesmo esqueleto.
    expect(montarEsqueleto(amostraNoQuadro(outro, 150).pose)).toEqual(montarEsqueleto(amostraNoQuadro(roteiro, 150).pose));
  });

  test('~12 s, com a câmera lenta a 0,5× e depois a velocidade real', () => {
    expect(roteiro.duracaoEmQuadros / FPS).toBeGreaterThan(11.5);
    expect(roteiro.duracaoEmQuadros / FPS).toBeLessThan(12.5);
    const lenta = roteiro.trechos.find((t) => t.id === 'lenta')!;
    const real = roteiro.trechos.find((t) => t.id === 'real')!;
    // A mesma janela da animação, mostrada no dobro do tempo.
    expect(lenta.ate - lenta.de).toBeCloseTo(2 * (real.ate - real.de), -1);
    expect(tempoNoQuadro(roteiro, lenta.de + FPS) - tempoNoQuadro(roteiro, lenta.de)).toBeCloseTo(0.5);
    expect(tempoNoQuadro(roteiro, real.de + FPS) - tempoNoQuadro(roteiro, real.de)).toBeCloseTo(1);
  });

  test('o tempo não pula na troca de trecho (exceto a volta da lenta para a real)', () => {
    for (const [a, b] of [['abertura', 'lenta'], ['real', 'fecho']] as const) {
      const t = roteiro.trechos.find((x) => x.id === b)!;
      expect(trechoNoQuadro(roteiro, t.de - 1).id).toBe(a);
      expect(tempoNoQuadro(roteiro, t.de) - tempoNoQuadro(roteiro, t.de - 1)).toBeCloseTo(1 / FPS);
    }
  });

  test('no quadro do pôster (ápice do voo) o quadril está mais alto que no início', () => {
    const poster = quadroDoPoster(roteiro);
    expect(trechoNoQuadro(roteiro, poster).id).toBe('lenta');
    expect(tempoNoQuadro(roteiro, poster)).toBeCloseTo(2.0, 1);
    expect(amostraNoQuadro(roteiro, poster).carga.pes).toBe(0); // no ar, nada na base
    expect(alturaDoQuadril(poster)).toBeGreaterThan(alturaDoQuadril(0) + 0.2);
    // É o pico da câmera lenta, não só "mais alto que o início".
    const lenta = roteiro.trechos.find((t) => t.id === 'lenta')!;
    let maisAlto = lenta.de;
    for (let q = lenta.de; q < lenta.ate; q++) if (alturaDoQuadril(q) > alturaDoQuadril(maisAlto)) maisAlto = q;
    expect(Math.abs(maisAlto - poster)).toBeLessThanOrEqual(1);
  });

  test('o script do pôster usa o quadro calculado aqui', () => {
    const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(pacote.scripts.poster).toContain(`--frame=${quadroDoPoster(roteiro)}`);
  });
});
