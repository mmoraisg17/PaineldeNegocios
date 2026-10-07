import { type DadosPraticante, trilhaDoObjetivo } from '../../dominio';
import { ROTULO_DA_FIRMEZA, ROTULO_DA_TRILHA, ROTULO_DO_OBJETIVO } from '../../estado/formatos';
import { Secao } from './Secao';

/* Só leitura: o que a pessoa respondeu no primeiro uso. */
export function DadosDoPerfil({ praticante }: { praticante: DadosPraticante }) {
  const { perfil } = praticante;
  const dados = [
    { rotulo: 'Nome', valor: perfil.nome },
    { rotulo: 'Objetivo', valor: ROTULO_DO_OBJETIVO[perfil.objetivo] },
    { rotulo: 'Trilha', valor: ROTULO_DA_TRILHA[trilhaDoObjetivo(perfil.objetivo)] },
    { rotulo: 'Firmeza', valor: ROTULO_DA_FIRMEZA[perfil.firmeza] },
  ];
  return (
    <Secao titulo="Seus dados">
      <dl className="flex flex-col gap-2">
        {dados.map(({ rotulo, valor }) => (
          <div key={rotulo} className="flex flex-col">
            <dt className="text-base text-texto-suave">{rotulo}</dt>
            <dd className="text-lg font-semibold text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
    </Secao>
  );
}
