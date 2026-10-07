/* Congela o valor e tudo que há dentro dele. Os dados do domínio são
   compartilhados (o catálogo é lido por todas as telas): congelar faz uma
   mutação acidental virar erro na hora, em vez de um bug que só aparece em
   outra tela. Vale para dados em JSON (objetos, vetores e primitivos). */
/* Cópia profunda para dados em JSON. Serve para entregar às telas um estado
   que não compartilha objetos com constantes de módulo (o estado da demo,
   por exemplo): quem alterar a cópia não contamina a próxima chamada. */
export function copiarProfundo<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

export function congelarProfundo<T>(valor: T): Readonly<T> {
  if (valor === null || typeof valor !== 'object' || Object.isFrozen(valor)) return valor;
  for (const filho of Object.values(valor)) congelarProfundo(filho);
  return Object.freeze(valor);
}
