import type { NivelDoMascote } from '../../dominio';
import { Mascote, type PoseDoMascote } from './Mascote';
import { COMO_SUBIR, FRASE_DO_NIVEL, NOME_DO_NIVEL, descricaoDoMascote } from './textos';

type Props = {
  nivel: NivelDoMascote;
  pose?: PoseDoMascote;
  /* Mostra a dica de como ele fica mais forte. */
  comDica?: boolean;
};

/* O estado do mascote em texto, ao lado do desenho: a animação nunca é a única
   forma de saber como ele está. */
export function CartaoDoMascote({ nivel, pose = 'parado', comDica = true }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-cartao bg-cartao-3 p-4">
      <Mascote nivel={nivel} pose={pose} tamanho={88} descricao={descricaoDoMascote(nivel)} className="shrink-0" />
      <div>
        <p className="text-base font-bold text-marca">{NOME_DO_NIVEL[nivel]}</p>
        <p className="mt-1 text-lg font-semibold text-texto">{FRASE_DO_NIVEL[nivel]}</p>
        {comDica ? <p className="mt-1 text-base text-texto-suave">{COMO_SUBIR[nivel]}</p> : null}
      </div>
    </div>
  );
}
