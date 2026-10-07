import { describe, expect, test } from 'vitest';
import { ENQUADRAMENTO_PADRAO, enquadramento } from './enquadramento';

/* Auditoria visual, V8: no erro, a câmera chega perto da região a corrigir,
   como os close-ups da referência; na execução certa, mostra o corpo todo. */

describe('enquadramento', () => {
  test('execução certa ou só dica: corpo inteiro', () => {
    expect(enquadramento('pernas', 'ok')).toEqual(ENQUADRAMENTO_PADRAO);
    expect(enquadramento('pernas', 'dica')).toEqual(ENQUADRAMENTO_PADRAO);
  });

  test('sem região (desvio sem lugar no corpo): corpo inteiro mesmo com atenção', () => {
    expect(enquadramento(null, 'atencao')).toEqual(ENQUADRAMENTO_PADRAO);
  });

  test('erro nas pernas: mira mais baixo e chega mais perto', () => {
    const e = enquadramento('pernas', 'atencao');
    expect(e.alturaDoAlvo).toBeLessThan(ENQUADRAMENTO_PADRAO.alturaDoAlvo);
    expect(e.distancia).toBeLessThan(ENQUADRAMENTO_PADRAO.distancia);
  });

  test('erro nos braços ou no tronco: mira mais alto que nas pernas', () => {
    expect(enquadramento('bracos', 'pare').alturaDoAlvo).toBeGreaterThan(enquadramento('pernas', 'pare').alturaDoAlvo);
    expect(enquadramento('tronco', 'pare').alturaDoAlvo).toBeGreaterThan(enquadramento('pernas', 'pare').alturaDoAlvo);
  });

  test('o close-up nunca corta o corpo pela metade (no máximo 25% mais perto)', () => {
    for (const regiao of ['pernas', 'tronco', 'bracos'] as const) {
      expect(enquadramento(regiao, 'pare').distancia).toBeGreaterThanOrEqual(0.75);
    }
  });
});
