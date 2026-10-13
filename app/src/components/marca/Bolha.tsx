/* A bolha do Nivela: o ponto do "i" da logo (ver LogoNivela.tsx) como peça do
   sistema visual. Regra da marca: o rosa da bolha marca ONDE VOCÊ ESTÁ (um
   nível, uma posição no progresso), nunca enfeita. Tudo aqui é decorativo
   (aria-hidden): o texto ao lado diz o mesmo em palavras. */

const NIVEL_MAXIMO_PADRAO = 3;

/* Medidor de nível: uma bolha por degrau; as cheias são o nível atual (como o
   rosa do "i" sobre a haste). */
export function MedidorDeNivel({ nivel, maximo = NIVEL_MAXIMO_PADRAO }: { nivel: number; maximo?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1">
      {Array.from({ length: maximo }, (_, degrau) => (
        <span key={degrau} className={`size-3 rounded-full ${degrau < nivel ? 'bg-dado' : 'bg-dado-trilha'}`} />
      ))}
    </span>
  );
}

const DIAMETRO_DA_BOLHA = '1.25rem';

/* Barra de progresso no desenho da logo: haste de tinta com a bolha rosa na
   ponta. `valor` vai de 0 a 1. A bolha nunca sai da trilha, nem em 0 nem em 1. */
export function BarraComBolha({ valor }: { valor: number }) {
  const parte = Math.min(1, Math.max(0, Number.isFinite(valor) ? valor : 0));
  return (
    <div aria-hidden="true" className="relative mt-2 h-5 overflow-hidden rounded-full bg-dado-trilha">
      <div
        className="absolute inset-y-1 left-0 rounded-full bg-texto"
        style={{ width: `calc(${DIAMETRO_DA_BOLHA} / 2 + (100% - ${DIAMETRO_DA_BOLHA}) * ${parte})` }}
      />
      <span
        className="absolute inset-y-0 size-5 rounded-full bg-dado"
        style={{ left: `calc((100% - ${DIAMETRO_DA_BOLHA}) * ${parte})` }}
      />
    </div>
  );
}
