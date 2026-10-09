import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

afterEach(() => {
  vi.restoreAllMocks();
});

/* O convite vive em Perfil → Acompanhantes; o teste abre a tela real e gera o
   código, como a Dona Lúcia faria. */
async function abrirComConviteGerado() {
  const usuario = userEvent.setup();
  renderizarApp('/praticante/perfil', { papel: 'praticante', id: 'lucia' });
  await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));
  return usuario;
}

/* A tela tem outra região de status (a de autorizar e remover acompanhantes):
   aqui só interessa a que fica dentro do cartão do convite. */
const regiaoDoConvite = (): HTMLElement => {
  const cartao = screen.getByText('Código do convite').parentElement as HTMLElement;
  return within(cartao).getByRole('status');
};

describe('aviso do convite como região viva', () => {
  test('o status já está montado e vazio (só para leitor de tela) antes de qualquer toque', async () => {
    // Arrange / Act
    await abrirComConviteGerado();

    // Assert
    const regiao = regiaoDoConvite();
    expect(regiao).toBeEmptyDOMElement();
    expect(regiao).toHaveClass('sr-only');
  });

  test('copiar o código troca o texto da MESMA região, que passa a ficar visível', async () => {
    // Arrange
    const usuario = await abrirComConviteGerado();
    const regiao = regiaoDoConvite();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));

    // Assert
    await waitFor(() => expect(regiao).toHaveTextContent('Código copiado.'));
    expect(regiao).toBeInTheDocument();
    expect(regiao).not.toHaveClass('sr-only');
  });

  test('a falha de cópia também entra na região que já existia', async () => {
    // Arrange
    const usuario = await abrirComConviteGerado();
    const regiao = regiaoDoConvite();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('sem permissão'));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }));

    // Assert
    await waitFor(() => expect(regiao).toHaveTextContent(/Não deu para copiar o link/));
  });

  test('copiar duas vezes seguidas limpa e regrava o texto, para o leitor anunciar de novo', async () => {
    // Arrange
    const usuario = await abrirComConviteGerado();
    const regiao = regiaoDoConvite();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const textos: string[] = [];
    const observador = new MutationObserver(() => textos.push(regiao.textContent ?? ''));
    observador.observe(regiao, { childList: true, characterData: true, subtree: true });
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }));
    await waitFor(() => expect(regiao).toHaveTextContent('Link copiado.'));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }));
    await waitFor(() => expect(textos.filter((t) => t === 'Link copiado.')).toHaveLength(2));
    observador.disconnect();

    // Assert
    expect(textos).toContain('');
    expect(regiao).toHaveTextContent('Link copiado.');
  });
});
