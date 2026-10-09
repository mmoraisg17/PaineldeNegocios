import { afterEach, describe, expect, test, vi } from 'vitest';
import { TOLERANCIA_DA_META_EM_PONTOS, alertasDoAluno, podeVer, permissoes, revogar } from './acompanhamento';
import { CONTAS_DA_DEMO, SENHA_DA_DEMO, criarEstadoDemo, criarGeradorPseudoaleatorio, IDS_DEMO } from './demo';
import { ITERACOES_DA_SENHA, buscarCredencial, conferirSenha } from './credenciais';
import { carregarEstado, salvarEstado, type Armazenamento } from './persistencia';
import { buscarExercicio } from './catalogo';
import { ajusteVigente, rotinaDoPraticante } from './estado';
import { montarRotina } from './rotina';
import { notaDeExecucao } from './progressao';
import { semanaDeTreino, type ResultadoExercicio, type Sessao } from './sessao';
import { trilhaDoObjetivo } from './perfil';

const AGORA = new Date('2026-10-07T15:30:00.000Z');
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const SEMANAS = 6;
const PLANEJADAS_POR_SEMANA = 3;

afterEach(() => {
  vi.restoreAllMocks();
});

const demo = criarEstadoDemo(AGORA);
const lucia = demo.praticantes[IDS_DEMO.lucia];
const rafael = demo.praticantes[IDS_DEMO.rafael];

function exerciciosDe(sessoes: readonly Sessao[]): ResultadoExercicio[] {
  return sessoes.flatMap((sessao) => sessao.exercicios);
}

function media(valores: number[]): number {
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

function primeirasEUltimas(sessoes: readonly Sessao[], quantidade: number) {
  return {
    primeiras: exerciciosDe(sessoes.slice(0, quantidade)),
    ultimas: exerciciosDe(sessoes.slice(-quantidade)),
  };
}

describe('criarGeradorPseudoaleatorio', () => {
  test('a mesma semente gera sempre a mesma sequência', () => {
    const primeiro = criarGeradorPseudoaleatorio(42);
    const segundo = criarGeradorPseudoaleatorio(42);

    const a = Array.from({ length: 5 }, () => primeiro());
    const b = Array.from({ length: 5 }, () => segundo());

    expect(a).toEqual(b);
  });

  test('sementes diferentes geram sequências diferentes', () => {
    const a = criarGeradorPseudoaleatorio(1)();
    const b = criarGeradorPseudoaleatorio(2)();

    expect(a).not.toBe(b);
  });

  test('só devolve valores no intervalo [0, 1)', () => {
    const proximo = criarGeradorPseudoaleatorio(7);

    for (let tentativa = 0; tentativa < 1000; tentativa += 1) {
      const valor = proximo();
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });
});

describe('estado de demonstração: contas', () => {
  test('não escolhe nenhuma conta: quem entra é a tela inicial', () => {
    expect(demo.contaAtual).toBeNull();
  });

  test('tem Dona Lúcia (68, equilíbrio) e Rafael (34, joelho)', () => {
    expect(lucia).toMatchObject({ idade: 68, perfil: { nome: 'Dona Lúcia', objetivo: 'equilibrio' } });
    expect(rafael).toMatchObject({ idade: 34, perfil: { nome: 'Rafael', objetivo: 'joelho' } });
    expect(trilhaDoObjetivo(rafael?.perfil.objetivo ?? 'equilibrio')).toBe('fisio');
  });

  test('tem Carlos e Ana como profissionais e Marta como familiar', () => {
    const porId = Object.fromEntries(demo.acompanhantes.map((pessoa) => [pessoa.id, pessoa]));

    expect(porId[IDS_DEMO.carlos]).toMatchObject({ nome: 'Carlos', tipo: 'profissional', funcao: 'Personal' });
    expect(porId[IDS_DEMO.ana]).toMatchObject({ nome: 'Ana', tipo: 'profissional', funcao: 'Fisioterapeuta' });
    expect(porId[IDS_DEMO.marta]).toMatchObject({ nome: 'Marta', tipo: 'familiar', funcao: 'Filha' });
    expect(demo.acompanhantes).toHaveLength(3);
  });

  test('Carlos e Marta acompanham a Lúcia; Ana acompanha o Rafael; todos autorizados', () => {
    const pares = demo.vinculos.map((vinculo) => `${vinculo.acompanhanteId}->${vinculo.alunoId}`).sort();

    expect(pares).toEqual(['ana->rafael', 'carlos->lucia', 'marta->lucia']);
    expect(demo.vinculos.every(podeVer)).toBe(true);
  });

  test('o tipo de cada vínculo bate com o tipo do acompanhante (Marta só lê)', () => {
    for (const vinculo of demo.vinculos) {
      const pessoa = demo.acompanhantes.find((candidata) => candidata.id === vinculo.acompanhanteId);
      expect(vinculo.tipo).toBe(pessoa?.tipo);
    }
    const marta = demo.vinculos.find((vinculo) => vinculo.acompanhanteId === IDS_DEMO.marta);
    expect(permissoes(marta?.tipo ?? 'familiar').ajustarRotina).toBe(false);
  });

  test('começa sem convites pendentes', () => {
    expect(demo.convites).toEqual([]);
  });
});

describe('estado de demonstração: determinismo', () => {
  test('duas chamadas com a mesma data geram exatamente o mesmo estado', () => {
    expect(criarEstadoDemo(new Date(AGORA))).toEqual(demo);
  });

  test('não usa Math.random', () => {
    const espiao = vi.spyOn(Math, 'random');

    criarEstadoDemo(AGORA);

    expect(espiao).not.toHaveBeenCalled();
  });

  test('não altera a data recebida', () => {
    const data = new Date(AGORA);

    criarEstadoDemo(data);

    expect(data.getTime()).toBe(AGORA.getTime());
  });

  test('sobrevive a salvar e carregar do armazenamento (passa na validação)', () => {
    const dados = new Map<string, string>();
    const armazenamento: Armazenamento = {
      getItem: (chave) => dados.get(chave) ?? null,
      setItem: (chave, valor) => void dados.set(chave, valor),
      removeItem: (chave) => void dados.delete(chave),
    };

    salvarEstado(armazenamento, demo);

    expect(carregarEstado(armazenamento)).toEqual(demo);
  });
});

describe('estado de demonstração: histórico de 6 semanas', () => {
  test('a Lúcia tem 16 treinos (18 planejados, 2 faltas) e o Rafael 17 (1 falta)', () => {
    expect(lucia?.sessoes).toHaveLength(SEMANAS * PLANEJADAS_POR_SEMANA - 2);
    expect(rafael?.sessoes).toHaveLength(SEMANAS * PLANEJADAS_POR_SEMANA - 1);
  });

  test('todas as sessões caem nas últimas 6 semanas, em ordem cronológica, sem data futura', () => {
    for (const dados of [lucia, rafael]) {
      const instantes = (dados?.sessoes ?? []).map((sessao) => Date.parse(sessao.data));

      expect(instantes).toEqual([...instantes].sort((a, b) => a - b));
      expect(Math.max(...instantes)).toBeLessThanOrEqual(AGORA.getTime());
      expect(Math.min(...instantes)).toBeGreaterThan(AGORA.getTime() - SEMANAS * 7 * MS_POR_DIA);
    }
  });

  test('cada sessão traz os exercícios da rotina do praticante', () => {
    const idsEsperados = montarRotina(lucia!.perfil, {}).itens.map((item) => item.exercicioId);

    for (const sessao of lucia?.sessoes ?? []) {
      expect(sessao.exercicios.map((exercicio) => exercicio.id)).toEqual(idsEsperados);
    }
  });

  test('a nota de cada exercício é a nota de execução das suas próprias medidas', () => {
    for (const exercicio of exerciciosDe([...(lucia?.sessoes ?? []), ...(rafael?.sessoes ?? [])])) {
      expect(exercicio.nota).toBe(notaDeExecucao(exercicio));
    }
  });

  test('as medidas ficam dentro das faixas válidas', () => {
    for (const exercicio of exerciciosDe([...(lucia?.sessoes ?? []), ...(rafael?.sessoes ?? [])])) {
      expect(exercicio.simetria).toBeGreaterThanOrEqual(0);
      expect(exercicio.simetria).toBeLessThanOrEqual(100);
      expect(exercicio.estabilidade).toBeGreaterThanOrEqual(0);
      expect(exercicio.estabilidade).toBeLessThanOrEqual(100);
      expect(exercicio.apoioNasBarras).toBeGreaterThanOrEqual(0);
      expect(exercicio.apoioNasBarras).toBeLessThanOrEqual(1);
    }
  });

  test('a Lúcia evolui: nota de ~60 para ~85, apoio de ~0,35 para ~0,10, simetria melhora', () => {
    const { primeiras, ultimas } = primeirasEUltimas(lucia?.sessoes ?? [], 3);

    expect(media(primeiras.map((e) => e.nota))).toBeGreaterThan(55);
    expect(media(primeiras.map((e) => e.nota))).toBeLessThan(68);
    expect(media(ultimas.map((e) => e.nota))).toBeGreaterThan(80);
    expect(media(ultimas.map((e) => e.nota))).toBeLessThan(92);
    expect(media(primeiras.map((e) => e.apoioNasBarras))).toBeGreaterThan(0.28);
    expect(media(primeiras.map((e) => e.apoioNasBarras))).toBeLessThan(0.42);
    expect(media(ultimas.map((e) => e.apoioNasBarras))).toBeLessThan(0.15);
    expect(media(ultimas.map((e) => e.simetria))).toBeGreaterThan(media(primeiras.map((e) => e.simetria)) + 10);
  });

  test('o Rafael também evolui em nota, apoio e simetria', () => {
    const { primeiras, ultimas } = primeirasEUltimas(rafael?.sessoes ?? [], 3);

    expect(media(ultimas.map((e) => e.nota))).toBeGreaterThan(media(primeiras.map((e) => e.nota)) + 10);
    expect(media(ultimas.map((e) => e.apoioNasBarras))).toBeLessThan(media(primeiras.map((e) => e.apoioNasBarras)));
    expect(media(ultimas.map((e) => e.simetria))).toBeGreaterThan(media(primeiras.map((e) => e.simetria)));
  });

  test('a percepção acompanha a evolução: começa difícil/ok e termina fácil', () => {
    const sessoes = lucia?.sessoes ?? [];

    expect(sessoes.slice(0, 3).some((sessao) => sessao.percepcao !== 'facil')).toBe(true);
    expect(sessoes.at(-1)?.percepcao).toBe('facil');
  });
});

describe('estado de demonstração: níveis e rotina', () => {
  test('a Lúcia subiu de nível em ao menos um exercício pela regra do manual', () => {
    const niveis = Object.values(lucia?.niveis ?? {});

    expect(niveis.length).toBeGreaterThan(0);
    expect(niveis.every((nivel) => nivel >= 1 && nivel <= 3)).toBe(true);
    expect(niveis.some((nivel) => nivel > 1)).toBe(true);
  });

  test('a Lúcia treina nos níveis que o histórico registrou (o nível atual é o do último treino ou acima)', () => {
    const ultima = lucia?.sessoes.at(-1);

    for (const exercicio of ultima?.exercicios ?? []) {
      expect(lucia?.niveis[exercicio.id] ?? 1).toBeGreaterThanOrEqual(exercicio.nivel);
    }
  });

  test('a Ana fixou o miniagachamento do Rafael no nível 2, com meta de simetria 50', () => {
    expect(rafael?.ajuste).toMatchObject({
      autor: 'Ana',
      autorId: 'ana',
      niveisFixados: { 'miniagachamento-simetrico': 2 },
      metas: { 'miniagachamento-simetrico': { simetriaEsquerda: 50 } },
    });
  });

  test('o nível fixado nunca muda no histórico do Rafael', () => {
    const niveisDoMini = (rafael?.sessoes ?? []).flatMap((sessao) =>
      sessao.exercicios.filter((e) => e.id === 'miniagachamento-simetrico').map((e) => e.nivel),
    );

    expect(niveisDoMini.length).toBeGreaterThan(0);
    expect(new Set(niveisDoMini)).toEqual(new Set([2]));
  });

  test('a rotina do Rafael começa pelo joelho e mostra a meta e o nível fixado pela Ana', () => {
    const rotina = montarRotina(rafael!.perfil, rafael!.niveis, rafael!.ajuste);

    expect(rotina.itens.map((item) => item.exercicioId).slice(0, 2)).toEqual([
      'miniagachamento-simetrico',
      'descida-de-degrau',
    ]);
    expect(rotina.itens[0]).toMatchObject({ fixadoPor: 'Ana', meta: { simetriaEsquerda: 50 } });
    expect(rotina.ajustadoPor).toBe('Ana');
  });
});

describe('estado de demonstração: alertas e recados', () => {
  test('o Rafael tem exatamente 1 alerta ativo: simetria abaixo da meta da Ana', () => {
    const semana = semanaDeTreino(rafael!.sessoes, PLANEJADAS_POR_SEMANA, AGORA);

    const alertas = alertasDoAluno(rafael!.sessoes, semana, rafael!.ajuste?.metas);

    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({
      tipo: 'simetria-fora-da-meta',
      exercicioId: 'miniagachamento-simetrico',
    });
  });

  test('só o exercício com meta de simetria registra a carga na perna esquerda', () => {
    const comCarga = exerciciosDe(rafael?.sessoes ?? []).filter((e) => e.cargaEsquerda !== undefined);

    expect(comCarga.length).toBeGreaterThan(0);
    expect(new Set(comCarga.map((e) => e.id))).toEqual(new Set(['miniagachamento-simetrico']));
  });

  test('a carga na perna esquerda melhora ao longo das semanas, mas ainda fica fora da tolerância da meta', () => {
    const cargas = (rafael?.sessoes ?? []).flatMap((sessao) =>
      sessao.exercicios.flatMap((e) => (e.id === 'miniagachamento-simetrico' && e.cargaEsquerda !== undefined ? [e.cargaEsquerda] : [])),
    );

    expect(cargas.length).toBe(rafael?.sessoes.length);
    expect(media(cargas.slice(-3))).toBeGreaterThan(media(cargas.slice(0, 3)) + 4);
    expect(Math.abs(50 - (cargas.at(-1) ?? 50))).toBeGreaterThan(TOLERANCIA_DA_META_EM_PONTOS);
  });

  test('a Lúcia treinou na última semana e não tem nenhum alerta', () => {
    const semana = semanaDeTreino(lucia!.sessoes, PLANEJADAS_POR_SEMANA, AGORA);

    expect(semana.feitas).toBe(PLANEJADAS_POR_SEMANA);
    expect(alertasDoAluno(lucia!.sessoes, semana, lucia!.ajuste?.metas)).toEqual([]);
  });

  test('há 1 recado do Carlos para a Lúcia, ainda não lido', () => {
    expect(demo.recados).toHaveLength(1);
    expect(demo.recados[0]).toMatchObject({
      deId: IDS_DEMO.carlos,
      paraId: IDS_DEMO.lucia,
      lido: false,
    });
    expect(demo.recados[0]?.texto.length).toBeGreaterThan(0);
    expect(Date.parse(demo.recados[0]?.enviadoEm ?? '')).toBeLessThan(AGORA.getTime());
  });

  test('o recado vem de um profissional (quem pode enviar recados)', () => {
    const autor = demo.acompanhantes.find((pessoa) => pessoa.id === demo.recados[0]?.deId);

    expect(permissoes(autor?.tipo ?? 'familiar').enviarRecados).toBe(true);
  });
});

describe('estado de demonstração: vínculos, ajuste vigente e inclinação', () => {
  test('cada vínculo tem um id único que não deriva de aluno e acompanhante', () => {
    const ids = demo.vinculos.map((vinculo) => vinculo.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const vinculo of demo.vinculos) {
      expect(vinculo.id).not.toBe(`${vinculo.alunoId}:${vinculo.acompanhanteId}`);
    }
  });

  test('o ajuste da Ana está vigente enquanto o vínculo dela com o Rafael está autorizado', () => {
    expect(ajusteVigente(demo, IDS_DEMO.rafael)?.autor).toBe('Ana');
    expect(rotinaDoPraticante(demo, IDS_DEMO.rafael)?.ajustadoPor).toBe('Ana');
  });

  test('revogar o vínculo da Ana desliga o ajuste dela na hora', () => {
    const vinculos = demo.vinculos.map((vinculo) =>
      vinculo.acompanhanteId === IDS_DEMO.ana ? revogar(vinculo, AGORA) : vinculo,
    );
    const semAna = { ...demo, vinculos };

    expect(ajusteVigente(semAna, IDS_DEMO.rafael)).toBeUndefined();
    expect(rotinaDoPraticante(semAna, IDS_DEMO.rafael)?.ajustadoPor).toBeUndefined();
  });

  test('os níveis gravados e treinados nunca exigem mais inclinação do que a plataforma da pessoa tem', () => {
    for (const dados of [lucia, rafael]) {
      const maxima = dados?.perfil.inclinacaoMaxima ?? 0;
      const niveis = Object.entries(dados?.niveis ?? {});

      expect(niveis.length).toBeGreaterThan(0);
      for (const [id, nivel] of niveis) {
        expect(buscarExercicio(id)?.niveis[nivel].inclinacao).toBeLessThanOrEqual(maxima);
      }
      for (const exercicio of exerciciosDe(dados?.sessoes ?? [])) {
        expect(buscarExercicio(exercicio.id)?.niveis[exercicio.nivel].inclinacao).toBeLessThanOrEqual(maxima);
      }
    }
  });
});

describe('estado de demonstração: isolamento de referências', () => {
  test('cada chamada devolve objetos novos, sem compartilhar nada com chamadas anteriores', () => {
    const outro = criarEstadoDemo(AGORA);

    expect(outro.praticantes['lucia']?.perfil).not.toBe(lucia?.perfil);
    expect(outro.credenciais).not.toBe(demo.credenciais);
    expect(outro.credenciais[0]).not.toBe(demo.credenciais[0]);
    expect(outro.praticantes['rafael']?.ajuste).not.toBe(rafael?.ajuste);
    expect(outro.praticantes['rafael']?.ajuste?.metas).not.toBe(rafael?.ajuste?.metas);
    expect(outro.acompanhantes[0]).not.toBe(demo.acompanhantes[0]);
  });

  test('alterar o estado devolvido não contamina o estado da chamada seguinte', () => {
    const primeiro = criarEstadoDemo(AGORA);
    const nomeOriginal = primeiro.praticantes['lucia']?.perfil.nome;

    const perfil = primeiro.praticantes['lucia']?.perfil;
    if (perfil) {
      perfil.nome = 'ALTERADO';
    }
    const credencial = primeiro.credenciais[0];
    if (credencial) credencial.email = 'alterado@demo.test';
    const ajuste = primeiro.praticantes['rafael']?.ajuste;
    if (ajuste?.metas) ajuste.metas['miniagachamento-simetrico'] = { simetriaEsquerda: 99 };

    const segundo = criarEstadoDemo(AGORA);
    expect(segundo.praticantes['lucia']?.perfil.nome).toBe(nomeOriginal);
    expect(segundo.credenciais[0]?.email).toBe('lucia@demo.test');
    expect(segundo.praticantes['rafael']?.ajuste?.metas).toEqual({ 'miniagachamento-simetrico': { simetriaEsquerda: 50 } });
  });
});

describe('estado de demonstração: contas com senha', () => {
  test('a senha pública da demonstração é demo1234', () => {
    expect(SENHA_DA_DEMO).toBe('demo1234');
  });

  test('lista as 5 contas na ordem lucia, rafael, carlos, ana, marta', () => {
    expect(CONTAS_DA_DEMO).toEqual([
      { papel: 'praticante', pessoaId: 'lucia', email: 'lucia@demo.test' },
      { papel: 'praticante', pessoaId: 'rafael', email: 'rafael@demo.test' },
      { papel: 'acompanhante', pessoaId: 'carlos', email: 'carlos@demo.test' },
      { papel: 'acompanhante', pessoaId: 'ana', email: 'ana@demo.test' },
      { papel: 'acompanhante', pessoaId: 'marta', email: 'marta@demo.test' },
    ]);
  });

  test('cada conta da lista tem uma credencial com o mesmo e-mail, papel e pessoa', () => {
    for (const conta of CONTAS_DA_DEMO) {
      const credencial = buscarCredencial(demo.credenciais, conta.email, conta.papel);
      expect(credencial).toMatchObject({ email: conta.email, papel: conta.papel, pessoaId: conta.pessoaId });
    }
    expect(demo.credenciais).toHaveLength(CONTAS_DA_DEMO.length);
  });

  test('cada credencial aponta para uma pessoa que existe no estado', () => {
    for (const credencial of demo.credenciais) {
      const existe =
        credencial.papel === 'praticante'
          ? credencial.pessoaId in demo.praticantes
          : demo.acompanhantes.some((pessoa) => pessoa.id === credencial.pessoaId);
      expect(existe).toBe(true);
    }
  });

  test('usa sal diferente em cada conta, 600 mil iterações e valores em hexadecimal', () => {
    const sais = new Set(demo.credenciais.map((credencial) => credencial.sal));

    expect(sais.size).toBe(demo.credenciais.length);
    for (const credencial of demo.credenciais) {
      expect(credencial.iteracoes).toBe(ITERACOES_DA_SENHA);
      expect(credencial.sal).toMatch(/^[0-9a-f]{32}$/);
      expect(credencial.hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test('nenhum hash guarda a senha em texto', () => {
    expect(JSON.stringify(demo.credenciais)).not.toContain(SENHA_DA_DEMO);
  });

  test(
    'a senha demo1234 abre uma conta de praticante e uma de acompanhante, e outra senha não abre',
    async () => {
      const praticante = buscarCredencial(demo.credenciais, 'lucia@demo.test', 'praticante');
      const acompanhante = buscarCredencial(demo.credenciais, 'ana@demo.test', 'acompanhante');

      expect(praticante && (await conferirSenha(praticante, SENHA_DA_DEMO))).toBe(true);
      expect(acompanhante && (await conferirSenha(acompanhante, SENHA_DA_DEMO))).toBe(true);
      expect(praticante && (await conferirSenha(praticante, 'demo12345'))).toBe(false);
      expect(acompanhante && (await conferirSenha(acompanhante, 'Demo1234'))).toBe(false);
    },
    20000,
  );

  test(
    'as outras três contas também aceitam demo1234',
    async () => {
      for (const email of ['rafael@demo.test', 'carlos@demo.test', 'marta@demo.test']) {
        const papel = email.startsWith('rafael') ? 'praticante' : 'acompanhante';
        const credencial = buscarCredencial(demo.credenciais, email, papel);
        expect(credencial && (await conferirSenha(credencial, SENHA_DA_DEMO))).toBe(true);
      }
    },
    20000,
  );

  test('a rotina e o histórico das contas de demonstração seguem o mesmo sem a pergunta "o que há em casa"', () => {
    // Lúcia fica com a trilha inteira (4 exercícios); Rafael também (4, da trilha de fisio).
    expect(rotinaDoPraticante(demo, IDS_DEMO.lucia)?.itens).toHaveLength(4);
    expect(rotinaDoPraticante(demo, IDS_DEMO.rafael)?.itens).toHaveLength(4);
    expect(lucia?.sessoes).toHaveLength(16);
    expect(rafael?.sessoes).toHaveLength(17);
  });
});
