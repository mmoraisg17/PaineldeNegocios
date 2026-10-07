/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  /* Caminhos relativos em vez de '/PaineldeNegocios/'. O Pages serve o app num
     subcaminho do repositório, e com './' o mesmo build funciona lá, no
     `vite preview` e em qualquer outro host, sem trocar configuração. Isso só
     é seguro porque as rotas são por hash (ver rotas.tsx): o navegador nunca
     pede /praticante/hoje ao servidor. */
  base: './',
  plugins: [react(), tailwind()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
