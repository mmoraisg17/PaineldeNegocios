import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { RelogioDaAnimacao } from './relogio';

/* Com a animação pausada, o canvas só desenha sob demanda (frameloop
   "demand"). Mas a base segue medindo, como uma pessoa parada em cima dela:
   o simulador grava a leitura no relógio 10 vezes por segundo, fora do
   React, e os anéis de pressão, a seta e o prumo dependem dela. Este vigia
   confere a leitura no mesmo ritmo (revisão da fase 8):
   - a leitura mudou: pede um quadro, e a cena pausada desenha a 10 quadros
     por segundo, e não a 60;
   - o desvio ou o estado mudaram (troca de cor, close-up da câmera): pede
     quadros seguidos até a transição assentar, para ela não sair aos saltos.
   Com a animação andando, o canvas já desenha sempre e o vigia não muda nada. */

const INTERVALO_MS = 100; // mesmo ritmo do simulador (10 Hz)
const TEMPO_PARA_ASSENTAR = 1; // s: anéis, prumo e brilho chegam ao novo valor
const DELTA_MAXIMO = 0.1;

export function RedesenhoSobDemanda({ relogio }: { relogio: React.MutableRefObject<RelogioDaAnimacao> }) {
  const invalidate = useThree((s) => s.invalidate);
  const restante = useRef(0);

  useEffect(() => {
    let situacaoAnterior = '';
    let leituraAnterior = '';
    const id = window.setInterval(() => {
      const r = relogio.current;
      const s = r.sensores;
      const situacao = `${r.desvio}|${s?.estado}`;
      const leitura = `${s?.pes.toFixed(2)}|${s?.cargaEsquerda.toFixed(2)}`;
      if (situacao !== situacaoAnterior) restante.current = TEMPO_PARA_ASSENTAR;
      else if (leitura === leituraAnterior) return;
      situacaoAnterior = situacao;
      leituraAnterior = leitura;
      invalidate();
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [relogio, invalidate]);

  useFrame((_, delta) => {
    if (restante.current <= 0) return;
    restante.current -= Math.min(delta, DELTA_MAXIMO);
    invalidate();
  });
  return null;
}
