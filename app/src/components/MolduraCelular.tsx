import { useLayoutEffect, type ReactNode } from 'react';

/* Altura total do aparelho: tela de 844 px + 12 px de borda em cima e embaixo. */
const ALTURA_APARELHO = 868;
/* Respiro em volta do aparelho (1,5 rem de cada lado da .moldura-mesa). */
const RESPIRO_VERTICAL = 48;

export function escalaDaMoldura(alturaJanela: number): number {
  return Math.min(1, Math.max(0.5, (alturaJanela - RESPIRO_VERTICAL) / ALTURA_APARELHO));
}

/* Envolve o app inteiro. No celular é invisível (a tela ocupa a janela); no
   desktop vira um aparelho de 390 × 844 no meio da página. Quem decide isso é
   o CSS (.moldura-* em styles/global.css); aqui só se calcula a escala usada
   no desktop. useLayoutEffect roda antes da pintura, então o aparelho já
   aparece no tamanho certo, sem salto. */
export function MolduraCelular({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const aplicar = () =>
      document.documentElement.style.setProperty('--escala-moldura', String(escalaDaMoldura(window.innerHeight)));
    aplicar();
    window.addEventListener('resize', aplicar);
    return () => window.removeEventListener('resize', aplicar);
  }, []);

  return (
    <div className="moldura-mesa" data-moldura>
      <div className="moldura-aparelho">
        <div className="tela" data-tela>
          {children}
        </div>
      </div>
      <aside className="moldura-aviso" aria-label="Sobre esta visualização">
        <p className="text-lg font-semibold text-texto">Protótipo do app</p>
        <p className="mt-2">
          Pensado para o celular. Aqui no computador ele aparece dentro de uma moldura para simular o aparelho: use o mouse
          como se fosse o dedo.
        </p>
      </aside>
    </div>
  );
}
