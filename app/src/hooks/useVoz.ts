import { useEffect, useRef } from 'react';

/* Avisos falados em português (Web Speech API, sem custo e sem rede). Para
   quem não consegue olhar a tela durante o exercício, a voz é o retorno
   principal (manual, seção 6.3). Fala só quando o aviso muda, nunca em loop.
   Navegadores sem síntese de voz simplesmente ficam em silêncio. */
export function useVoz(ativa: boolean, chave: string, texto: string) {
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (!ativa || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (chave === ultima.current) return;
    ultima.current = chave;
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = 0.95; // um pouco mais devagar: público 60+
    const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'));
    if (voz) fala.voice = voz;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
  }, [ativa, chave, texto]);

  // Ao desligar a voz ou sair da tela, cala o que estiver falando.
  useEffect(() => {
    if (ativa) return undefined;
    ultima.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    return undefined;
  }, [ativa]);
  useEffect(() => () => void (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.cancel()), []);
}
