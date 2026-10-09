import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { type EstadoApp, gerarConvite } from '../../dominio';
import { gerarConviteDe } from '../../estado/acoes';
import { AGORA_DA_DEMO, renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';

usarAmbienteDeTeste();

const MS_POR_HORA = 60 * 60 * 1000;
const CODIGO_FIXO = 'ABC234';
const ROTULO_DO_CAMPO = 'Código ou link do convite';

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

/* Para abrir a tela já com ?codigo=, o código precisa ser conhecido antes de
   montar o app: troca o código sorteado por um fixo. */
function comConviteFixo(alunoId: string, quando: Date = AGORA_DA_DEMO, tipo: 'profissional' | 'familiar' = 'profissional') {
  return (estado: EstadoApp): EstadoApp => {
    const { estado: gerado, convite } = gerarConviteDe(estado, alunoId, tipo, quando);
    return {
      ...gerado,
      convites: gerado.convites.map((c) => (c.codigo === convite.codigo ? { ...c, codigo: CODIGO_FIXO } : c)),
    };
  };
}

const abrirComo = (id: 'carlos' | 'ana', preparar?: (e: EstadoApp) => EstadoApp, caminho = '/acompanhante/adicionar') =>
  renderizarApp(caminho, { papel: 'acompanhante', id }, preparar);

describe('campo do código', () => {
  test('tem rótulo, aceita link colado (sem maxlength), sem preenchimento automático e teclado de texto', () => {
    // Arrange / Act
    abrirComo('ana');

    // Assert
    const campo = screen.getByLabelText(ROTULO_DO_CAMPO);
    expect(screen.getByRole('heading', { level: 1, name: 'Adicionar aluno' })).toHaveFocus();
    expect(campo).not.toHaveAttribute('maxlength');
    expect(campo).toHaveAttribute('autocomplete', 'off');
    expect(campo).toHaveAttribute('autocapitalize', 'characters');
    expect(campo).toHaveAttribute('spellcheck', 'false');
    expect(campo).toHaveValue('');
  });

  test('o que a pessoa digita vira maiúscula e perde os espaços', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComo('ana');

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'ab c2');

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue('ABC2');
  });

  test('mostra a dica de demonstração e o link para voltar', () => {
    // Arrange / Act
    abrirComo('ana');

    // Assert
    expect(screen.getByText(/Para testar: entre como lucia@demo\.test \/ demo1234/)).toHaveTextContent(
      'Perfil → Acompanhantes → Convidar',
    );
    expect(screen.getByText(/copie o código ou o link/)).toBeInTheDocument();
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
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Pedido enviado. Agora Dona Lúcia precisa autorizar no app.');
    const vinculo = app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia');
    expect(vinculo).toMatchObject({ status: 'pendente', tipo: 'profissional' });
    expect(app.estado().convites).toHaveLength(0);
    expect(screen.queryByLabelText(ROTULO_DO_CAMPO)).not.toBeInTheDocument();
  });

  test('depois do sucesso, oferece o link "Ver meus alunos"', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    abrirComo('ana', preparar);
    expect(screen.queryByRole('link', { name: 'Ver meus alunos' })).not.toBeInTheDocument();

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('link', { name: 'Ver meus alunos' })).toHaveAttribute('href', '/acompanhante/alunos');
  });

  test('quem já acompanha o aluno é avisado, sem criar um segundo vínculo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    const app = abrirComo('carlos', preparar);

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
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
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'ZZZZZZ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    const erro = screen.getByRole('alert');
    expect(erro).toHaveTextContent('Não encontramos esse convite neste aparelho');
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveAttribute('aria-invalid', 'true');
    expect(app.estado().vinculos).toEqual(antes);
  });

  test('um código vencido (mais de 48 horas) pede um código novo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia', new Date(AGORA_DA_DEMO.getTime() - 72 * MS_POR_HORA));
    const app = abrirComo('ana', preparar);

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);
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
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), solto.codigo);
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
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo.slice(0, 3));
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Digite os 6 caracteres do código.');
    expect(app.estado().convites).toHaveLength(1);
  });
});

describe('aberta pelo link do convite (?codigo=)', () => {
  const CAMINHO = `/acompanhante/adicionar?codigo=${CODIGO_FIXO}`;

  test('mostra quem convidou, o tipo do convite e o formulário já preenchido', () => {
    // Arrange / Act
    abrirComo('ana', comConviteFixo('lucia'), CAMINHO);

    // Assert
    expect(screen.getByText('Dona Lúcia convidou você para acompanhar os treinos como profissional.')).toBeInTheDocument();
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue(CODIGO_FIXO);
    expect(screen.getByRole('button', { name: 'Aceitar convite' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar pedido' })).not.toBeInTheDocument();
  });

  test('um convite de familiar diz "como familiar"', () => {
    // Arrange / Act
    abrirComo('ana', comConviteFixo('lucia', AGORA_DA_DEMO, 'familiar'), CAMINHO);

    // Assert
    expect(screen.getByText('Dona Lúcia convidou você para acompanhar os treinos como familiar.')).toBeInTheDocument();
  });

  test('aceitar cria o vínculo pendente e oferece "Ver meus alunos"', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const app = abrirComo('ana', comConviteFixo('lucia'), CAMINHO);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Aceitar convite' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Pedido enviado. Agora Dona Lúcia precisa autorizar no app.');
    expect(app.estado().vinculos.find((v) => v.acompanhanteId === 'ana' && v.alunoId === 'lucia')).toMatchObject({
      status: 'pendente',
      tipo: 'profissional',
    });
    expect(screen.getByRole('link', { name: 'Ver meus alunos' })).toBeInTheDocument();
  });

  test('o código da rota em minúsculas é normalizado', () => {
    // Arrange / Act
    abrirComo('ana', comConviteFixo('lucia'), '/acompanhante/adicionar?codigo=abc234');

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue(CODIGO_FIXO);
  });

  test('um convite vencido mostra o erro e deixa o formulário vazio para um código novo', () => {
    // Arrange
    const vencido = new Date(AGORA_DA_DEMO.getTime() - 72 * MS_POR_HORA);

    // Act
    abrirComo('ana', comConviteFixo('lucia', vencido), CAMINHO);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(/venceu.*gerar um novo/i);
    expect(screen.queryByText(/convidou você/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue('');
  });

  test('um convite que não existe neste aparelho mostra o erro com orientação', () => {
    // Arrange / Act
    abrirComo('ana', undefined, CAMINHO);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não encontramos esse convite neste aparelho. Confira o código com o aluno ou peça um novo.',
    );
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toHaveValue('');
  });

  test('um convite sem aluno ligado mostra o erro próprio', () => {
    // Arrange
    const solto = { ...gerarConvite('profissional', AGORA_DA_DEMO), codigo: CODIGO_FIXO };

    // Act
    abrirComo('ana', (e) => ({ ...e, convites: [...e.convites, solto] }), CAMINHO);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(/não está ligado a nenhum aluno/i);
  });

  test('um ?codigo= vazio abre o formulário vazio, sem erro', () => {
    // Arrange / Act
    abrirComo('ana', undefined, '/acompanhante/adicionar?codigo=');

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar pedido' })).toBeInTheDocument();
  });
});

describe('depois do pedido enviado', () => {
  const CAMINHO = `/acompanhante/adicionar?codigo=${CODIGO_FIXO}`;

  test('esconde o formulário: o botão "Aceitar convite" não pode ser tocado de novo', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComo('ana', comConviteFixo('lucia'), CAMINHO);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Aceitar convite' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Aceitar convite' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(ROTULO_DO_CAMPO)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver meus alunos' })).toBeInTheDocument();
  });

  test('esconde também o "Enviar pedido" de quem digitou o código', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    abrirComo('ana', preparar);
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Enviar pedido' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Colar' })).not.toBeInTheDocument();
  });

  test('o foco vai para a mensagem de sucesso, que fica na região de status', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComo('ana', comConviteFixo('lucia'), CAMINHO);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Aceitar convite' }));

    // Assert
    const mensagem = screen.getByRole('status');
    expect(mensagem).toHaveTextContent('Pedido enviado. Agora Dona Lúcia precisa autorizar no app.');
    expect(mensagem).toHaveFocus();
  });

  test('quem já acompanha o aluno também vê o formulário escondido e a mensagem com foco', async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { gerado, preparar } = comConvite('lucia');
    abrirComo('carlos', preparar);
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), gerado.codigo);

    // Act
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.queryByLabelText(ROTULO_DO_CAMPO)).not.toBeInTheDocument();
  });

  test('um erro não esconde o formulário: dá para corrigir o código', async () => {
    // Arrange
    const usuario = userEvent.setup();
    abrirComo('ana');

    // Act
    await usuario.type(screen.getByLabelText(ROTULO_DO_CAMPO), 'ZZZZZZ');
    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    // Assert
    expect(screen.getByLabelText(ROTULO_DO_CAMPO)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar pedido' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver meus alunos' })).not.toBeInTheDocument();
  });
});
