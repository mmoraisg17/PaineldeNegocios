import { CONTAS_DA_DEMO, SENHA_DA_DEMO, buscarCredencial, type EstadoApp, type PapelDaConta } from '../../dominio';
import { useApp } from '../../estado/ContextoApp';

function nomeDaConta(estado: EstadoApp, papel: PapelDaConta, pessoaId: string): string | undefined {
  return papel === 'praticante'
    ? estado.praticantes[pessoaId]?.perfil.nome
    : estado.acompanhantes.find((pessoa) => pessoa.id === pessoaId)?.nome;
}

/* A senha da demonstração é pública de propósito: está escrita na tela para o
   avaliador testar sem pedir nada. "Usar" só preenche os campos; entrar
   continua sendo um toque em "Entrar", como numa conta de verdade. Só aparecem
   as contas que existem de fato neste aparelho. */
export function ContasDaDemo({ papel, aoUsar }: { papel: PapelDaConta; aoUsar: (email: string, senha: string) => void }) {
  const { estado } = useApp();
  const contas = CONTAS_DA_DEMO.filter(
    (conta) => conta.papel === papel && buscarCredencial(estado.credenciais, conta.email, papel),
  );
  if (contas.length === 0) return null;

  return (
    <details className="rounded-cartao border-2 border-borda bg-superficie px-4">
      <summary className="flex min-h-14 cursor-pointer items-center text-lg font-semibold text-marca">
        Contas de demonstração
      </summary>
      <div className="flex flex-col gap-3 pb-4">
        <p className="text-base text-texto-suave">
          Senha de todas: <strong className="text-texto">{SENHA_DA_DEMO}</strong>. Ela é pública: serve só para testar.
        </p>
        <ul className="flex flex-col gap-2">
          {contas.map((conta) => {
            const nome = nomeDaConta(estado, papel, conta.pessoaId) ?? conta.email;
            return (
              <li key={conta.pessoaId} className="flex items-center justify-between gap-3">
                <span className="text-base text-texto">{`${nome} · ${conta.email}`}</span>
                <button
                  type="button"
                  aria-label={`Usar conta de ${nome}`}
                  onClick={() => aoUsar(conta.email, SENHA_DA_DEMO)}
                  className="min-h-12 shrink-0 rounded-botao border-2 border-marca px-4 text-base font-semibold text-marca active:bg-primaria-suave"
                >
                  Usar
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
