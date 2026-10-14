import { Component, type ReactNode, Suspense } from 'react';

/* Mostra o modelo 3D do desenho quando ele carrega. Enquanto carrega, e se o
   arquivo falhar (rede, cache), mostra a versão simples em caixas, para a cena
   nunca quebrar nem ficar sem plataforma ou banquinho. */
class SemModelo extends Component<{ reserva: ReactNode; children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };
  static getDerivedStateFromError() {
    return { falhou: true };
  }
  render() {
    return this.state.falhou ? this.props.reserva : this.props.children;
  }
}

export function ModeloComReserva({ reserva, children }: { reserva: ReactNode; children: ReactNode }) {
  return (
    <SemModelo reserva={reserva}>
      <Suspense fallback={reserva}>{children}</Suspense>
    </SemModelo>
  );
}
