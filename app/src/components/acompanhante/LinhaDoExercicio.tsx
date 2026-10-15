import type { Exercicio, Nivel } from '../../dominio';
import type { ItemDoFormulario } from './ajusteDaRotina';

const NIVEIS: readonly Nivel[] = [1, 2, 3];

type Props = {
  exercicio: Exercicio;
  item: ItemDoFormulario;
  aoMudar: (mudanca: Partial<ItemDoFormulario>) => void;
};

/* Um exercício da trilha no formulário "Ajustar rotina": incluir/remover e,
   se incluído, o nível (com a opção de fixá-lo). */
export function LinhaDoExercicio({ exercicio, item, aoMudar }: Props) {
  return (
    <li className="flex flex-col gap-2 rounded-botao border-2 border-borda p-3">
      <label className="flex min-h-12 items-center gap-3 text-lg font-semibold text-texto">
        <input
          type="checkbox"
          checked={item.incluido}
          onChange={(evento) => aoMudar({ incluido: evento.target.checked })}
          className="size-6 shrink-0 accent-marca"
        />
        {exercicio.nome}
      </label>

      {item.incluido ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold text-texto-suave">Nível de {exercicio.nome}</legend>
          <div className="grid grid-cols-3 gap-2">
            {NIVEIS.map((nivel) => (
              <label
                key={nivel}
                className="flex min-h-16 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-botao border-2 border-borda px-1 py-2 text-base font-semibold has-checked:border-marca has-checked:bg-primaria-suave"
              >
                <input
                  type="radio"
                  name={`nivel-${exercicio.id}`}
                  value={nivel}
                  checked={item.nivel === nivel}
                  onChange={() => aoMudar({ nivel })}
                  className="size-5 shrink-0 accent-marca"
                />
                Nível {nivel}
              </label>
            ))}
          </div>
          <label className="flex min-h-12 items-center gap-3 text-base text-texto">
            <input
              type="checkbox"
              checked={item.fixar}
              onChange={(evento) => aoMudar({ fixar: evento.target.checked })}
              className="size-6 shrink-0 accent-marca"
            />
            Fixar nível (o app deixa de mudar sozinho)
          </label>
        </fieldset>
      ) : null}
    </li>
  );
}
