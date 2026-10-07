import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type DadosPraticante,
  type EstadoApp,
  type ItemRotina,
  type Percepcao,
  type ResultadoExercicio,
  type Acompanhante,
  apagarDados,
  armazenamentoDoNavegador,
  carregarEstado,
  criarEstadoDemo,
  salvarEstado,
} from '../dominio';
import { type DecisaoDoExercicio, recusarMudancaDeNivel, registrarSessao } from './acoes';

/* Estado do app inteiro (contas, treinos, vínculos), salvo no aparelho a
   cada mudança. As regras ficam em acoes.ts; aqui só se guarda, salva e
   distribui para as telas. */

export type Preferencias = {
  tamanhoTexto: 'normal' | 'grande' | 'muito-grande';
  altoContraste: boolean;
  voz: boolean;
};

export type TreinoEmAndamento = { itens: ItemRotina[]; resultados: ResultadoExercicio[] };
export type ResumoDoTreino = { resultados: ResultadoExercicio[]; decisoes: DecisaoDoExercicio[]; percepcao: Percepcao };

type ValorDoContexto = {
  estado: EstadoApp;
  atualizar: (mudar: (estado: EstadoApp) => EstadoApp) => void;
  preferencias: Preferencias;
  mudarPreferencias: (mudanca: Partial<Preferencias>) => void;
  treino: TreinoEmAndamento | null;
  iniciarTreino: (itens: ItemRotina[]) => void;
  registrarResultado: (resultado: ResultadoExercicio) => void;
  cancelarTreino: () => void;
  concluirTreino: (percepcao: Percepcao) => ResumoDoTreino | null;
  /* Manual 8.2: "o app sempre avisa antes de mudar o nível, e você pode recusar". */
  recusarMudanca: (exercicioId: DecisaoDoExercicio['exercicioId']) => void;
  ultimoResumo: ResumoDoTreino | null;
  reiniciarDemonstracao: () => void;
};

const Contexto = createContext<ValorDoContexto | null>(null);

const CHAVE_PREFERENCIAS = 'app-equilibrio:preferencias';
const PREFERENCIAS_PADRAO: Preferencias = { tamanhoTexto: 'normal', altoContraste: false, voz: false };
/* Fonte base por tamanho (o padrão de 18 px já é maior que o comum: público 60+). */
export const FONTE_BASE: Record<Preferencias['tamanhoTexto'], string> = { normal: '112.5%', grande: '125%', 'muito-grande': '140%' };

function lerPreferencias(): Preferencias {
  try {
    const bruto = localStorage.getItem(CHAVE_PREFERENCIAS);
    const valor = bruto ? (JSON.parse(bruto) as Partial<Preferencias>) : {};
    return {
      // hasOwn, não `in`: 'toString' e 'constructor' passariam pelo `in` (localStorage editável).
      tamanhoTexto: typeof valor.tamanhoTexto === 'string' && Object.hasOwn(FONTE_BASE, valor.tamanhoTexto) ? valor.tamanhoTexto : 'normal',
      altoContraste: valor.altoContraste === true,
      voz: valor.voz === true,
    };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

/* Primeira visita (ou dados apagados): o protótipo já nasce com as contas de
   demonstração do manual (seção 17), sem ninguém logado. */
function estadoDeArranque(): EstadoApp {
  const salvo = carregarEstado(armazenamentoDoNavegador());
  const vazio = Object.keys(salvo.praticantes).length === 0 && salvo.acompanhantes.length === 0;
  return vazio ? { ...criarEstadoDemo(new Date()), contaAtual: null } : salvo;
}

export function ProvedorDoApp({ children, estadoInicial }: { children: ReactNode; estadoInicial?: EstadoApp }) {
  const [estado, setEstado] = useState<EstadoApp>(() => estadoInicial ?? estadoDeArranque());
  const [preferencias, setPreferencias] = useState<Preferencias>(lerPreferencias);
  const [treino, setTreino] = useState<TreinoEmAndamento | null>(null);
  const [ultimoResumo, setUltimoResumo] = useState<ResumoDoTreino | null>(null);

  useEffect(() => {
    salvarEstado(armazenamentoDoNavegador(), estado);
  }, [estado]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch {
      /* armazenamento indisponível (aba anônima): vale só nesta visita */
    }
    const html = document.documentElement;
    html.style.fontSize = FONTE_BASE[preferencias.tamanhoTexto];
    html.classList.toggle('alto-contraste', preferencias.altoContraste);
  }, [preferencias]);

  const atualizar = useCallback((mudar: (e: EstadoApp) => EstadoApp) => setEstado(mudar), []);
  const mudarPreferencias = useCallback((m: Partial<Preferencias>) => setPreferencias((p) => ({ ...p, ...m })), []);

  const concluirTreino = useCallback(
    (percepcao: Percepcao): ResumoDoTreino | null => {
      const conta = estado.contaAtual;
      if (!treino || !conta || conta.papel !== 'praticante') return null;
      const { estado: novo, decisoes } = registrarSessao(estado, conta.id, treino.resultados, percepcao, new Date());
      const resumo = { resultados: treino.resultados, decisoes, percepcao };
      setEstado(novo);
      setTreino(null);
      setUltimoResumo(resumo);
      return resumo;
    },
    [estado, treino],
  );

  const recusarMudanca = useCallback(
    (exercicioId: DecisaoDoExercicio['exercicioId']) => {
      const conta = estado.contaAtual;
      const decisao = ultimoResumo?.decisoes.find((d) => d.exercicioId === exercicioId);
      if (!conta || conta.papel !== 'praticante' || !ultimoResumo || !decisao || decisao.decisao.mudanca === 'mantem') return;
      setEstado((e) => recusarMudancaDeNivel(e, conta.id, exercicioId, decisao.nivelAnterior));
      setUltimoResumo({
        ...ultimoResumo,
        decisoes: ultimoResumo.decisoes.map((d) => (d.exercicioId === exercicioId ? { ...d, recusada: true } : d)),
      });
    },
    [estado.contaAtual, ultimoResumo],
  );

  const valor = useMemo<ValorDoContexto>(
    () => ({
      estado,
      atualizar,
      preferencias,
      mudarPreferencias,
      treino,
      iniciarTreino: (itens) => {
        setTreino({ itens, resultados: [] });
        setUltimoResumo(null);
      },
      registrarResultado: (r) => setTreino((t) => (t ? { ...t, resultados: [...t.resultados.filter((x) => x.id !== r.id), r] } : t)),
      cancelarTreino: () => setTreino(null),
      concluirTreino,
      recusarMudanca,
      ultimoResumo,
      reiniciarDemonstracao: () => {
        apagarDados(armazenamentoDoNavegador());
        setEstado({ ...criarEstadoDemo(new Date()), contaAtual: null });
        setTreino(null);
        setUltimoResumo(null);
      },
    }),
    [estado, atualizar, preferencias, mudarPreferencias, treino, concluirTreino, recusarMudanca, ultimoResumo],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): ValorDoContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useApp precisa estar dentro de <ProvedorDoApp>');
  return valor;
}

export function usePraticanteAtual(): DadosPraticante | undefined {
  const { estado } = useApp();
  const conta = estado.contaAtual;
  return conta?.papel === 'praticante' ? estado.praticantes[conta.id] : undefined;
}

export function useAcompanhanteAtual(): Acompanhante | undefined {
  const { estado } = useApp();
  const conta = estado.contaAtual;
  return conta?.papel === 'acompanhante' ? estado.acompanhantes.find((a) => a.id === conta.id) : undefined;
}
