import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { CATALOGO, rotinaDoPraticante } from '../../dominio';
import { exerciciosAnimados } from '../../movimento/animacoes';
import { abrirTela, estadoDeTeste, usarRelogioFixo } from './auxiliaresDeTeste';

usarRelogioFixo();

const nomesDaTrilha = (trilha: 'equilibrio60' | 'fisio') => CATALOGO.filter((e) => e.trilha === trilha).map((e) => e.nome);
const cartao = (nome: string) => screen.getByRole('article', { name: nome });

test('mostra o título e as duas abas', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  expect(screen.getByRole('heading', { level: 1, name: 'Biblioteca' })).toHaveFocus();
  expect(screen.getByRole('tablist', { name: 'Trilhas de exercícios' })).toBeInTheDocument();
  expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Equilíbrio 60+', 'Fisioterapia']);
});

test('a aba inicial é a trilha do praticante', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  expect(screen.getByRole('tab', { name: 'Equilíbrio 60+' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Fisioterapia' })).toHaveAttribute('aria-selected', 'false');
  expect(screen.getAllByRole('article')).toHaveLength(nomesDaTrilha('equilibrio60').length);
});

test('para quem treina fisioterapia, a aba inicial é a de fisioterapia', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca', { estado: estadoDeTeste('rafael') });

  // Assert
  expect(screen.getByRole('tab', { name: 'Fisioterapia' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(nomesDaTrilha('fisio').length);
});

test('o painel da aba é ligado a ela por aria-labelledby', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Equilíbrio 60+');
});

test('clicar na outra aba troca os exercícios', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');

  // Act
  await userEvent.click(screen.getByRole('tab', { name: 'Fisioterapia' }));

  // Assert
  expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Fisioterapia');
  expect(screen.getByRole('article', { name: 'Descida de degrau (step-down)' })).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Sentar e levantar' })).not.toBeInTheDocument();
});

test('só a aba selecionada entra na ordem do Tab (foco móvel)', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  expect(screen.getByRole('tab', { name: 'Equilíbrio 60+' })).toHaveAttribute('tabindex', '0');
  expect(screen.getByRole('tab', { name: 'Fisioterapia' })).toHaveAttribute('tabindex', '-1');
});

test('as setas do teclado movem o foco e a seleção entre as abas', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');
  const equilibrio = screen.getByRole('tab', { name: 'Equilíbrio 60+' });
  const fisio = screen.getByRole('tab', { name: 'Fisioterapia' });
  equilibrio.focus();

  // Act / Assert
  await userEvent.keyboard('{ArrowRight}');
  expect(fisio).toHaveFocus();
  expect(fisio).toHaveAttribute('aria-selected', 'true');

  await userEvent.keyboard('{ArrowRight}');
  expect(equilibrio).toHaveFocus();
  expect(equilibrio).toHaveAttribute('aria-selected', 'true');

  await userEvent.keyboard('{ArrowLeft}');
  expect(fisio).toHaveFocus();

  await userEvent.keyboard('{Home}');
  expect(equilibrio).toHaveFocus();

  await userEvent.keyboard('{End}');
  expect(fisio).toHaveFocus();
  expect(fisio).toHaveAttribute('aria-selected', 'true');
});

test('cada cartão traz o nome, o "para quê" e os acessórios', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  const sentar = within(cartao('Sentar e levantar'));
  expect(sentar.getByText(/Força nas pernas para levantar da cadeira/)).toBeInTheDocument();
  expect(sentar.getByText('Barras')).toBeInTheDocument();
  expect(sentar.getByText('Cadeira')).toBeInTheDocument();
});

test('mostra o nível atual da pessoa nos exercícios que estão na rotina dela', () => {
  // Arrange
  const estado = estadoDeTeste();
  const item = rotinaDoPraticante(estado, 'lucia')?.itens.find((i) => i.exercicioId === 'sentar-e-levantar');
  if (!item) throw new Error('item ausente');

  // Act
  abrirTela('/praticante/biblioteca', { estado });

  // Assert
  expect(within(cartao('Sentar e levantar')).getByText(`Seu nível atual: ${item.nivel}`)).toBeInTheDocument();
});

test('diz "Não está na sua rotina" para o que a rotina não inclui', async () => {
  // Arrange: o Rafael treina a trilha de fisioterapia
  abrirTela('/praticante/biblioteca', { estado: estadoDeTeste('rafael') });

  // Act
  await userEvent.click(screen.getByRole('tab', { name: 'Equilíbrio 60+' }));

  // Assert
  expect(within(cartao('Sentar e levantar')).getByText('Não está na sua rotina')).toBeInTheDocument();
});

test('o selo "Animação 3D" aparece só nos exercícios que têm animação', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert: em cada cartão na tela, o selo segue a lista de animações.
  const animados = exerciciosAnimados();
  const cartoes = screen.getAllByRole('article');
  expect(cartoes.length).toBeGreaterThan(0);
  for (const elemento of cartoes) {
    const exercicio = CATALOGO.find((e) => within(elemento).queryByRole('heading', { name: e.nome }));
    expect(exercicio, 'cartão sem exercício conhecido').toBeDefined();
    const selo = within(elemento).queryByText('Animação 3D');
    expect(selo !== null, exercicio?.id).toBe(animados.includes(exercicio?.id ?? ''));
  }
});

test('"Experimentar agora" abre o exercício no nível atual da pessoa', () => {
  // Arrange
  const estado = estadoDeTeste();
  const item = rotinaDoPraticante(estado, 'lucia')?.itens.find((i) => i.exercicioId === 'sentar-e-levantar');
  if (!item) throw new Error('item ausente');

  // Act
  abrirTela('/praticante/biblioteca', { estado });

  // Assert
  expect(within(cartao('Sentar e levantar')).getByRole('link', { name: /Experimentar agora/ })).toHaveAttribute(
    'href',
    `/praticante/exercicio/sentar-e-levantar?nivel=${item.nivel}`,
  );
});

test('exercício fora da rotina abre no nível 1', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca', { estado: estadoDeTeste('rafael') });

  // Act
  await userEvent.click(screen.getByRole('tab', { name: 'Equilíbrio 60+' }));

  // Assert
  expect(within(cartao('Sentar e levantar')).getByRole('link', { name: /Experimentar agora/ })).toHaveAttribute(
    'href',
    '/praticante/exercicio/sentar-e-levantar?nivel=1',
  );
});

test('o filtro de nível mostra a dose daquele nível e abre o exercício nele', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');
  const nivel2 = screen.getByRole('button', { name: 'Nível 2' });
  expect(nivel2).toHaveAttribute('aria-pressed', 'false');

  // Act
  await userEvent.click(nivel2);

  // Assert
  expect(nivel2).toHaveAttribute('aria-pressed', 'true');
  const sentar = within(cartao('Sentar e levantar'));
  expect(sentar.getByText(/Nível 2: 10 vezes/)).toBeInTheDocument();
  expect(sentar.getByRole('link', { name: /Experimentar agora/ })).toHaveAttribute('href', '/praticante/exercicio/sentar-e-levantar?nivel=2');
});

test('tocar de novo no filtro de nível o desliga', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');
  const nivel3 = screen.getByRole('button', { name: 'Nível 3' });
  await userEvent.click(nivel3);

  // Act
  await userEvent.click(nivel3);

  // Assert
  expect(nivel3).toHaveAttribute('aria-pressed', 'false');
  expect(within(cartao('Sentar e levantar')).queryByText(/Nível 3:/)).not.toBeInTheDocument();
});

test('o filtro de acessório deixa só os exercícios que usam aquele acessório', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Elástico' }));

  // Assert
  expect(screen.getByRole('button', { name: 'Elástico' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('article', { name: 'Abdução de quadril com elástico' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('1 exercício');
});

test('sem nenhum exercício para o filtro, avisa e oferece limpar os filtros', async () => {
  // Arrange
  abrirTela('/praticante/biblioteca');
  await userEvent.click(screen.getByRole('tab', { name: 'Fisioterapia' }));
  await userEvent.click(screen.getByRole('button', { name: 'Elástico' }));
  expect(screen.queryAllByRole('article')).toHaveLength(0);
  expect(screen.getByText(/Nenhum exercício/)).toBeInTheDocument();

  // Act
  await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

  // Assert
  expect(screen.getAllByRole('article')).toHaveLength(nomesDaTrilha('fisio').length);
  expect(screen.getByRole('button', { name: 'Elástico' })).toHaveAttribute('aria-pressed', 'false');
});

test('os filtros oferecem os quatro acessórios e os três níveis', () => {
  // Arrange / Act
  abrirTela('/praticante/biblioteca');

  // Assert
  const acessorios = within(screen.getByRole('group', { name: 'Filtrar por acessório' }));
  expect(acessorios.getAllByRole('button').map((b) => b.textContent?.replace('✓', '').trim())).toEqual(['Barras', 'Elástico', 'Inclinação', 'Cadeira']);
  const niveis = within(screen.getByRole('group', { name: 'Filtrar por nível' }));
  expect(niveis.getAllByRole('button')).toHaveLength(3);
});
