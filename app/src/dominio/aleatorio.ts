/* Fontes de aleatoriedade e de identificadores. Ficam num lugar só para os
   outros módulos poderem receber a função por parâmetro nos testes e usar a
   versão segura no app. */

const VALORES_DE_UM_UINT32 = 2 ** 32;
const BYTE_MAXIMO_MAIS_UM = 256;
const BITS_DA_VARIANTE = 0x3;
const VARIANTE_RFC_4122 = 0x8;
const NIBBLE_MAXIMO_MAIS_UM = 16;

/* Quantas vezes sorteamos de novo quando o valor já existe. Com 31^6 códigos
   possíveis, uma segunda tentativa já é rara; o limite só impede laço
   infinito se alguém injetar um sorteio constante. */
export const TENTATIVAS_PARA_VALOR_UNICO = 20;

/* Número em [0, 1) vindo de crypto.getRandomValues, que (ao contrário do
   Math.random) não é previsível a partir de valores anteriores. Sem crypto
   (ambiente muito antigo) cai no Math.random: o app continua funcionando. */
export function aleatorioSeguro(): number {
  const criptografia: Crypto | undefined = globalThis.crypto;
  if (typeof criptografia?.getRandomValues !== 'function') return Math.random();
  const [valor = 0] = criptografia.getRandomValues(new Uint32Array(1));
  return valor / VALORES_DE_UM_UINT32;
}

function digitoHexadecimal(): string {
  return Math.floor(aleatorioSeguro() * NIBBLE_MAXIMO_MAIS_UM).toString(NIBBLE_MAXIMO_MAIS_UM);
}

/* UUID v4 montado à mão, para ambientes sem crypto.randomUUID (Safari antigo,
   páginas sem HTTPS). */
function uuidManual(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (marca) => {
    if (marca === 'x') return digitoHexadecimal();
    const variante = (Math.floor(aleatorioSeguro() * BYTE_MAXIMO_MAIS_UM) & BITS_DA_VARIANTE) | VARIANTE_RFC_4122;
    return variante.toString(NIBBLE_MAXIMO_MAIS_UM);
  });
}

export function novoId(): string {
  const criptografia: Crypto | undefined = globalThis.crypto;
  return typeof criptografia?.randomUUID === 'function' ? criptografia.randomUUID() : uuidManual();
}

/* Repete `gerar` até achar um valor que `jaExiste` não conheça. Lança se
   esgotar as tentativas: é um defeito de quem injetou o gerador, não uma
   situação do usuário. */
export function gerarValorUnico<T>(gerar: () => T, jaExiste: (valor: T) => boolean, descricao: string): T {
  for (let tentativa = 0; tentativa < TENTATIVAS_PARA_VALOR_UNICO; tentativa += 1) {
    const candidato = gerar();
    if (!jaExiste(candidato)) return candidato;
  }
  throw new Error(`Não foi possível gerar ${descricao} único.`);
}
