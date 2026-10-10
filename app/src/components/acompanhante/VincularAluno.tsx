import { useId, useRef, useState, type FormEvent } from 'react';
import { CODIGO_DO_CONVITE_TAMANHO } from '../../dominio';
import { usarCodigo } from '../../estado/acoes';
import { useApp } from '../../estado/ContextoApp';
import { codigoDoTexto } from '../../estado/linkDoConvite';
import { useAnuncio } from '../../hooks/useAnuncio';
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, CAMPO } from './estilos';
import { MENSAGEM_DE_ERRO_DO_CONVITE } from './mensagensDoConvite';
import { Icone } from '../Icone';

const DICA_DE_COLAR = 'Não deu para colar. Toque e segure no campo e escolha Colar.';
const SEM_CODIGO_NA_AREA = 'Não achamos um código no que foi copiado. Copie o código ou o link de novo.';

/* Só mostra "Colar" onde o navegador deixa ler a área de transferência (exige
   https e, em alguns aparelhos, uma permissão): sem a API, o toque longo no
   campo continua funcionando. */
const podeLerAreaDeTransferencia = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';

const ESTILO_DO_SUCESSO = 'rounded-botao bg-primaria-suave p-3 text-lg font-semibold text-primaria-escura';

/* Erro do convite (role="alert"): o leitor de tela anuncia na hora. Quando já
   está na tela desde a abertura (link vencido), é lido como parte da página. O
   sucesso é outra coisa: vai para a região de status fixa do formulário. */
export function AlertaDoConvite({ id, texto }: { id?: string; texto: string }) {
  return (
    <p id={id} role="alert" className="rounded-botao bg-perigo-fundo p-3 text-lg font-semibold text-perigo">
      <span aria-hidden="true">! </span>
      {texto}
    </p>
  );
}

type Props = {
  acompanhanteId: string;
  /* Código que já veio do link; passa pelo mesmo tratamento do que se digita. */
  valorInicial?: string;
  rotuloDoBotao?: string;
  /* Avisa a tela quando o pedido foi criado (ex.: para mostrar "Ver meus alunos"). */
  aoEnviar?: () => void;
  /* Depois do pedido criado, tira o formulário da tela (o botão não pode ser
     tocado de novo) e leva o foco à mensagem de sucesso. O pedido repetido já é
     idempotente no domínio; isto só poupa a pessoa de ver um botão que não serve. */
  esconderFormularioAposEnviar?: boolean;
};

/* Vincular-se a um aluno (manual 12.1) com o código ou o link que ele enviou.
   O pedido nasce pendente e só vale depois que o aluno autoriza. */
export function VincularAluno({
  acompanhanteId,
  valorInicial = '',
  rotuloDoBotao = 'Enviar pedido',
  aoEnviar,
  esconderFormularioAposEnviar = false,
}: Props) {
  const { estado, atualizar } = useApp();
  const [codigo, setCodigo] = useState(() => codigoDoTexto(valorInicial));
  /* Erro (role="alert") e sucesso (role="status") ficam separados: o sucesso, e o
     aviso de "colado", vão para uma região viva que NUNCA sai da tela. Muitos
     leitores só anunciam a região que já existia antes de o texto mudar. */
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, anunciar] = useAnuncio();
  const [concluido, setConcluido] = useState(false);
  /* Um ref (e não só estado) porque dois toques no mesmo instante rodam antes de
     a tela refazer o desenho: o segundo ainda veria o código preenchido. */
  const enviado = useRef(false);
  const botaoDeEnviar = useRef<HTMLButtonElement>(null);
  const regiaoDeStatus = useRef<HTMLParagraphElement>(null);
  const idCampo = useId();
  const idErro = useId();

  /* O campo guarda sempre o código já limpo: quem cola um link ou dita "abc 234"
     vê as 6 letras, e o resto some. */
  const aplicarCodigo = (texto: string) => {
    setCodigo(codigoDoTexto(texto));
    setErro(null);
    enviado.current = false;
  };

  /* Quem digita mexe no código: o aviso de "colado" ou de sucesso já não vale. */
  const digitarCodigo = (texto: string) => {
    aplicarCodigo(texto);
    anunciar('');
  };

  /* O aviso antigo sai junto, senão "colado" ficaria ao lado do erro. */
  const falhar = (texto: string) => {
    anunciar('');
    setErro(texto);
  };

  const colar = async () => {
    try {
      const encontrado = codigoDoTexto(await navigator.clipboard.readText());
      if (encontrado === '') {
        falhar(SEM_CODIGO_NA_AREA);
        return;
      }
      aplicarCodigo(encontrado);
      anunciar(`Código ${encontrado} colado.`);
      /* Foco no botão de enviar, e não no campo: a região de status já leu o
         código, e voltar ao campo faria o leitor de tela ler as 6 letras uma
         segunda vez. O passo seguinte de quem cola é enviar; para corrigir, é só
         voltar um item com o leitor (ou tocar no campo). */
      botaoDeEnviar.current?.focus();
    } catch {
      falhar(DICA_DE_COLAR);
    }
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (enviado.current) return;
    if (codigo.length !== CODIGO_DO_CONVITE_TAMANHO) {
      falhar(`Digite os ${CODIGO_DO_CONVITE_TAMANHO} caracteres do código.`);
      return;
    }
    /* Mesmo no erro o estado volta com os convites vencidos já limpos. */
    const { estado: novo, resultado } = usarCodigo(estado, codigo, acompanhanteId, new Date());
    atualizar(() => novo);
    if (!resultado.ok) {
      falhar(MENSAGEM_DE_ERRO_DO_CONVITE[resultado.erro]);
      return;
    }
    enviado.current = true;
    const aluno = estado.praticantes[resultado.vinculo.alunoId]?.perfil.nome ?? 'O aluno';
    setCodigo('');
    setErro(null);
    anunciar(
      resultado.vinculo.status === 'autorizado'
        ? `Você já acompanha ${aluno}.`
        : `Pedido enviado. Agora ${aluno} precisa autorizar no app.`,
    );
    if (esconderFormularioAposEnviar) {
      /* O botão focado vai sair da tela: o foco passa antes para a mensagem, que
         continua montada. */
      regiaoDeStatus.current?.focus();
      setConcluido(true);
    }
    aoEnviar?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {concluido ? null : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
          <label htmlFor={idCampo} className="text-lg font-semibold text-texto">
            Código ou link do convite
          </label>
          <input
            id={idCampo}
            type="text"
            value={codigo}
            autoComplete="off"
            autoCapitalize="characters"
            inputMode="text"
            spellCheck={false}
            aria-invalid={erro !== null}
            aria-describedby={erro !== null ? idErro : undefined}
            onChange={(evento) => digitarCodigo(evento.target.value)}
            className={`${CAMPO} min-h-16 text-center text-3xl font-bold tracking-[0.3em]`}
          />
          {podeLerAreaDeTransferencia() ? (
            <button type="button" onClick={() => void colar()} className={BOTAO_SECUNDARIO}>
              Colar
            </button>
          ) : null}
          <button ref={botaoDeEnviar} type="submit" className={BOTAO_PRINCIPAL}>
            {rotuloDoBotao}
          </button>
        </form>
      )}

      {erro !== null ? <AlertaDoConvite id={idErro} texto={erro} /> : null}
      <p
        ref={regiaoDeStatus}
        role="status"
        tabIndex={-1}
        className={aviso ? `${ESTILO_DO_SUCESSO} outline-none` : 'sr-only'}
      >
        {aviso ? <Icone nome="certo" className="mr-1 inline size-5 align-text-bottom" /> : null}
        {aviso}
      </p>
    </div>
  );
}
