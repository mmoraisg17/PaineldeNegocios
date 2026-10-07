import { useParams } from 'react-router';
import { TelaEmConstrucao } from '../components/TelaEmConstrucao';

/* Telas marcadoras da fase 1. Cada uma vira um arquivo próprio quando for
   construída (fase 5); ficam juntas aqui enquanto são só título e descrição. */

export const Hoje = () => (
  <TelaEmConstrucao titulo="Hoje" descricao="O seu treino do dia, montado para o seu perfil e nível." />
);

export const Biblioteca = () => (
  <TelaEmConstrucao titulo="Biblioteca" descricao="Os exercícios das trilhas Equilíbrio 60+ e Fisioterapia, com os níveis de cada um." />
);

export const Progresso = () => (
  <TelaEmConstrucao titulo="Progresso" descricao="A sua evolução: adesão, simetria, estabilidade e apoio nas barras." />
);

export const Perfil = () => (
  <TelaEmConstrucao titulo="Perfil" descricao="Seus dados, acompanhantes autorizados, ajustes e privacidade." />
);

export function Exercicio() {
  const { id } = useParams();
  return <TelaEmConstrucao titulo="Exercício" descricao={`Animação 3D, mapa de pressão e correções (${id ?? 'sem exercício'}).`} />;
}

export const Alunos = () => (
  <TelaEmConstrucao titulo="Meus alunos" descricao="As pessoas que autorizaram você a acompanhar os treinos delas." />
);

export function Aluno() {
  const { id } = useParams();
  return <TelaEmConstrucao titulo="Relatório do aluno" descricao={`Adesão, gráficos, histórico e ajuste da rotina (${id ?? 'sem aluno'}).`} />;
}
