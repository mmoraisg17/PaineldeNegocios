import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { PapelDaConta } from '../../dominio';

const ABAS: readonly { papel: PapelDaConta; rotulo: string }[] = [
  { papel: 'praticante', rotulo: 'Praticante' },
  { papel: 'acompanhante', rotulo: 'Acompanhante' },
];

export const ID_DO_PAINEL_DE_ACESSO = 'painel-de-acesso';
const idDaAba = (papel: PapelDaConta) => `aba-${papel}`;

type Props = { papel: PapelDaConta; aoTrocar: (papel: PapelDaConta) => void; children: ReactNode };

/* Abas no padrão WAI-ARIA (troca automática): as setas mudam de aba e levam o
   foco junto; Home e End vão para a primeira e a última. Só a aba ativa entra
   na ordem do Tab. Há um painel só, que o conteúdo da aba ativa ocupa; por
   isso todas as abas apontam (aria-controls) para ele, e ele é nomeado pela
   aba ativa. */
export function AbasDeAcesso({ papel, aoTrocar, children }: Props) {
  const abas = useRef<Partial<Record<PapelDaConta, HTMLButtonElement | null>>>({});

  const irPara = (indice: number) => {
    const destino = ABAS[(indice + ABAS.length) % ABAS.length];
    if (!destino) return;
    aoTrocar(destino.papel);
    abas.current[destino.papel]?.focus();
  };

  const aoTeclar = (evento: KeyboardEvent) => {
    const atual = ABAS.findIndex((aba) => aba.papel === papel);
    const proximo: Record<string, number> = {
      ArrowRight: atual + 1,
      ArrowLeft: atual - 1,
      Home: 0,
      End: ABAS.length - 1,
    };
    const indice = proximo[evento.key];
    if (indice === undefined) return;
    evento.preventDefault();
    irPara(indice);
  };

  return (
    <div className="flex flex-col">
      <div role="tablist" aria-label="Tipo de conta" className="grid grid-cols-2 gap-1 rounded-botao bg-primaria-suave p-1">
        {ABAS.map((aba) => {
          const ativa = aba.papel === papel;
          return (
            <button
              key={aba.papel}
              ref={(elemento) => {
                abas.current[aba.papel] = elemento;
              }}
              id={idDaAba(aba.papel)}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={ID_DO_PAINEL_DE_ACESSO}
              tabIndex={ativa ? 0 : -1}
              onClick={() => aoTrocar(aba.papel)}
              onKeyDown={aoTeclar}
              className={`min-h-14 rounded-botao px-2 text-lg font-semibold ${
                ativa ? 'bg-primaria text-sobre-primaria' : 'text-primaria-escura active:bg-superficie'
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>
      <div id={ID_DO_PAINEL_DE_ACESSO} role="tabpanel" aria-labelledby={idDaAba(papel)} className="mt-5 flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}
