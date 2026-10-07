import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { type EstadoApp, gerarConvite } from '../../dominio';
import { gerarConviteDe } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const MS_POR_HORA = 60 * 60 * 1000;

/* A tela precisa de um código que exista no estado; o cenário guarda o código
   gerado para o teste digitá-lo, como o acompanhante faria. */
function comConvite(alunoId: string, quando: Date = AGORA_DA_DEMO) {
  const gerado = { codigo: '' };
  const preparar = (estado: EstadoApp): EstadoApp => {
    const resultado = gerarConviteDe(estado, alunoId, 'profissional', quando);
    gerado.codigo = resultado.convite.codigo;
    return resultado.estado;
  };
  return { gerado, preparar };
}

const abrirComo = (id: 'carlos' | 'ana', preparar?: (e: EstadoApp) => EstadoApp) =>
  renderizarApp('/acompanhante/adicionar', { papel: 'acompanhante', id }, preparar);

describe('campo do código', () => {
  test('tem rótulo, 6 caracteres, sem preenchimento automático e teclado de texto', () => {
    // Arrange / Act
    abrirComo('ana');

    // Assert
    const campo = screen.getByLabelText('Código do aluno');
    expect(screen.getByRole('heading', { level: 1, name: 'Adicionar aluno' })).toHaveFocus();
    expect(campo).toHaveAttribute('maxlength', '6');
    expect(campo).toHaveAttribute('autocomplete', 'off');
    expect(campo).toHaveAttribute('inputmode', 'text');
  });

  test('o que a pessoa digita vira maiúscula e perde os espaços', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComo('ana');

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), 'ab c2');

    // Assert
    expect(screen.getByLabelText('Código do aluno')).toHaveValue('ABC2');
  });

  test('mostra a dica de demonstração e o link para voltar', () => {
    // Arrange / Act
    abrirComo('ana');

    // Assert
    expect(
      screen.getByText('Para testar: entre como Dona Lúcia, vá em Perfil → Acompanhantes → Convidar e digite o código aqui.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute('href', '/acompanhante/alunos');
  });
});

describe('enviar o código', () => {
  test('um código válido cria um pedido pendente e avisa que o aluno precisa autorizar', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    const app = abrirComo('ana', preparar);

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Pedido enviado. Agora Dona Lúcia precisa autorizar no app.');
    const vinculo = app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia');
    expect(vinculo).toMatchObject({ status: 'pendente', tipo: 'profissional' });
    expect(app.estado().convites).toHaveLength(0);
    expect(screen.getByLabelText('Código do aluno')).toHaveValue('');
  });

  test('quem já acompanha o aluno é avisado, sem criar um segundo vínculo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    const app = abrirComo('carlos', preparar);

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Você já acompanha Dona Lúcia.');
    expect(app.estado().vinculos.filter((v) => v.acompanhanteId === 'carlos' && v.alunoId === 'lucia')).toHaveLength(1);
  });

  test('um código que não existe mostra erro amigável e não cria vínculo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrirComo('ana');
    const antes = app.estado().vinculos;

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), 'ZZZZZZ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    const erro = screen.getByRole('alert');
    expect(erro).toHaveTextContent('Não encontramos esse código');
    expect(screen.getByLabelText('Código do aluno')).toHaveAttribute('aria-invalid', 'true');
    expect(app.estado().vinculos).toEqual(antes);
  });

  test('um código vencido (mais de 48 horas) pede um código novo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia', new Date(AGORA_DA_DEMO.getTime() - 72 * MS_POR_HORA));
    const app = abrirComo('ana', preparar);

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(/venceu.*gerar um novo/i);
    expect(app.estado().vinculos.some((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia')).toBe(false);
  });

  test('um convite sem aluno associado dá um erro próprio', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const solto = gerarConvite('profissional', AGORA_DA_DEMO);
    abrirComo('ana', (e) => ({ ...e, convites: [...e.convites, solto] }));

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), solto.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(/não está ligado a nenhum aluno/i);
  });

  test('um código incompleto pede os 6 caracteres e nem consulta o estado', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    const app = abrirComo('ana', preparar);

    // Act
    await usuario.type(screen.getByLabelText('Código do aluno'), gerado.codigo.slice(0, 3));
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Digite os 6 caracteres do código.');
    expect(app.estado().convites).toHaveLength(1);
  });
});
