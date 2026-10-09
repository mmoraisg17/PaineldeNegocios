import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ITERACOES_DA_SENHA,
  ErroSemCriptografia,
  TAMANHO_MAXIMO_DA_SENHA,
  TAMANHO_MAXIMO_DO_EMAIL,
  TAMANHO_MINIMO_DA_SENHA,
  buscarCredencial,
  conferirSenha,
  criarCredencial,
  derivarHash,
  emailValido,
  normalizarEmail,
  problemaDaSenha,
  temCriptografia,
  type Credencial,
} from './credenciais';

/* Poucas iterações nos testes: o que se confere é a lógica, não o custo do
   PBKDF2 (600 mil iterações levam ~0,4 s cada). */
const ITERACOES_RAPIDAS = 1_000;
const SAL_FIXO = '00112233445566778899aabbccddeeff';
const AGORA = new Date('2026-10-07T12:00:00Z');

type DadosDaCredencial = { email: string; papel: 'praticante' | 'acompanhante'; pessoaId: string; senha: string };

async function credencialDe(sobrescrever: Partial<DadosDaCredencial> = {}): Promise<Credencial> {
  return criarCredencial(
    { email: 'lucia@exemplo.com', papel: 'praticante', pessoaId: 'p1', senha: 'senha-forte-1', ...sobrescrever },
    AGORA,
    { gerarSal: () => SAL_FIXO, iteracoes: ITERACOES_RAPIDAS },
  );
}

describe('constantes', () => {
  test('seguem os limites combinados', () => {
    expect(TAMANHO_MINIMO_DA_SENHA).toBe(8);
    expect(TAMANHO_MAXIMO_DA_SENHA).toBe(128);
    expect(TAMANHO_MAXIMO_DO_EMAIL).toBe(254);
    expect(ITERACOES_DA_SENHA).toBe(600_000);
  });
});

describe('normalizarEmail', () => {
  test('tira espaços das pontas e põe em minúsculas', () => {
    expect(normalizarEmail('  Lucia@Exemplo.COM \n')).toBe('lucia@exemplo.com');
  });

  test('devolve texto vazio para texto só de espaços', () => {
    expect(normalizarEmail('   ')).toBe('');
  });
});

describe('emailValido', () => {
  test.each(['a@b.co', 'lucia@exemplo.com', 'nome.sobrenome+tag@sub.dominio.com.br', '  MAIUSCULO@EXEMPLO.COM  '])(
    'aceita %j',
    (email) => {
      expect(emailValido(email)).toBe(true);
    },
  );

  test.each([
    '',
    '   ',
    'sem-arroba',
    '@sem-usuario.com',
    'sem-dominio@',
    'sem@ponto',
    'com espaco@exemplo.com',
    'a@b .com',
    'a@@b.com',
    'a@b.',
    'a@.com',
  ])('recusa %j', (email) => {
    expect(emailValido(email)).toBe(false);
  });

  test('aceita 254 caracteres e recusa 255', () => {
    const base = '@exemplo.com';
    const noLimite = `${'a'.repeat(TAMANHO_MAXIMO_DO_EMAIL - base.length)}${base}`;

    expect(noLimite).toHaveLength(254);
    expect(emailValido(noLimite)).toBe(true);
    expect(emailValido(`a${noLimite}`)).toBe(false);
  });
});

describe('problemaDaSenha', () => {
  test('aponta senha curta abaixo de 8 caracteres', () => {
    expect(problemaDaSenha('1234567')).toBe('curta');
    expect(problemaDaSenha('')).toBe('curta');
  });

  test('aceita exatamente 8 e exatamente 128 caracteres', () => {
    expect(problemaDaSenha('12345678')).toBeNull();
    expect(problemaDaSenha('a'.repeat(128))).toBeNull();
  });

  test('aponta senha longa acima de 128 caracteres', () => {
    expect(problemaDaSenha('a'.repeat(129))).toBe('longa');
  });

  test('não exige letra, número ou símbolo (sem regras de composição)', () => {
    expect(problemaDaSenha('aaaaaaaa')).toBeNull();
    expect(problemaDaSenha('        ')).toBeNull();
  });

  test('conta emoji como um caractere só', () => {
    expect(problemaDaSenha('😀'.repeat(8))).toBeNull();
    expect(problemaDaSenha('😀'.repeat(7))).toBe('curta');
  });
});

describe('derivarHash', () => {
  test('bate com o vetor de teste conhecido do PBKDF2-HMAC-SHA-256 (RFC 7914, c = 1)', async () => {
    // senha "passwd", sal "salt" (73616c74 em hexadecimal), 1 iteração, 32 bytes.
    const hash = await derivarHash('passwd', '73616c74', 1);

    expect(hash).toBe('55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc');
  });

  test('devolve 64 caracteres hexadecimais (256 bits)', async () => {
    const hash = await derivarHash('qualquer coisa', SAL_FIXO, ITERACOES_RAPIDAS);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('é determinístico para os mesmos dados', async () => {
    const [um, dois] = await Promise.all([
      derivarHash('senha', SAL_FIXO, ITERACOES_RAPIDAS),
      derivarHash('senha', SAL_FIXO, ITERACOES_RAPIDAS),
    ]);

    expect(um).toBe(dois);
  });

  test('muda com a senha, o sal ou as iterações', async () => {
    const base = await derivarHash('senha', SAL_FIXO, ITERACOES_RAPIDAS);

    expect(await derivarHash('Senha', SAL_FIXO, ITERACOES_RAPIDAS)).not.toBe(base);
    expect(await derivarHash('senha', 'ffeeddccbbaa99887766554433221100', ITERACOES_RAPIDAS)).not.toBe(base);
    expect(await derivarHash('senha', SAL_FIXO, ITERACOES_RAPIDAS + 1)).not.toBe(base);
  });

  test('aceita senha com acento e emoji', async () => {
    const hash = await derivarHash('açaí-😀-ção', SAL_FIXO, ITERACOES_RAPIDAS);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('usa o SubtleCrypto recebido por parâmetro', async () => {
    const chamadas: string[] = [];
    const subtleFalso = {
      importKey: async () => {
        chamadas.push('importKey');
        return {} as CryptoKey;
      },
      deriveBits: async () => {
        chamadas.push('deriveBits');
        return new Uint8Array(32).buffer;
      },
    } as unknown as SubtleCrypto;

    const hash = await derivarHash('senha', SAL_FIXO, 10, subtleFalso);

    expect(chamadas).toEqual(['importKey', 'deriveBits']);
    expect(hash).toBe('0'.repeat(64));
  });

  test('recusa sal que não é hexadecimal, sem citar a senha', async () => {
    const erro = await derivarHash('senha-secreta', 'zz', 10).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).not.toContain('senha-secreta');
  });
});

describe('criarCredencial', () => {
  test('monta a credencial com e-mail normalizado, sal e hash em hexadecimal', async () => {
    const credencial = await credencialDe({ email: '  Lucia@Exemplo.COM ' });

    expect(credencial).toEqual({
      email: 'lucia@exemplo.com',
      papel: 'praticante',
      pessoaId: 'p1',
      sal: SAL_FIXO,
      hash: await derivarHash('senha-forte-1', SAL_FIXO, ITERACOES_RAPIDAS),
      iteracoes: ITERACOES_RAPIDAS,
      criadaEm: AGORA.toISOString(),
    });
  });

  test('nunca guarda a senha em texto', async () => {
    const credencial = await credencialDe({ senha: 'senha-muito-secreta' });

    expect(JSON.stringify(credencial)).not.toContain('senha-muito-secreta');
    expect(Object.keys(credencial).toSorted()).toEqual(['criadaEm', 'email', 'hash', 'iteracoes', 'papel', 'pessoaId', 'sal']);
  });

  test('sorteia um sal de 16 bytes diferente a cada credencial quando não recebe gerador', async () => {
    const opcoes = { iteracoes: ITERACOES_RAPIDAS };
    const dados = { email: 'a@b.co', papel: 'praticante', pessoaId: 'p', senha: 'senha-forte-1' } as const;

    const [um, dois] = await Promise.all([criarCredencial(dados, AGORA, opcoes), criarCredencial(dados, AGORA, opcoes)]);

    expect(um.sal).toMatch(/^[0-9a-f]{32}$/);
    expect(dois.sal).toMatch(/^[0-9a-f]{32}$/);
    expect(um.sal).not.toBe(dois.sal);
    expect(um.hash).not.toBe(dois.hash);
  });

  test('usa 600 mil iterações e SHA-256 por padrão', async () => {
    const parametros: Pbkdf2Params[] = [];
    const subtleFalso = {
      importKey: async () => ({}) as CryptoKey,
      deriveBits: async (algoritmo: Pbkdf2Params) => {
        parametros.push(algoritmo);
        return new Uint8Array(32).buffer;
      },
    } as unknown as SubtleCrypto;

    const credencial = await criarCredencial(
      { email: 'a@b.co', papel: 'acompanhante', pessoaId: 'x', senha: 'senha-forte-1' },
      AGORA,
      { subtle: subtleFalso },
    );

    expect(credencial.iteracoes).toBe(ITERACOES_DA_SENHA);
    expect(parametros[0]?.iterations).toBe(ITERACOES_DA_SENHA);
    expect(parametros[0]?.hash).toBe('SHA-256');
  });
});

describe('conferirSenha', () => {
  test('aceita a senha certa', async () => {
    const credencial = await credencialDe();

    expect(await conferirSenha(credencial, 'senha-forte-1')).toBe(true);
  });

  test('recusa senha errada, inclusive diferença de maiúscula, de espaço e senha vazia', async () => {
    const credencial = await credencialDe();

    expect(await conferirSenha(credencial, 'senha-forte-2')).toBe(false);
    expect(await conferirSenha(credencial, 'Senha-forte-1')).toBe(false);
    expect(await conferirSenha(credencial, 'senha-forte-1 ')).toBe(false);
    expect(await conferirSenha(credencial, '')).toBe(false);
  });

  test('recusa credencial adulterada (hash trocado ou truncado)', async () => {
    const credencial = await credencialDe();
    const trocado: Credencial = { ...credencial, hash: '0'.repeat(64) };
    const truncado: Credencial = { ...credencial, hash: credencial.hash.slice(0, 32) };

    expect(await conferirSenha(trocado, 'senha-forte-1')).toBe(false);
    expect(await conferirSenha(truncado, 'senha-forte-1')).toBe(false);
  });

  test('recusa quando o número de iterações foi alterado', async () => {
    const credencial = await credencialDe();

    expect(await conferirSenha({ ...credencial, iteracoes: credencial.iteracoes + 1 }, 'senha-forte-1')).toBe(false);
  });

  test('recusa, sem lançar, credencial com sal inválido', async () => {
    const credencial = await credencialDe();

    expect(await conferirSenha({ ...credencial, sal: 'zz' }, 'senha-forte-1')).toBe(false);
  });
});

describe('buscarCredencial', () => {
  test('acha pelo e-mail normalizado e pelo papel', async () => {
    const praticante = await credencialDe({ papel: 'praticante' });
    const acompanhante = await credencialDe({ papel: 'acompanhante', pessoaId: 'a1' });

    expect(buscarCredencial([praticante, acompanhante], '  LUCIA@exemplo.com ', 'acompanhante')).toBe(acompanhante);
    expect(buscarCredencial([praticante, acompanhante], 'lucia@exemplo.com', 'praticante')).toBe(praticante);
  });

  test('a mesma pessoa pode ser praticante e acompanhante com o mesmo e-mail', async () => {
    const praticante = await credencialDe({ papel: 'praticante' });

    expect(buscarCredencial([praticante], 'lucia@exemplo.com', 'acompanhante')).toBeUndefined();
  });

  test('devolve undefined quando o e-mail não existe ou a lista é vazia', async () => {
    const praticante = await credencialDe();

    expect(buscarCredencial([praticante], 'outra@exemplo.com', 'praticante')).toBeUndefined();
    expect(buscarCredencial([], 'lucia@exemplo.com', 'praticante')).toBeUndefined();
  });
});

describe('sem WebCrypto (http fora de localhost)', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('temCriptografia é verdadeiro quando o navegador oferece crypto.subtle', () => {
    expect(temCriptografia()).toBe(true);
  });

  test('temCriptografia é falso quando crypto.subtle não existe', () => {
    vi.stubGlobal('crypto', {});

    expect(temCriptografia()).toBe(false);
  });

  test('temCriptografia é falso quando nem crypto existe', () => {
    vi.stubGlobal('crypto', undefined);

    expect(temCriptografia()).toBe(false);
  });

  test('derivarHash lança ErroSemCriptografia, e não um erro genérico', async () => {
    vi.stubGlobal('crypto', {});

    await expect(derivarHash('senha', SAL_FIXO, 10)).rejects.toBeInstanceOf(ErroSemCriptografia);
  });

  test('conferirSenha repassa o erro em vez de tratar como senha errada', async () => {
    const credencial = await credencialDe();
    vi.stubGlobal('crypto', {});

    await expect(conferirSenha(credencial, 'senha-forte-1')).rejects.toBeInstanceOf(ErroSemCriptografia);
  });
});
