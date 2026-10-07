import { useId, useState } from 'react';
import { type Convite, type TipoAcompanhante, VALIDADE_DO_CONVITE_EM_HORAS } from '../../dominio';
import { gerarConviteDe } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { formatarData } from '../../estado/formatos';
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO } from './estilos';

const OPCOES: { valor: TipoAcompanhante; rotulo: string; detalhe: string }[] = [
  { valor: 'profissional', rotulo: 'Profissional', detalhe: 'Personal ou fisioterapeuta: vê, ajusta a rotina e envia recados' },
  { valor: 'familiar', rotulo: 'Familiar', detalhe: 'Só vê os relatórios' },
];

/* Soletrado com vírgulas para o leitor de tela dizer letra por letra ("A, B,
   7, K") em vez de tentar ler "AB7K" como palavra. */
const soletrar = (codigo: string): string => [...codigo].join(', ');

/* Convidar um acompanhante (manual 11.2): escolhe o tipo, o app gera o
   código de 6 caracteres, e a pessoa o digita na tela dela. */
export function ConviteDoPerfil({ praticanteId }: { praticanteId: string }) {
  const { estado, atualizar } = useApp();
  const [tipo, setTipo] = useState<TipoAcompanhante>('profissional');
  const [convite, setConvite] = useState<Convite | null>(null);
  const [aviso, setAviso] = useState('');
  const idExplicacao = useId();

  /* Quem precisa do código na tela calcula com a função pura e só depois
     grava no estado, em vez de ler o convite de volta do estado. */
  const gerar = () => {
    const resultado = gerarConviteDe(estado, praticanteId, tipo, new Date());
    atualizar(() => resultado.estado);
    setConvite(resultado.convite);
    setAviso('');
  };

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setAviso('Código copiado.');
    } catch {
      /* sem permissão ou sem a API (http, navegador antigo): o código continua na tela */
      setAviso('Não deu para copiar. Anote o código ou tire uma foto da tela.');
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t-2 border-borda pt-4">
      <h3 className="text-xl font-bold text-texto">Convidar alguém</h3>
      <fieldset aria-describedby={idExplicacao} className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-texto">Quem você quer convidar?</legend>
        {OPCOES.map((opcao) => (
          <label
            key={opcao.valor}
            className="flex min-h-14 items-center gap-3 rounded-botao border-2 border-borda px-3 py-2 has-checked:border-primaria has-checked:bg-primaria-suave"
          >
            <input
              type="radio"
              name="tipo-de-convite"
              value={opcao.valor}
              checked={tipo === opcao.valor}
              onChange={() => setTipo(opcao.valor)}
              className="size-6 shrink-0 accent-primaria"
            />
            <span>
              <span className="block text-lg font-semibold text-texto">{opcao.rotulo}</span>
              <span className="block text-base text-texto-suave">{opcao.detalhe}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p id={idExplicacao} className="text-base text-texto-suave">
        Ninguém vê os seus dados sem o seu convite, e você autoriza cada pessoa antes.
      </p>

      <button type="button" onClick={gerar} className={convite ? BOTAO_SECUNDARIO : BOTAO_PRINCIPAL}>
        {convite ? 'Gerar outro código' : 'Gerar código'}
      </button>

      {convite ? (
        <div className="flex flex-col items-center gap-2 rounded-cartao bg-primaria-suave p-4 text-center">
          <p className="text-base font-semibold text-primaria-escura">Código do convite</p>
          <span
            role="img"
            aria-label={`Código de convite: ${soletrar(convite.codigo)}`}
            className="block pl-[0.15em] text-4xl font-black tracking-[0.15em] text-primaria-escura"
          >
            {convite.codigo}
          </span>
          <p className="text-base text-texto">
            Válido por {VALIDADE_DO_CONVITE_EM_HORAS} horas, até {formatarData(convite.expiraEm)}
          </p>
          <button type="button" onClick={() => void copiar(convite.codigo)} className={BOTAO_SECUNDARIO}>
            Copiar código
          </button>
          {aviso ? (
            <p role="status" className="text-base font-semibold text-texto">
              {aviso}
            </p>
          ) : null}
          <p className="text-base text-texto-suave">
            Envie o código à pessoa. Quando ela digitar, o pedido aparece aqui em cima para você autorizar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
