import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter, useLocation, type RouteObject } from 'react-router';
import { afterEach, beforeEach, vi } from 'vitest';
import { criarEstadoDemo, type EstadoApp } from '../../dominio';
import { ProvedorDoApp, useApp } from '../../estado/ContextoApp';
import { Biblioteca } from './Biblioteca';
import { Concluido } from './Concluido';
import { Hoje } from './Hoje';
import { Progresso } from './Progresso';

/* Apoio dos testes das quatro telas do praticante (nada aqui vai para o
   build: só os arquivos .test.tsx importam este módulo). */

export const AGORA_DE_TESTE = new Date('2026-10-07T12:00:00Z');

/* As telas leem `new Date()`; congelar só o Date (e não os temporizadores)
   deixa a semana da demonstração estável sem atrapalhar o userEvent. Deve ser
   chamado no topo do arquivo de teste. */
export function usarRelogioFixo(): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA_DE_TESTE);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });
}

export function estadoDeTeste(id = 'lucia'): EstadoApp {
  return { ...criarEstadoDemo(AGORA_DE_TESTE), contaAtual: { papel: 'praticante', id } };
}

/* Marcador da tela do exercício: mostra para onde a navegação foi, sem
   carregar a cena 3D. */
function DestinoFalso() {
  const { pathname, search } = useLocation();
  return <p data-testid="destino">{`${pathname}${search}`}</p>;
}

const ROTAS_MINIMAS: RouteObject[] = [
  { path: '/praticante/hoje', element: <Hoje /> },
  { path: '/praticante/biblioteca', element: <Biblioteca /> },
  { path: '/praticante/progresso', element: <Progresso /> },
  { path: '/praticante/concluido', element: <Concluido /> },
  { path: '/praticante/exercicio/:id', element: <DestinoFalso /> },
];

type ValorDoApp = ReturnType<typeof useApp>;
let ultimoValor: ValorDoApp | null = null;

function CapturaDoApp() {
  ultimoValor = useApp();
  return null;
}

/* O contexto do app como está agora: para conferir o que a tela gravou. */
export function lerApp(): ValorDoApp {
  if (!ultimoValor) throw new Error('Nenhuma tela foi renderizada ainda');
  return ultimoValor;
}

export function abrirTela(caminho: string, opcoes: { estado?: EstadoApp; rotas?: RouteObject[] } = {}) {
  const roteador = createMemoryRouter(opcoes.rotas ?? ROTAS_MINIMAS, { initialEntries: [caminho] });
  render(
    <ProvedorDoApp estadoInicial={opcoes.estado ?? estadoDeTeste()}>
      <CapturaDoApp />
      <RouterProvider router={roteador} />
    </ProvedorDoApp>,
  );
  return roteador;
}
