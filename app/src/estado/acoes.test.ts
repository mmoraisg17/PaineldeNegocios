import { describe, expect, test } from 'vitest';
import { IDS_DEMO, criarEstadoDemo, estadoInicial, type Perfil, type ResultadoExercicio } from '../dominio';
import {
  alunosDe,
  autorizarVinculo,
  criarAcompanhante,
  criarPraticante,
  enviarRecado,
  entrar,
  gerarConviteDe,
  marcarRecadosLidos,
  recadosPara,
  recusarMudancaDeNivel,
  registrarSessao,
  revogarVinculo,
  sair,
  salvarAjuste,
  usarCodigo,
  vinculosDoPraticante,
} from './acoes';

const AGORA = new Date('2026-10-07T12:00:00.000Z');
const ids = (() => {
  let n = 0;
  return () => `id-${(n += 1)}`;
})();

const PERFIL: Perfil = { nome: 'Você', objetivo: 'equilibrio', firmeza: 'as-vezes', acessoriosEmCasa: ['cadeira'], inclinacaoMaxima: 3 };

const resultado = (id: ResultadoExercicio['id'], nota: number, nivel: 1 | 2 | 3 = 1): ResultadoExercicio => ({
  id,
  nivel,
  nota,
  simetria: nota,
  estabilidade: nota,
  apoioNasBarras: 0.05,
});

describe('conta', () => {
  test('entrar e sair trocam só a conta atual, sem mutar o estado recebido', () => {
    const inicial = estadoInicial();
    const dentro = entrar(inicial, { papel: 'praticante', id: 'x' });
    expect(dentro.contaAtual).toEqual({ papel: 'praticante', id: 'x' });
    expect(inicial.contaAtual).toBeNull();
    expect(sair(dentro).contaAtual).toBeNull();
  });
});

describe('criar praticante', () => {
  test('aplica o nível sugerido a todos os exercícios da trilha, limitado pela inclinação', () => {
    const { estado, id } = criarPraticante(estadoInicial(), { ...PERFIL, inclinacaoMaxima: 0 }, 3, ids);
    const niveis = estado.praticantes[id]!.niveis;
    expect(niveis['pes-em-linha']).toBe(3);
    // Transferência de peso pede inclinação nos níveis 2 e 3: com plataforma plana, fica no 1.
    expect(niveis['transferencia-de-peso']).toBe(1);
    expect(niveis['miniagachamento-simetrico']).toBeUndefined();
  });
});

describe('registrar sessão e evoluir', () => {
  test('sobe de nível após duas sessões boas, como no manual (8.2)', () => {
    const base = criarPraticante(estadoInicial(), PERFIL, 1, ids);
    const s1 = registrarSessao(base.estado, base.id, [resultado('pes-em-linha', 90)], 'ok', AGORA);
    expect(s1.decisoes[0]?.decisao.mudanca).toBe('mantem');
    const s2 = registrarSessao(s1.estado, base.id, [resultado('pes-em-linha', 88)], 'facil', AGORA);
    expect(s2.decisoes[0]?.decisao.mudanca).toBe('sobe');
    expect(s2.estado.praticantes[base.id]!.niveis['pes-em-linha']).toBe(2);
    expect(s2.estado.praticantes[base.id]!.sessoes).toHaveLength(2);
  });

  test('não muda o nível fixado pela fisioterapeuta enquanto o vínculo vale', () => {
    const demo = criarEstadoDemo(AGORA);
    const nivelAntes = demo.praticantes[IDS_DEMO.rafael]!.niveis['miniagachamento-simetrico'];
    let estado = demo;
    for (let i = 0; i < 3; i += 1) estado = registrarSessao(estado, IDS_DEMO.rafael, [resultado('miniagachamento-simetrico', 95, 2)], 'facil', AGORA).estado;
    expect(estado.praticantes[IDS_DEMO.rafael]!.niveis['miniagachamento-simetrico']).toBe(nivelAntes);
  });

  test('sem resultados ou praticante inexistente, nada muda', () => {
    const inicial = estadoInicial();
    expect(registrarSessao(inicial, 'ninguem', [resultado('pes-em-linha', 90)], 'ok', AGORA).estado).toBe(inicial);
  });

  test('a decisão guarda o nível anterior, para a pessoa poder recusar a mudança', () => {
    const base = criarPraticante(estadoInicial(), PERFIL, 1, ids);
    const s1 = registrarSessao(base.estado, base.id, [resultado('pes-em-linha', 90)], 'ok', AGORA);
    const s2 = registrarSessao(s1.estado, base.id, [resultado('pes-em-linha', 88)], 'facil', AGORA);
    expect(s2.decisoes[0]).toMatchObject({ nivelAnterior: 1, decisao: { nivel: 2, mudanca: 'sobe' } });
  });

  test('recusar a mudança devolve o nível anterior só daquele exercício (manual, 8.2)', () => {
    const base = criarPraticante(estadoInicial(), PERFIL, 1, ids);
    const s1 = registrarSessao(base.estado, base.id, [resultado('pes-em-linha', 90)], 'ok', AGORA);
    const s2 = registrarSessao(s1.estado, base.id, [resultado('pes-em-linha', 88)], 'facil', AGORA);
    const recusado = recusarMudancaDeNivel(s2.estado, base.id, 'pes-em-linha', 1);
    expect(recusado.praticantes[base.id]!.niveis['pes-em-linha']).toBe(1);
    expect(recusado.praticantes[base.id]!.sessoes).toHaveLength(2);
    expect(s2.estado.praticantes[base.id]!.niveis['pes-em-linha']).toBe(2); // sem mutar
  });

  test('recusar para praticante inexistente não muda nada', () => {
    const inicial = estadoInicial();
    expect(recusarMudancaDeNivel(inicial, 'ninguem', 'pes-em-linha', 1)).toBe(inicial);
  });
});

describe('convite → vínculo pendente → autorizar → revogar', () => {
  const preparar = () => {
    const p = criarPraticante(estadoInicial(), PERFIL, 1, ids);
    const a = criarAcompanhante(p.estado, { nome: 'Carlos', tipo: 'profissional', funcao: 'Personal' }, ids);
    return { estado: a.estado, alunoId: p.id, acompanhanteId: a.id };
  };

  test('fluxo completo do manual (11.2 e 12.1)', () => {
    const { estado, alunoId, acompanhanteId } = preparar();
    const { estado: comConvite, convite } = gerarConviteDe(estado, alunoId, 'profissional', AGORA);
    expect(convite.alunoId).toBe(alunoId);

    const uso = usarCodigo(comConvite, convite.codigo.toLowerCase(), acompanhanteId, AGORA);
    expect(uso.resultado.ok).toBe(true);
    if (!uso.resultado.ok) return;
    expect(uso.estado.convites).toHaveLength(0); // código consumido
    expect(alunosDe(uso.estado, acompanhanteId)).toHaveLength(0); // ainda pendente

    const autorizado = autorizarVinculo(uso.estado, uso.resultado.vinculo.id, AGORA);
    expect(alunosDe(autorizado, acompanhanteId)).toHaveLength(1);
    expect(vinculosDoPraticante(autorizado, alunoId)).toHaveLength(1);

    const revogado = revogarVinculo(autorizado, uso.resultado.vinculo.id, AGORA);
    expect(alunosDe(revogado, acompanhanteId)).toHaveLength(0);
    expect(vinculosDoPraticante(revogado, alunoId)).toHaveLength(0);
  });

  test('código inexistente ou expirado não cria vínculo', () => {
    const { estado, alunoId, acompanhanteId } = preparar();
    expect(usarCodigo(estado, 'ZZZZZZ', acompanhanteId, AGORA).resultado).toEqual({ ok: false, erro: 'nao-encontrado' });
    const { estado: comConvite, convite } = gerarConviteDe(estado, alunoId, 'familiar', AGORA);
    const depois = new Date(AGORA.getTime() + 49 * 3600 * 1000);
    expect(usarCodigo(comConvite, convite.codigo, acompanhanteId, depois).resultado).toEqual({ ok: false, erro: 'expirado' });
  });
});

describe('ajuste e recados', () => {
  const demo = () => criarEstadoDemo(AGORA);

  test('profissional autorizado ajusta a rotina; familiar não', () => {
    const ok = salvarAjuste(demo(), IDS_DEMO.carlos, IDS_DEMO.lucia, { niveisFixados: { 'pes-em-linha': 2 } });
    expect(ok.ok).toBe(true);
    expect(ok.estado.praticantes[IDS_DEMO.lucia]!.ajuste).toMatchObject({ autor: 'Carlos', autorId: IDS_DEMO.carlos });
    expect(salvarAjuste(demo(), IDS_DEMO.marta, IDS_DEMO.lucia, {}).ok).toBe(false);
  });

  test('recado: profissional envia, familiar não, texto vazio não, e some quando o vínculo é revogado', () => {
    const enviado = enviarRecado(demo(), IDS_DEMO.carlos, IDS_DEMO.lucia, '  Ótimo treino!  ', AGORA, ids);
    expect(enviado.ok).toBe(true);
    expect(recadosPara(enviado.estado, IDS_DEMO.lucia).some((r) => r.texto === 'Ótimo treino!' && r.autor === 'Carlos')).toBe(true);
    expect(enviarRecado(demo(), IDS_DEMO.marta, IDS_DEMO.lucia, 'Oi', AGORA, ids).ok).toBe(false);
    expect(enviarRecado(demo(), IDS_DEMO.carlos, IDS_DEMO.lucia, '   ', AGORA, ids).ok).toBe(false);

    const vinculoCarlos = enviado.estado.vinculos.find((v) => v.acompanhanteId === IDS_DEMO.carlos)!;
    const revogado = revogarVinculo(enviado.estado, vinculoCarlos.id, AGORA);
    expect(recadosPara(revogado, IDS_DEMO.lucia)).toEqual([]);
  });

  test('marcar recados como lidos', () => {
    const estado = marcarRecadosLidos(demo(), IDS_DEMO.lucia);
    expect(estado.recados.filter((r) => r.paraId === IDS_DEMO.lucia).every((r) => r.lido)).toBe(true);
    expect(marcarRecadosLidos(estado, IDS_DEMO.lucia)).toBe(estado);
  });
});
