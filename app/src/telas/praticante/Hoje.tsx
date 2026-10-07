import { useEffect, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router';
import { buscarExercicio, rotinaDoPraticante, semanaDeTreino, type DadosPraticante, type ItemRotina, type Rotina } from '../../dominio';
import { marcarRecadosLidos, recadosPara } from '../../estado/acoes';
import { useApp, usePraticanteAtual } from '../../estado/ContextoApp';
import { ROTULO_DO_APOIO, formatarData, formatarDose } from '../../estado/formatos';
import { useTituloDaTela } from '../../hooks/useTituloDaTela';

/* Tela Hoje (manual, seção 5): recados, treino do dia e o botão que começa. */

const ROLAGEM = 'flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]';

type RefDoTitulo = RefObject<HTMLHeadingElement | null>;

function IconeEnvelope() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 shrink-0 fill-none stroke-primaria" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function Hoje() {
  const praticante = usePraticanteAtual();
  const tituloRef = useTituloDaTela(praticante ? `Olá, ${praticante.perfil.nome}` : 'Hoje');
  if (!praticante) return <SemRotina tituloRef={tituloRef} />;
  return <TreinoDoDia praticante={praticante} tituloRef={tituloRef} />;
}

function SemRotina({ tituloRef }: { tituloRef: RefDoTitulo }) {
  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Hoje
      </h1>
      <p className="rounded-cartao bg-superficie p-4 text-lg">
        Não encontramos o seu treino. Volte ao início e entre de novo para continuar.
      </p>
      <Link to="/" className="flex min-h-14 w-fit items-center rounded-botao bg-primaria px-6 text-lg font-semibold text-sobre-primaria">
        Voltar ao início
      </Link>
    </div>
  );
}

function TreinoDoDia({ praticante, tituloRef }: { praticante: DadosPraticante; tituloRef: RefDoTitulo }) {
  const { estado, atualizar, iniciarTreino } = useApp();
  const navigate = useNavigate();
  const rotina = rotinaDoPraticante(estado, praticante.id);
  const recados = recadosPara(estado, praticante.id);
  // Quem ainda não tinha lido fica com o selo "Novo" até sair da tela, mesmo
  // com o recado já marcado como lido logo abaixo.
  const [idsNovos] = useState(() => new Set(recados.filter((recado) => !recado.lido).map((recado) => recado.id)));

  useEffect(() => {
    atualizar((atual) => marcarRecadosLidos(atual, praticante.id));
  }, [atualizar, praticante.id]);

  function comecarTreino(itens: readonly ItemRotina[]) {
    const primeiro = itens[0];
    if (!primeiro) return;
    iniciarTreino([...itens]);
    // `treino` é o índice do item: a tela do exercício usa para saber qual vem a seguir.
    navigate(`/praticante/exercicio/${primeiro.exercicioId}?nivel=${primeiro.nivel}&treino=0`);
  }

  return (
    <div className={ROLAGEM}>
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        Olá, {praticante.perfil.nome}
      </h1>

      {recados.length > 0 ? (
        <section aria-labelledby="titulo-recados" className="flex flex-col gap-2">
          <h2 id="titulo-recados" className="text-lg font-bold">
            Recados
          </h2>
          <ul className="flex flex-col gap-2">
            {recados.map((recado) => (
              <li key={recado.id} className="flex gap-3 rounded-cartao bg-primaria-suave p-4">
                <IconeEnvelope />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-base font-bold text-primaria-escura">
                    {recado.autor}
                    {idsNovos.has(recado.id) ? <span className="rounded-full bg-primaria px-2 py-0.5 text-sm text-sobre-primaria">Novo</span> : null}
                  </p>
                  <p className="mt-1 text-lg text-texto">{recado.texto}</p>
                  <p className="mt-1 text-sm text-texto-suave">{formatarData(recado.enviadoEm)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rotina && rotina.itens.length > 0 ? (
        <>
          <CartaoDoTreino rotina={rotina} />
          <Semana praticante={praticante} rotina={rotina} />
          <div className="sticky bottom-0 -mx-5 bg-fundo/95 px-5 py-3">
            <button
              type="button"
              onClick={() => comecarTreino(rotina.itens)}
              className="flex min-h-16 w-full items-center justify-center rounded-botao bg-primaria px-4 text-xl font-semibold text-sobre-primaria active:bg-primaria-escura"
            >
              Começar treino
            </button>
          </div>
        </>
      ) : (
        <p className="rounded-cartao bg-superficie p-4 text-lg">
          A sua rotina está vazia por enquanto. Se um acompanhante ajustou o treino, peça a ele para incluir exercícios.
        </p>
      )}
    </div>
  );
}

function CartaoDoTreino({ rotina }: { rotina: Rotina }) {
  return (
    <section aria-labelledby="titulo-treino" className="flex flex-col gap-3 rounded-cartao bg-superficie p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-treino" className="text-xl font-bold">
          Treino de hoje
        </h2>
        {rotina.ajustadoPor ? (
          <span className="rounded-full bg-alerta-fundo px-3 py-1 text-base font-semibold text-alerta-texto">Ajustado por {rotina.ajustadoPor}</span>
        ) : null}
      </div>
      <p className="text-base text-texto-suave">Cerca de {rotina.minutosEstimados} minutos</p>
      <ul className="flex flex-col gap-2">
        {rotina.itens.map((item) => (
          <li key={item.exercicioId}>
            <ItemDoTreino item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ItemDoTreino({ item }: { item: ItemRotina }) {
  const nome = buscarExercicio(item.exercicioId)?.nome ?? item.exercicioId;
  return (
    <Link
      to={`/praticante/exercicio/${item.exercicioId}?nivel=${item.nivel}`}
      className="flex min-h-16 items-center gap-3 rounded-botao border border-borda bg-fundo px-4 py-3 active:bg-primaria-suave"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-texto">{nome}</span>
        <span className="block text-base text-texto-suave">
          {formatarDose(item.dose)} · {ROTULO_DO_APOIO[item.apoio]}
        </span>
        {item.fixadoPor ? <span className="block text-base font-medium text-alerta-texto">Nível fixado por {item.fixadoPor}</span> : null}
      </span>
      <span className="shrink-0 rounded-full bg-primaria-suave px-3 py-1 text-base font-semibold text-primaria">Nível {item.nivel}</span>
      <span aria-hidden="true" className="text-2xl text-texto-suave">
        ›
      </span>
    </Link>
  );
}

function Semana({ praticante, rotina }: { praticante: DadosPraticante; rotina: Rotina }) {
  const { feitas, planejadas } = semanaDeTreino(praticante.sessoes, rotina.frequenciaSemanal, new Date());
  const proporcao = planejadas > 0 ? Math.min(feitas / planejadas, 1) : 0;
  return (
    <section aria-label="Sua semana" className="rounded-cartao bg-superficie p-4">
      <p className="text-lg font-semibold">
        {feitas} de {planejadas} {planejadas === 1 ? 'treino' : 'treinos'} nesta semana
      </p>
      {/* Só reforço visual: o número acima já diz tudo. */}
      <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded-full bg-primaria-suave">
        <div className="h-full rounded-full bg-primaria" style={{ width: `${Math.round(proporcao * 100)}%` }} />
      </div>
    </section>
  );
}
