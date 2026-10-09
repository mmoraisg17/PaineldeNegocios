import { useCallback, useEffect, useRef, useState } from 'react';

/* Muitos leitores de tela só anunciam uma região viva (role="status") quando o
   TEXTO dela muda com a região já montada; uma região criada com o conteúdo, ou
   um texto igual ao anterior, passa em silêncio. O hook guarda o texto do aviso
   para a tela manter o <p role="status"> sempre montado e só trocar o conteúdo.
   Para repetir o mesmo texto (ex.: tocar em "Copiar link" duas vezes), limpa e
   regrava no quadro seguinte. Texto vazio apaga o aviso. */
export function useAnuncio() {
  const [texto, setTexto] = useState('');
  /* Ref, e não o estado, porque dois avisos no mesmo instante rodam antes de a
     tela refazer o desenho: o estado ainda teria o valor velho. */
  const atual = useRef('');
  const pendente = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(pendente.current), []);

  const anunciar = useCallback((novo: string) => {
    clearTimeout(pendente.current);
    pendente.current = undefined;
    const repetido = novo !== '' && novo === atual.current;
    atual.current = repetido ? '' : novo;
    setTexto(atual.current);
    if (!repetido) return;
    pendente.current = setTimeout(() => {
      atual.current = novo;
      setTexto(novo);
    }, 0);
  }, []);

  return [texto, anunciar] as const;
}
