import { useId, useRef, useState } from 'react';
import { type Acompanhante, type Permissoes, type Vinculo, permissoes } from '../../dominio';
import { Confirmacao } from './Confirmacao';
import { BOTAO_DE_PERIGO, BOTAO_PRINCIPAL } from './estilos';

const NOME_DO_ACOMPANHANTE_REMOVIDO = 'Acompanhante';

function juntarComE(itens: readonly string[]): string {
  const ultimo = itens.at(-1);
  if (itens.length < 2 || ultimo === undefined) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${ultimo}`;
}

/* "O que cada um pode fazer" (manual 11.1), dito em frase. Num pedido ainda
   pendente fica no condicional, porque ainda não pode nada. */
export function descreverPermissoes(permitido: Permissoes, pendente: boolean): string {
  const acoes = [
    permitido.verRelatorios ? 'ver os relatórios' : null,
    permitido.ajustarRotina ? 'ajustar a rotina' : null,
    permitido.enviarRecados ? 'enviar recados' : null,
  ].filter((acao): acao is string => acao !== null);
  const verbo = pendente ? 'poderá' : 'pode';
  const nucleo = acoes.length === 1 ? `só ${verbo} ${acoes[0]}` : `${verbo} ${juntarComE(acoes)}`;
  const frase = `${pendente ? 'se você autorizar, ' : ''}${nucleo}.`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

type Props = {
  vinculo: Vinculo;
  acompanhante: Acompanhante | undefined;
  aoAutorizar: (vinculo: Vinculo, nome: string) => void;
  aoRemover: (vinculo: Vinculo, nome: string) => void;
};

/* Um acompanhante na lista do Perfil. O estado (pendente ou autorizado) vem
   escrito com ícone e texto, não só por cor. */
export function LinhaDoAcompanhante({ vinculo, acompanhante, aoAutorizar, aoRemover }: Props) {
  const idNome = useId();
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const [confirmando, setConfirmando] = useState(false);
  const nome = acompanhante?.nome ?? NOME_DO_ACOMPANHANTE_REMOVIDO;
  const pendente = vinculo.status === 'pendente';

  return (
    <li aria-labelledby={idNome} className="flex flex-col gap-2 rounded-cartao border-2 border-borda p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p id={idNome} className="text-xl font-bold text-texto">
            {nome}
          </p>
          {acompanhante ? <p className="text-base text-texto-suave">{acompanhante.funcao}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${pendente ? 'bg-alerta-fundo text-alerta-texto' : 'bg-primaria-suave text-primaria-escura'}`}
        >
          <span aria-hidden="true">{pendente ? '⏳ ' : '✓ '}</span>
          {pendente ? 'Pendente' : 'Autorizado'}
        </span>
      </div>

      {pendente ? <p className="text-lg font-semibold text-texto">{nome} pediu para acompanhar você</p> : null}
      <p className="text-base text-texto">{descreverPermissoes(permissoes(vinculo.tipo), pendente)}</p>

      {pendente ? (
        <button type="button" aria-label={`Autorizar ${nome}`} onClick={() => aoAutorizar(vinculo, nome)} className={BOTAO_PRINCIPAL}>
          Autorizar
        </button>
      ) : (
        <>
          <button
            ref={gatilhoRef}
            type="button"
            aria-label={`Remover acesso de ${nome}`}
            aria-expanded={confirmando}
            onClick={() => setConfirmando(true)}
            className={BOTAO_DE_PERIGO}
          >
            Remover acesso
          </button>
          {confirmando ? (
            <Confirmacao
              pergunta={`Remover o acesso de ${nome}?`}
              detalhe={`${nome} deixa de ver os seus dados na hora. Para voltar a acompanhar você, precisará de um convite novo.`}
              textoConfirmar="Sim, remover acesso"
              aoConfirmar={() => aoRemover(vinculo, nome)}
              aoCancelar={() => setConfirmando(false)}
              gatilho={gatilhoRef}
            />
          ) : null}
        </>
      )}
    </li>
  );
}
