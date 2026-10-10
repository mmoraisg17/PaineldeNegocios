import { useEffect, type RefObject } from 'react';
import { Link } from 'react-router';
import type { Percepcao, ResultadoExercicio } from '../../dominio';
import type { DecisaoDoExercicio } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { ROTULO_DA_PERCEPCAO } from '../../estado/formatos';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';
import { Icone, type NomeDoIcone } from '../../components/Icone';

/* Treino concluído (manual, 8.1): resume o que os sensores mediram e pergunta
   "Como foi para você?". A resposta, junto com as notas, decide o nível do
   próximo treino (8.2); a regra mora em estado/acoes.ts, aqui só se mostra. */

const ROLAGEM = 'flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]';
const PERCEPCOES: readonly Percepcao[] = ['facil', 'ok', 'dificil'];
// Um tom de cartão por medida (Zepp: cada categoria de dado tem a sua cor).
const CARTAO_DA_MEDIDA = ['bg-cartao-1', 'bg-cartao-2', 'bg-cartao-3', 'bg-cartao-4'] as const;
// O ícone só enfeita (aria-hidden): o texto do botão é que diz a resposta.
const ICONE_DA_PERCEPCAO: Record<Percepcao, NomeDoIcone> = { facil: 'rosto-facil', ok: 'rosto-ok', dificil: 'rosto-dificil' };

type RefDoTitulo = RefObject<HTMLHeadingElement | null>;

const arredondarMedia = (valores: readonly number[]): number =>
  valores.length === 0 ? 0 : Math.round(valores.reduce((soma, valor) => soma + valor, 0) / valores.length);

export function Concluido() {
  const { treino, ultimoResumo, concluirTreino } = useApp();
  const resultados = treino?.resultados ?? ultimoResumo?.resultados ?? [];
  const temTreino = treino !== null || ultimoResumo !== null;
  const tituloRef = useTituloDaTela(temTreino ? 'Treino concluído' : 'Nenhum treino para concluir');
  const respondido = treino === null && ultimoResumo !== null;

  // Ao responder, o botão clicado some da tela; sem isto o foco se perderia.
  useEffect(() => {
    if (respondido) tituloRef.current?.focus();
  }, [respondido, tituloRef]);

  if (!temTreino) return <SemTreino tituloRef={tituloRef} />;

  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Treino concluído
      </h1>

      {resultados.length === 0 ? (
        <>
          <p className="rounded-cartao bg-superficie p-4 text-lg">
            Nenhum exercício foi concluído neste treino, então não há o que avaliar. Quando quiser, comece de novo pela tela Hoje.
          </p>
          <BotaoDeVolta />
        </>
      ) : (
        <>
          <ResumoDosResultados resultados={resultados} />
          {ultimoResumo && treino === null ? (
            <>
              <p className="text-lg text-texto-suave">Você marcou: {ROTULO_DA_PERCEPCAO[ultimoResumo.percepcao]}</p>
              <DecisoesDeNivel decisoes={ultimoResumo.decisoes} />
              <BotaoDeVolta />
            </>
          ) : (
            <PerguntaDePercepcao aoEscolher={(percepcao) => concluirTreino(percepcao)} />
          )}
        </>
      )}
    </div>
  );
}

function SemTreino({ tituloRef }: { tituloRef: RefDoTitulo }) {
  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Nenhum treino para concluir
      </h1>
      <p className="rounded-cartao bg-superficie p-4 text-lg">Quando você terminar um treino, o resumo dele aparece aqui.</p>
      <Link to="/praticante/hoje" className="flex min-h-16 items-center justify-center rounded-botao bg-primaria px-4 text-xl font-semibold text-sobre-primaria">
        Ir para o Hoje
      </Link>
    </div>
  );
}

function BotaoDeVolta() {
  return (
    <Link
      to="/praticante/hoje"
      className="flex min-h-16 items-center justify-center rounded-botao bg-primaria px-4 text-xl font-semibold text-sobre-primaria active:bg-primaria-pressionada"
    >
      Voltar ao início
    </Link>
  );
}

function ResumoDosResultados({ resultados }: { resultados: readonly ResultadoExercicio[] }) {
  const itens = [
    { rotulo: 'Exercícios feitos', valor: String(resultados.length) },
    { rotulo: 'Nota média', valor: String(arredondarMedia(resultados.map((r) => r.nota))), complemento: 'de 100' },
    { rotulo: 'Simetria média', valor: String(arredondarMedia(resultados.map((r) => r.simetria))), complemento: 'de 100' },
    { rotulo: 'Estabilidade média', valor: String(arredondarMedia(resultados.map((r) => r.estabilidade))), complemento: 'de 100' },
  ];
  return (
    <section aria-label="Resumo do treino">
      <dl className="grid grid-cols-2 gap-3">
        {itens.map((item, posicao) => (
          <div key={item.rotulo} className={`rounded-cartao p-4 ${CARTAO_DA_MEDIDA[posicao % CARTAO_DA_MEDIDA.length]}`}>
            <dt className="text-base text-texto-suave">{item.rotulo}</dt>
            <dd className="mt-1 text-3xl font-bold text-marca">
              {item.valor}
              {item.complemento ? <span className="ml-1 text-base font-medium text-texto-suave">{item.complemento}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PerguntaDePercepcao({ aoEscolher }: { aoEscolher: (percepcao: Percepcao) => void }) {
  return (
    <div role="group" aria-labelledby="titulo-percepcao" className="flex flex-col gap-3">
      <h2 id="titulo-percepcao" className="text-2xl font-bold">
        Como foi para você?
      </h2>
      <p className="text-base text-texto-suave">A sua resposta ajusta o próximo treino.</p>
      <div className="grid grid-cols-3 gap-3">
        {PERCEPCOES.map((percepcao) => (
          <button
            key={percepcao}
            type="button"
            onClick={() => aoEscolher(percepcao)}
            className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-botao border-2 border-marca bg-superficie px-1 text-xl font-bold text-marca active:bg-primaria-suave"
          >
            <Icone nome={ICONE_DA_PERCEPCAO[percepcao]} className="size-10" />
            {ROTULO_DA_PERCEPCAO[percepcao]}
          </button>
        ))}
      </div>
    </div>
  );
}

const ESTILO_DA_DECISAO = {
  sobe: { caixa: 'bg-certo-suave text-certo-escuro', icone: 'sobe' },
  mantem: { caixa: 'border border-borda bg-superficie text-texto', icone: 'mantem' },
  desce: { caixa: 'bg-alerta-fundo text-alerta-texto', icone: 'desce' },
} as const;

function tituloDaDecisao({ decisao, nivelAnterior, recusada }: DecisaoDoExercicio): string {
  if (recusada) return `Você continua no nível ${nivelAnterior}`;
  if (decisao.mudanca === 'sobe') return `Sobe para o nível ${decisao.nivel}`;
  if (decisao.mudanca === 'desce') return `Volta para o nível ${decisao.nivel}`;
  return 'Mantém o nível';
}

/* Cada mudança tem ícone e texto além da cor. "Volta" usa o tom de atenção,
   não o de erro: baixar o nível é uma escolha de segurança, não uma falha. */
function DecisoesDeNivel({ decisoes }: { decisoes: readonly DecisaoDoExercicio[] }) {
  const { recusarMudanca } = useApp();
  return (
    <section aria-labelledby="titulo-decisoes" className="flex flex-col gap-3">
      <h2 id="titulo-decisoes" className="text-2xl font-bold">
        O que muda no próximo treino
      </h2>
      {decisoes.length === 0 ? (
        <p className="text-lg">Nenhum nível mudou desta vez.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {decisoes.map((item) => {
            const estilo = ESTILO_DA_DECISAO[item.recusada ? 'mantem' : item.decisao.mudanca];
            const podeRecusar = item.decisao.mudanca !== 'mantem' && !item.recusada;
            return (
              <li key={item.exercicioId} className={`flex gap-3 rounded-cartao p-4 ${estilo.caixa}`}>
                <Icone nome={estilo.icone} className="mt-1 size-6" />
                <div>
                  <p className="text-base font-semibold">{item.nome}</p>
                  <p className="text-xl font-bold">{tituloDaDecisao(item)}</p>
                  <p className="mt-1 text-base">{item.recusada ? 'Tudo bem: o app volta a avaliar no próximo treino.' : item.decisao.motivo}</p>
                  {podeRecusar && (
                    <button
                      type="button"
                      onClick={() => recusarMudanca(item.exercicioId)}
                      className="mt-3 min-h-12 rounded-botao border-2 border-current bg-superficie/60 px-4 text-base font-semibold"
                    >
                      Prefiro continuar no nível {item.nivelAnterior}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
