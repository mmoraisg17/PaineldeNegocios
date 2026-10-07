import type { ReactNode } from 'react';
import { Navigate, Outlet, createHashRouter, type RouteObject } from 'react-router';
import { MolduraCelular } from './components/MolduraCelular';
import { ABAS_PRATICANTE, BarraDeAbas } from './components/BarraDeAbas';
import { Inicio } from './telas/Inicio';
import { NaoEncontrada } from './telas/NaoEncontrada';
import { Exercicio } from './telas/Exercicio';
import { Aluno, Alunos, Biblioteca, Hoje, Perfil, Progresso } from './telas/marcadores';

function LayoutRaiz() {
  return (
    <MolduraCelular>
      <Outlet />
    </MolduraCelular>
  );
}

/* O exercício ocupa a tela toda (sem barra de abas) para a animação 3D e o
   mapa de pressão terem espaço; por isso ele fica fora deste layout. */
function LayoutPraticante() {
  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <BarraDeAbas abas={ABAS_PRATICANTE} />
    </>
  );
}

/* Telas sem barra de abas também precisam do marco <main>: é por ele que o
   leitor de tela oferece "ir para o conteúdo principal". */
function TelaCheia({ children }: { children: ReactNode }) {
  return <main className="flex min-h-0 flex-1 flex-col">{children}</main>;
}

export const rotas: RouteObject[] = [
  {
    path: '/',
    element: <LayoutRaiz />,
    errorElement: (
      <MolduraCelular>
        <NaoEncontrada />
      </MolduraCelular>
    ),
    children: [
      { index: true, element: <Inicio /> },
      {
        path: 'praticante',
        element: <LayoutPraticante />,
        children: [
          { index: true, element: <Navigate to="hoje" replace /> },
          { path: 'hoje', element: <Hoje /> },
          { path: 'biblioteca', element: <Biblioteca /> },
          { path: 'progresso', element: <Progresso /> },
          { path: 'perfil', element: <Perfil /> },
        ],
      },
      { path: 'praticante/exercicio/:id', element: <TelaCheia><Exercicio /></TelaCheia> },
      {
        path: 'acompanhante',
        element: <TelaCheia><Outlet /></TelaCheia>,
        children: [
          { index: true, element: <Navigate to="alunos" replace /> },
          { path: 'alunos', element: <Alunos /> },
          { path: 'aluno/:id', element: <Aluno /> },
        ],
      },
    ],
  },
];

/* Rotas por hash (#/praticante/hoje): o GitHub Pages não reescreve caminhos
   para o index.html, então com rotas "limpas" recarregar uma tela interna daria
   404. Com hash, o servidor só vê o index.html. */
export const criarRoteador = () => createHashRouter(rotas);
