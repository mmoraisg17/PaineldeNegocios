import { bytesAleatoriosEmHex } from './aleatorio';
import type { PapelDaConta } from './estado';

/* Contas com e-mail e senha.

   O QUE ISTO É E NÃO É: o app não tem servidor. A senha é "derivada" (PBKDF2)
   e só o resultado fica no localStorage, então ninguém lê a senha ali. Mas a
   credencial mora no mesmo aparelho que os dados de saúde: quem tem acesso ao
   navegador pode apagá-la ou copiá-la para tentar adivinhar a senha por
   força bruta (o custo alto do PBKDF2 só encarece cada tentativa). Isso
   separa pessoas que dividem o aparelho; não substitui a autenticação de um
   servidor. Nunca guarde a senha em texto, nem em log, nem em mensagem de
   erro. */

export type Credencial = {
  /* Sempre normalizado (ver `normalizarEmail`). */
  email: string;
  papel: PapelDaConta;
  /* Id do praticante ou do acompanhante dono desta credencial. */
  pessoaId: string;
  /* 16 bytes aleatórios em hexadecimal: um por credencial, para duas pessoas
     com a mesma senha não terem o mesmo hash. */
  sal: string;
  /* PBKDF2-HMAC-SHA-256, 256 bits, em hexadecimal. */
  hash: string;
  /* Guardado junto para poder aumentar o custo no futuro sem invalidar as
     credenciais antigas. */
  iteracoes: number;
  criadaEm: string;
};

/* Sem regras de composição (maiúscula, símbolo...): o NIST 800-63B mostra que
   elas geram senhas piores. Só comprimento. */
export const TAMANHO_MINIMO_DA_SENHA = 8;
export const TAMANHO_MAXIMO_DA_SENHA = 128;
/* Limite do endereço de e-mail na RFC 5321. */
export const TAMANHO_MAXIMO_DO_EMAIL = 254;
/* Recomendação da OWASP (2023) para PBKDF2-HMAC-SHA-256. */
export const ITERACOES_DA_SENHA = 600_000;

/* Faixa de iterações aceita ao ler do aparelho. O localStorage é editável:
   sem teto, alguém (ou um erro) gravaria bilhões de iterações e o login
   travaria o aparelho; sem piso, um hash fraco passaria por válido. */
export const ITERACOES_MINIMAS_ACEITAS = 10_000;
export const ITERACOES_MAXIMAS_ACEITAS = 5_000_000;
export const BYTES_DO_SAL = 16;
export const BYTES_DO_HASH = 32;

const BITS_POR_BYTE = 8;

const FORMATO_DO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEXADECIMAL_COM_PARES = /^(?:[0-9a-f]{2})*$/i;

export type OpcoesDaCredencial = {
  gerarSal?: () => string;
  iteracoes?: number;
  subtle?: SubtleCrypto;
};

export function normalizarEmail(texto: string): string {
  return texto.trim().toLowerCase();
}

/* Formato simples (x@y.z): quem confirma de verdade que o endereço existe é
   um e-mail de confirmação, que o protótipo não tem. */
export function emailValido(texto: string): boolean {
  const email = normalizarEmail(texto);
  return email.length <= TAMANHO_MAXIMO_DO_EMAIL && FORMATO_DO_EMAIL.test(email);
}

/* Conta caracteres (e não unidades UTF-16): um emoji vale um. */
export function problemaDaSenha(senha: string): 'curta' | 'longa' | null {
  const tamanho = Array.from(senha).length;
  if (tamanho < TAMANHO_MINIMO_DA_SENHA) return 'curta';
  return tamanho > TAMANHO_MAXIMO_DA_SENHA ? 'longa' : null;
}

function hexParaBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (!HEXADECIMAL_COM_PARES.test(hex)) throw new Error('Valor hexadecimal inválido.');
  const bytes = new Uint8Array(hex.length / 2);
  for (let posicao = 0; posicao < bytes.length; posicao += 1) {
    bytes[posicao] = Number.parseInt(hex.slice(posicao * 2, posicao * 2 + 2), 16);
  }
  return bytes;
}

function bytesParaHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/* O WebCrypto só existe em contexto seguro (https ou localhost). Quem abre o
   app por http num endereço de rede cai aqui. É um erro PRÓPRIO para as telas
   não confundirem "o aparelho não consegue calcular o hash" com "senha errada". */
export class ErroSemCriptografia extends Error {
  constructor() {
    super('Este navegador não oferece criptografia segura (use HTTPS).');
    this.name = 'ErroSemCriptografia';
  }
}

export function temCriptografia(): boolean {
  const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;
  return subtle !== undefined;
}

function subtleDoNavegador(): SubtleCrypto {
  const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;
  if (!subtle) throw new ErroSemCriptografia();
  return subtle;
}

export async function derivarHash(
  senha: string,
  salHex: string,
  iteracoes: number,
  subtle: SubtleCrypto = subtleDoNavegador(),
): Promise<string> {
  const sal = hexParaBytes(salHex);
  const chave = await subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, BYTES_DO_HASH * BITS_POR_BYTE);
  return bytesParaHex(new Uint8Array(bits));
}

export async function criarCredencial(
  dados: { email: string; papel: PapelDaConta; pessoaId: string; senha: string },
  agora: Date,
  opcoes: OpcoesDaCredencial = {},
): Promise<Credencial> {
  const { gerarSal = () => bytesAleatoriosEmHex(BYTES_DO_SAL), iteracoes = ITERACOES_DA_SENHA, subtle } = opcoes;
  const sal = gerarSal();
  return {
    email: normalizarEmail(dados.email),
    papel: dados.papel,
    pessoaId: dados.pessoaId,
    sal,
    hash: await derivarHash(dados.senha, sal, iteracoes, subtle),
    iteracoes,
    criadaEm: agora.toISOString(),
  };
}

/* Compara sem parar no primeiro caractere diferente, para o tempo da conferência
   não revelar quantos caracteres do hash acertaram. O tamanho não é segredo. */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let posicao = 0; posicao < a.length; posicao += 1) {
    diferenca |= a.charCodeAt(posicao) ^ b.charCodeAt(posicao);
  }
  return diferenca === 0;
}

/* Credencial adulterada (sal que não é hexadecimal, por exemplo) conta como
   senha errada: quem chama mostra "e-mail ou senha incorretos" e pronto.
   Só a falta de WebCrypto NÃO vira "senha errada": o erro sobe para a tela
   avisar o que de fato acontece (a senha pode estar certa). */
export async function conferirSenha(credencial: Credencial, senha: string, subtle?: SubtleCrypto): Promise<boolean> {
  try {
    const hash = await derivarHash(senha, credencial.sal, credencial.iteracoes, subtle);
    return iguaisEmTempoConstante(hash, credencial.hash);
  } catch (erro) {
    if (erro instanceof ErroSemCriptografia) throw erro;
    return false;
  }
}

/* O e-mail é único POR PAPEL: a mesma pessoa pode ter uma conta de praticante
   e outra de acompanhante com o mesmo endereço. */
export function buscarCredencial(
  credenciais: readonly Credencial[],
  email: string,
  papel: PapelDaConta,
): Credencial | undefined {
  const procurado = normalizarEmail(email);
  return credenciais.find((credencial) => credencial.papel === papel && credencial.email === procurado);
}
