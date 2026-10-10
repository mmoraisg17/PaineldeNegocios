import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, vi } from 'vitest';
import { type ContaAtual, type EstadoApp, criarEstadoDemo } from '../dominio';
import { ProvedorDoApp, useApp } from '../estado/ContextoApp';
import { rotas } from '../rotas';

/* Instante fixo da demonstração: o histórico das contas (3 treinos por semana,
   por 6 semanas) termina aqui. Os testes das telas congelam o relógio nele
   para "esta semana" não depender do dia em que a suíte roda. */
export const AGORA_DA_DEMO = new Date('2026-10-07T12:00:00Z');

type ValorDoApp = ReturnType<typeof useApp>;

/* Os testes olham o que a tela mostra, mas também precisam conferir o que ficou
   gravado no estado (ex.: "salvar ajuste altera a rotina"). Este componente,
   sem visual, guarda o valor mais recente do contexto para a leitura. */
function Espiao({ guardar }: { guardar: (valor: ValorDoApp) => void }) {
  const valor = useApp();
  useEffect(() => {
    guardar(valor);
  });
  return null;
}

/* Abre o app inteiro (rotas reais) num roteador em memória, já logado na conta
   pedida e com o estado da demonstração. `preparar` deixa o teste montar um
   cenário (ex.: um convite já gerado) antes da primeira renderização. */
export function renderizarApp(
  caminho: string,
  conta: ContaAtual | null,
  preparar: (estado: EstadoApp) => EstadoApp = (estado) => estado,
) {
  let atual: ValorDoApp | undefined;
  const estadoInicial = preparar({ ...criarEstadoDemo(AGORA_DA_DEMO), contaAtual: conta });
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] });

  render(
    <ProvedorDoApp estadoInicial={estadoInicial}>
      <Espiao
        guardar={(valor) => {
          atual = valor;
        }}
      />
      <RouterProvider router={roteador} />
    </ProvedorDoApp>,
  );

  const app = (): ValorDoApp => {
    if (!atual) throw new Error('O contexto do app ainda não foi lido');
    return atual;
  };
  return { roteador, estado: () => app().estado, preferencias: () => app().preferencias };
}

/* Cada teste começa do zero: sem preferências ou estado salvos no aparelho
   (o provedor grava no localStorage) e com o relógio parado em AGORA_DA_DEMO.
   Só o Date é congelado: os temporizadores reais continuam, para o userEvent e
   o findBy não travarem. */
export function usarAmbienteDeTeste() {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = '';
    document.documentElement.classList.remove('alto-contraste');
    document.documentElement.removeAttribute('data-aparencia');
    document.documentElement.removeAttribute('data-mascote');
    document.documentElement.style.colorScheme = '';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA_DA_DEMO);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}
