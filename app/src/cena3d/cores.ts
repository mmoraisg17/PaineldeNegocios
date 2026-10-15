/* Lê as cores da cena dos tokens do tema (styles/global.css, bloco @theme
   static), para a paleta continuar num lugar só. O valor reserva só aparece
   se o CSS ainda não tiver carregado, o que não acontece no app real. */
const RESERVA = {
  corpo: '#d9dde2',
  borda: '#ffffff',
  musculo: '#2ec5ff',
  certo: '#3ddc84',
  atencao: '#ffb020',
  erro: '#ff4d4f',
  sapato: '#1b1f24',
  fundo: '#0e1217',
  base: '#4a5462',
  sensores: '#ddefea',
  metal: '#9aa4b1',
  madeira: '#b7835a',
  chao: '#1a2027',
  luzChao: '#252e38',
  destaque: '#e8735a',
} as const;

export type CoresDaCena = Record<keyof typeof RESERVA, string>;

export function lerCoresDaCena(): CoresDaCena {
  const estilo = getComputedStyle(document.documentElement);
  const entradas = Object.entries(RESERVA).map(([nome, reserva]) => {
    // luzChao → --color-cena-luz-chao (variáveis CSS em kebab-case)
    const variavel = nome.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
    const valor = estilo.getPropertyValue(`--color-cena-${variavel}`).trim();
    return [nome, valor || reserva];
  });
  return Object.fromEntries(entradas) as CoresDaCena;
}
