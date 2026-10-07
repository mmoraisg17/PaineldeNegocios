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

/* Perfil → Ajustes (manual 13.1). Tudo vai direto para as preferências, que
   o provedor salva no aparelho e aplica na página inteira. */
export function AjustesDoApp() {
  const { preferencias, mudarPreferencias } = useApp();
  return (
    <Secao titulo="Ajustes">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-texto">Tamanho do texto</legend>
        {TAMANHOS.map((tamanho) => (
          <label
            key={tamanho.valor}
            className={`flex min-h-14 items-center gap-3 rounded-botao border-2 border-borda px-3 font-semibold has-checked:border-primaria has-checked:bg-primaria-suave ${tamanho.classe}`}
          >
            <input
              type="radio"
              name="tamanho-do-texto"
              value={tamanho.valor}
              checked={preferencias.tamanhoTexto === tamanho.valor}
              onChange={() => mudarPreferencias({ tamanhoTexto: tamanho.valor })}
              className="size-6 shrink-0 accent-primaria"
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
