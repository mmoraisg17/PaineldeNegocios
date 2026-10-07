import { estadoInicial, type EstadoApp } from './estado';
import { sanearEstado } from './sanitizacao';

/* LIMITAÇÕES DESTE PROTÓTIPO (de segurança e privacidade):
   - Os dados, que são dados de saúde (LGPD), ficam em TEXTO CLARO no
     localStorage do aparelho. Não há criptografia nem senha: quem usa o mesmo
     navegador lê tudo. Aceitável só porque a demo roda com dados de exemplo.
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

/* O sufixo ":v1" acompanha VERSAO_DO_ESTADO. Se o formato mudar, a chave
   nova faz o app ignorar o dado antigo em vez de interpretá-lo errado. */
export const CHAVE_DO_ESTADO = 'app-equilibrio:v1';

/* Nunca lança: armazenamento ausente/bloqueado, JSON corrompido ou formato de
   topo desconhecido caem no estado inicial. Dentro de um estado reconhecível,
   o que estiver inválido (nível 5, item nulo, número NaN, id desconhecido,
   percepção inesperada) é descartado item a item por `sanearEstado`, para o
   resto do histórico sobreviver. Perder um item é melhor que o app abrir em
   branco ou quebrar uma tela. */
export function carregarEstado(armazenamento: Armazenamento | null | undefined): EstadoApp {
  if (!armazenamento) return estadoInicial();
  try {
    const texto = armazenamento.getItem(CHAVE_DO_ESTADO);
    if (texto === null) return estadoInicial();
    const lido: unknown = JSON.parse(texto);
    return sanearEstado(lido);
  } catch {
    return estadoInicial();
  }
}

/* Devolve se conseguiu gravar, em vez de lançar: cota cheia e modo privado
   são comuns, e a tela decide se avisa a pessoa. */
export function salvarEstado(armazenamento: Armazenamento | null | undefined, estado: EstadoApp): boolean {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(CHAVE_DO_ESTADO, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/* "Apagar meus dados" (manual, seção 13.2). Mexe só na chave do app. */
export function apagarDados(armazenamento: Armazenamento | null | undefined): boolean {
  if (!armazenamento) return false;
  try {
    armazenamento.removeItem(CHAVE_DO_ESTADO);
    return true;
  } catch {
    return false;
  }
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
