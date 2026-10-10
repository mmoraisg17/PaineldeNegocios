import { NavLink } from 'react-router';
import { Fragment, type ReactNode } from 'react';

type Aba = { para: string; rotulo: string; icone: ReactNode };

/* Ícones em SVG inline: são quatro, simples, e assim o app não depende de uma
   biblioteca de ícones nem de requisição extra. currentColor deixa a cor com o
   estado ativo/inativo definido nas classes. */
const ICONE = {
  hoje: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>
  ),
  biblioteca: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v16H5zM10.5 4h4v16h-4zM16.2 4.6l3.6-1 3.2 15.6-3.6 1z" /></svg>
  ),
  progresso: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10h3.5v10zM10.25 20V5h3.5v15zM16.5 20v-7H20v7z" /></svg>
  ),
  perfil: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9m-8 9c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" /></svg>
  ),
};

export const ABAS_PRATICANTE: Aba[] = [
  { para: '/praticante/hoje', rotulo: 'Hoje', icone: ICONE.hoje },
  { para: '/praticante/biblioteca', rotulo: 'Biblioteca', icone: ICONE.biblioteca },
  { para: '/praticante/progresso', rotulo: 'Progresso', icone: ICONE.progresso },
  { para: '/praticante/perfil', rotulo: 'Perfil', icone: ICONE.perfil },
];

/* Alvo de toque de 56 px de altura (acima dos 48 px recomendados): parte do
   público tem tremor ou dedos menos precisos. O rótulo sempre aparece junto do
   ícone, porque ícone sozinho é adivinhação para quem não usa apps todo dia. */
export function BarraDeAbas({ abas, meio }: { abas: Aba[]; meio?: ReactNode }) {
  const posicaoDoMeio = Math.floor(abas.length / 2);
  return (
    <nav aria-label="Navegação principal" className="relative z-10 shrink-0 bg-barra pb-[env(safe-area-inset-bottom)]">
      {/* role="list" de propósito: o Safari tira a semântica de lista de <ul> sem marcadores. */}
      {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul role="list" className="grid" style={{ gridTemplateColumns: `repeat(${abas.length + (meio ? 1 : 0)}, minmax(0, 1fr))` }}>
        {abas.map((aba, posicao) => (
          <Fragment key={aba.para}>
            {meio && posicao === posicaoDoMeio ? meio : null}
          <li>
            <NavLink
              to={aba.para}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-sm tracking-tight ${
                  isActive ? 'font-bold text-sobre-barra' : 'font-semibold text-sobre-barra'
                }`
              }
            >
              {/* A aba ativa não depende só da cor nem do fundo (daltonismo, baixa
                  visão, modo de cores forçadas do Windows, que apaga fundos): a
                  pílula leva contorno claro (3:1 ou mais contra a barra) e o
                  rótulo fica sublinhado, além do negrito. */}
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-14 items-center justify-center rounded-full ${isActive ? 'bg-barra-ativa outline-2 -outline-offset-2 outline-sobre-barra' : ''}`}
                  >
                    <span className="size-6 fill-current">{aba.icone}</span>
                  </span>
                  <span className={isActive ? 'underline decoration-2 underline-offset-4' : ''}>{aba.rotulo}</span>
                </>
              )}
            </NavLink>
          </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
