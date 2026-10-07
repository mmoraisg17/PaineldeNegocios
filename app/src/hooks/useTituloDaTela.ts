import { useEffect, useRef } from 'react';
import { APP_NAME } from '../config/app';

/* Num app de uma página só, trocar de tela não recarrega nada: sem isto, o
   leitor de tela (TalkBack, VoiceOver) não percebe a navegação e a aba do
   navegador mostra sempre o mesmo título (WCAG 2.4.2). O hook dá a cada tela
   o seu título e leva o foco ao <h1>, que precisa de tabIndex={-1}. */
export function useTituloDaTela<T extends HTMLElement = HTMLHeadingElement>(titulo: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    document.title = titulo === APP_NAME ? `${APP_NAME} · protótipo` : `${titulo} · ${APP_NAME}`;
    ref.current?.focus({ preventScroll: true });
  }, [titulo]);

  return ref;
}
