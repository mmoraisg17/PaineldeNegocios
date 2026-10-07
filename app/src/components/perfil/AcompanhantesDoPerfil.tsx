import { useRef, useState } from 'react';
import { type Vinculo } from '../../dominio';
import { autorizarVinculo, revogarVinculo, vinculosDoPraticante } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { ConviteDoPerfil } from './ConviteDoPerfil';
import { LinhaDoAcompanhante } from './LinhaDoAcompanhante';
import { Secao } from './Secao';

/* Perfil → Acompanhantes (manual 11): quem pediu, quem já acompanha, e o
   convite de novas pessoas. */
export function AcompanhantesDoPerfil({ praticanteId }: { praticanteId: string }) {
  const { estado, atualizar } = useApp();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [aviso, setAviso] = useState('');
  const vinculos = vinculosDoPraticante(estado, praticanteId);

  /* O botão apertado some quando a lista muda; sem mover o foco, o teclado e
     o leitor de tela cairiam no início da página. O título da seção é um ponto
     de partida estável, e o aviso (região "status") conta o que aconteceu. */
  const concluir = (mensagem: string) => {
    setAviso(mensagem);
    tituloRef.current?.focus();
  };

  const autorizar = (vinculo: Vinculo, nome: string) => {
    atualizar((e) => autorizarVinculo(e, vinculo.id, new Date()));
    concluir(`${nome} agora acompanha você.`);
  };

  const remover = (vinculo: Vinculo, nome: string) => {
    atualizar((e) => revogarVinculo(e, vinculo.id, new Date()));
    concluir(`Acesso de ${nome} removido.`);
  };

  return (
    <Secao titulo="Acompanhantes" tituloRef={tituloRef}>
      <p role="status" className={aviso ? 'rounded-botao bg-primaria-suave p-3 text-lg font-semibold text-primaria-escura' : 'sr-only'}>
        {aviso}
      </p>
      {vinculos.length === 0 ? (
        <p className="text-lg text-texto">Você ainda não autorizou ninguém. Ninguém vê os seus dados sem o seu convite.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vinculos.map(({ vinculo, acompanhante }) => (
            <LinhaDoAcompanhante key={vinculo.id} vinculo={vinculo} acompanhante={acompanhante} aoAutorizar={autorizar} aoRemover={remover} />
          ))}
        </ul>
      )}
      <ConviteDoPerfil praticanteId={praticanteId} />
    </Secao>
  );
}
