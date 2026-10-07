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
    expect(screen.getByText(/Perfil → Acompanhantes → Convidar/)).toBeInTheDocument();
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

describe('ações', () => {
  test('"Adicionar aluno" leva à tela do código', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = entrarComo('carlos');

    // Act
    await usuario.click(screen.getByRole('link', { name: 'Adicionar aluno' }));

    // Assert
    expect(app.roteador.state.location.pathname).toBe('/acompanhante/adicionar');
  });

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
