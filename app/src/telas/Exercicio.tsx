import { Suspense, lazy, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { AvisoDeCorrecao, MENSAGEM_OK } from '../components/AvisoDeCorrecao';
import { MapaDePressao } from '../components/MapaDePressao';
import { PainelDemonstracao } from '../components/PainelDemonstracao';
import { novoRelogio } from '../cena3d/relogio';
import { type Apoio, type Exercicio as TipoExercicio, type Nivel, buscarExercicio } from '../dominio';
import { useSimulacaoDeSensores } from '../hooks/useSimulacaoDeSensores';
import { useTituloDaTela } from '../hooks/useTituloDaTela';
import { useVoz } from '../hooks/useVoz';
import { animacaoDe } from '../movimento/animacoes';
import type { ModoBracos } from '../movimento/corpo';
import type { Desvio } from '../sensores';

const VisualizadorExercicio = lazy(() => import('../cena3d/VisualizadorExercicio'));

/* O apoio do nível vira o jeito de segurar na animação: o boneco mostra o
   mesmo nível que a rotina pede (revisão da fase 3). */
const BRACOS_DO_APOIO: Record<Apoio, ModoBracos> = {
  'duas-maos': 'barras',
  'uma-mao': 'uma-mao',
  toque: 'uma-mao',
  'sem-maos': 'cruzados',
};

const prefereMenosMovimento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function nivelDaBusca(valor: string | null): Nivel {
  return valor === '2' ? 2 : valor === '3' ? 3 : 1;
}

export function Exercicio() {
  const { id = '' } = useParams();
  const exercicio = buscarExercicio(id);
  if (!exercicio) return <ExercicioInexistente />;
  return <TelaDoExercicio key={id} exercicio={exercicio} />;
}

function TelaDoExercicio({ exercicio }: { exercicio: TipoExercicio }) {
  const [busca] = useSearchParams();
  const nivel = nivelDaBusca(busca.get('nivel'));
  const config = exercicio.niveis[nivel];
  const animacao = useMemo(() => animacaoDe(exercicio.id, BRACOS_DO_APOIO[config.apoio]), [exercicio.id, config.apoio]);
  const relogio = useRef(novoRelogio(prefereMenosMovimento()));
  const tituloRef = useTituloDaTela(exercicio.nome);

  const [automatico, setAutomatico] = useState(true);
  const [desvioForcado, setDesvioForcado] = useState<Desvio | null>(null);
  const [voz, setVoz] = useState(false);
  const [versaoDesvio, setVersaoDesvio] = useState(0);

  const sim = useSimulacaoDeSensores({
    exercicio,
    nivel,
    animacao,
    relogio,
    desvioForcado: automatico ? null : desvioForcado,
    automatico,
    aoMudarDesvio: () => setVersaoDesvio((v) => v + 1),
  });
  const mensagem = sim.avaliacao.correcao?.mensagem ?? MENSAGEM_OK;
  useVoz(voz, sim.avaliacao.correcao?.id ?? sim.avaliacao.estado, mensagem);

  const trilha = exercicio.trilha === 'fisio' ? 'Fisioterapia' : 'Equilíbrio 60+';

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <header className="flex flex-col gap-2">
        <Link to="/praticante/hoje" className="flex min-h-12 w-fit items-center gap-1 text-lg font-semibold text-primaria">
          <span aria-hidden="true">‹</span> Voltar
        </Link>
        <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
          {exercicio.nome}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-base">
          <span className="rounded-full bg-primaria-suave px-3 py-1 font-semibold text-primaria">Nível {nivel}</span>
          <span className="text-texto-suave">
            {trilha} · {config.descricao}
          </span>
        </p>
      </header>

      {animacao ? (
        <Suspense fallback={<p className="flex h-56 items-center justify-center rounded-cartao bg-superficie text-texto-suave">Carregando animação…</p>}>
          <VisualizadorExercicio animacao={animacao} nomeExercicio={exercicio.nome} relogio={relogio} versao={versaoDesvio} />
        </Suspense>
      ) : (
        <p className="rounded-cartao bg-superficie p-4 text-texto-suave">A animação 3D deste exercício chega numa próxima etapa. Siga os passos abaixo.</p>
      )}

      <PainelDemonstracao
        exercicio={exercicio}
        desvioForcado={automatico ? null : desvioForcado}
        automatico={automatico}
        voz={voz}
        aoForcar={(d) => {
          setAutomatico(false);
          setDesvioForcado(d);
        }}
        aoAutomatico={(ligado) => {
          setAutomatico(ligado);
          setDesvioForcado(null);
        }}
        aoVoz={setVoz}
      />

      <AvisoDeCorrecao avaliacao={sim.avaliacao} />
      <MapaDePressao leitura={sim.leitura} esperado={sim.esperado} estado={sim.avaliacao.estado} />

      <section aria-labelledby="titulo-como" className="rounded-cartao bg-superficie p-4">
        <h2 id="titulo-como" className="text-lg font-bold">
          Como fazer
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-lg">
          {exercicio.comoFazer.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      </section>


      <Link
        to="/praticante/hoje"
        className="flex min-h-16 items-center justify-center rounded-botao bg-primaria text-xl font-semibold text-sobre-primaria"
      >
        Concluir
      </Link>
    </div>
  );
}

function ExercicioInexistente() {
  const tituloRef = useTituloDaTela('Exercício não encontrado');
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 px-6">
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
        Exercício não encontrado
      </h1>
      <Link to="/praticante/biblioteca" className="flex min-h-14 w-fit items-center rounded-botao bg-primaria px-6 text-lg font-semibold text-sobre-primaria">
        Ver a biblioteca
      </Link>
    </div>
  );
}
