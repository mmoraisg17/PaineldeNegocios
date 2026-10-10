import { useEffect, useMemo, useState } from 'react';
import { FREQUENCIA_SEMANAL_PADRAO, forcaDoMascote, rotinaDoPraticante, type NivelDoMascote } from '../dominio';
import { useApp, usePraticanteAtual } from '../estado/ContextoApp';

const MS_POR_HORA = 60 * 60 * 1000;

/* A hora atual, renovada a cada hora e quando a aba volta a aparecer. O app pode
   ficar aberto por dias (a faixa mora no layout e não remonta ao trocar de aba):
   sem isto o mascote ficaria no nível de quando a pessoa abriu o app. */
function useHoraAtual(): number {
  const [hora, setHora] = useState(() => Math.floor(Date.now() / MS_POR_HORA));
  useEffect(() => {
    const atualizar = () => setHora(Math.floor(Date.now() / MS_POR_HORA));
    const intervalo = window.setInterval(atualizar, MS_POR_HORA);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') atualizar();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, []);
  return hora;
}

/* Força do mascote da conta que está aberta; `undefined` sem praticante. Recalcula
   quando os treinos mudam e a cada hora. */
export function useNivelDoMascote(): NivelDoMascote | undefined {
  const { estado } = useApp();
  const praticante = usePraticanteAtual();
  const hora = useHoraAtual();
  const planejadas = praticante
    ? (rotinaDoPraticante(estado, praticante.id)?.frequenciaSemanal ?? FREQUENCIA_SEMANAL_PADRAO)
    : undefined;
  const sessoes = praticante?.sessoes;

  // `hora` só invalida o cálculo; a data usada é a de agora (um treino de 5 minutos atrás não pode virar "futuro").
  return useMemo(
    () => (sessoes && planejadas !== undefined ? forcaDoMascote(sessoes, planejadas, new Date()) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessoes, planejadas, hora],
  );
}
