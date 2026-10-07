import { useEffect, useRef, useState } from 'react';
import { escolherVozBrasileira } from './vozBrasileira';

const temSinteseDeVoz = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/* Avisos falados em português do Brasil (Web Speech API, sem custo e sem
   rede). Para quem não consegue olhar a tela durante o exercício, a voz é o
   retorno principal (manual, seção 6.3). Fala só quando o aviso muda, nunca
   em loop.

   Requisito do grupo (07/10/2026): o sotaque tem de ser brasileiro. Se o
   aparelho não tiver voz pt-BR, o app fica em silêncio e devolve
   `vozBrasileiraDisponivel = false` para a tela avisar. Só pedir lang
   "pt-BR" ao navegador não basta: sem voz brasileira ele usa a de Portugal. */
export function useVoz(ativa: boolean, chave: string, texto: string): { vozBrasileiraDisponivel: boolean } {
  const ultima = useRef<string | null>(null);
  const voz = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const [disponivel, setDisponivel] = useState(true);

  // As vozes chegam de forma assíncrona (no Chrome, a primeira chamada a
  // getVoices costuma vir vazia): escolhe de novo quando a lista muda.
  useEffect(() => {
    if (!temSinteseDeVoz()) return undefined;
    const atualizar = () => {
      const vozes = window.speechSynthesis.getVoices();
      voz.current = escolherVozBrasileira(vozes);
      // Lista vazia = ainda carregando; só conclui "indisponível" com a lista pronta.
      if (vozes.length > 0) setDisponivel(voz.current !== undefined);
    };
    atualizar();
    window.speechSynthesis.addEventListener('voiceschanged', atualizar);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', atualizar);
  }, []);

  useEffect(() => {
    if (!ativa || !temSinteseDeVoz() || !voz.current) return;
    if (chave === ultima.current) return;
    ultima.current = chave;
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = 0.95; // um pouco mais devagar: público 60+
    fala.voice = voz.current;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
  }, [ativa, chave, texto]);

  // Ao desligar a voz ou sair da tela, cala o que estiver falando.
  useEffect(() => {
    if (ativa) return;
    ultima.current = null;
    if (temSinteseDeVoz()) window.speechSynthesis.cancel();
  }, [ativa]);
  useEffect(() => () => void (temSinteseDeVoz() && window.speechSynthesis.cancel()), []);

  return { vozBrasileiraDisponivel: disponivel };
}
