import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { APP_NAME } from './config/app';
import { SENHA_DA_DEMO, criarCredencial } from './dominio';
import { renderizarApp, usarAmbienteDeTeste } from './test/renderizarApp';

// O jsdom não tem WebGL nem ResizeObserver: a cena 3D é testada pelo motor
// (src/movimento) e verificada no navegador; aqui ela vira um marcador.
vi.mock('./cena3d/VisualizadorExercicio', () => ({ default: () => <p>animação 3D</p> }));

usarAmbienteDeTeste();
beforeEach(() => sessionStorage.clear());

// O hash PBKDF2 (600 mil iterações) leva ~0,4 s: login e cadastro pedem folga.
const ESPERA_DO_HASH = { timeout: 10000 };
const TEMPO_DO_TESTE = 20000;

type Usuario = ReturnType<typeof userEvent.setup>;

async function preencherEEntrar(usuario: Usuario, email: string, senha: string) {
  await usuario.type(screen.getByLabelText('E-mail'), email);
  await usuario.type(screen.getByLabelText('Senha'), senha);
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('início', () => {
  test('mostra o nome do app, o slogan e as duas abas, com Praticante ativa', () => {
    renderizarApp('/', null);

    expect(screen.getByRole('heading', { level: 1, name: APP_NAME })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Praticante' })).toBeInTheDocument();
  });

  test('avisa que é para usar dados fictícios e que o protótipo é educacional', () => {
    renderizarApp('/', null);

    expect(screen.getByText(/use dados fictícios/i)).toBeInTheDocument();
    expect(screen.getByText(/protótipo educacional/i)).toBeInTheDocument();
  });

  test('clicar em Acompanhante troca a aba e grava o papel no endereço', async () => {
    const { roteador } = renderizarApp('/', null);

    await userEvent.click(screen.getByRole('tab', { name: 'Acompanhante' }));

    expect(screen.getByRole('tabpanel', { name: 'Acompanhante' })).toBeInTheDocument();
    expect(screen.getByText('Personal, fisioterapeuta ou familiar')).toBeInTheDocument();
    expect(roteador.state.location.search).toBe('?papel=acompanhante');
  });

  test('trocar de aba não empilha endereços no histórico (usa replace)', async () => {
    const { roteador } = renderizarApp('/', null);

    await userEvent.click(screen.getByRole('tab', { name: 'Acompanhante' }));

    expect(roteador.state.historyAction).toBe('REPLACE');
  });

  test('a seta para a direita troca de aba', async () => {
    renderizarApp('/', null);
    screen.getByRole('tab', { name: 'Praticante' }).focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveFocus();
  });

  test('?papel=acompanhante abre a aba do acompanhante', () => {
    renderizarApp('/?papel=acompanhante', null);

    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
  });

  test('um papel desconhecido no endereço cai na aba do praticante', () => {
    renderizarApp('/?papel=administrador', null);

    expect(screen.getByRole('tab', { name: 'Praticante' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('login', () => {
  test('a Dona Lúcia entra com e-mail e senha e abre a aba Hoje', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);

    await preencherEEntrar(usuario, 'lucia@demo.test', SENHA_DA_DEMO);

    expect(await screen.findByRole('link', { name: /Hoje/ }, ESPERA_DO_HASH)).toHaveAttribute('aria-current', 'page');
    expect(roteador.state.location.pathname).toBe('/praticante/hoje');
  }, TEMPO_DO_TESTE);

  test('o Carlos entra pela aba Acompanhante e vai para a lista de alunos, sem a barra do praticante', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/?papel=acompanhante', null);

    await preencherEEntrar(usuario, 'carlos@demo.test', SENHA_DA_DEMO);

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/acompanhante/alunos'), ESPERA_DO_HASH);
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
  }, TEMPO_DO_TESTE);

  test('senha errada mostra um aviso genérico e continua no início', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);

    await preencherEEntrar(usuario, 'lucia@demo.test', 'senha-errada-1');

    expect(await screen.findByRole('alert', {}, ESPERA_DO_HASH)).toHaveTextContent('E-mail ou senha incorretos.');
    expect(roteador.state.location.pathname).toBe('/');
  }, TEMPO_DO_TESTE);

  test('a conta do outro papel não entra pela aba errada', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/', null);

    await preencherEEntrar(usuario, 'carlos@demo.test', SENHA_DA_DEMO);

    expect(await screen.findByRole('alert', {}, ESPERA_DO_HASH)).toHaveTextContent('E-mail ou senha incorretos.');
    expect(roteador.state.location.pathname).toBe('/');
  }, TEMPO_DO_TESTE);

  test('"Manter conectado" desmarcado grava manterConectado como falso', async () => {
    const usuario = userEvent.setup();
    const { estado } = renderizarApp('/', null);

    await preencherEEntrar(usuario, 'lucia@demo.test', SENHA_DA_DEMO);

    await vi.waitFor(() => expect(estado().contaAtual?.id).toBeDefined(), ESPERA_DO_HASH);
    expect(estado().contaAtual?.manterConectado).toBe(false);
  }, TEMPO_DO_TESTE);

  test('"Manter conectado" marcado grava manterConectado como verdadeiro', async () => {
    const usuario = userEvent.setup();
    const { estado } = renderizarApp('/', null);
    await usuario.click(screen.getByRole('checkbox', { name: 'Manter conectado' }));

    await preencherEEntrar(usuario, 'lucia@demo.test', SENHA_DA_DEMO);

    await vi.waitFor(() => expect(estado().contaAtual?.id).toBeDefined(), ESPERA_DO_HASH);
    expect(estado().contaAtual?.manterConectado).toBe(true);
  }, TEMPO_DO_TESTE);

  test('o botão "Usar" das contas de demonstração preenche e-mail e senha', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/', null);

    await usuario.click(screen.getByText('Contas de demonstração'));
    await usuario.click(screen.getByRole('button', { name: /Usar conta de Dona Lúcia/ }));

    expect(screen.getByLabelText('E-mail')).toHaveValue('lucia@demo.test');
    expect(screen.getByLabelText('Senha')).toHaveValue(SENHA_DA_DEMO);
  });

  test('as contas de demonstração mostram a senha pública escrita na tela', async () => {
    const usuario = userEvent.setup();
    renderizarApp('/', null);

    await usuario.click(screen.getByText('Contas de demonstração'));

    expect(screen.getByText(new RegExp(SENHA_DA_DEMO))).toBeInTheDocument();
    expect(screen.getByText(/Dona Lúcia · lucia@demo\.test/)).toBeInTheDocument();
  });
});

describe('convite', () => {
  test('/convite/ABC234 sem conta leva ao início na aba Acompanhante, com o aviso do convite', () => {
    const { roteador } = renderizarApp('/convite/ABC234', null);

    expect(roteador.state.location.pathname).toBe('/');
    expect(roteador.state.location.search).toBe('?papel=acompanhante&convite=ABC234');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Você recebeu um convite de acompanhamento \(código ABC234\)/)).toBeInTheDocument();
  });

  test('depois de entrar, o Carlos vai direto para a tela de adicionar com o código do convite', async () => {
    const usuario = userEvent.setup();
    const { roteador } = renderizarApp('/convite/ABC234', null);

    await preencherEEntrar(usuario, 'carlos@demo.test', SENHA_DA_DEMO);

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/acompanhante/adicionar'), ESPERA_DO_HASH);
    expect(roteador.state.location.search).toBe('?codigo=ABC234');
  }, TEMPO_DO_TESTE);

  test('acompanhante já conectado abrindo o link com espaços e minúsculas vai direto ao vínculo', () => {
    const { roteador } = renderizarApp('/convite/abc 234', { papel: 'acompanhante', id: 'carlos' });

    expect(roteador.state.location.pathname).toBe('/acompanhante/adicionar');
    expect(roteador.state.location.search).toBe('?codigo=ABC234');
  });

  test('um convite sem nenhum caractere válido volta ao início sem aviso', () => {
    const { roteador } = renderizarApp('/convite/---', null);

    expect(roteador.state.location.pathname).toBe('/');
    expect(roteador.state.location.search).toBe('');
  });

  test('o convite não aceita endereço de redirecionamento vindo da URL', () => {
    const { roteador } = renderizarApp('/convite/ABC234?destino=https://exemplo.com', null);

    expect(roteador.state.location.pathname).toBe('/');
    expect(roteador.state.location.search).toBe('?papel=acompanhante&convite=ABC234');
  });

  test('praticante conectado abrindo o convite vê a aba Acompanhante para trocar de conta', () => {
    const { roteador } = renderizarApp('/?convite=ABC234', { papel: 'praticante', id: 'lucia' });

    expect(roteador.state.location.pathname).toBe('/');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('conta já conectada', () => {
  test('praticante conectado abrindo o início vai direto para o Hoje', () => {
    const { roteador } = renderizarApp('/', { papel: 'praticante', id: 'lucia' });

    expect(roteador.state.location.pathname).toBe('/praticante/hoje');
  });

  test('acompanhante conectado abrindo o início vai direto para a lista de alunos', () => {
    const { roteador } = renderizarApp('/', { papel: 'acompanhante', id: 'carlos' });

    expect(roteador.state.location.pathname).toBe('/acompanhante/alunos');
  });

  test('uma conta que não existe mais no estado não é redirecionada e o login aparece', () => {
    const { roteador } = renderizarApp('/', { papel: 'acompanhante', id: 'fantasma' });

    expect(roteador.state.location.pathname).toBe('/');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});

describe('compatibilidade com endereços antigos', () => {
  test('/entrar/acompanhante vira /?papel=acompanhante', () => {
    const { roteador } = renderizarApp('/entrar/acompanhante', null);

    expect(roteador.state.location.pathname).toBe('/');
    expect(roteador.state.location.search).toBe('?papel=acompanhante');
    expect(screen.getByRole('tab', { name: 'Acompanhante' })).toHaveAttribute('aria-selected', 'true');
  });

  test('/entrar/praticante vira /?papel=praticante', () => {
    const { roteador } = renderizarApp('/entrar/praticante', null);

    expect(roteador.state.location.search).toBe('?papel=praticante');
  });

  test('/entrar com papel inválido volta ao início limpo', () => {
    const { roteador } = renderizarApp('/entrar/administrador', null);

    expect(roteador.state.location.pathname).toBe('/');
    expect(roteador.state.location.search).toBe('');
  });
});

describe('guardas de acesso', () => {
  test('sem conta, as telas internas voltam ao início', () => {
    const { roteador } = renderizarApp('/acompanhante/alunos', null);

    expect(roteador.state.location.pathname).toBe('/');
  });

  test('praticante não abre telas do acompanhante e cai na sua própria tela inicial', () => {
    const { roteador } = renderizarApp('/acompanhante/aluno/lucia', { papel: 'praticante', id: 'lucia' });

    expect(roteador.state.location.pathname).toBe('/praticante/hoje');
  });

  test('acompanhante não abre telas do praticante', () => {
    const { roteador } = renderizarApp('/praticante/hoje', { papel: 'acompanhante', id: 'carlos' });

    expect(roteador.state.location.pathname).not.toBe('/praticante/hoje');
  });

  test('praticante recém-cadastrado, sem triagem feita, é levado ao primeiro uso', async () => {
    const credencial = await criarCredencial(
      { email: 'novo@exemplo.com', papel: 'praticante', pessoaId: 'novo-1', senha: 'uma-senha-boa' },
      new Date(),
      { iteracoes: 1000 },
    );

    const { roteador } = renderizarApp('/praticante/hoje', { papel: 'praticante', id: 'novo-1' }, (estado) => ({
      ...estado,
      credenciais: [...estado.credenciais, credencial],
    }));

    expect(roteador.state.location.pathname).toBe('/primeiro-uso');
  });

  test('praticante sem dados e sem credencial volta ao início', () => {
    const { roteador } = renderizarApp('/praticante/hoje', { papel: 'praticante', id: 'sumiu' });

    expect(roteador.state.location.pathname).toBe('/');
  });

  test('a tela de exercício abre sem a barra de abas e carrega a animação', async () => {
    renderizarApp('/praticante/exercicio/sentar-e-levantar', { papel: 'praticante', id: 'lucia' });

    expect(screen.getByRole('heading', { level: 1, name: 'Sentar e levantar' })).toBeInTheDocument();
    expect(await screen.findByText('animação 3D')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
  });
});

describe('cadastro', () => {
  test('cadastrar-se como praticante leva ao primeiro uso, com a credencial guardada', async () => {
    const usuario = userEvent.setup();
    const { roteador, estado } = renderizarApp('/cadastro/praticante', null);

    await usuario.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await usuario.type(screen.getByLabelText('Senha'), 'uma-senha-boa');
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }));

    await vi.waitFor(() => expect(roteador.state.location.pathname).toBe('/primeiro-uso'), ESPERA_DO_HASH);
    await vi.waitFor(() =>
      expect(estado().credenciais.some((c) => c.email === 'maria@exemplo.com' && c.papel === 'praticante')).toBe(true),
    );
  }, TEMPO_DO_TESTE);
});

describe('endereços inexistentes', () => {
  test('um endereço inexistente mostra erro amigável com volta ao início', () => {
    renderizarApp('/nao-existe', null);

    expect(screen.getByRole('heading', { name: 'Tela não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });
});

describe('mascote na barra de abas', () => {
  test.each(['hoje', 'biblioteca', 'progresso', 'perfil'])('aparece na aba %s do praticante', (aba) => {
    renderizarApp('/praticante/' + aba, { papel: 'praticante', id: 'lucia' });

    expect(screen.getByRole('button', { name: /^Mascote, / })).toBeInTheDocument();
  });

  test('não aparece na entrada, no cadastro, no exercício nem para o acompanhante', () => {
    const casos: Array<[string, { papel: 'praticante' | 'acompanhante'; id: string } | null]> = [
      ['/', null],
      ['/cadastro/praticante', null],
      ['/praticante/exercicio/sentar-e-levantar', { papel: 'praticante', id: 'lucia' }],
      ['/acompanhante/alunos', { papel: 'acompanhante', id: 'carlos' }],
    ];
    for (const [caminho, conta] of casos) {
      renderizarApp(caminho, conta);
      expect(screen.queryByRole('button', { name: /^Mascote, / })).not.toBeInTheDocument();
      cleanup();
    }
  });

  test('fica no centro da barra, entre Biblioteca e Progresso', () => {
    renderizarApp('/praticante/hoje', { papel: 'praticante', id: 'lucia' });

    const barra = screen.getByRole('navigation', { name: 'Navegação principal' });
    const itens = within(barra).getAllByRole('listitem');
    expect(itens).toHaveLength(5);
    expect(itens[1]).toHaveTextContent('Biblioteca');
    expect(within(itens[2] as HTMLElement).getByRole('button', { name: /^Mascote, / })).toBeInTheDocument();
    expect(itens[3]).toHaveTextContent('Progresso');
  });

  test('fica parado: não existe faixa de passeio', () => {
    renderizarApp('/praticante/hoje', { papel: 'praticante', id: 'lucia' });

    expect(document.querySelector('.faixa-mascote, .faixa-trilha, .faixa-passeio')).toBeNull();
    expect(screen.getByRole('button', { name: /^Mascote, / }).querySelector('svg')).toHaveAttribute('data-pose', 'parado');
  });

  test('a demonstração da Lúcia (treinos em dia) mostra um mascote forte ou campeão', () => {
    renderizarApp('/praticante/hoje', { papel: 'praticante', id: 'lucia' });

    expect(screen.getByRole('button', { name: /^Mascote, (forte|campeão)/ })).toBeInTheDocument();
  });
});
