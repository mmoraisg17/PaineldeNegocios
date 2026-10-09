import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { type EstadoApp } from '../../dominio';
import { gerarConviteDe, revogarVinculo, usarCodigo } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const entrarComo = (id: 'carlos' | 'ana' | 'marta', preparar?: (e: EstadoApp) => EstadoApp) =>
  renderizarApp('/acompanhante/alunos', { papel: 'acompanhante', id }, preparar);

describe('lista de alunos', () => {
  test('mostra o título e o nome e a função de quem acompanha', () => {
    // Arrange / Act
    entrarComo('carlos');

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Meus alunos' })).toHaveFocus();
    expect(screen.getByText('Carlos · Personal')).toBeInTheDocument();
  });

  test('cada aluno traz trilha, último treino, treinos da semana e alertas', () => {
    // Arrange / Act
    entrarComo('carlos');

    // Assert
    const lucia = screen.getByRole('link', { name: /Dona Lúcia/ });
    expect(lucia).toHaveAttribute('href', '/acompanhante/aluno/lucia');
    expect(within(lucia).getByText('Equilíbrio 60+')).toBeInTheDocument();
    expect(within(lucia).getByText(/Último treino: 05\/10/)).toBeInTheDocument();
    expect(within(lucia).getByText('3 de 3 nesta semana')).toBeInTheDocument();
    expect(within(lucia).getByText('Sem alertas')).toBeInTheDocument();
  });

  test('conta os alertas do aluno, como a simetria fora da meta do Rafael', () => {
    // Arrange / Act
    entrarComo('ana');

    // Assert
    const rafael = screen.getByRole('link', { name: /Rafael/ });
    expect(within(rafael).getByText('Fisioterapia')).toBeInTheDocument();
    expect(within(rafael).getByText('1 alerta')).toBeInTheDocument();
  });

  test('a Marta (familiar) também vê a lista, mas só da filha que a autorizou', () => {
    // Arrange / Act
    entrarComo('marta');

    // Assert
    expect(screen.getByRole('link', { name: /Dona Lúcia/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Rafael/ })).not.toBeInTheDocument();
  });

  test('tocar num aluno abre o relatório dele', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('carlos');

    // Act
    await usuario.click(screen.getByRole('link', { name: /Dona Lúcia/ }));

    // Assert
    expect(app.roteador.state.location.pathname).toBe('/acompanhante/aluno/lucia');
    expect(screen.getByRole('heading', { level: 1, name: 'Dona Lúcia' })).toBeInTheDocument();
  });

  test('sem alunos, explica como o aluno gera o código', () => {
    // Arrange / Act
    entrarComo('carlos', (e) => revogarVinculo(e, 'vinculo-demo-1', AGORA_DA_DEMO));

    // Assert
    expect(screen.queryByRole('link', { name: /Dona Lúcia/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Você ainda não tem alunos/)).toBeInTheDocument();
    expect(screen.getByText(/Perfil → Acompanhantes → Convidar/)).toHaveTextContent(/código ou o link.*cole aqui/i);
  });

  test('um pedido ainda não autorizado aparece como aguardando, sem abrir os dados', () => {
    // Arrange
    const pedido = (e: EstadoApp) => {
      const { estado, convite } = gerarConviteDe(e, 'rafael', 'profissional', AGORA_DA_DEMO);
      return usarCodigo(estado, convite.codigo, 'carlos', AGORA_DA_DEMO).estado;
    };

    // Act
    entrarComo('carlos', pedido);

    // Assert
    expect(screen.getByText(/Aguardando autorização: Rafael/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Rafael/ })).not.toBeInTheDocument();
  });
});

describe('adicionar aluno na própria lista', () => {
  const ROTULO_DO_CAMPO = 'Código ou link do convite';

  test('mostra logo ao entrar o cartão com a frase e o campo do código', () => {
    // Arrange / Act
    entrarComo('carlos');

    // Assert
    expect(screen.getByRole('heading', { level: 2, name: 'Adicionar aluno' })).toBeInTheDocument();
    expect(screen.getByText('Cole o código ou o link que o aluno enviou.')).toBeInTheDocument();
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue('');
    expect(screen.queryByRole('link', { name: 'Adicionar aluno' })).not.toBeInTheDocument();
  });

  test('enviar um código válido cria o pedido e mostra "Aguardando autorização"', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const gerado = { codigo: '' };
    const app = entrarComo('ana', (e) => {
      const resultado = gerarConviteDe(e, 'lucia', 'familiar', AGORA_DA_DEMO);
      gerado.codigo = resultado.convite.codigo;
      return resultado.estado;
    });
    expect(screen.queryByText(/Aguardando autorização/)).not.toBeInTheDocument();

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByText(/Aguardando autorização: Dona Lúcia/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Pedido enviado. Agora Dona Lúcia precisa autorizar no app.');
    expect(app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia')).toMatchObject({
      status: 'pendente',
      tipo: 'familiar',
    });
  });

  test('um código errado mostra o erro na própria lista, sem sair da tela', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('carlos');

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'ZZZZZZ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Não encontramos esse convite neste aparelho');
    expect(app.roteador.state.location.pathname).toBe('/acompanhante/alunos');
  });
});

describe('ações', () => {

  test('"Sair" encerra a sessão e volta ao início', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('carlos');

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Sair' }));

    // Assert
    expect(app.estado().contaAtual).toBeNull();
    expect(app.roteador.state.location.pathname).toBe('/');
  });
});
