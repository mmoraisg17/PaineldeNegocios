import type { Desvio } from '../sensores/tipos';
import type { Pose } from './corpo';

/* Como cada desvio aparece no corpo do boneco, para o avaliador VER o que o
   mapa de pressão está acusando. São deslocamentos pequenos sobre a pose
   certa (o quadril continua alcançável e os pés plantados; há teste para
   isso). Desvios que não têm leitura visual clara (movimento rápido, alvo,
   inclinação da base) não mexem no corpo. */

export type RegiaoDoCorpo = 'pernas' | 'tronco' | 'bracos';

export function aplicarDesvioNaPose(pose: Pose, desvio: Desvio | null, tempo: number): Pose {
  if (!desvio) return pose;
  const balanco = (amplitude: number, hz: number) => amplitude * Math.sin(2 * Math.PI * hz * tempo);
  switch (desvio) {
    case 'assimetria':
      // Peso jogado na perna direita: quadril e tronco vão para a direita.
      return { ...pose, deslocamentoLateral: pose.deslocamentoLateral - 0.05, inclinacaoLateral: pose.inclinacaoLateral - 7 };
    case 'desvio-lateral':
      return { ...pose, deslocamentoLateral: pose.deslocamentoLateral + 0.045, inclinacaoLateral: pose.inclinacaoLateral + 8 };
    case 'peso-na-ponta':
      return { ...pose, tronco: pose.tronco + 12 };
    case 'apoio-excessivo':
    case 'apoio-total':
      // Pendurado nas barras: tronco à frente, sobre as mãos.
      return { ...pose, tronco: pose.tronco + 7 };
    case 'oscilacao':
      return { ...pose, deslocamentoLateral: pose.deslocamentoLateral + balanco(0.025, 1.1), inclinacaoLateral: pose.inclinacaoLateral + balanco(4, 1.1) };
    case 'perda-de-equilibrio':
      return { ...pose, deslocamentoLateral: pose.deslocamentoLateral + balanco(0.045, 1.4), inclinacaoLateral: pose.inclinacaoLateral + balanco(9, 1.4) };
    default:
      return pose;
  }
}

export function regiaoDoDesvio(desvio: Desvio | null): RegiaoDoCorpo | null {
  switch (desvio) {
    case 'assimetria':
    case 'peso-na-ponta':
    case 'brusco':
      return 'pernas';
    case 'desvio-lateral':
    case 'oscilacao':
    case 'perda-de-equilibrio':
      return 'tronco';
    case 'apoio-excessivo':
    case 'apoio-total':
      return 'bracos';
    default:
      return null;
  }
}
