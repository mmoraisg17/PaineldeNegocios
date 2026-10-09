import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { CAMPO as CAMPO_ACOMPANHANTE } from '../acompanhante/estilos';
import { CampoDeTexto } from './CampoDeTexto';
import { CAMPO } from './estilos';

describe('CampoDeTexto', () => {
  test('a borda do campo usa o token de contraste de componente, não a borda de divisória', () => {
    render(<CampoDeTexto rotulo="Nome" valor="" aoMudar={() => {}} />);

    const classes = screen.getByLabelText('Nome').className.split(' ');
    expect(classes).toContain('border-borda-campo');
    expect(classes).not.toContain('border-borda');
  });

  test('o texto de exemplo (placeholder) usa a cor suave, de contraste legível', () => {
    render(<CampoDeTexto rotulo="Nome" valor="" aoMudar={() => {}} placeholder="Ex.: Dona Maria" />);

    expect(screen.getByLabelText('Nome').className.split(' ')).toContain('placeholder:text-texto-suave');
  });

  test('o campo com erro troca a borda para a cor de perigo', () => {
    render(<CampoDeTexto rotulo="Nome" valor="" aoMudar={() => {}} erro="Informe o nome." />);

    expect(screen.getByLabelText('Nome').className.split(' ')).toContain('border-perigo');
  });
});

describe.each([
  ['acesso', CAMPO],
  ['acompanhante', CAMPO_ACOMPANHANTE],
])('CAMPO de %s', (_nome, campo) => {
  test('usa a borda de campo e o placeholder suave', () => {
    const classes = campo.split(' ');
    expect(classes).toContain('border-borda-campo');
    expect(classes).not.toContain('border-borda');
    expect(classes).toContain('placeholder:text-texto-suave');
  });
});
