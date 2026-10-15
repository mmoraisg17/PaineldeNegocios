/* Imports no estilo do Vite que o código do app usa (ver remotion.config.ts). */
declare module '*?url' {
  const url: string;
  export default url;
}
declare module '*?raw' {
  const texto: string;
  export default texto;
}
declare module '*.css';
