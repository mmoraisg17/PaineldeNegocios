import { describe, expect, test } from 'vitest';
import { CODIGO_DO_CONVITE_TAMANHO } from '../dominio';
import { ROTA_DO_CONVITE, codigoDoTexto, linkDoConvite } from './linkDoConvite';

const SITE = 'https://alesx.github.io/PaineldeNegocios/';

describe('ROTA_DO_CONVITE', () => {
  test('é a rota /convite', () => {
    expect(ROTA_DO_CONVITE).toBe('/convite');
  });
});

describe('linkDoConvite', () => {
  test('monta o link com hash a partir do endereço do site', () => {
    expect(linkDoConvite(SITE, 'ABC234')).toBe('https://alesx.github.io/PaineldeNegocios/#/convite/ABC234');
  });

  test('descarta o hash atual, seja qual for a tela em que a pessoa está', () => {
    expect(linkDoConvite(`${SITE}#/praticante/perfil`, 'ABC234')).toBe(`${SITE}#/convite/ABC234`);
    expect(linkDoConvite(`${SITE}#`, 'ABC234')).toBe(`${SITE}#/convite/ABC234`);
  });

  test('mantém o que vem antes do hash, inclusive a consulta', () => {
    expect(linkDoConvite('http://localhost:5173/?teste=1#/x', 'ABC234')).toBe('http://localhost:5173/?teste=1#/convite/ABC234');
  });

  test('funciona com endereço sem barra final', () => {
    expect(linkDoConvite('https://x.github.io/PaineldeNegocios', 'ABC234')).toBe(
      'https://x.github.io/PaineldeNegocios#/convite/ABC234',
    );
  });

  test('o link que o app gera volta para o mesmo código em codigoDoTexto', () => {
    expect(codigoDoTexto(linkDoConvite(`${SITE}#/praticante/perfil`, 'K7M2QX'))).toBe('K7M2QX');
  });
});

describe('codigoDoTexto', () => {
  test('mantém um código já limpo', () => {
    expect(codigoDoTexto('ABC234')).toBe('ABC234');
  });

  test('passa para maiúsculas', () => {
    expect(codigoDoTexto('abc234')).toBe('ABC234');
  });

  test('tira espaços, hífens e outros símbolos (código colado ou ditado)', () => {
    expect(codigoDoTexto('  abc 234 \n')).toBe('ABC234');
    expect(codigoDoTexto('ABC-234')).toBe('ABC234');
    expect(codigoDoTexto('A.B,C_2/3!4')).toBe('ABC234');
  });

  test('corta no tamanho do código', () => {
    expect(codigoDoTexto('ABC234XYZ789')).toBe('ABC234');
    expect(codigoDoTexto('ABC234XYZ789')).toHaveLength(CODIGO_DO_CONVITE_TAMANHO);
  });

  test('devolve texto vazio para entrada vazia ou sem letras e dígitos', () => {
    expect(codigoDoTexto('')).toBe('');
    expect(codigoDoTexto('   ')).toBe('');
    expect(codigoDoTexto('---')).toBe('');
  });

  test('pega o código de um link colado, com e sem barra final', () => {
    expect(codigoDoTexto('https://x.github.io/PaineldeNegocios/#/convite/ABC234')).toBe('ABC234');
    expect(codigoDoTexto('https://x.github.io/PaineldeNegocios/#/convite/ABC234/')).toBe('ABC234');
  });

  test('pega o código de um link colado com espaços em volta e em minúsculas', () => {
    expect(codigoDoTexto('  https://x.github.io/PaineldeNegocios/#/convite/abc234  ')).toBe('ABC234');
  });

  test('ignora consulta ou texto que venha depois do código no link', () => {
    expect(codigoDoTexto('https://x.github.io/#/convite/ABC234?origem=zap')).toBe('ABC234');
    expect(codigoDoTexto('Entre por aqui: https://x.github.io/#/convite/ABC234 obrigado!')).toBe('ABC234');
  });

  test('aceita só o pedaço "convite/CÓDIGO" ou "/convite/CÓDIGO"', () => {
    expect(codigoDoTexto('convite/ABC234')).toBe('ABC234');
    expect(codigoDoTexto('#/convite/abc234')).toBe('ABC234');
  });

  test('link sem código depois de convite/ devolve vazio', () => {
    expect(codigoDoTexto('https://x.github.io/#/convite/')).toBe('');
  });

  test('um link que não é de convite não vira código por acidente de letras do endereço', () => {
    // sem "convite/", valem as regras do código colado: só letras e dígitos, cortado em 6.
    expect(codigoDoTexto('https://x.io')).toBe('HTTPSX');
  });

  test('não confunde letras acentuadas com letras do código', () => {
    expect(codigoDoTexto('ÁBC é234')).toBe('BC234');
  });
});
