import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { useTituloDaTela } from '../hooks/useTituloDaTela';

/* Tela de erro das rotas. Para o usuário, "não encontrada" e "algo deu errado"
   pedem a mesma ação, voltar ao início, então as duas caem aqui com a mensagem
   certa e sem detalhe técnico na tela. */
export function NaoEncontrada() {
  const erro = useRouteError();
  const naoExiste = isRouteErrorResponse(erro) && erro.status === 404;
  const titulo = naoExiste ? 'Tela não encontrada' : 'Algo deu errado';
  const tituloRef = useTituloDaTela(titulo);

  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-4 px-6">
      <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold text-texto outline-none">
        {titulo}
      </h1>
      <p className="text-lg text-texto-suave">
        {naoExiste ? 'Este endereço não existe no app.' : 'Não foi possível abrir esta tela agora.'}
      </p>
      <Link to="/" className="flex min-h-14 items-center rounded-botao bg-primaria px-6 text-lg font-semibold text-sobre-primaria">
        Voltar ao início
      </Link>
    </main>
  );
}
