import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

/* Abas do padrão WAI-ARIA (tablist/tab/tabpanel). A seta move o foco e já abre
   a aba: são só três painéis leves, então não há custo em ativar na hora, e
   quem usa leitor de tela ouve o painel novo sem apertar mais nada. Só a aba
   ativa fica na ordem do Tab; as outras se alcançam pelas setas. */

export type Aba = { id: string; rotulo: string; conteudo: ReactNode };

type Props = { rotulo: string; abas: readonly Aba[] };

const BASE_DA_ABA = 'flex min-h-12 flex-1 items-center justify-center rounded-botao border-2 px-2 text-center text-lg font-semibold';
const ABA_ATIVA = `${BASE_DA_ABA} border-primaria bg-primaria text-sobre-primaria`;
const ABA_INATIVA = `${BASE_DA_ABA} border-primaria bg-superficie text-primaria active:bg-primaria-suave`;

/* Posição da aba que a tecla pede, ou nulo se a tecla não é de navegação. */
function destinoDaTecla(tecla: string, atual: number, total: number): number | null {
  if (tecla === 'ArrowRight') return (atual + 1) % total;
  if (tecla === 'ArrowLeft') return (atual - 1 + total) % total;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  return null;
}

export function AbasAcessiveis({ rotulo, abas }: Props) {
  const base = useId();
  const [ativaId, setAtivaId] = useState(abas[0]?.id);
  const referencias = useRef<(HTMLButtonElement | null)[]>([]);
  const posicaoAtiva = Math.max(
    abas.findIndex((aba) => aba.id === ativaId),
    0,
  );
  const ativa = abas[posicaoAtiva];

  function aoApertarTecla(evento: KeyboardEvent<HTMLButtonElement>, posicao: number) {
    const destino = destinoDaTecla(evento.key, posicao, abas.length);
    const aba = destino === null ? undefined : abas[destino];
    if (destino === null || !aba) return;
    // Sem isto a página rolaria com Home/End e com as setas.
    evento.preventDefault();
    setAtivaId(aba.id);
    referencias.current[destino]?.focus();
  }

  if (!ativa) return null;
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={rotulo} className="flex gap-2">
        {abas.map((aba, posicao) => {
          const selecionada = posicao === posicaoAtiva;
          return (
            <button
              key={aba.id}
              ref={(elemento) => {
                referencias.current[posicao] = elemento;
              }}
              type="button"
              role="tab"
              id={`${base}-aba-${aba.id}`}
              aria-selected={selecionada}
              aria-controls={`${base}-painel-${aba.id}`}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => setAtivaId(aba.id)}
              onKeyDown={(evento) => aoApertarTecla(evento, posicao)}
              className={selecionada ? ABA_ATIVA : ABA_INATIVA}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${base}-painel-${ativa.id}`} aria-labelledby={`${base}-aba-${ativa.id}`} tabIndex={0} className="flex flex-col gap-3">
        {ativa.conteudo}
      </div>
    </div>
  );
}
