import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { type EstadoApp, rotinaDoPraticante } from '../../dominio';
import { gerarConviteDe, revogarVinculo, usarCodigo } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const abrir = (id: 'carlos' | 'ana' | 'marta', aluno: string, preparar?: (e: EstadoApp) => EstadoApp) =>
  renderizarApp(`/acompanhante/aluno/${aluno}`, { papel: 'acompanhante', id }, preparar);

describe('segurança: só quem foi autorizado vê o aluno', () => {
  test('sem vínculo, mostra "sem acesso" e nenhum dado do aluno', () => {
    // Arrange / Act: o Carlos nunca foi autorizado pelo Rafael
    abrir('carlos', 'rafael');

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Você não tem acesso a este aluno' })).toHaveFocus();
    expect(screen.queryByText(/Rafael/)).not.toBeInTheDocument();
    expect(screen.queryByText('Resumo')).not.toBeInTheDocument();
    expect(screen.queryByText('Histórico de treinos')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Meus alunos/ })).toHaveAttribute('href', '/acompanhante/alunos');
  });

  test('um aluno que não existe também cai em "sem acesso"', () => {
    // Arrange / Act
    abrir('carlos', 'ninguem');

    // Assert
    expect(screen.getByRole('heading', { name: 'Você não tem acesso a este aluno' })).toBeInTheDocument();
  });

  test('um pedido ainda pendente não dá acesso', () => {
    // Arrange
    const pedido = (e: EstadoApp) => {
      const { estado, convite } = gerarConviteDe(e, 'rafael', 'profissional', AGORA_DA_DEMO);
      return usarCodigo(estado, convite.codigo, 'carlos', AGORA_DA_DEMO).estado;
    };

    // Act
    abrir('carlos', 'rafael', pedido);

    // Assert
    expect(screen.getByRole('heading', { name: 'Você não tem acesso a este aluno' })).toBeInTheDocument();
    expect(screen.queryByText(/Rafael/)).not.toBeInTheDocument();
  });

  test('um acesso removido pelo aluno deixa de mostrar o relatório', () => {
    // Arrange / Act
    abrir('carlos', 'lucia', (e) => revogarVinculo(e, 'vinculo-demo-1', AGORA_DA_DEMO));

    // Assert
    expect(screen.getByRole('heading', { name: 'Você não tem acesso a este aluno' })).toBeInTheDocument();
    expect(screen.queryByText(/Dona Lúcia/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ajustar rotina' })).not.toBeInTheDocument();
  });
});

describe('relatório', () => {
  test('resume adesão, nota, simetria, estabilidade e apoio nas barras', () => {
    // Arrange / Act
    abrir('carlos', 'lucia');

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Dona Lúcia' })).toHaveFocus();
    const resumo = screen.getByRole('region', { name: 'Resumo' });
    expect(within(resumo).getByText('Adesão da semana').nextElementSibling).toHaveTextContent('3 de 3 treinos (100%)');
    for (const rotulo of ['Nota média', 'Simetria', 'Estabilidade', 'Apoio nas barras']) {
      expect(within(resumo).getByText(rotulo).nextElementSibling).toHaveTextContent(/\d/);
    }
  });

  test('mostra "Nenhum alerta" quando não há o que destacar', () => {
    // Arrange / Act
    abrir('carlos', 'lucia');

    // Assert
    const alertas = screen.getByRole('region', { name: 'Alertas' });
    expect(within(alertas).getByText(/Nenhum alerta/)).toBeInTheDocument();
  });

  test('mostra o texto de cada alerta, com ícone e rótulo (não só cor)', () => {
    // Arrange / Act
    abrir('ana', 'rafael');

    // Assert
    const alertas = screen.getByRole('region', { name: 'Alertas' });
    expect(within(alertas).getByText(/Simetria fora da meta: Miniagachamento/)).toBeInTheDocument();
    expect(within(alertas).getByText('Atenção')).toBeInTheDocument();
  });

  test('o histórico começa pelo treino mais recente e traz exercício, nível, nota e percepção', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir('carlos', 'lucia');

    // Act
    const historico = screen.getByRole('region', { name: 'Histórico de treinos' });
    const treinos = within(historico).getAllByRole('listitem', { name: /^Treino de / });

    // Assert
    expect(treinos).toHaveLength(5);
    expect(within(treinos[0]!).getByText('05/10/2026')).toBeInTheDocument();
    expect(within(treinos[0]!).getByText(/Percepção:/)).toBeInTheDocument();
    expect(within(treinos[0]!).getByText(/Sentar e levantar/)).toHaveTextContent(/nível \d · nota \d+/);

    // Act: ver todos
    await usuario.click(within(historico).getByRole('button', { name: /Ver todos os treinos/ }));

    // Assert: 16 treinos feitos (18 planejados, 2 faltas)
    expect(within(historico).getAllByRole('listitem', { name: /^Treino de / })).toHaveLength(16);
  });
});

describe('permissões', () => {
  test('o Carlos (profissional) vê "Ajustar rotina" e "Enviar recado"', () => {
    // Arrange / Act
    abrir('carlos', 'lucia');

    // Assert
    expect(screen.getByRole('heading', { name: 'Ajustar rotina' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enviar recado' })).toBeInTheDocument();
    expect(screen.queryByText(/Como familiar/)).not.toBeInTheDocument();
  });

  test('a Marta (familiar) só lê: sem ajuste, sem recado, com a nota explicativa', () => {
    // Arrange / Act
    abrir('marta', 'lucia');

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Dona Lúcia' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ajustar rotina' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Enviar recado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar rotina' })).not.toBeInTheDocument();
    expect(screen.getByText('Como familiar, você acompanha os relatórios, mas não altera a rotina.')).toBeInTheDocument();
  });
});

describe('ajustar a rotina', () => {
  test('salva exercício removido, nível fixado e frequência no estado, e avisa sobre o selo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrir('carlos', 'lucia');

    // Act
    await usuario.click(screen.getByRole('checkbox', { name: 'Pés em linha (tandem)' }));
    const nivel = screen.getByRole('group', { name: 'Nível de Sentar e levantar' });
    await usuario.click(within(nivel).getByRole('radio', { name: 'Nível 3' }));
    await usuario.click(within(nivel).getByRole('checkbox', { name: /Fixar nível/ }));
    await usuario.selectOptions(screen.getByLabelText('Treinos por semana'), '4');
    await usuario.click(screen.getByRole('button', { name: 'Salvar rotina' }));

    // Assert
    expect(app.estado().praticantes['lucia']?.ajuste).toMatchObject({
      autor: 'Carlos',
      autorId: 'carlos',
      exerciciosRemovidos: ['pes-em-linha'],
      niveisFixados: { 'sentar-e-levantar': 3 },
      frequenciaSemanal: 4,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Rotina ajustada. Dona Lúcia verá o selo "Ajustado por Carlos"');
    const rotina = rotinaDoPraticante(app.estado(), 'lucia');
    expect(rotina?.itens.some((i) => i.exercicioId === 'pes-em-linha')).toBe(false);
    expect(rotina?.frequenciaSemanal).toBe(4);
    expect(rotina?.ajustadoPor).toBe('Carlos');
  });

  test('só mostra o nível se o exercício estiver na rotina e bloqueia o que a plataforma não alcança', async () => {
    // Arrange: a plataforma desta aluna só chega à inclinação 1
    const usuario = userEvent.setup();
    const limitarInclinacao = (e: EstadoApp): EstadoApp => {
      const lucia = e.praticantes['lucia'];
      return lucia ? { ...e, praticantes: { ...e.praticantes, lucia: { ...lucia, perfil: { ...lucia.perfil, inclinacaoMaxima: 1 } } } } : e;
    };
    abrir('carlos', 'lucia', limitarInclinacao);

    // Act / Assert: a transferência de peso pede inclinação 2 no nível 3
    const transferencia = screen.getByRole('group', { name: 'Nível de Transferência de peso com alvos' });
    expect(within(transferencia).getByRole('radio', { name: 'Nível 3' })).toBeDisabled();
    expect(within(transferencia).getByRole('radio', { name: 'Nível 2' })).toBeEnabled();

    await usuario.click(screen.getByRole('checkbox', { name: 'Pés em linha (tandem)' }));
    expect(screen.queryByRole('group', { name: 'Nível de Pés em linha (tandem)' })).not.toBeInTheDocument();
  });

  test('a trilha de equilíbrio não oferece meta de simetria', () => {
    // Arrange / Act
    abrir('carlos', 'lucia');

    // Assert
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  test('a meta de simetria vai de 40 a 60, com o valor por extenso, e é salva', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrir('ana', 'rafael');
    const controle = screen.getByRole('slider', { name: /Meta de simetria/ });
    expect(controle).toHaveAttribute('min', '40');
    expect(controle).toHaveAttribute('max', '60');
    expect(controle).toHaveValue('50');

    // Act
    fireEvent.change(controle, { target: { value: '55' } });
    await usuario.click(screen.getByRole('button', { name: 'Salvar rotina' }));

    // Assert
    expect(screen.getAllByText('55% do peso na perna esquerda e 45% na direita').length).toBeGreaterThan(0);
    expect(app.estado().praticantes['rafael']?.ajuste?.metas).toEqual({ 'miniagachamento-simetrico': { simetriaEsquerda: 55 } });
    expect(screen.getByRole('status')).toHaveTextContent('Rotina ajustada. Rafael verá o selo "Ajustado por Ana"');
  });

  test('sem usar a meta, ela é removida do ajuste', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrir('ana', 'rafael');

    // Act
    await usuario.click(screen.getByRole('checkbox', { name: 'Usar meta de simetria' }));
    await usuario.click(screen.getByRole('button', { name: 'Salvar rotina' }));

    // Assert
    expect(app.estado().praticantes['rafael']?.ajuste?.metas).toEqual({});
    expect(screen.getByRole('slider', { name: /Meta de simetria/ })).toBeDisabled();
  });

  test('a frequência semanal vai de 2 a 5', () => {
    // Arrange / Act
    abrir('carlos', 'lucia');

    // Assert
    const opcoes = within(screen.getByLabelText('Treinos por semana')).getAllByRole('option');
    expect(opcoes.map((o) => o.getAttribute('value'))).toEqual(['2', '3', '4', '5']);
  });
});

describe('enviar recado', () => {
  test('grava o recado no estado, confirma o envio e limpa o campo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrir('carlos', 'lucia');
    const antes = app.estado().recados.length;

    // Act
    await usuario.type(screen.getByLabelText('Recado para Dona Lúcia'), 'Parabéns pela semana!');
    expect(screen.getByText('21 de 280 caracteres')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Enviar recado' }));

    // Assert
    expect(app.estado().recados).toHaveLength(antes + 1);
    expect(app.estado().recados.at(-1)).toMatchObject({ deId: 'carlos', paraId: 'lucia', texto: 'Parabéns pela semana!', lido: false });
    expect(screen.getByRole('status')).toHaveTextContent('Recado enviado. Dona Lúcia vai ler na tela Hoje.');
    expect(screen.getByLabelText('Recado para Dona Lúcia')).toHaveValue('');
  });

  test('o recado tem no máximo 280 caracteres', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrir('carlos', 'lucia');
    const campo = screen.getByLabelText('Recado para Dona Lúcia');

    // Act
    await usuario.click(campo);
    await usuario.paste('a'.repeat(300));

    // Assert
    expect(campo).toHaveAttribute('maxlength', '280');
    expect(campo).toHaveValue('a'.repeat(280));
    expect(screen.getByText('280 de 280 caracteres')).toBeInTheDocument();
  });

  test('um recado em branco é recusado com uma explicação', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrir('carlos', 'lucia');
    const antes = app.estado().recados.length;

    // Act
    await usuario.type(screen.getByLabelText('Recado para Dona Lúcia'), '   ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar recado' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Escreva o recado antes de enviar.');
    expect(app.estado().recados).toHaveLength(antes);
  });
});
