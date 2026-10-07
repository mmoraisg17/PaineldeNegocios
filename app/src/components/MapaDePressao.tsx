import type { Esperado, EstadoDaExecucao, Leitura } from '../sensores';

/* Vista de cima da plataforma, como na tela S1 do Figma: quatro sensores nos
   cantos, o ponto do centro de pressão e a barra esquerda/direita.

   Orientação: o praticante olha para o topo da tela, então a esquerda dele é
   a esquerda da tela e a ponta dos pés fica para cima. */
const L = 300;
const A = 200;
const CX = L / 2;
const CY = A / 2;
const ALCANCE_X = 112; // px por unidade de copML
const ALCANCE_Y = 72; // px por unidade de copAP

const paraTela = (ml: number, ap: number) => ({ x: CX - ml * ALCANCE_X, y: CY - ap * ALCANCE_Y });

const COR_DO_PONTO: Record<EstadoDaExecucao, string> = {
  ok: 'fill-primaria',
  dica: 'fill-primaria',
  atencao: 'fill-alerta-texto',
  pare: 'fill-perigo',
};

export function MapaDePressao({ leitura, esperado, estado }: { leitura: Leitura; esperado: Esperado; estado: EstadoDaExecucao }) {
  const ponto = paraTela(leitura.copML, leitura.copAP);
  const zona = paraTela(esperado.copML, esperado.copAP);
  const esquerda = Math.round(leitura.cargaEsquerda * 100);
  const direita = 100 - esquerda;
  const apoio = Math.round(leitura.maos * 100);

  return (
    <section aria-labelledby="titulo-mapa" className="rounded-cartao border border-borda bg-superficie p-4">
      <h2 id="titulo-mapa" className="text-base font-semibold text-texto-suave">
        Vista de cima da plataforma
      </h2>
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Centro do seu peso: ${esquerda}% na esquerda e ${direita}% na direita. Apoio nas barras: ${apoio}%.`}
      >
        <rect x="8" y="6" width={L - 16} height={A - 12} rx="18" className="fill-fundo stroke-borda" strokeWidth="2" />
        <text x={CX} y="22" textAnchor="middle" className="fill-texto-suave text-[11px]">frente</text>
        <line x1={CX} y1="30" x2={CX} y2={A - 16} className="stroke-borda" strokeDasharray="5 5" />
        <line x1="22" y1={CY} x2={L - 22} y2={CY} className="stroke-borda" strokeDasharray="5 5" />
        {[
          [30, 26],
          [L - 30, 26],
          [30, A - 26],
          [L - 30, A - 26],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="7" className="fill-texto-suave" />
        ))}
        {/* Zona da execução certa naquele instante (ou o alvo, na transferência de peso) */}
        <circle
          cx={zona.x}
          cy={zona.y}
          r={esperado.alvo ? 20 : 26}
          className={esperado.alvo ? 'fill-none stroke-primaria' : 'fill-primaria-suave stroke-primaria/30'}
          strokeWidth={esperado.alvo ? 3 : 1.5}
          strokeDasharray={esperado.alvo ? '6 4' : undefined}
        />
        <g style={{ transform: `translate(${ponto.x}px, ${ponto.y}px)`, transition: 'transform 100ms linear' }}>
          <circle r="13" className={`${COR_DO_PONTO[estado]} transition-colors`} />
          <circle r="5" className="fill-superficie" />
        </g>
      </svg>

      <div className="mt-3 flex justify-between text-lg font-semibold tabular">
        <span>Esquerda {esquerda}%</span>
        <span>Direita {direita}%</span>
      </div>
      <div className="mt-1 flex h-3 gap-1" aria-hidden="true">
        <div className="rounded-full bg-texto-suave transition-[flex-grow]" style={{ flexGrow: esquerda }} />
        <div className="rounded-full bg-primaria transition-[flex-grow]" style={{ flexGrow: direita }} />
      </div>

      <div className="mt-4 flex items-center justify-between text-base">
        <span className="font-semibold">Apoio nas barras</span>
        <span className="tabular font-semibold">{apoio}%</span>
      </div>
      <div className="mt-1 h-3 rounded-full bg-fundo" aria-hidden="true">
        <div
          className={`h-3 rounded-full transition-[width] ${apoio > 40 ? 'bg-perigo' : apoio > 20 ? 'bg-alerta-texto' : 'bg-primaria'}`}
          style={{ width: `${Math.min(100, apoio)}%` }}
        />
      </div>
    </section>
  );
}
