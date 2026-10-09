import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, type RouteObject } from 'react-router';
import { expect, test } from 'vitest';
import { type Credencial, type EstadoApp, criarEstadoDemo } from '../dominio';
import { AGORA_DA_DEMO } from '../test/renderizarApp';
import { PrimeiroUso } from './PrimeiroUso';
import { abrirTela, lerApp } from './praticante/auxiliaresDeTeste';

/* Cada passo troca os botões de lugar: sem mover o foco, quem usa teclado ou
   leitor de tela cai no topo da página (revisão da fase 5, H1). Os demais
   testes cobrem a triagem sem avaliação: o nível sai das respostas. */

const ID_NOVO = 'novo';

/* Campos de mentira, só com formato válido: a tela nunca confere a senha. */
const CREDENCIAL_NOVA: Credencial = {
  email: 'novo@exemplo.com',
  papel: 'praticante',
  pessoaId: ID_NOVO,
  sal: '00'.repeat(16),
  hash: '00'.repeat(32),
  iteracoes: 1,
  criadaEm: AGORA_DA_DEMO.toISOString(),
};

function estadoDoRecemCadastrado(): EstadoApp {
  return {
    ...criarEstadoDemo(AGORA_DA_DEMO),
    credenciais: [...criarEstadoDemo(AGORA_DA_DEMO).credenciais, CREDENCIAL_NOVA],
    contaAtual: { papel: 'praticante', id: ID_NOVO, manterConectado: false },
  };
}

function Marcador() {
  const { pathname, search } = useLocation();
  return <p data-testid="destino">{`${pathname}${search}`}</p>;
}

const ROTAS: RouteObject[] = [
  { path: '/primeiro-uso', element: <PrimeiroUso /> },
  { path: '/praticante/hoje', element: <Marcador /> },
  { path: '/', element: <Marcador /> },
];

function abrir(estado: EstadoApp = estadoDoRecemCadastrado()) {
  const usuario = userEvent.setup();
  const roteador = abrirTela('/primeiro-uso', { estado, rotas: ROTAS });
  return { usuario, roteador };
}

const ESPERA = { timeout: 3000 };

async function ate(usuario: ReturnType<typeof userEvent.setup>, passo: 'conectar' | 'calibrar' | 'resultado') {
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  if (passo === 'conectar') return;
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  await usuario.click(await screen.findByRole('button', { name: 'Continuar' }, ESPERA));
  if (passo === 'calibrar') return;
  await usuario.click(screen.getByRole('button', { name: 'Estou em cima da plataforma' }));
  await usuario.click(screen.getByRole('button', { name: 'Pular (demonstração)' }));
  await usuario.click(await screen.findByRole('button', { name: 'Continuar' }));
}

test('ao avançar de passo, o foco vai para o título do novo passo', async () => {
  const { usuario } = abrir();
  await ate(usuario, 'conectar');
  expect(screen.getByRole('heading', { level: 2, name: 'Conectar a plataforma' })).toHaveFocus();
});

test('ao conectar, o foco vai para o aviso de conectada; só a linha de status é anunciada', async () => {
  const { usuario } = abrir();
  await ate(usuario, 'conectar');
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  const status = await screen.findByText(/Conectada/, {}, ESPERA);
  // O foco vem num efeito depois do texto: sob carga, chega um instante depois.
  await waitFor(() => expect(status).toHaveFocus());
  expect(status).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByRole('heading', { level: 2, name: 'Conectar a plataforma' }).closest('[aria-live]')).toBeNull();
});

test('a contagem não é anunciada a cada segundo; o fim é anunciado e recebe o foco', async () => {
  const { usuario } = abrir();
  await ate(usuario, 'conectar');
  await usuario.click(screen.getByRole('button', { name: 'Conectar plataforma' }));
  await usuario.click(await screen.findByRole('button', { name: 'Continuar' }, ESPERA));
  await usuario.click(screen.getByRole('button', { name: 'Estou em cima da plataforma' }));

  expect(screen.getByRole('timer')).not.toHaveAttribute('aria-live');
  await usuario.click(screen.getByRole('button', { name: 'Pular (demonstração)' }));
  await waitFor(() => expect(screen.getByRole('timer')).toHaveFocus());
  expect(screen.getByRole('status')).toHaveTextContent('Pronto! Seu peso foi registrado.');
});

test('começa em "Passo 1 de 4"', () => {
  abrir();
  expect(screen.getByText('Passo 1 de 4')).toBeInTheDocument();
});

test('o perfil não pergunta o que a pessoa tem em casa nem fala em avaliação', async () => {
  const { usuario } = abrir();
  expect(screen.queryByText(/em casa/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/cadeira|elástico/i)).not.toBeInTheDocument();
  expect(screen.getByText('1. Seu objetivo')).toBeInTheDocument();
  expect(screen.getByText('2. Sua firmeza hoje')).toBeInTheDocument();

  await ate(usuario, 'resultado');
  expect(screen.queryByText(/avalia/i)).not.toBeInTheDocument();
});

test('depois da calibração vem direto o resultado, no passo 4 de 4', async () => {
  const { usuario } = abrir();
  await ate(usuario, 'resultado');
  expect(screen.getByRole('heading', { level: 2, name: 'Seu nível inicial' })).toHaveFocus();
  expect(screen.getByText('Passo 4 de 4')).toBeInTheDocument();
});

test('"Tenho firmeza" sugere o nível 2 e não oferece o nível 3', async () => {
  const { usuario } = abrir();
  await usuario.click(screen.getByRole('button', { name: 'Tenho firmeza' }));
  await ate(usuario, 'resultado');

  expect(screen.getByText(/sugerimos começar no/)).toHaveTextContent('nível 2');
  expect(screen.getByRole('button', { name: 'Nível 2' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Nível 1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Nível 3' })).not.toBeInTheDocument();
  expect(screen.getByText(/O app sobe o nível quando os seus treinos forem bem\./)).toBeInTheDocument();
});

test('"Preciso de apoio" sugere o nível 1 e só oferece ele', async () => {
  const { usuario } = abrir();
  await usuario.click(screen.getByRole('button', { name: 'Preciso de apoio' }));
  await ate(usuario, 'resultado');

  expect(screen.getByText(/sugerimos começar no/)).toHaveTextContent('nível 1');
  expect(screen.getByRole('button', { name: 'Nível 1' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('button', { name: 'Nível 2' })).not.toBeInTheDocument();
});

test('fluxo completo: cria o praticante com o id da conta, o nome digitado e o nível escolhido', async () => {
  const { usuario } = abrir();
  await usuario.type(screen.getByLabelText('Como quer ser chamado?'), '  Dona Maria ');
  await usuario.click(screen.getByRole('button', { name: 'Tenho firmeza' }));
  await ate(usuario, 'resultado');
  await usuario.click(screen.getByRole('button', { name: 'Nível 1' }));
  await usuario.click(screen.getByRole('button', { name: 'Ver meu treino de hoje' }));

  await waitFor(() => expect(screen.getByTestId('destino')).toHaveTextContent('/praticante/hoje'));
  const { estado } = lerApp();
  const criado = estado.praticantes[ID_NOVO];
  expect(criado).toBeDefined();
  expect(criado?.perfil).toEqual({ nome: 'Dona Maria', objetivo: 'equilibrio', firmeza: 'firme', inclinacaoMaxima: 3 });
  expect(Object.values(criado?.niveis ?? {}).every((nivel) => nivel === 1)).toBe(true);
  expect(estado.contaAtual).toEqual({ papel: 'praticante', id: ID_NOVO, manterConectado: false });
});

test('toque duplo em "Ver meu treino de hoje" não cria o praticante duas vezes', async () => {
  const { usuario } = abrir();
  await ate(usuario, 'resultado');
  const botao = screen.getByRole('button', { name: 'Ver meu treino de hoje' });
  await usuario.dblClick(botao);

  await waitFor(() => expect(screen.getByTestId('destino')).toHaveTextContent('/praticante/hoje'));
  const ids = Object.keys(lerApp().estado.praticantes).filter((id) => id === ID_NOVO);
  expect(ids).toEqual([ID_NOVO]);
});

test('sem conta, volta para a tela inicial com o papel de praticante', async () => {
  abrir({ ...criarEstadoDemo(AGORA_DA_DEMO), contaAtual: null });
  expect(await screen.findByTestId('destino')).toHaveTextContent('/?papel=praticante');
});

test('praticante que já tem dados vai direto para o treino de hoje', async () => {
  abrir({ ...criarEstadoDemo(AGORA_DA_DEMO), contaAtual: { papel: 'praticante', id: 'lucia' } });
  expect(await screen.findByTestId('destino')).toHaveTextContent('/praticante/hoje');
});

test('acompanhante logado não fica na triagem do praticante', async () => {
  abrir({ ...criarEstadoDemo(AGORA_DA_DEMO), contaAtual: { papel: 'acompanhante', id: 'rafael' } });
  expect(await screen.findByTestId('destino')).toHaveTextContent('/?papel=praticante');
});

test('"Sair" zera a conta e volta para a tela inicial; a credencial continua', async () => {
  const { usuario } = abrir();
  await usuario.click(screen.getByRole('button', { name: /Sair/ }));

  expect(await screen.findByTestId('destino')).toHaveTextContent('/?papel=praticante');
  const { estado } = lerApp();
  expect(estado.contaAtual).toBeNull();
  expect(estado.credenciais.some((c) => c.pessoaId === ID_NOVO)).toBe(true);
  expect(estado.praticantes[ID_NOVO]).toBeUndefined();
});
