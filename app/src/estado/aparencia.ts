/* Aparência do app (Perfil → Ajustes): clara, escura ou a do aparelho.

   A escolha é uma preferência do aparelho, não da conta (mora em
   `Preferencias`, junto do tamanho do texto). O CSS só conhece dois valores
   em `html[data-aparencia]`: 'clara' e 'escura'. "Automática" é resolvida
   aqui, em JavaScript, para o bloco de cores escuras existir uma vez só no
   CSS (em vez de repetido dentro de uma media query). */

export const APARENCIAS = ['automatica', 'clara', 'escura'] as const;
export type Aparencia = (typeof APARENCIAS)[number];
export type AparenciaEfetiva = 'clara' | 'escura';

/* Padrão claro: o público principal tem 60 anos ou mais, e a leitura em tema
   escuro ainda não foi testada com ele. Quem quiser muda em Ajustes. */
export const APARENCIA_PADRAO: Aparencia = 'clara';

const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';

/* Valida o que veio do localStorage (editável por quem usa o aparelho). */
export function lerAparencia(valor: unknown): Aparencia {
  return typeof valor === 'string' && (APARENCIAS as readonly string[]).includes(valor) ? (valor as Aparencia) : APARENCIA_PADRAO;
}

export function aparenciaEfetiva(escolha: Aparencia, aparelhoEscuro: boolean): AparenciaEfetiva {
  if (escolha === 'automatica') return aparelhoEscuro ? 'escura' : 'clara';
  return escolha;
}

function consultarAparelho(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA_ESCURO) : null;
}

function marcar(html: HTMLElement, escolha: Aparencia, consulta: MediaQueryList | null) {
  const efetiva = aparenciaEfetiva(escolha, consulta?.matches === true);
  html.setAttribute('data-aparencia', efetiva);
  // Faz as barras de rolagem e os campos nativos acompanharem o tema.
  html.style.colorScheme = efetiva === 'escura' ? 'dark' : 'light';
}

/* Só marca a página, uma vez, sem acompanhar o aparelho: serve para pintar a
   primeira tela já na aparência certa, antes de o React montar. */
export function marcarAparencia(html: HTMLElement, escolha: Aparencia): void {
  marcar(html, escolha, consultarAparelho());
}

/* Aplica a aparência na página e devolve a função que para de acompanhar o
   aparelho (só faz algo no modo automático). */
export function aplicarAparencia(html: HTMLElement, escolha: Aparencia): () => void {
  const consulta = consultarAparelho();
  const remarcar = () => marcar(html, escolha, consulta);

  remarcar();
  if (escolha !== 'automatica' || !consulta) return () => undefined;
  // Safari/iOS antes do 14 só tem addListener/removeListener (e addEventListener nem existe).
  if (typeof consulta.addEventListener !== 'function') {
    consulta.addListener(remarcar);
    return () => consulta.removeListener(remarcar);
  }
  consulta.addEventListener('change', remarcar);
  return () => consulta.removeEventListener('change', remarcar);
}
