import type { ReactNode } from 'react';
import { Navigate, Outlet, createHashRouter, type RouteObject } from 'react-router';
import { MolduraCelular } from './components/MolduraCelular';
import { ABAS_PRATICANTE, BarraDeAbas } from './components/BarraDeAbas';
import type { PapelDaConta } from './dominio';
import { useApp } from './estado/ContextoApp';
import { EscolherConta } from './telas/EscolherConta';
import { Exercicio } from './telas/Exercicio';
import { Inicio } from './telas/Inicio';
import { NaoEncontrada } from './telas/NaoEncontrada';
import { PrimeiroUso } from './telas/PrimeiroUso';
import { AdicionarAluno } from './telas/acompanhante/AdicionarAluno';
import { Aluno } from './telas/acompanhante/Aluno';
import { Alunos } from './telas/acompanhante/Alunos';
import { Biblioteca } from './telas/praticante/Biblioteca';
import { Concluido } from './telas/praticante/Concluido';
import { Hoje } from './telas/praticante/Hoje';
import { Perfil } from './telas/praticante/Perfil';
import { Progresso } from './telas/praticante/Progresso';

function LayoutRaiz() {
  return (
    <MolduraCelular>
      <Outlet />
    </MolduraCelular>
  );
}

/* Só entra quem está logado com o papel certo; os outros voltam ao início.
   Evita, por exemplo, abrir #/acompanhante/alunos sem ter escolhido conta. */
function ExigeConta({ papel, children }: { papel: PapelDaConta; children: ReactNode }) {
  const { estado } = useApp();
  return estado.contaAtual?.papel === papel ? <>{children}</> : <Navigate to="/" replace />;
}

/* O exercício e a conclusão ocupam a tela toda (sem barra de abas) para a
   animação 3D e o mapa de pressão terem espaço; por isso ficam fora deste
   layout. */
function LayoutPraticante() {
  return (
    <ExigeConta papel="praticante">
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <BarraDeAbas abas={ABAS_PRATICANTE} />
    </ExigeConta>
  );
}

/* Telas sem barra de abas também precisam do marco <main>: é por ele que o
   leitor de tela oferece "ir para o conteúdo principal". */
function TelaCheia({ papel, children }: { papel?: PapelDaConta; children: ReactNode }) {
  const conteudo = <main className="flex min-h-0 flex-1 flex-col">{children}</main>;
  return papel ? <ExigeConta papel={papel}>{conteudo}</ExigeConta> : conteudo;
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
      { path: 'entrar/:papel', element: <TelaCheia><EscolherConta /></TelaCheia> },
      { path: 'primeiro-uso', element: <TelaCheia><PrimeiroUso /></TelaCheia> },
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
      { path: 'praticante/exercicio/:id', element: <TelaCheia papel="praticante"><Exercicio /></TelaCheia> },
      { path: 'praticante/concluido', element: <TelaCheia papel="praticante"><Concluido /></TelaCheia> },
      {
        path: 'acompanhante',
        element: <TelaCheia papel="acompanhante"><Outlet /></TelaCheia>,
        children: [
          { index: true, element: <Navigate to="alunos" replace /> },
          { path: 'alunos', element: <Alunos /> },
          { path: 'adicionar', element: <AdicionarAluno /> },
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
