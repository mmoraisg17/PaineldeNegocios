import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SENHA_DA_DEMO } from '../dominio';
import { renderizarApp, usarAmbienteDeTeste } from '../test/renderizarApp';

usarAmbienteDeTeste();
beforeEach(() => sessionStorage.clear());

const ESPERA_DO_HASH = { timeout: 10000 };
const TEMPO_DO_TESTE = 20000;

describe('formulário de login', () => {
  test('os campos têm os atributos certos para o teclado e o gerenciador de senhas', () => {
    renderizarApp('/', null);

    const email = screen.getByLabelText('E-mail');
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(email).toHaveAttribute('inputmode', 'email');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
  });

  test('"Manter conectado" começa desmarcado e avisa para marcar só no próprio aparelho', () => {
    renderizarApp('/', null);

    const caixa = screen.getByRole('checkbox', { name: 'Manter conectado' });
    expect(caixa).not.toBeChecked();
    expect(caixa).toHaveAccessibleDescription('Só marque no seu próprio aparelho');
  });

  test('o olho mostra a senha digitada', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/', null);
    await usuario.type(screen.getByLabelText('Senha'), 'minha-senha');

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Senha')).toHaveValue('minha-senha');
  });

  test('campos vazios pedem o preenchimento e levam o foco ao primeiro vazio, sem conferir a senha', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/', null);

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Digite o e-mail e a senha.');
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  test('enquanto confere a senha, o botão fica desabilitado e mostra "Entrando…"', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);
    await usuario.type(screen.getByLabelText('E-mail'), 'lucia@demo.test');
    await usuario.type(screen.getByLabelText('Senha'), SENHA_DA_DEMO);

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    const botao = screen.getByRole('button', { name: 'Entrando…' });
    expect(botao).toBeDisabled();
    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/praticante/hoje'), ESPERA_DO_HASH);
  }, TEMPO_DO_TESTE);

  test('depois de um erro, o botão volta a funcionar e o aviso some ao tentar de novo com a senha certa', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);
    await usuario.type(screen.getByLabelText('E-mail'), 'lucia@demo.test');
    await usuario.type(screen.getByLabelText('Senha'), 'errada-errada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert', {}, ESPERA_DO_HASH);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();

    await usuario.clear(screen.getByLabelText('Senha'));
    await usuario.type(screen.getByLabelText('Senha'), SENHA_DA_DEMO);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/praticante/hoje'), ESPERA_DO_HASH);
  }, TEMPO_DO_TESTE);

  test('o e-mail digitado com maiúsculas e espaços nas pontas ainda entra', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);
    await usuario.type(screen.getByLabelText('E-mail'), '  Lucia@Demo.TEST ');
    await usuario.type(screen.getByLabelText('Senha'), SENHA_DA_DEMO);

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/praticante/hoje'), ESPERA_DO_HASH);
  }, TEMPO_DO_TESTE);

  test('trocar de aba limpa o que foi digitado no formulário', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/', null);
    await usuario.type(screen.getByLabelText('E-mail'), 'lucia@demo.test');

    await usuario.click(screen.getByRole('tab', { name: 'Acompanhante' }));

    expect(screen.getByLabelText('E-mail')).toHaveValue('');
  });
});

describe('criar conta', () => {
  test('o link "Criar conta" do praticante vai para o cadastro de praticante', () => {
    renderizarApp('/', null);

    expect(screen.getByText('Ainda não tem conta?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro/praticante');
  });

  test('o link "Criar conta" do acompanhante leva o código do convite', () => {
    renderizarApp('/?papel=acompanhante&convite=abc234', null);

    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/cadastro/acompanhante?convite=ABC234',
    );
  });

  test('o link "Criar conta" do praticante não leva convite', () => {
    renderizarApp('/?papel=praticante&convite=ABC234', null);

    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro/praticante');
  });
});

describe('contas de demonstração', () => {
  test('mostram só as contas do papel da aba', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/?papel=acompanhante', null);

    await usuario.click(screen.getByText('Contas de demonstração'));

    expect(screen.getByRole('button', { name: /Usar conta de .*Carlos/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dona Lúcia/ })).not.toBeInTheDocument();
  });
});

describe('aviso do convite', () => {
  test('um convite vazio depois de normalizado é ignorado', () => {
    renderizarApp('/?convite=%20%20', null);

    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText(/Você recebeu um convite/)).not.toBeInTheDocument();
  });

  test('o aviso mostra o código normalizado', () => {
    renderizarApp('/?papel=acompanhante&convite=abc-234', null);

    expect(screen.getByText(/código ABC234/)).toBeInTheDocument();
  });
});

describe('mascote na tela de entrada', () => {
  test('mostra o mascote com texto alternativo e sem pessoa na plataforma', () => {
    renderizarApp('/', null);

    const mascote = screen.getByRole('img', { name: 'Mascote do app: um kettlebell sorridente' });
    expect(mascote.tagName.toLowerCase()).toBe('svg');
    expect(mascote).toHaveAttribute('data-pose', 'acenar');
    expect(screen.queryByRole('img', { name: /Pessoa em pé na plataforma/ })).not.toBeInTheDocument();
  });
});
