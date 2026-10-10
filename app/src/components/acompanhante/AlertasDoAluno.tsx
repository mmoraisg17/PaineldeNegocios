import { useId } from 'react';
import type { Alerta } from '../../dominio';
import { CARTAO } from './estilos';
import { Icone } from '../Icone';

/* Alertas do manual 12.2. São pontos para conversar com o aluno, e o texto
   diz isso: o app acompanha o treino, não faz diagnóstico. Cada alerta leva
   ícone, rótulo "Atenção" e a frase, para não depender só da cor. */
export function AlertasDoAluno({ alertas }: { alertas: readonly Alerta[] }) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className={`${CARTAO} flex flex-col gap-3`}>
      <h2 id={idTitulo} className="text-2xl font-bold text-texto">
        Alertas
      </h2>
      {alertas.length === 0 ? (
        <p className="flex items-center gap-2 rounded-botao bg-primaria-suave p-3 text-lg font-semibold text-primaria-escura">
          <Icone nome="certo" className="size-5" />
          <span>Nenhum alerta no momento.</span>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alertas.map((alerta) => (
            <li
              key={`${alerta.tipo}-${alerta.exercicioId ?? ''}`}
              className="flex items-start gap-3 rounded-botao bg-alerta-fundo p-3 text-alerta-texto"
            >
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-superficie/70 text-lg font-black">
                !
              </span>
              <p className="text-lg">
                <span className="block text-sm font-bold uppercase tracking-wide">Atenção</span>
                <span className="font-semibold">{alerta.mensagem}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-base text-texto-suave">Alertas são pontos para conversar com o aluno. Não são diagnóstico.</p>
    </section>
  );
}
