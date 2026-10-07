import { expect, test } from 'vitest';
import { formatarData, formatarDose, primeiroNome } from './formatos';

test('formata dose de repetições e de tempo, com e sem "por lado"', () => {
  expect(formatarDose({ tipo: 'repeticoes', repeticoes: 10 })).toBe('10 vezes');
  expect(formatarDose({ tipo: 'repeticoes', repeticoes: 6, porLado: true })).toBe('6 vezes por lado');
  expect(formatarDose({ tipo: 'tempo', segundos: 20 })).toBe('20 s');
});

test('formata a data no padrão brasileiro e ignora data inválida', () => {
  expect(formatarData('2026-10-07T12:00:00.000Z')).toBe('07/10');
  expect(formatarData('2026-10-07T12:00:00.000Z', true)).toBe('07/10/2026');
  expect(formatarData('ontem')).toBe('');
});

test('primeiro nome', () => {
  expect(primeiroNome('  Dona Lúcia ')).toBe('Dona');
  expect(primeiroNome('Rafael')).toBe('Rafael');
});
