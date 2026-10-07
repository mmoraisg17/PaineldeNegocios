import { permissoesDoVinculo, type Convite, type TipoAcompanhante, type Vinculo } from './acompanhamento';
import type { Perfil } from './perfil';
import { montarRotina, type AjusteProfissional, type NiveisAtuais, type Rotina } from './rotina';
import type { Sessao } from './sessao';

/* Formato salvo no aparelho. Subir este número exige uma migração (ou, no
   protótipo, aceitar começar do zero): ver `carregarEstado`. */
export const VERSAO_DO_ESTADO = 1;

export type PapelDaConta = 'praticante' | 'acompanhante';

export type ContaAtual = { papel: PapelDaConta; id: string };

export type DadosPraticante = {
  id: string;
  idade?: number;
  perfil: Perfil;
  niveis: NiveisAtuais;
  sessoes: Sessao[];
  /* Rotina ajustada por um acompanhante profissional, se houver. */
  ajuste?: AjusteProfissional;
};

export type Acompanhante = {
  id: string;
  nome: string;
  tipo: TipoAcompanhante;
  /* Texto livre mostrado ao lado do nome: "Personal", "Fisioterapeuta", "Filha". */
  funcao: string;
};

/* Recado curto: a tela impõe no campo e o domínio corta ao gravar e ao ler
   do aparelho (localStorage adulterado não quebra a tela; fase 8). */
export const TAMANHO_MAXIMO_DO_RECADO = 280;

/* Mensagem de mão única do profissional para o praticante (sem chat). */
export type Recado = {
  id: string;
  deId: string;
  paraId: string;
  texto: string;
  enviadoEm: string;
  lido: boolean;
};

export type EstadoApp = {
  versao: typeof VERSAO_DO_ESTADO;
  contaAtual: ContaAtual | null;
  praticantes: Record<string, DadosPraticante>;
  acompanhantes: Acompanhante[];
  vinculos: Vinculo[];
  convites: Convite[];
  recados: Recado[];
};

/* Estado de "primeiro uso": ninguém entrou e não há dados. Devolve um objeto
   novo a cada chamada para dois chamadores nunca compartilharem (e
   alterarem) o mesmo vetor. */
export function estadoInicial(): EstadoApp {
  return {
    versao: VERSAO_DO_ESTADO,
    contaAtual: null,
    praticantes: {},
    acompanhantes: [],
    vinculos: [],
    convites: [],
    recados: [],
  };
}

/* O ajuste do profissional só vale enquanto ele tem vínculo autorizado com
   permissão de ajustar a rotina. Revogar o acesso (ou nunca ter sido
   autorizado) desliga o ajuste na hora: nível fixado, metas e selo "Ajustado
   por". O ajuste continua guardado no estado, mas não é mais aplicado. Sem
   `autorId` não há como conferir o vínculo, então também não vale. */
export function ajusteVigente(estado: EstadoApp, praticanteId: string): AjusteProfissional | undefined {
  const ajuste = estado.praticantes[praticanteId]?.ajuste;
  const autorId = ajuste?.autorId;
  if (!ajuste || autorId === undefined) return undefined;

  const autorizado = estado.vinculos.some(
    (vinculo) =>
      vinculo.alunoId === praticanteId &&
      vinculo.acompanhanteId === autorId &&
      permissoesDoVinculo(vinculo).ajustarRotina,
  );
  return autorizado ? ajuste : undefined;
}

/* Rotina do praticante já com a regra de vigência do ajuste. As telas devem
   usar esta função, e não `montarRotina` com `praticante.ajuste` direto. */
export function rotinaDoPraticante(estado: EstadoApp, praticanteId: string): Rotina | undefined {
  const praticante = estado.praticantes[praticanteId];
  if (!praticante) return undefined;
  return montarRotina(praticante.perfil, praticante.niveis, ajusteVigente(estado, praticanteId));
}
