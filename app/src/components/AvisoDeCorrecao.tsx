import type { Avaliacao } from '../sensores';

const ESTILO = {
  ok: { caixa: 'bg-primaria-suave text-primaria-escura', icone: '✓', titulo: 'Tudo certo' },
  dica: { caixa: 'bg-primaria-suave text-primaria-escura', icone: '★', titulo: 'Muito bem' },
  atencao: { caixa: 'bg-alerta-fundo text-alerta-texto', icone: '!', titulo: 'Ajuste' },
  pare: { caixa: 'bg-perigo-fundo text-perigo', icone: '✋', titulo: 'Pare' },
} as const;

export const MENSAGEM_OK = 'Muito bem, continue assim';

/* O aviso que o praticante lê de longe: texto grande, cor E ícone E título
   (nunca só a cor, por causa de daltonismo e baixa visão). "Pare" é anunciado
   na hora pelo leitor de tela (alert); os outros, educadamente (status). */
export function AvisoDeCorrecao({ avaliacao }: { avaliacao: Avaliacao }) {
  const estilo = ESTILO[avaliacao.estado];
  const mensagem = avaliacao.correcao?.mensagem ?? MENSAGEM_OK;
  return (
    <div
      role={avaliacao.estado === 'pare' ? 'alert' : 'status'}
      data-estado={avaliacao.estado}
      className={`flex items-center gap-3 rounded-cartao px-4 py-3 transition-colors ${estilo.caixa}`}
    >
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-superficie/70 text-xl font-black">
        {estilo.icone}
      </span>
      <p className="text-lg leading-snug">
        <span className="block text-sm font-bold uppercase tracking-wide">{estilo.titulo}</span>
        <span className="font-semibold">{mensagem}</span>
      </p>
    </div>
  );
}
