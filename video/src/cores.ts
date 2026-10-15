import { type CoresDaCena, lerCoresDaCena } from '../../app/src/cena3d/cores';
import cssDoApp from '../../app/src/styles/global.css?raw';

/* Cores da cena iguais às do app. O app lê as cores dos tokens CSS
   (--color-cena-*) do bloco `@theme static` de styles/global.css; o vídeo não
   carrega aquele CSS (ele passa pelo Tailwind), então copia só as variáveis
   da cena para o documento e usa a mesma lerCoresDaCena. Sem isso a cena
   sairia com as cores de reserva de cores.ts, que já não são as do app. */
export function coresDaCenaDoApp(): CoresDaCena {
  // Todos os blocos `@theme static` (há mais de um); os da aparência escura
  // e do alto contraste ficam em seletores `html[...]` e não entram.
  for (const [, bloco] of cssDoApp.matchAll(/@theme static\s*\{([\s\S]*?)\n\}/g)) {
    for (const [, nome, valor] of (bloco ?? '').matchAll(/(--color-cena-[a-z-]+)\s*:\s*([^;]+);/g)) {
      if (nome && valor) document.documentElement.style.setProperty(nome, valor.trim());
    }
  }
  return lerCoresDaCena();
}

/* Cor de um token do app (a primeira definição, a da aparência clara). */
export function tokenDoApp(nome: string, reserva: string): string {
  const achado = new RegExp(`--color-${nome}\\s*:\\s*([^;]+);`).exec(cssDoApp)?.[1];
  return achado?.trim() ?? reserva;
}
