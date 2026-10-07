import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { type EstadoApp } from '../../dominio';
import { gerarConviteDe, usarCodigo } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const entrarComo = (id: 'lucia' | 'rafael', preparar?: (e: EstadoApp) => EstadoApp) =>
  renderizarApp('/praticante/perfil', { papel: 'praticante', id }, preparar);

/* Cenário: a Ana pediu para acompanhar a Lúcia e ainda aguarda autorização. */
const comPedidoPendenteDaAna = (estado: EstadoApp): EstadoApp => {
  const { estado: comConvite, convite } = gerarConviteDe(estado, 'lucia', 'profissional', AGORA_DA_DEMO);
  return usarCodigo(comConvite, convite.codigo, 'ana', AGORA_DA_DEMO).estado;
};

describe('dados do perfil', () => {
  test('mostra nome, objetivo, trilha e firmeza da Dona Lúcia', () => {
    // Arrange / Act
    entrarComo('lucia');

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toHaveFocus();
    expect(screen.getByText('Dona Lúcia')).toBeInTheDocument();
    expect(screen.getByText('Objetivo').nextElementSibling).toHaveTextContent('Equilíbrio');
    expect(screen.getByText('Trilha').nextElementSibling).toHaveTextContent('Equilíbrio 60+');
    expect(screen.getByText('Firmeza').nextElementSibling).toHaveTextContent('Às vezes me desequilibro');
  });

  test('mostra a trilha de fisioterapia e o joelho como objetivo do Rafael', () => {
    // Arrange / Act
    entrarComo('rafael');

    // Assert
    expect(screen.getByText('Trilha').nextElementSibling).toHaveTextContent('Fisioterapia');
    expect(screen.getByText('Objetivo').nextElementSibling).toHaveTextContent('Joelho');
  });
});

describe('acompanhantes', () => {
  test('lista cada acompanhante com a função e o que ele pode fazer', () => {
    // Arrange / Act
    entrarComo('lucia');

    // Assert
    const carlos = screen.getByRole('listitem', { name: /Carlos/ });
    expect(within(carlos).getByText(/Personal/)).toBeInTheDocument();
    expect(within(carlos).getByText(/ver os relatórios, ajustar a rotina e enviar recados/i)).toBeInTheDocument();
    const marta = screen.getByRole('listitem', { name: /Marta/ });
    expect(within(marta).getByText(/Filha/)).toBeInTheDocument();
    expect(within(marta).getByText(/só pode ver os relatórios/i)).toBeInTheDocument();
  });

  test('"Remover acesso" pede confirmação e depois tira o acompanhante da lista', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Remover acesso de Carlos' }));
    const confirmacao = screen.getByRole('group', { name: /Remover o acesso de Carlos\?/ });
    await usuario.click(within(confirmacao).getByRole('button', { name: 'Sim, remover acesso' }));

    // Assert
    expect(screen.queryByRole('listitem', { name: /Carlos/ })).not.toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /Marta/ })).toBeInTheDocument();
    expect(app.estado().vinculos.find((v) => v.acompanhanteId === 'carlos')?.status).toBe('revogado');
    expect(screen.getByRole('status')).toHaveTextContent('Acesso de Carlos removido');
  });

  test('cancelar a confirmação mantém o acesso', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Remover acesso de Marta' }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    expect(screen.queryByRole('group', { name: /Remover o acesso/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover acesso de Marta' })).toBeInTheDocument();
    expect(app.estado().vinculos.find((v) => v.acompanhanteId === 'marta')?.status).toBe('autorizado');
  });

  test('a tecla Esc fecha a confirmação sem remover ninguém', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');
    await usuario.click(screen.getByRole('button', { name: 'Remover acesso de Marta' }));

    // Act
    await usuario.keyboard('{Escape}');

    // Assert
    expect(screen.queryByRole('group', { name: /Remover o acesso/ })).not.toBeInTheDocument();
    expect(app.estado().vinculos.every((v) => v.status === 'autorizado')).toBe(true);
  });

  test('um pedido pendente mostra "pediu para acompanhar você" e o botão Autorizar', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia', comPedidoPendenteDaAna);
    expect(screen.getByText('Ana pediu para acompanhar você')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover acesso de Ana' })).not.toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Autorizar Ana' }));

    // Assert
    expect(app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia')?.status).toBe('autorizado');
    expect(screen.queryByText('Ana pediu para acompanhar você')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover acesso de Ana' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ana agora acompanha você');
  });
});

describe('convidar', () => {
  test('gera o código grande, soletrado, válido por 48 horas, e guarda o convite no estado', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');

    // Act
    await usuario.click(screen.getByRole('radio', { name: /Familiar/ }));
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));

    // Assert
    const convite = app.estado().convites.at(-1);
    expect(convite).toMatchObject({ alunoId: 'lucia', tipo: 'familiar' });
    const codigo = convite?.codigo ?? '';
    expect(codigo).toHaveLength(6);
    const grande = screen.getByRole('img', { name: `Código de convite: ${[...codigo].join(', ')}` });
    expect(grande).toHaveTextContent(codigo);
    expect(screen.getByText(/Válido por 48 horas/)).toBeInTheDocument();
  });

  test('gera convite de profissional quando essa é a escolha (a padrão)', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('rafael');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));

    // Assert
    expect(app.estado().convites.at(-1)).toMatchObject({ alunoId: 'rafael', tipo: 'profissional' });
  });

  test('"Copiar código" envia o código para a área de transferência e confirma', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');
    const copiar = vi.spyOn(navigator.clipboard, 'writeText');
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));

    // Assert
    expect(copiar).toHaveBeenCalledWith(app.estado().convites.at(-1)?.codigo);
    expect(await screen.findByText('Código copiado.')).toBeInTheDocument();
  });

  test('se a cópia falhar, orienta a anotar o código em vez de quebrar', async () => {
    // Arrange
    const usuario = userEvent.setup();
    entrarComo('lucia');
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('sem permissão'));
    await usuario.click(screen.getByRole('button', { name: 'Gerar código' }));

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Copiar código' }));

    // Assert
    expect(await screen.findByText(/Não deu para copiar/)).toBeInTheDocument();
  });
});

describe('ajustes', () => {
  test('o tamanho do texto é salvo nas preferências e muda a fonte base', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');
    expect(screen.getByRole('radio', { name: 'Normal' })).toBeChecked();

    // Act
    await usuario.click(screen.getByRole('radio', { name: 'Muito grande' }));

    // Assert
    expect(app.preferencias().tamanhoTexto).toBe('muito-grande');
    expect(document.documentElement.style.fontSize).toBe('140%');
    expect(screen.getByRole('radio', { name: 'Muito grande' })).toBeChecked();
  });

  test('o alto contraste liga e desliga, com o estado dito em texto', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');
    const alternancia = screen.getByRole('switch', { name: /Alto contraste/ });
    expect(alternancia).toHaveAttribute('aria-checked', 'false');
    expect(alternancia).toHaveTextContent('Desligado');

    // Act
    await usuario.click(alternancia);

    // Assert
    expect(app.preferencias().altoContraste).toBe(true);
    expect(document.documentElement).toHaveClass('alto-contraste');
    expect(alternancia).toHaveAttribute('aria-checked', 'true');
    expect(alternancia).toHaveTextContent('Ligado');

    // Act: desligar de novo
    await usuario.click(alternancia);
    expect(app.preferencias().altoContraste).toBe(false);
  });

  test('os avisos por voz ligam com a nota sobre a voz em português do Brasil', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');

    // Act
    await usuario.click(screen.getByRole('switch', { name: /Avisos por voz/ }));

    // Assert
    expect(app.preferencias().voz).toBe(true);
    expect(screen.getByText(/voz em português do Brasil/i)).toBeInTheDocument();
  });
});

describe('privacidade e saída', () => {
  test('explica que os dados de treino são dados de saúde e ficam só no aparelho', () => {
    // Arrange / Act
    entrarComo('lucia');

    // Assert
    expect(screen.getByText(/dados de saúde/i)).toBeInTheDocument();
    expect(screen.getByText(/apenas neste aparelho/i)).toBeInTheDocument();
  });

  test('apagar os dados exige confirmação, recomeça a demonstração e volta ao início', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia', (e) => gerarConviteDe(e, 'lucia', 'familiar', AGORA_DA_DEMO).estado);
    expect(app.estado().convites).toHaveLength(1);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Apagar meus dados e recomeçar' }));
    expect(app.estado().convites).toHaveLength(1);
    await usuario.click(screen.getByRole('button', { name: 'Sim, apagar tudo' }));

    // Assert
    expect(app.estado().convites).toHaveLength(0);
    expect(app.estado().contaAtual).toBeNull();
    expect(app.roteador.state.location.pathname).toBe('/');
  });

  test('desistir de apagar os dados não muda nada', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia', (e) => gerarConviteDe(e, 'lucia', 'familiar', AGORA_DA_DEMO).estado);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Apagar meus dados e recomeçar' }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    expect(app.estado().convites).toHaveLength(1);
    expect(app.roteador.state.location.pathname).toBe('/praticante/perfil');
  });

  test('"Sair" encerra a sessão e volta ao início', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('lucia');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));

    // Assert
    expect(app.estado().contaAtual).toBeNull();
    expect(app.roteador.state.location.pathname).toBe('/');
  });
});
