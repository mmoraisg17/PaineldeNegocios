import { describe, expect, test } from 'vitest';
import { enderecoDoCadastro, enderecoDoInicio, papelDoTexto } from './enderecos';

describe('enderecoDoInicio', () => {
  test('leva só o papel quando não há convite', () => {
    expect(enderecoDoInicio('praticante')).toBe('/?papel=praticante');
  });

  test('leva o convite normalizado para o acompanhante', () => {
    expect(enderecoDoInicio('acompanhante', ' abc-234 ')).toBe('/?papel=acompanhante&convite=ABC234');
  });

  test('descarta o convite do praticante', () => {
    expect(enderecoDoInicio('praticante', 'ABC234')).toBe('/?papel=praticante');
  });

  test('descarta um convite que não tem nenhum caractere válido', () => {
    expect(enderecoDoInicio('acompanhante', '--- ')).toBe('/?papel=acompanhante');
  });

  test('não deixa passar "&", "#" nem outro endereço dentro do convite', () => {
    expect(enderecoDoInicio('acompanhante', 'AB&papel=x#//evil.com')).toBe('/?papel=acompanhante&convite=ABPAPE');
  });
});

describe('enderecoDoCadastro', () => {
  test('monta o caminho do cadastro do papel', () => {
    expect(enderecoDoCadastro('praticante')).toBe('/cadastro/praticante');
  });

  test('leva o convite do acompanhante', () => {
    expect(enderecoDoCadastro('acompanhante', 'abc234')).toBe('/cadastro/acompanhante?convite=ABC234');
  });
});

describe('papelDoTexto', () => {
  test('aceita os dois papéis e recusa qualquer outro valor', () => {
    expect(papelDoTexto('praticante')).toBe('praticante');
    expect(papelDoTexto('acompanhante')).toBe('acompanhante');
    expect(papelDoTexto('administrador')).toBeNull();
    expect(papelDoTexto('')).toBeNull();
    expect(papelDoTexto(null)).toBeNull();
    expect(papelDoTexto(undefined)).toBeNull();
  });
});
