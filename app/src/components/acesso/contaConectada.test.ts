import { describe, expect, test } from 'vitest';
import { criarEstadoDemo, type ContaAtual, type EstadoApp } from '../../dominio';
import { contaConectadaValida } from './contaConectada';

const DEMO = criarEstadoDemo(new Date('2026-10-07T12:00:00Z'));
const comConta = (conta: ContaAtual | null): EstadoApp => ({ ...DEMO, contaAtual: conta });

describe('contaConectadaValida', () => {
  test('devolve nulo sem conta', () => {
    expect(contaConectadaValida(comConta(null))).toBeNull();
  });

  test('aceita praticante com dados', () => {
    const conta: ContaAtual = { papel: 'praticante', id: 'lucia' };
    expect(contaConectadaValida(comConta(conta))).toEqual(conta);
  });

  test('aceita acompanhante que está na lista', () => {
    const conta: ContaAtual = { papel: 'acompanhante', id: 'carlos' };
    expect(contaConectadaValida(comConta(conta))).toEqual(conta);
  });

  test('recusa acompanhante que sumiu do estado', () => {
    expect(contaConectadaValida(comConta({ papel: 'acompanhante', id: 'fantasma' }))).toBeNull();
  });

  test('recusa praticante sem dados e sem credencial', () => {
    expect(contaConectadaValida(comConta({ papel: 'praticante', id: 'fantasma' }))).toBeNull();
  });

  test('aceita praticante recém-cadastrado, com credencial e sem dados', () => {
    const credencial = { ...DEMO.credenciais[0]!, pessoaId: 'novo', email: 'novo@exemplo.com' };
    const estado: EstadoApp = {
      ...DEMO,
      credenciais: [...DEMO.credenciais, credencial],
      contaAtual: { papel: 'praticante', id: 'novo' },
    };
    expect(contaConectadaValida(estado)).toEqual({ papel: 'praticante', id: 'novo' });
  });

  test('não confunde o id "constructor" com uma propriedade herdada', () => {
    expect(contaConectadaValida(comConta({ papel: 'praticante', id: 'constructor' }))).toBeNull();
  });
});
