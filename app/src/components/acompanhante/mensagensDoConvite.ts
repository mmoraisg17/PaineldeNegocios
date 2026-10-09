import { VALIDADE_DO_CONVITE_EM_HORAS } from '../../dominio';
import type { ResultadoDoCodigo } from '../../estado/acoes';

export type ErroDoConvite = Extract<ResultadoDoCodigo, { ok: false }>['erro'];

/* Um texto só para o formulário e para a tela aberta pelo link: quem recebe o
   convite lê a mesma explicação nos dois caminhos. */
export const MENSAGEM_DE_ERRO_DO_CONVITE: Record<ErroDoConvite, string> = {
  'nao-encontrado': 'Não encontramos esse convite neste aparelho. Confira o código com o aluno ou peça um novo.',
  expirado: `Esse código venceu (ele vale ${VALIDADE_DO_CONVITE_EM_HORAS} horas). Peça ao aluno para gerar um novo.`,
  'convite-sem-aluno': 'Esse convite não está ligado a nenhum aluno. Peça ao aluno para gerar um código novo.',
};
