import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TAMANHO_MINIMO_DA_SENHA } from '../dominio';
import { renderizarApp, usarAmbienteDeTeste } from '../test/renderizarApp';

usarAmbienteDeTeste();
beforeEach(() => sessionStorage.clear());

const ESPERA_DO_HASH = { timeout: 10000 };
const TEMPO_DO_TESTE = 20000;
const SENHA_BOA = 'uma-senha-boa';

type Usuario = ReturnType<typeof userEvent.setup>;

async function preencherCadastro(usuario: Usuario, email: string, senha: string) {
  await usuario.type(screen.getByLabelText('E-mail'), email);
  await usuario.type(screen.getByLabelText('Senha'), senha);
}

describe('cadastro: estrutura', () => {
  test('o papel inválido volta ao início', () => {
    const { roteador } = renderizarApp('/cadastro/administrador', null);

    expect(roteador.state.location.pathname).toBe('/');
  });

  test('a conta de praticante tem título, volta para a aba certa e só pede e-mail e senha', () => {
    renderizarApp('/cadastro/praticante', null);

    expect(screen.getByRole('heading', { level: 1, name: 'Criar conta de praticante' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute('href', '/?papel=praticante');
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByRole('checkbox', { name: 'Manter conectado' })).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/?papel=praticante');
  });

  test('a senha traz a dica do tamanho mínimo e o conselho de não reaproveitar senhas', () => {
    renderizarApp('/cadastro/praticante', null);

    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(
      `Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres. Crie uma senha só para este app: não use a senha do seu e-mail ou do banco.`,
    );
  });

  test('a conta de acompanhante pede nome, tipo e função, e o tipo começa em Profissional', () => {
    renderizarApp('/cadastro/acompanhante', null);

    expect(screen.getByRole('heading', { level: 1, name: 'Criar conta de acompanhante' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Profissional (personal, fisioterapeuta)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Familiar' })).not.toBeChecked();
    expect(screen.getByLabelText('Função (opcional)')).toBeInTheDocument();
  });

  test('o convite do endereço volta junto no link "Voltar" e no "Entrar"', () => {
    renderizarApp('/cadastro/acompanhante?convite=abc234', null);

    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute('href', '/?papel=acompanhante&convite=ABC234');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/?papel=acompanhante&convite=ABC234');
  });
});

describe('cadastro: validação antes do hash', () => {
  test('e-mail inválido mostra o erro no campo e leva o foco até ele', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, 'isto-nao-e-email', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    const campo = screen.getByLabelText('E-mail');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(/e-mail válido/i);
    expect(campo).toHaveFocus();
    expect(screen.getByLabelText('Senha')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('senha curta mostra o erro no campo da senha', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, 'maria@exemplo.com', '1234567');

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    const campo = screen.getByLabelText('Senha');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(/pelo menos 8 caracteres/i);
    expect(campo).toHaveFocus();
  });

  test('e-mail já em uso mostra o erro no campo do e-mail', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, 'Lucia@demo.test', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    const campo = screen.getByLabelText('E-mail');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(
      'Já existe uma conta de praticante com este e-mail. Volte e toque em Entrar.',
    );
    expect(roteador.state.location.pathname).toBe('/cadastro/praticante');
  });

  test('o mesmo e-mail de um praticante pode ser usado numa conta de acompanhante', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/cadastro/acompanhante', null);
    await usuario.type(screen.getByLabelText('Nome'), 'Lúcia Filha');
    await preencherCadastro(usuario, 'lucia@demo.test', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/acompanhante/alunos'), ESPERA_DO_HASH);
  }, TEMPO_DO_TESTE);

  test('o acompanhante sem nome vê o erro no campo do nome, que é o primeiro a receber o foco', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/cadastro/acompanhante', null);
    await preencherCadastro(usuario, 'isto-nao-e-email', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome')).toHaveFocus();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Senha')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('corrigir o e-mail e enviar de novo troca o erro do e-mail pelo erro seguinte, o da senha', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, 'isto-nao-e-email', '123');
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');

    await usuario.clear(screen.getByLabelText('E-mail'));
    await usuario.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Senha')).toHaveFocus();
  });
});

describe('cadastro: criação da conta', () => {
  test('o praticante é criado conectado, vai ao primeiro uso e a senha nunca fica no estado', async () => {
    const usuario = userEvent.setup();
    const { roteador, estado } = renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, '  Maria@Exemplo.com ', SENHA_BOA);
    await usuario.click(screen.getByRole('checkbox', { name: 'Manter conectado' }));

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/primeiro-uso'), ESPERA_DO_HASH);
    await vi.waitFor(() => expect(estado().credenciais.some((c) => c.email === 'maria@exemplo.com')).toBe(true));
    const credencial = estado().credenciais.find((c) => c.email === 'maria@exemplo.com');
    expect(credencial).toMatchObject({ papel: 'praticante' });
    expect(estado().contaAtual).toMatchObject({ papel: 'praticante', id: credencial?.pessoaId, manterConectado: true });
    expect(JSON.stringify(estado())).not.toContain(SENHA_BOA);
    expect(Object.keys(estado().praticantes)).not.toContain(credencial?.pessoaId);
  }, TEMPO_DO_TESTE);

  test('enquanto cria, o botão fica desabilitado e mostra "Criando conta…"', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/cadastro/praticante', null);
    await preencherCadastro(usuario, 'maria@exemplo.com', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByRole('button', { name: 'Criando conta…' })).toBeDisabled();
    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/primeiro-uso'), ESPERA_DO_HASH);
  }, TEMPO_DO_TESTE);

  test('o acompanhante é criado com nome, tipo e função e vai para a lista de alunos', async () => {
    const usuario = userEvent.setup();
    const { roteador, estado } = renderizarApp('/cadastro/acompanhante', null);
    await usuario.type(screen.getByLabelText('Nome'), 'Beatriz Souza');
    await usuario.click(screen.getByRole('radio', { name: 'Familiar' }));
    await usuario.type(screen.getByLabelText('Função (opcional)'), 'Filha');
    await preencherCadastro(usuario, 'bia@exemplo.com', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/acompanhante/alunos'), ESPERA_DO_HASH);
    await vi.waitFor(() => expect(estado().acompanhantes.some((a) => a.nome === 'Beatriz Souza')).toBe(true));
    const nova = estado().acompanhantes.find((a) => a.nome === 'Beatriz Souza');
    expect(nova).toMatchObject({ tipo: 'familiar', funcao: 'Filha' });
    expect(estado().contaAtual).toMatchObject({ papel: 'acompanhante', id: nova?.id, manterConectado: false });
    expect(JSON.stringify(estado())).not.toContain(SENHA_BOA);
  }, TEMPO_DO_TESTE);

  test('o acompanhante que veio de um convite vai direto ao vínculo depois de criar a conta', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/cadastro/acompanhante?convite=abc234', null);
    await usuario.type(screen.getByLabelText('Nome'), 'Beatriz Souza');
    await preencherCadastro(usuario, 'bia@exemplo.com', SENHA_BOA);

    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/acompanhante/adicionar'), ESPERA_DO_HASH);
    expect(roteador.state.location.search).toBe('?codigo=ABC234');
  }, TEMPO_DO_TESTE);
});
