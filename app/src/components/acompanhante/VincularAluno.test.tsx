import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { type EstadoApp } from '../../dominio';
import { gerarConviteDe } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const ROTULO_DO_CAMPO = 'Código ou link do convite';

/* O formulário aparece em "Meus alunos" sem rota própria: a Ana ainda não
   acompanha a Dona Lúcia, então um convite dela vira um pedido novo. */
function abrirComConvite() {
  const gerado = { codigo: '' };
  const app = renderizarApp('/acompanhante/alunos', { papel: 'acompanhante', id: 'ana' }, (estado: EstadoApp) => {
    const resultado = gerarConviteDe(estado, 'lucia', 'profissional', AGORA_DA_DEMO);
    gerado.codigo = resultado.convite.codigo;
    return resultado.estado;
  });
  return { app, gerado };
}

const pedidoDaAna = (app: ReturnType<typeof abrirComConvite>['app']) =>
  app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia');

describe('extrair o código do que a pessoa cola ou digita', () => {
  test('um link colado inteiro vira só o código e o pedido é enviado', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { app, gerado } = abrirComConvite();
    await usuario.click(screen.getByLabelText(ROTULO_DO_CAMPO));

    // Act
    await usuario.paste(`https://x.github.io/app/#/convite/${gerado.codigo}`);

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue(gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(pedidoDaAna(app)).toMatchObject({ status: 'pendente' });
  });

  test('um link colado com barra final e minúsculas também funciona', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    await usuario.click(screen.getByLabelText(ROTULO_DO_CAMPO));

    // Act
    await usuario.paste(`http://localhost:5173/#/convite/${gerado.codigo.toLowerCase()}/`);

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue(gerado.codigo);
  });

  test('texto com espaços e minúsculas, como a pessoa ditaria, vira o código', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { app, gerado } = abrirComConvite();
    await usuario.click(screen.getByLabelText(ROTULO_DO_CAMPO));

    // Act
    await usuario.paste(` ${gerado.codigo.slice(0, 3).toLowerCase()} ${gerado.codigo.slice(3).toLowerCase()} `);

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue(gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(pedidoDaAna(app)).toBeDefined();
  });

  test('o campo nunca guarda mais de 6 caracteres, mesmo digitando além', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComConvite();

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'abcdefghij');

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue('ABCDEF');
  });
});

describe('botão Colar', () => {
  test('lê a área de transferência, extrai o código e preenche o campo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    const ler = vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(`Entre aqui: http://x/#/convite/${gerado.codigo}`);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    expect(ler).toHaveBeenCalledTimes(1);
    expect(await screen.findByDisplayValue(gerado.codigo)).toBe(screen.getByLabelText(ROTULO_DO_CAMPO));
  });

  test('se a leitura falhar, ensina a colar com toque longo no campo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValue(new Error('sem permissão'));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não deu para colar. Toque e segure no campo e escolha Colar.',
    );
  });

  test('se a área de transferência não tem um código, avisa em vez de limpar o campo em silêncio', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('   ');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(/Não achamos um código/);
  });

  test('não existe quando o navegador não sabe ler a área de transferência', async () => {
    // Arrange
    userEvent.setup();
    const original = navigator.clipboard.readText;
    Object.defineProperty(navigator.clipboard, 'readText', { value: undefined, configurable: true });

    try {
      // Act
      renderizarApp('/acompanhante/alunos', { papel: 'acompanhante', id: 'ana' });

      // Assert
      expect(screen.queryByRole('button', { name: 'Colar' })).not.toBeInTheDocument();
      expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toBeInTheDocument();
    } finally {
      /* sem devolver, o teste seguinte herdaria um clipboard sem readText */
      Object.defineProperty(navigator.clipboard, 'readText', { value: original, configurable: true, writable: true });
    }
  });
});

describe('toque duplo', () => {
  test('dois toques seguidos em "Enviar pedido" criam um só pedido', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { app, gerado } = abrirComConvite();
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
    const botao = screen.getByRole('button', { name: 'Enviar pedido' });

    // Act
    await usuario.dblClick(botao);

    // Assert
    expect(app.estado().vinculos.filter((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Pedido enviado');
  });
});

describe('avisos como região viva', () => {
  test('o status já está montado e vazio (só para leitor de tela) antes de qualquer ação', () => {
    // Arrange / Act
    abrirComConvite();

    // Assert
    const regiao = screen.getByRole('status');
    expect(regiao).toBeEmptyDOMElement();
    expect(regiao).toHaveClass('sr-only');
  });

  test('colar com sucesso anuncia "Código XXXXXX colado." na região que já existia', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    const regiao = screen.getByRole('status');
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(`http://x/#/convite/${gerado.codigo}`);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    await waitFor(() => expect(regiao).toHaveTextContent(`Código ${gerado.codigo} colado.`));
    expect(screen.getByRole('status')).toBe(regiao);
    expect(regiao).not.toHaveClass('sr-only');
  });

  test('depois de colar, o foco vai para o botão de enviar', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(gerado.codigo);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar pedido' })).toHaveFocus());
  });

  test('colar o mesmo código duas vezes limpa e regrava o aviso, para ser anunciado de novo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    const regiao = screen.getByRole('status');
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(gerado.codigo);
    const textos: string[] = [];
    const observador = new MutationObserver(() => textos.push(regiao.textContent ?? ''));
    observador.observe(regiao, { childList: true, characterData: true, subtree: true });
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));
    await waitFor(() => expect(regiao).toHaveTextContent('colado'));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));
    await waitFor(() => expect(textos.filter((t) => t.includes('colado'))).toHaveLength(2));
    observador.disconnect();

    // Assert
    expect(textos).toContain('');
  });

  test('quando não há código para colar, só o alerta aparece: sem "colado" e sem mover o foco', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('   ');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(/Não achamos um código/);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Colar' })).toHaveFocus();
  });

  test('a leitura que falha deixa só o alerta e o foco no "Colar"', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValue(new Error('sem permissão'));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Colar' })).toHaveFocus();
  });

  test('colar com sucesso apaga um erro anterior', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    const ler = vi.spyOn(navigator.clipboard, 'readText').mockResolvedValueOnce('   ');
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    ler.mockResolvedValue(gerado.codigo);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('colado'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('digitar depois de colar apaga o aviso de "colado", que já não vale', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Colar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('colado'));

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), '{Backspace}');

    // Assert
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  test('o resultado do envio usa a mesma região e o erro continua sendo alert', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado } = abrirComConvite();
    const regiao = screen.getByRole('status');
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'ZZZZZZ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Não encontramos esse convite');

    // Act
    await usuario.clear(screen.getByLabelText(ROTULO_DO_CAMPO));
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBe(regiao);
    expect(regiao).toHaveTextContent('Pedido enviado');
  });
});
