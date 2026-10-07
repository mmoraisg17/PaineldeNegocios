/* Escolha da voz dos avisos: sempre português do Brasil.

   A primeira versão pegava a primeira voz cujo idioma começasse com "pt", e
   no Windows ela costuma ser a de Portugal (pt-PT). Agora a ordem é:
   1. voz com idioma exatamente pt-BR (aceita "pt_BR" e maiúsculas/minúsculas);
   2. voz cujo nome diga Brasil/Brazil (alguns sistemas rotulam mal o idioma);
   3. nenhuma: o app só define lang = "pt-BR" e deixa o navegador escolher.
   Uma voz pt-PT nunca é escolhida, mesmo se for a única "pt" instalada. */
type VozDisponivel = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>;

const normalizar = (lang: string) => lang.replace('_', '-').toLowerCase();

export function escolherVozBrasileira<T extends VozDisponivel>(vozes: readonly T[]): T | undefined {
  const brasileiras = vozes.filter((v) => normalizar(v.lang) === 'pt-br');
  // Entre as brasileiras, prefere a instalada no aparelho: funciona sem
  // internet e responde mais rápido do que as vozes em nuvem.
  const local = brasileiras.find((v) => v.localService);
  if (local ?? brasileiras[0]) return local ?? brasileiras[0];
  return vozes.find((v) => /brasil|brazil/i.test(v.name) && !normalizar(v.lang).startsWith('pt-pt'));
}
