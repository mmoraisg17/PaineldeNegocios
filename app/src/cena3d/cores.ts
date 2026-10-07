/* Lê as cores da cena dos tokens do tema (styles/global.css, bloco @theme
   static), para a paleta continuar num lugar só. O valor reserva só aparece
   se o CSS ainda não tiver carregado, o que não acontece no app real. */
const RESERVA = {
  pele: '#c68863',
  camisa: '#0f6e5c',
  calca: '#2f3b4a',
  sapato: '#1b1f24',
  base: '#3a4552',
  sensores: '#ddefea',
  metal: '#9aa4b1',
  madeira: '#b7835a',
  chao: '#ece9e2',
  destaque: '#e8735a',
} as const;

export type CoresDaCena = Record<keyof typeof RESERVA, string>;

export function lerCoresDaCena(): CoresDaCena {
  const estilo = getComputedStyle(document.documentElement);
  const entradas = Object.entries(RESERVA).map(([nome, reserva]) => {
    const valor = estilo.getPropertyValue(`--color-cena-${nome}`).trim();
    return [nome, valor || reserva];
  });
  return Object.fromEntries(entradas) as CoresDaCena;
}
