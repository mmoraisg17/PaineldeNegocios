import { expect, test } from 'vitest';
import { escolherVozBrasileira } from './vozBrasileira';

const voz = (lang: string, name: string, localService = true) => ({ lang, name, localService });

test('escolhe a voz pt-BR mesmo quando a de Portugal vem primeiro na lista', () => {
  const vozes = [voz('pt-PT', 'Microsoft Helia - Portuguese (Portugal)'), voz('pt-BR', 'Microsoft Maria - Portuguese (Brazil)')];
  expect(escolherVozBrasileira(vozes)?.name).toBe('Microsoft Maria - Portuguese (Brazil)');
});

test('aceita idioma escrito como pt_BR ou em minúsculas', () => {
  expect(escolherVozBrasileira([voz('pt-PT', 'Joana'), voz('pt_br', 'Luciana')])?.name).toBe('Luciana');
});

test('prefere a voz pt-BR instalada no aparelho à voz em nuvem', () => {
  const vozes = [voz('pt-BR', 'Google português do Brasil', false), voz('pt-BR', 'Microsoft Francisca', true)];
  expect(escolherVozBrasileira(vozes)?.name).toBe('Microsoft Francisca');
});

test('reconhece a voz pelo nome quando o idioma vem mal rotulado', () => {
  expect(escolherVozBrasileira([voz('pt', 'Português (Brasil)')])?.name).toBe('Português (Brasil)');
});

test('nunca escolhe uma voz de Portugal, mesmo se for a única em português', () => {
  expect(escolherVozBrasileira([voz('pt-PT', 'Joana'), voz('en-US', 'Samantha')])).toBeUndefined();
});

test('lista vazia (vozes ainda carregando) não escolhe nada', () => {
  expect(escolherVozBrasileira([])).toBeUndefined();
});
