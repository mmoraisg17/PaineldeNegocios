import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { CampoDeSenha } from './CampoDeSenha';

function Exemplo({ erro, dica }: { erro?: string; dica?: string }) {
  const [valor, setValor] = useState('');
  return (
    <CampoDeSenha
      id="senha"
      rotulo="Senha"
      valor={valor}
      aoMudar={setValor}
      autoComplete="current-password"
      erro={erro}
      dica={dica}
    />
  );
}

describe('CampoDeSenha', () => {
  test('começa com a senha oculta e o botão de olho oferece "Mostrar senha"', () => {
    render(<Exemplo />);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    const olho = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(olho).toHaveAttribute('type', 'button');
    expect(olho).toHaveAttribute('aria-controls', 'senha');
  });

  test('o olho mostra a senha sem perder o que foi digitado e depois oculta de novo', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    await usuario.type(screen.getByLabelText('Senha'), 'segredo123');

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Senha')).toHaveValue('segredo123');
    const ocultar = screen.getByRole('button', { name: 'Ocultar senha' });

    await usuario.click(ocultar);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Senha')).toHaveValue('segredo123');
  });

  test('o botão troca só o rótulo; não usa aria-pressed, que o leitor leria como "Ocultar senha, pressionado"', async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).not.toHaveAttribute('aria-pressed');

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(screen.getByRole('button', { name: 'Ocultar senha' })).not.toHaveAttribute('aria-pressed');
  });

  test('repassa o autoComplete para o gerenciador de senhas do aparelho', () => {
    render(<Exemplo />);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
  });

  test('o ícone do olho fica escondido do leitor de tela', () => {
    render(<Exemplo />);
    const icone = screen.getByRole('button', { name: 'Mostrar senha' }).querySelector('svg');
    expect(icone).toHaveAttribute('aria-hidden', 'true');
  });

  test('a dica e o erro ficam ligados ao campo e o erro marca o campo como inválido', () => {
    render(<Exemplo dica="Pelo menos 8 caracteres." erro="A senha é curta." />);

    const campo = screen.getByLabelText('Senha');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Pelo menos 8 caracteres. A senha é curta.');
  });

  test('sem erro, o campo não é marcado como inválido', () => {
    render(<Exemplo dica="Pelo menos 8 caracteres." />);

    const campo = screen.getByLabelText('Senha');
    expect(campo).not.toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Pelo menos 8 caracteres.');
  });
});
