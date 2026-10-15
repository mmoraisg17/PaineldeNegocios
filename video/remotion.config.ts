import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Config } from '@remotion/cli/config';

/* Navegador: usa um que já esteja instalado em vez de deixar o Remotion baixar
   o Chrome Headless Shell. Ordem: variável NAVEGADOR_DO_VIDEO, o headless shell
   do Playwright (é o mesmo programa que o Remotion baixaria) e, sem nenhum
   dos dois, o padrão do Remotion. O Chromium "completo" (/opt/pw-browsers/chromium)
   não serve: ele não tem mais o modo headless antigo que o Remotion usa
   ("Old Headless mode has been removed from the Chrome binary"). */
function acharNavegador(): string | null {
  const daVariavel = process.env['NAVEGADOR_DO_VIDEO'];
  if (daVariavel) return daVariavel;
  const pasta = '/opt/pw-browsers';
  if (!existsSync(pasta)) return null;
  const shell = readdirSync(pasta)
    .filter((nome) => nome.startsWith('chromium_headless_shell-'))
    .map((nome) => path.join(pasta, nome, 'chrome-linux', 'headless_shell'))
    .find((caminho) => existsSync(caminho));
  return shell ?? null;
}
const navegador = acharNavegador();
if (navegador) Config.setBrowserExecutable(navegador);

/* WebGL sem placa de vídeo: o SwiftShader (via ANGLE) desenha na CPU. É lento,
   por isso a concorrência baixa; numa máquina com GPU, `--gl=angle` e mais
   concorrência deixam o render bem mais rápido. */
Config.setChromiumOpenGlRenderer('swangle');
Config.setConcurrency(2);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(20);

const doVideo = (pacote: string) => path.resolve(process.cwd(), 'node_modules', pacote);

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    /* O código da cena vem de ../app/src, e lá perto existe app/node_modules
       com outra cópia de React e three. Duas cópias quebram os hooks e o R3F
       ("Invalid hook call", objetos de three que o renderizador não reconhece):
       tudo aponta para as cópias deste pacote. */
    alias: {
      ...(config.resolve?.alias as Record<string, string> | undefined),
      react: doVideo('react'),
      'react-dom': doVideo('react-dom'),
      three: doVideo('three'),
      '@react-three/fiber': doVideo('@react-three/fiber'),
    },
  },
  module: {
    ...config.module,
    rules: [
      /* Imports no estilo do Vite usados pelo app: `modelo.glb?url` vira a URL
         do arquivo, `global.css?raw` vira o texto do CSS (para ler os tokens
         de cor da cena sem passar pelo Tailwind). */
      { resourceQuery: /url/, type: 'asset/resource' },
      { resourceQuery: /raw/, type: 'asset/source' },
      // As regras do Remotion (CSS, TS…) valem para o resto; sem isso o
      // CSS cru também passaria pelo css-loader e quebraria no @import do Tailwind.
      { resourceQuery: { not: [/url/, /raw/] }, rules: (config.module?.rules ?? []).filter((regra) => regra !== '...') },
    ],
  },
}));
