import { useId, useState } from 'react';
import { APP_NAME } from '../../config/app';
import { type Convite, type TipoAcompanhante, VALIDADE_DO_CONVITE_EM_HORAS } from '../../dominio';
import { gerarConviteDe } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { formatarData } from '../../estado/formatos';
import { linkDoConvite } from '../../estado/linkDoConvite';
import { useAnuncio } from '../../hooks/useAnuncio';
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO } from './estilos';

const OPCOES: { valor: TipoAcompanhante; rotulo: string; detalhe: string }[] = [
  { valor: 'profissional', rotulo: 'Profissional', detalhe: 'Personal ou fisioterapeuta: vê, ajusta a rotina e envia recados' },
  { valor: 'familiar', rotulo: 'Familiar', detalhe: 'Só vê os relatórios' },
];

/* Soletrado com vírgulas para o leitor de tela dizer letra por letra ("A, B,
   7, K") em vez de tentar ler "AB7K" como palavra. */
const soletrar = (codigo: string): string => [...codigo].join(', ');

const TITULO_DO_ENVIO = `Convite para o ${APP_NAME}`;
const TEXTO_DO_ENVIO = `Convido você para acompanhar os meus treinos no ${APP_NAME}. Abra o link e entre como acompanhante.`;

/* Quem toca em "Cancelar" na folha de envio do aparelho faz o navegador
   recusar a promessa com AbortError: foi uma escolha, não uma falha. */
const foiCancelado = (erro: unknown): boolean =>
  typeof erro === 'object' && erro !== null && 'name' in erro && erro.name === 'AbortError';

const podeEnviarPeloAparelho = (): boolean => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const linkDoWhatsApp = (link: string): string => `https://wa.me/?text=${encodeURIComponent(`${TEXTO_DO_ENVIO} ${link}`)}`;

/* Código grande, link e os botões de envio. O aviso é um só (role="status"): o
   leitor de tela anuncia o último resultado, seja de cópia ou de envio. A região
   fica sempre montada (vazia e só para leitor de tela) e só o texto muda: muitos
   leitores não anunciam uma região criada já com conteúdo. */
function ConviteGerado({ convite }: { convite: Convite }) {
  const [aviso, anunciar] = useAnuncio();
  const link = linkDoConvite(window.location.href, convite.codigo);

  const copiar = async (texto: string, avisoDeSucesso: string, avisoDeFalha: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      anunciar(avisoDeSucesso);
    } catch {
      /* sem permissão ou sem a API (http, navegador antigo): o texto continua na tela */
      anunciar(avisoDeFalha);
    }
  };

  const enviarPeloAparelho = async () => {
    try {
      await navigator.share({ title: TITULO_DO_ENVIO, text: TEXTO_DO_ENVIO, url: link });
      anunciar('');
    } catch (erro) {
      if (foiCancelado(erro)) return;
      anunciar('Não deu para abrir o envio. Toque em "Copiar link" e mande por mensagem.');
    }
  };

  return (
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
      <button
        type="button"
        onClick={() => void copiar(convite.codigo, 'Código copiado.', 'Não deu para copiar. Anote o código ou tire uma foto da tela.')}
        className={BOTAO_SECUNDARIO}
      >
        Copiar código
      </button>

      <p className="mt-2 text-base font-semibold text-primaria-escura">Link do convite</p>
      <p className="w-full select-all break-all rounded-botao bg-superficie p-3 text-base text-texto">{link}</p>
      <button
        type="button"
        onClick={() =>
          void copiar(link, 'Link copiado.', 'Não deu para copiar o link. Toque e segure no link para copiar.')
        }
        className={BOTAO_SECUNDARIO}
      >
        Copiar link
      </button>
      {podeEnviarPeloAparelho() ? (
        <button type="button" onClick={() => void enviarPeloAparelho()} className={BOTAO_SECUNDARIO}>
          Enviar link
        </button>
      ) : null}
      <a href={linkDoWhatsApp(link)} target="_blank" rel="noopener noreferrer" className={BOTAO_SECUNDARIO}>
        Enviar pelo WhatsApp
      </a>

      <p role="status" className={aviso ? 'text-base font-semibold text-texto' : 'sr-only'}>
        {aviso}
      </p>
      <p className="text-base text-texto-suave">
        Envie o código ou o link. Ao abrir o link, a pessoa entra (ou cria a conta) como acompanhante e o pedido chega aqui
        para você autorizar.
      </p>
      <p className="text-base text-texto-suave">
        No protótipo, os dados ficam só neste aparelho: o link funciona aqui, no mesmo navegador.
      </p>
    </div>
  );
}

/* Convidar um acompanhante (manual 11.2): escolhe o tipo, o app gera o
   código de 6 caracteres e o link, e a pessoa usa um dos dois na tela dela. */
export function ConviteDoPerfil({ praticanteId }: { praticanteId: string }) {
  const { estado, atualizar } = useApp();
  const [tipo, setTipo] = useState<TipoAcompanhante>('profissional');
  const [convite, setConvite] = useState<Convite | null>(null);
  const idExplicacao = useId();

  /* Quem precisa do código na tela calcula com a função pura e só depois
     grava no estado, em vez de ler o convite de volta do estado. */
  const gerar = () => {
    const resultado = gerarConviteDe(estado, praticanteId, tipo, new Date());
    atualizar(() => resultado.estado);
    setConvite(resultado.convite);
  };

  return (
    <div className="flex flex-col gap-3 border-t-2 border-borda pt-4">
      <h3 className="text-xl font-bold text-texto">Convidar alguém</h3>
      <fieldset aria-describedby={idExplicacao} className="flex flex-col gap-2">
        <legend className="text-lg font-semibold text-texto">Quem você quer convidar?</legend>
        {OPCOES.map((opcao) => (
          <label
            key={opcao.valor}
            className="flex min-h-14 items-center gap-3 rounded-botao border-2 border-borda px-3 py-2 has-checked:border-marca has-checked:bg-primaria-suave"
          >
            <input
              type="radio"
              name="tipo-de-convite"
              value={opcao.valor}
              checked={tipo === opcao.valor}
              onChange={() => setTipo(opcao.valor)}
              className="size-6 shrink-0 accent-marca"
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

      {/* A chave faz um convite novo começar sem o aviso do anterior. */}
      {convite ? <ConviteGerado key={convite.codigo} convite={convite} /> : null}
    </div>
  );
}
