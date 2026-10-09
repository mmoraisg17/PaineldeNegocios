import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SENHA_DA_DEMO } from '../../dominio';
import { renderizarApp, usarAmbienteDeTeste } from '../../test/renderizarApp';
import { AVISO_SEM_CRIPTOGRAFIA } from './mensagens';

usarAmbienteDeTeste();
afterEach(() => vi.unstubAllGlobals());

const ESPERA_DO_HASH = { timeout: 10000 };
const TEMPO_DO_TESTE = 20000;

async function preencherEEntrar(email: string, senha: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText('E-mail'), email);
  await usuario.type(screen.getByLabelText('Senha'), senha);
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('FormularioDeLogin: aviso de falha', () => {
  test('sem WebCrypto, mesmo com a senha certa, explica o endereço seguro e não diz "senha incorreta"', async () => {
    const { roteador } = renderizarApp('/', null);
    vi.stubGlobal('crypto', {});

    await preencherEEntrar('lucia@demo.test', SENHA_DA_DEMO);

    const aviso = await screen.findByRole('alert', {}, ESPERA_DO_HASH);
    expect(aviso).toHaveTextContent(AVISO_SEM_CRIPTOGRAFIA);
    expect(aviso).not.toHaveTextContent('incorretos');
    expect(roteador.state.location.pathname).toBe('/');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  }, TEMPO_DO_TESTE);

  test('com WebCrypto, senha errada continua dizendo "E-mail ou senha incorretos."', async () => {
    renderizarApp('/', null);

    await preencherEEntrar('lucia@demo.test', 'senha-errada-1');

    expect(await screen.findByRole('alert', {}, ESPERA_DO_HASH)).toHaveTextContent('E-mail ou senha incorretos.');
  }, TEMPO_DO_TESTE);
});
