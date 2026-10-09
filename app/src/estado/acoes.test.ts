import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  IDS_DEMO,
  SENHA_DA_DEMO,
  criarCredencial,
  criarEstadoDemo,
  estadoInicial,
  precisaDoPrimeiroUso,
  type Credencial,
  type EstadoApp,
  type Perfil,
  type ResultadoExercicio,
} from '../dominio';
import {
  alunosDe,
  autorizarVinculo,
  cadastrarAcompanhante,
  cadastrarPraticante,
  criarAcompanhante,
  criarPraticante,
  destinoDepoisDeEntrar,
  enviarRecado,
  entrar,
  entrarComSenha,
  gerarConviteDe,
  marcarRecadosLidos,
  recadosPara,
  recusarMudancaDeNivel,
  registrarSessao,
  revogarVinculo,
  sair,
  salvarAjuste,
  usarCodigo,
  validarCadastro,
  vinculosDoPraticante,
} from './acoes';

const AGORA = new Date('2026-10-07T12:00:00.000Z');
const ids = (() => {
  let n = 0;
  return () => `id-${(n += 1)}`;
})();

const PERFIL: Perfil = { nome: 'Você', objetivo: 'equilibrio', firmeza: 'as-vezes', inclinacaoMaxima: 3 };

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

/* ---------- contas com e-mail e senha ---------- */

const ITERACOES_RAPIDAS = 1_000;
const SENHA = 'senha-forte-1';

async function credencialDe(
  papel: 'praticante' | 'acompanhante',
  email = 'pessoa@exemplo.com',
  pessoaId = 'pessoa-1',
  senha = SENHA,
): Promise<Credencial> {
  return criarCredencial({ email, papel, pessoaId, senha }, AGORA, { iteracoes: ITERACOES_RAPIDAS });
}

describe('validarCadastro', () => {
  const valido = { email: 'nova@exemplo.com', senha: SENHA, papel: 'praticante' } as const;

  test('aceita e-mail e senha corretos', () => {
    expect(validarCadastro(estadoInicial(), valido)).toBeNull();
  });

  test.each(['', 'sem-arroba', 'a@b', 'com espaco@exemplo.com'])('recusa o e-mail %j', (email) => {
    expect(validarCadastro(estadoInicial(), { ...valido, email })).toBe('email-invalido');
  });

  test('recusa senha curta e senha longa', () => {
    expect(validarCadastro(estadoInicial(), { ...valido, senha: '1234567' })).toBe('senha-curta');
    expect(validarCadastro(estadoInicial(), { ...valido, senha: 'a'.repeat(129) })).toBe('senha-longa');
  });

  test('o e-mail inválido vem antes do problema da senha', () => {
    expect(validarCadastro(estadoInicial(), { email: 'x', senha: '1', papel: 'praticante' })).toBe('email-invalido');
  });

  test('recusa e-mail que já tem conta do mesmo papel, mesmo escrito com maiúsculas e espaços', () => {
    const estado = criarEstadoDemo(AGORA);

    expect(validarCadastro(estado, { ...valido, email: '  LUCIA@demo.test ' })).toBe('email-em-uso');
  });

  test('o mesmo e-mail pode ter conta de papel diferente', () => {
    const estado = criarEstadoDemo(AGORA);

    expect(validarCadastro(estado, { email: 'lucia@demo.test', senha: SENHA, papel: 'acompanhante' })).toBeNull();
  });
});

describe('cadastrarPraticante', () => {
  test('guarda a credencial e entra com o id dela, sem criar o praticante (a triagem ainda vem)', async () => {
    const credencial = await credencialDe('praticante');
    const inicial = estadoInicial();

    const estado = cadastrarPraticante(inicial, credencial, true);

    expect(estado.credenciais).toEqual([credencial]);
    expect(estado.contaAtual).toEqual({ papel: 'praticante', id: 'pessoa-1', manterConectado: true });
    expect(estado.praticantes).toEqual({});
    expect(precisaDoPrimeiroUso(estado)).toBe(true);
  });

  test('registra manterConectado false', async () => {
    const estado = cadastrarPraticante(estadoInicial(), await credencialDe('praticante'), false);

    expect(estado.contaAtual?.manterConectado).toBe(false);
  });

  test('não altera o estado recebido', async () => {
    const inicial = estadoInicial();

    cadastrarPraticante(inicial, await credencialDe('praticante'), true);

    expect(inicial.credenciais).toEqual([]);
    expect(inicial.contaAtual).toBeNull();
  });

  test('toque duplo: com a credencial já guardada, devolve o mesmo estado', async () => {
    const credencial = await credencialDe('praticante');
    const uma = cadastrarPraticante(estadoInicial(), credencial, true);

    const duas = cadastrarPraticante(uma, credencial, true);

    expect(duas).toBe(uma);
    expect(duas.credenciais).toHaveLength(1);
  });

  test('o e-mail já usado (outro id, outro hash) não substitui nem duplica a credencial', async () => {
    const primeira = await credencialDe('praticante', 'a@exemplo.com', 'um');
    const outra = await credencialDe('praticante', 'A@exemplo.com', 'dois', 'outra-senha-1');
    const estado = cadastrarPraticante(estadoInicial(), primeira, true);

    const depois = cadastrarPraticante(estado, outra, true);

    expect(depois).toBe(estado);
    expect(depois.credenciais[0]?.pessoaId).toBe('um');
  });

  test('o mesmo e-mail como acompanhante não conta como duplicado', async () => {
    const comoAcompanhante = cadastrarAcompanhante(
      estadoInicial(),
      { nome: 'Pessoa', tipo: 'familiar', funcao: '' },
      await credencialDe('acompanhante', 'a@exemplo.com', 'ac-1'),
      true,
    );

    const estado = cadastrarPraticante(comoAcompanhante, await credencialDe('praticante', 'a@exemplo.com', 'pr-1'), true);

    expect(estado.credenciais).toHaveLength(2);
    expect(estado.contaAtual).toMatchObject({ papel: 'praticante', id: 'pr-1' });
  });

  test('o praticante nasce no fim da triagem com o id da credencial e deixa de precisar do primeiro uso', async () => {
    const credencial = await credencialDe('praticante');
    const cadastrado = cadastrarPraticante(estadoInicial(), credencial, true);

    const { estado, id } = criarPraticante(cadastrado, PERFIL, 1, () => credencial.pessoaId);

    expect(id).toBe('pessoa-1');
    expect(estado.praticantes['pessoa-1']).toBeDefined();
    expect(precisaDoPrimeiroUso(estado)).toBe(false);
  });
});

describe('cadastrarAcompanhante', () => {
  const dados = { nome: '  Dra.   Ana  ', tipo: 'profissional', funcao: ' Fisioterapeuta ' } as const;

  test('cria o acompanhante com o id da credencial, guarda a credencial e entra', async () => {
    const credencial = await credencialDe('acompanhante', 'ana@exemplo.com', 'ac-9');

    const estado = cadastrarAcompanhante(estadoInicial(), dados, credencial, false);

    expect(estado.acompanhantes).toEqual([{ id: 'ac-9', nome: 'Dra. Ana', tipo: 'profissional', funcao: 'Fisioterapeuta' }]);
    expect(estado.credenciais).toEqual([credencial]);
    expect(estado.contaAtual).toEqual({ papel: 'acompanhante', id: 'ac-9', manterConectado: false });
  });

  test.each([
    ['profissional', 'Profissional'],
    ['familiar', 'Familiar'],
  ] as const)('função vazia de %s vira "%s"', async (tipo, funcaoPadrao) => {
    const credencial = await credencialDe('acompanhante');

    const estado = cadastrarAcompanhante(estadoInicial(), { nome: 'Pessoa', tipo, funcao: '   ' }, credencial, true);

    expect(estado.acompanhantes[0]?.funcao).toBe(funcaoPadrao);
  });

  test('corta nome e função nos tamanhos máximos', async () => {
    const estado = cadastrarAcompanhante(
      estadoInicial(),
      { nome: 'N'.repeat(100), tipo: 'familiar', funcao: 'F'.repeat(100) },
      await credencialDe('acompanhante'),
      true,
    );

    expect(estado.acompanhantes[0]?.nome).toHaveLength(40);
    expect(estado.acompanhantes[0]?.funcao).toHaveLength(30);
  });

  test('toque duplo: não duplica o acompanhante nem a credencial', async () => {
    const credencial = await credencialDe('acompanhante');
    const uma = cadastrarAcompanhante(estadoInicial(), dados, credencial, true);

    const duas = cadastrarAcompanhante(uma, dados, credencial, true);

    expect(duas).toBe(uma);
    expect(duas.acompanhantes).toHaveLength(1);
  });

  test('não altera o estado recebido', async () => {
    const inicial = estadoInicial();

    cadastrarAcompanhante(inicial, dados, await credencialDe('acompanhante'), true);

    expect(inicial.acompanhantes).toEqual([]);
    expect(inicial.credenciais).toEqual([]);
  });
});

describe('entrarComSenha', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function estadoComContas(): Promise<EstadoApp> {
    const praticante = await credencialDe('praticante', 'lucia@exemplo.com', 'lucia-1');
    const acompanhante = await credencialDe('acompanhante', 'carlos@exemplo.com', 'carlos-1');
    const comPraticante = cadastrarPraticante(estadoInicial(), praticante, true);
    const comAcompanhante = cadastrarAcompanhante(
      comPraticante,
      { nome: 'Carlos', tipo: 'profissional', funcao: '' },
      acompanhante,
      true,
    );
    return sair(comAcompanhante);
  }

  test('com e-mail e senha certos devolve a conta, sem mexer no estado', async () => {
    const estado = await estadoComContas();

    const login = await entrarComSenha(estado, {
      email: 'carlos@exemplo.com',
      senha: SENHA,
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: true, conta: { papel: 'acompanhante', id: 'carlos-1', manterConectado: true } });
    expect(estado.contaAtual).toBeNull();
  });

  test('ignora maiúsculas e espaços no e-mail', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: '  Carlos@Exemplo.COM ',
      senha: SENHA,
      papel: 'acompanhante',
      manterConectado: false,
    });

    expect(login).toEqual({ ok: true, conta: { papel: 'acompanhante', id: 'carlos-1', manterConectado: false } });
  });

  test('praticante com triagem pendente entra (a conta existe só como credencial)', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: 'lucia@exemplo.com',
      senha: SENHA,
      papel: 'praticante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: true, conta: { papel: 'praticante', id: 'lucia-1', manterConectado: true } });
  });

  test('senha errada devolve credenciais-invalidas', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: 'carlos@exemplo.com',
      senha: 'senha-errada-1',
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'credenciais-invalidas' });
  });

  test('e-mail certo no papel errado devolve o mesmo erro (a mensagem não revela nada)', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: 'carlos@exemplo.com',
      senha: SENHA,
      papel: 'praticante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'credenciais-invalidas' });
  });

  test('conta inexistente devolve o mesmo erro e ainda gasta uma derivação (tempo igual ao de uma conta que existe)', async () => {
    const estado = await estadoComContas();
    const espiao = vi.spyOn(globalThis.crypto.subtle, 'deriveBits');

    const login = await entrarComSenha(estado, {
      email: 'ninguem@exemplo.com',
      senha: SENHA,
      papel: 'praticante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'credenciais-invalidas' });
    expect(espiao).toHaveBeenCalledTimes(1);
    expect(espiao.mock.calls[0]?.[0]).toMatchObject({ name: 'PBKDF2', iterations: 600_000 });
    espiao.mockRestore();
  }, 20000);

  test('sem WebCrypto devolve sem-criptografia (e não "senha incorreta") mesmo com a senha certa', async () => {
    const estado = await estadoComContas();
    const espiao = vi.spyOn(globalThis.crypto.subtle, 'deriveBits');
    vi.stubGlobal('crypto', {});

    const login = await entrarComSenha(estado, {
      email: 'carlos@exemplo.com',
      senha: SENHA,
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'sem-criptografia' });
    expect(espiao).not.toHaveBeenCalled();
    espiao.mockRestore();
  });

  test('sem WebCrypto o e-mail inexistente também devolve sem-criptografia, antes de qualquer hash', async () => {
    const estado = await estadoComContas();
    vi.stubGlobal('crypto', {});

    const login = await entrarComSenha(estado, {
      email: 'ninguem@exemplo.com',
      senha: SENHA,
      papel: 'praticante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'sem-criptografia' });
  });

  test('credencial de acompanhante cuja pessoa sumiu devolve credenciais-invalidas', async () => {
    const estado = await estadoComContas();
    const semAPessoa: EstadoApp = { ...estado, acompanhantes: [] };

    const login = await entrarComSenha(semAPessoa, {
      email: 'carlos@exemplo.com',
      senha: SENHA,
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'credenciais-invalidas' });
  });

  test('credencial adulterada (hash trocado) não deixa entrar', async () => {
    const estado = await estadoComContas();
    const adulterado: EstadoApp = {
      ...estado,
      credenciais: estado.credenciais.map((c) => ({ ...c, hash: '0'.repeat(64) })),
    };

    const login = await entrarComSenha(adulterado, {
      email: 'carlos@exemplo.com',
      senha: SENHA,
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: false, erro: 'credenciais-invalidas' });
  });

  test('senha vazia nunca entra', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: 'carlos@exemplo.com',
      senha: '',
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login.ok).toBe(false);
  });

  test('o resultado de erro não contém a senha digitada', async () => {
    const login = await entrarComSenha(await estadoComContas(), {
      email: 'carlos@exemplo.com',
      senha: 'senha-que-nao-pode-vazar',
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(JSON.stringify(login)).not.toContain('senha-que-nao-pode-vazar');
  });

  test('entra nas contas de demonstração com a senha pública', async () => {
    const login = await entrarComSenha(criarEstadoDemo(AGORA), {
      email: 'marta@demo.test',
      senha: SENHA_DA_DEMO,
      papel: 'acompanhante',
      manterConectado: true,
    });

    expect(login).toEqual({ ok: true, conta: { papel: 'acompanhante', id: IDS_DEMO.marta, manterConectado: true } });
  }, 20000);
});

describe('destinoDepoisDeEntrar', () => {
  const demo = criarEstadoDemo(AGORA);
  const acompanhante = { papel: 'acompanhante', id: IDS_DEMO.carlos } as const;

  test('acompanhante sem convite vai para a lista de alunos', () => {
    expect(destinoDepoisDeEntrar(demo, acompanhante)).toBe('/acompanhante/alunos');
    expect(destinoDepoisDeEntrar(demo, acompanhante, '')).toBe('/acompanhante/alunos');
    expect(destinoDepoisDeEntrar(demo, acompanhante, '   ')).toBe('/acompanhante/alunos');
  });

  test('acompanhante com convite vai para a tela de adicionar já com o código', () => {
    expect(destinoDepoisDeEntrar(demo, acompanhante, 'ABC234')).toBe('/acompanhante/adicionar?codigo=ABC234');
  });

  test('normaliza o convite: minúsculas, espaços e link colado', () => {
    expect(destinoDepoisDeEntrar(demo, acompanhante, ' abc 234 ')).toBe('/acompanhante/adicionar?codigo=ABC234');
    expect(destinoDepoisDeEntrar(demo, acompanhante, 'https://x.github.io/#/convite/abc234/')).toBe(
      '/acompanhante/adicionar?codigo=ABC234',
    );
  });

  test('convite que não tem letras nem dígitos vale como sem convite', () => {
    expect(destinoDepoisDeEntrar(demo, acompanhante, '---')).toBe('/acompanhante/alunos');
  });

  test('o código normalizado não deixa caracteres de URL passarem (nada de & ou #)', () => {
    expect(destinoDepoisDeEntrar(demo, acompanhante, 'AB&x=1#')).toBe('/acompanhante/adicionar?codigo=ABX1');
  });

  test('praticante que já fez a triagem vai para o Hoje', () => {
    expect(destinoDepoisDeEntrar(demo, { papel: 'praticante', id: IDS_DEMO.lucia })).toBe('/praticante/hoje');
  });

  test('praticante sem dados (triagem pendente) vai para o primeiro uso', () => {
    expect(destinoDepoisDeEntrar(demo, { papel: 'praticante', id: 'nova' })).toBe('/primeiro-uso');
  });

  test('praticante ignora o convite', () => {
    expect(destinoDepoisDeEntrar(demo, { papel: 'praticante', id: IDS_DEMO.lucia }, 'ABC234')).toBe('/praticante/hoje');
  });

  test('não confunde o id "constructor" com um praticante existente', () => {
    expect(destinoDepoisDeEntrar(demo, { papel: 'praticante', id: 'constructor' })).toBe('/primeiro-uso');
  });
});

describe('entrar e sair com manterConectado', () => {
  test('entrar guarda manterConectado e sair zera a conta toda', () => {
    const dentro = entrar(estadoInicial(), { papel: 'praticante', id: 'x', manterConectado: false });

    expect(dentro.contaAtual).toEqual({ papel: 'praticante', id: 'x', manterConectado: false });
    expect(sair(dentro).contaAtual).toBeNull();
  });
});
