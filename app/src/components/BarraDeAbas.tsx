import { NavLink } from 'react-router';
import type { ReactNode } from 'react';

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
export function BarraDeAbas({ abas }: { abas: Aba[] }) {
  return (
    <nav aria-label="Navegação principal" className="shrink-0 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)]">
      <ul role="list" className="grid grid-cols-4">
        {abas.map((aba) => (
          <li key={aba.para}>
            <NavLink
              to={aba.para}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-sm ${
                  isActive ? 'font-bold text-primaria' : 'font-semibold text-texto-suave'
                }`
              }
            >
              {/* A aba ativa não depende só da cor (daltonismo, baixa visão):
                  ganha uma pílula de fundo atrás do ícone e o rótulo em negrito. */}
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-14 items-center justify-center rounded-full ${isActive ? 'bg-primaria-suave' : ''}`}>
                    <span className="size-6 fill-current">{aba.icone}</span>
                  </span>
                  {aba.rotulo}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
