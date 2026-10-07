import type { Exercicio, Nivel } from '../../dominio';
import type { ItemDoFormulario } from './ajusteDaRotina';

const NIVEIS: readonly Nivel[] = [1, 2, 3];

type Props = {
  exercicio: Exercicio;
  item: ItemDoFormulario;
  /* Maior nível que a plataforma do aluno executa (inclinação máxima). */
  nivelMaximo: Nivel;
  aoMudar: (mudanca: Partial<ItemDoFormulario>) => void;
};

/* Um exercício da trilha no formulário "Ajustar rotina": incluir/remover e,
   se incluído, o nível (com a opção de fixá-lo). Os níveis que a plataforma do
   aluno não alcança ficam desabilitados e com o motivo escrito, porque a
   rotina os rebaixaria em silêncio ao montar. */
export function LinhaDoExercicio({ exercicio, item, nivelMaximo, aoMudar }: Props) {
  return (
    <li className="flex flex-col gap-2 rounded-botao border-2 border-borda p-3">
      <label className="flex min-h-12 items-center gap-3 text-lg font-semibold text-texto">
        <input
          type="checkbox"
          checked={item.incluido}
          onChange={(evento) => aoMudar({ incluido: evento.target.checked })}
          className="size-6 shrink-0 accent-primaria"
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
                className="flex min-h-16 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-botao border-2 border-borda px-1 py-2 text-base font-semibold has-checked:border-primaria has-checked:bg-primaria-suave has-disabled:border-dashed has-disabled:text-texto-suave"
              >
                <input
                  type="radio"
                  name={`nivel-${exercicio.id}`}
                  value={nivel}
                  checked={item.nivel === nivel}
                  disabled={nivel > nivelMaximo}
                  onChange={() => aoMudar({ nivel })}
                  className="size-5 shrink-0 accent-primaria"
                />
                Nível {nivel}
              </label>
            ))}
          </div>
          {nivelMaximo < 3 ? (
            <p className="text-base text-texto-suave">A plataforma deste aluno chega até o nível {nivelMaximo}.</p>
          ) : null}
          <label className="flex min-h-12 items-center gap-3 text-base text-texto">
            <input
              type="checkbox"
              checked={item.fixar}
              onChange={(evento) => aoMudar({ fixar: evento.target.checked })}
              className="size-6 shrink-0 accent-primaria"
            />
            Fixar nível (o app deixa de mudar sozinho)
          </label>
        </fieldset>
      ) : null}
    </li>
  );
}
