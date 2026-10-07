import type { Exercicio } from '../dominio';
import { type Desvio, ROTULO_DO_DESVIO, desviosSimulaveis } from '../sensores';

/* Painel do avaliador (manual, seção 17). A plataforma física ainda não
   existe, então é aqui que se "força" o que os sensores leriam. Fica logo
   abaixo do 3D, em botões compactos, para quem testa ver o boneco, o aviso
   e o mapa mudarem sem rolar a tela. A borda tracejada o separa visualmente
   das funções do produto. */
export function PainelDemonstracao({
  exercicio,
  desvioForcado,
  automatico,
  voz,
  aoForcar,
  aoAutomatico,
  aoVoz,
}: {
  exercicio: Exercicio;
  desvioForcado: Desvio | null;
  automatico: boolean;
  voz: boolean;
  aoForcar: (d: Desvio | null) => void;
  aoAutomatico: (ligado: boolean) => void;
  aoVoz: (ligada: boolean) => void;
}) {
  const desvios = desviosSimulaveis(exercicio);
  const botao = (ativo: boolean) =>
    `min-h-11 rounded-full border-2 px-3 text-sm font-semibold ${
      ativo ? 'border-primaria bg-primaria text-sobre-primaria' : 'border-borda bg-superficie text-texto'
    }`;

  return (
    <details className="rounded-cartao border-2 border-dashed border-borda bg-superficie/60 px-3 py-2" open>
      <summary className="cursor-pointer text-base font-semibold text-texto">
        Simular sensores <span className="font-normal text-texto-suave">(demonstração)</span>
      </summary>
      <div className="mt-2 flex flex-wrap gap-2 pb-1">
        <button type="button" aria-pressed={automatico} onClick={() => aoAutomatico(!automatico)} className={botao(automatico)}>
          {automatico ? '● ' : '○ '}Automático
        </button>
        <button type="button" aria-pressed={!automatico && desvioForcado === null} onClick={() => aoForcar(null)} className={botao(!automatico && desvioForcado === null)}>
          Execução certa
        </button>
        {desvios.map(({ desvio }) => (
          <button key={desvio} type="button" aria-pressed={desvioForcado === desvio} onClick={() => aoForcar(desvio)} className={botao(desvioForcado === desvio)}>
            {ROTULO_DO_DESVIO[desvio]}
          </button>
        ))}
        <button type="button" aria-pressed={voz} onClick={() => aoVoz(!voz)} className={botao(voz)}>
          {voz ? '🔊 Voz ligada' : '🔈 Voz'}
        </button>
      </div>
    </details>
  );
}
