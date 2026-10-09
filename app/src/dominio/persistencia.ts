import { estadoInicial, type EstadoApp } from './estado';
import { sanearContaDaSessao, sanearEstado } from './sanitizacao';

/* LIMITAÇÕES DESTE PROTÓTIPO (de segurança e privacidade):
   - Os dados, que são dados de saúde (LGPD), ficam em TEXTO CLARO no
     localStorage do aparelho. Não há criptografia: quem usa o mesmo navegador
     lê tudo. A senha da conta separa quem usa o app, mas não protege os dados
     gravados (ela é só derivada e conferida no próprio aparelho; ver
     credenciais.ts). Aceitável só porque a demo roda com dados de exemplo.
   - A "revogação" de um acompanhante é apenas um campo (`status: 'revogado'`)
     no mesmo armazenamento. Ela não impede, por si, que o dado seja lido: o
     controle de acesso vive no código. Por isso TODA leitura de dados de um
     praticante feita em nome de terceiros (profissional ou familiar) deve
     passar por `podeVer` / `permissoesDoVinculo`, e o ajuste de rotina por
     `ajusteVigente`. Num produto real, isso precisa virar autorização no
     servidor, com dados criptografados. */

/* Só o que o domínio usa do Storage do navegador. Receber isto (e não o
   `localStorage` direto) deixa os testes rodarem com um armazenamento falso e
   deixa o domínio livre de globais. */
export type Armazenamento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/* O sufixo ":v2" acompanha VERSAO_DO_ESTADO. Se o formato mudar, a chave
   nova faz o app ignorar o dado antigo em vez de interpretá-lo errado. */
export const CHAVE_DO_ESTADO = 'app-equilibrio:v2';

/* Chaves de versões que o app não lê mais. `apagarVersoesAntigas` as remove no
   arranque: dado de saúde não deve ficar esquecido no aparelho, sem que
   nenhuma tela o mostre nem permita apagá-lo. */
export const CHAVES_ANTIGAS: readonly string[] = ['app-equilibrio:v1'];

/* Quem não marca "manter conectado" fica conectado só enquanto a aba estiver
   aberta: a conta atual vai para o sessionStorage, que o navegador esvazia ao
   fechar a aba. */
export const CHAVE_DA_SESSAO = 'app-equilibrio:sessao:v2';

function lerContaDaSessao(sessao: Armazenamento | null | undefined): unknown {
  if (!sessao) return null;
  try {
    const texto = sessao.getItem(CHAVE_DA_SESSAO);
    return texto === null ? null : (JSON.parse(texto) as unknown);
  } catch {
    return null;
  }
}

/* Nunca lança: armazenamento ausente/bloqueado, JSON corrompido ou formato de
   topo desconhecido caem no estado inicial. Dentro de um estado reconhecível,
   o que estiver inválido (nível 5, item nulo, número NaN, id desconhecido,
   percepção inesperada) é descartado item a item por `sanearEstado`, para o
   resto do histórico sobreviver. Perder um item é melhor que o app abrir em
   branco ou quebrar uma tela.

   Se o estado do local não tem conta atual e a `sessao` guarda uma conta
   válida (alguém que entrou sem "manter conectado" e recarregou a página), essa
   conta volta, marcada com `manterConectado: false`. */
export function carregarEstado(
  armazenamento: Armazenamento | null | undefined,
  sessao?: Armazenamento | null,
): EstadoApp {
  if (!armazenamento) return estadoInicial();
  try {
    const texto = armazenamento.getItem(CHAVE_DO_ESTADO);
    if (texto === null) return estadoInicial();
    const lido: unknown = JSON.parse(texto);
    const estado = sanearEstado(lido);
    if (estado.contaAtual) return estado;
    const contaDaSessao = sanearContaDaSessao(lerContaDaSessao(sessao), estado);
    return contaDaSessao ? { ...estado, contaAtual: contaDaSessao } : estado;
  } catch {
    return estadoInicial();
  }
}

function tentar(operacao: () => void): boolean {
  try {
    operacao();
    return true;
  } catch {
    return false;
  }
}

/* "Manter conectado": com `manterConectado === false` (ausente vale `true`) a
   conta NÃO vai para o local: o local guarda o estado com `contaAtual: null` e
   a conta vai, sozinha, para a `sessao`. Nos outros casos o estado inteiro vai
   para o local e a conta antiga da sessão é apagada (quem sai, ou passa a
   manter a conexão, não deixa uma conta velha para trás).

   Devolve se conseguiu gravar tudo, em vez de lançar: cota cheia e modo
   privado são comuns, e a tela decide se avisa a pessoa. */
export function salvarEstado(
  armazenamento: Armazenamento | null | undefined,
  estado: EstadoApp,
  sessao?: Armazenamento | null,
): boolean {
  if (!armazenamento) return false;
  const conta = estado.contaAtual;
  const soNestaAba = conta !== null && conta.manterConectado === false;
  const noLocal: EstadoApp = soNestaAba ? { ...estado, contaAtual: null } : estado;

  const gravouLocal = tentar(() => armazenamento.setItem(CHAVE_DO_ESTADO, JSON.stringify(noLocal)));
  if (!sessao) return gravouLocal;
  const gravouSessao = tentar(() =>
    soNestaAba ? sessao.setItem(CHAVE_DA_SESSAO, JSON.stringify(conta)) : sessao.removeItem(CHAVE_DA_SESSAO),
  );
  return gravouLocal && gravouSessao;
}

/* "Apagar meus dados" (manual, seção 13.2). Mexe só nas chaves do app, e tenta
   as duas mesmo se a primeira falhar. */
export function apagarDados(armazenamento: Armazenamento | null | undefined, sessao?: Armazenamento | null): boolean {
  const apagouLocal = armazenamento ? tentar(() => armazenamento.removeItem(CHAVE_DO_ESTADO)) : false;
  const apagouSessao = sessao ? tentar(() => sessao.removeItem(CHAVE_DA_SESSAO)) : true;
  return apagouLocal && apagouSessao;
}

/* Remove os dados de versões que o app não lê mais (ver CHAVES_ANTIGAS). Tenta
   todas, mesmo se uma falhar; nunca lança. */
export function apagarVersoesAntigas(armazenamento: Armazenamento | null | undefined): boolean {
  if (!armazenamento) return false;
  const resultados = CHAVES_ANTIGAS.map((chave) => tentar(() => armazenamento.removeItem(chave)));
  return resultados.every(Boolean);
}

/* Em alguns navegadores só ler `localStorage` já lança SecurityError (cookies
   bloqueados, iframe sandbox). Por isso o acesso fica dentro do try. */
export function armazenamentoDoNavegador(escopo: { localStorage?: Storage } = globalThis): Armazenamento | null {
  try {
    return escopo.localStorage ?? null;
  } catch {
    return null;
  }
}

/* Igual a `armazenamentoDoNavegador`, mas para o sessionStorage. */
export function armazenamentoDaSessao(escopo: { sessionStorage?: Storage } = globalThis): Armazenamento | null {
  try {
    return escopo.sessionStorage ?? null;
  } catch {
    return null;
  }
}
