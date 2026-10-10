import type { Aparencia } from '../../estado/aparencia';
import { useApp, type Preferencias } from '../../estado/ContextoApp';
import { Interruptor } from './Interruptor';
import { Secao } from './Secao';

/* O texto de cada opção já aparece no tamanho que ela representa: quem
   enxerga mal escolhe vendo, sem precisar adivinhar. */
const TAMANHOS: { valor: Preferencias['tamanhoTexto']; rotulo: string; classe: string }[] = [
  { valor: 'normal', rotulo: 'Normal', classe: 'text-lg' },
  { valor: 'grande', rotulo: 'Grande', classe: 'text-xl' },
  { valor: 'muito-grande', rotulo: 'Muito grande', classe: 'text-2xl' },
];

const APARENCIAS_DO_APP: { valor: Aparencia; rotulo: string; nota?: string }[] = [
  { valor: 'clara', rotulo: 'Clara' },
  { valor: 'escura', rotulo: 'Escura' },
  { valor: 'automatica', rotulo: 'Automática', nota: 'Segue o aparelho' },
];

/* Linha de uma opção de rádio. A borda é a de campo (3:1: a área tocável fica evidente para
   quem enxerga mal) e o foco envolve a linha inteira, não só o círculo de 27 px. */
const OPCAO =
  'flex min-h-14 items-center gap-3 rounded-botao border-2 border-borda-campo px-3 font-semibold has-checked:border-marca has-checked:bg-primaria-suave has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-marca';

/* Perfil → Ajustes (manual 13.1). Tudo vai direto para as preferências, que
   o provedor salva no aparelho e aplica na página inteira. */
export function AjustesDoApp() {
  const { preferencias, mudarPreferencias } = useApp();
  return (
    <Secao titulo="Ajustes">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-texto">Aparência</legend>
        {APARENCIAS_DO_APP.map((opcao) => (
          <label
            key={opcao.valor}
            className={`${OPCAO} text-lg`}
          >
            <input
              type="radio"
              name="aparencia"
              value={opcao.valor}
              checked={preferencias.aparencia === opcao.valor}
              onChange={() => mudarPreferencias({ aparencia: opcao.valor })}
              className="size-6 shrink-0 accent-marca"
            />
            <span>
              {opcao.rotulo}
              {opcao.nota ? <span className="block text-base font-normal text-texto-suave">{opcao.nota}</span> : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-texto">Tamanho do texto</legend>
        {TAMANHOS.map((tamanho) => (
          <label
            key={tamanho.valor}
            className={`${OPCAO} ${tamanho.classe}`}
          >
            <input
              type="radio"
              name="tamanho-do-texto"
              value={tamanho.valor}
              checked={preferencias.tamanhoTexto === tamanho.valor}
              onChange={() => mudarPreferencias({ tamanhoTexto: tamanho.valor })}
              className="size-6 shrink-0 accent-marca"
            />
            {tamanho.rotulo}
          </label>
        ))}
      </fieldset>

      <Interruptor
        rotulo="Alto contraste"
        descricao="Cores mais fortes para ler com mais facilidade."
        ligado={preferencias.altoContraste}
        aoMudar={(altoContraste) => mudarPreferencias({ altoContraste })}
      />
      <Interruptor
        rotulo="Avisos por voz"
        descricao="Lê as correções em voz alta durante o exercício, com voz em português do Brasil."
        ligado={preferencias.voz}
        aoMudar={(voz) => mudarPreferencias({ voz })}
      />
    </Secao>
  );
}
