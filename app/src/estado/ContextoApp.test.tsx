import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CHAVE_DA_SESSAO,
  CHAVE_DO_ESTADO,
  criarEstadoDemo,
  estadoInicial,
  type Credencial,
  type EstadoApp,
} from '../dominio';
import { ProvedorDoApp, useApp } from './ContextoApp';

const AGORA = new Date('2026-10-07T12:00:00Z');
const CHAVE_V1 = 'app-equilibrio:v1';

type ValorDoApp = ReturnType<typeof useApp>;
let app: ValorDoApp | null = null;

function Espiao() {
  const valor = useApp();
  useEffect(() => {
    app = valor;
  });
  return null;
}

function abrir(estadoInicialDoTeste?: EstadoApp) {
  render(
    <ProvedorDoApp {...(estadoInicialDoTeste ? { estadoInicial: estadoInicialDoTeste } : {})}>
      <Espiao />
    </ProvedorDoApp>,
  );
}

const lerApp = (): ValorDoApp => {
  if (!app) throw new Error('O provedor ainda não renderizou');
  return app;
};

const noLocal = (): EstadoApp => JSON.parse(localStorage.getItem(CHAVE_DO_ESTADO) ?? 'null') as EstadoApp;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  app = null;
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('arranque do app', () => {
  test('sem nada salvo, começa com as contas de demonstração e ninguém logado', () => {
    abrir();

    expect(lerApp().estado.contaAtual).toBeNull();
    expect(Object.keys(lerApp().estado.praticantes)).toEqual(['lucia', 'rafael']);
    expect(lerApp().estado.credenciais).toHaveLength(5);
  });

  test('apaga os dados da versão 1 que ficaram esquecidos no aparelho', () => {
    localStorage.setItem(CHAVE_V1, '{"versao":1,"praticantes":{}}');

    abrir();

    expect(localStorage.getItem(CHAVE_V1)).toBeNull();
  });

  test('não mexe nas preferências ao apagar a versão antiga', () => {
    localStorage.setItem(CHAVE_V1, '{}');
    localStorage.setItem('app-equilibrio:preferencias', '{"voz":true}');

    abrir();

    expect(localStorage.getItem('app-equilibrio:preferencias')).toContain('"voz":true');
  });

  test('recupera o estado salvo, com a conta de quem escolheu manter conectado', () => {
    const salvo: EstadoApp = { ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: true } };
    localStorage.setItem(CHAVE_DO_ESTADO, JSON.stringify(salvo));

    abrir();

    expect(lerApp().estado.contaAtual).toEqual({ papel: 'praticante', id: 'lucia', manterConectado: true });
  });

  test('recupera da sessão a conta de quem não marcou "manter conectado" (recarregar a página)', () => {
    localStorage.setItem(CHAVE_DO_ESTADO, JSON.stringify({ ...criarEstadoDemo(AGORA), contaAtual: null }));
    sessionStorage.setItem(CHAVE_DA_SESSAO, JSON.stringify({ papel: 'acompanhante', id: 'carlos', manterConectado: false }));

    abrir();

    expect(lerApp().estado.contaAtual).toEqual({ papel: 'acompanhante', id: 'carlos', manterConectado: false });
  });

  test('não recria a demonstração por cima de um cadastro cuja triagem ainda não terminou', () => {
    const pendente: EstadoApp = {
      ...estadoInicial(),
      contaAtual: { papel: 'praticante', id: 'nova', manterConectado: true },
      credenciais: [
        {
          email: 'nova@exemplo.com',
          papel: 'praticante',
          pessoaId: 'nova',
          sal: 'ab'.repeat(16),
          hash: 'cd'.repeat(32),
          iteracoes: 600_000,
          criadaEm: AGORA.toISOString(),
        },
      ],
    };
    localStorage.setItem(CHAVE_DO_ESTADO, JSON.stringify(pendente));

    abrir();

    expect(lerApp().estado.credenciais.map((c) => c.email)).toEqual(['nova@exemplo.com']);
    expect(lerApp().estado.contaAtual).toEqual({ papel: 'praticante', id: 'nova', manterConectado: true });
    expect(lerApp().estado.praticantes).toEqual({});
  });
});

describe('salvar o estado', () => {
  test('conta com manterConectado true fica no armazenamento local e não vai para a sessão', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: true } });

    expect(noLocal().contaAtual).toEqual({ papel: 'praticante', id: 'lucia', manterConectado: true });
    expect(sessionStorage.getItem(CHAVE_DA_SESSAO)).toBeNull();
  });

  test('conta com manterConectado false vai só para a sessão', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: false } });

    expect(noLocal().contaAtual).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(CHAVE_DA_SESSAO) ?? 'null')).toEqual({
      papel: 'praticante',
      id: 'lucia',
      manterConectado: false,
    });
  });

  test('sair apaga a conta da sessão', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: false } });

    act(() => lerApp().atualizar((estado) => ({ ...estado, contaAtual: null })));

    expect(sessionStorage.getItem(CHAVE_DA_SESSAO)).toBeNull();
  });
});

describe('reiniciarDemonstracao', () => {
  test('apaga o que estava salvo no local e na sessão e volta ao estado de demonstração sem conta', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: false } });
    expect(sessionStorage.getItem(CHAVE_DA_SESSAO)).not.toBeNull();

    act(() => lerApp().reiniciarDemonstracao());

    expect(lerApp().estado.contaAtual).toBeNull();
    expect(sessionStorage.getItem(CHAVE_DA_SESSAO)).toBeNull();
    expect(noLocal().contaAtual).toBeNull();
    expect(lerApp().estado.credenciais).toHaveLength(5);
  });
});

/* Várias abas: o evento 'storage' só chega às OUTRAS abas, e o jsdom não o
   dispara sozinho, então o teste grava no localStorage (como a outra aba
   faria) e dispara o evento à mão. */
const gravarComoOutraAba = (estado: EstadoApp) => localStorage.setItem(CHAVE_DO_ESTADO, JSON.stringify(estado));
const avisarOutraAba = (chave: string | null = CHAVE_DO_ESTADO) =>
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: chave, storageArea: localStorage }));
  });


function outraAbaGravou(estado: EstadoApp, chave: string | null = CHAVE_DO_ESTADO) {
  gravarComoOutraAba(estado);
  avisarOutraAba(chave);
}

describe('várias abas', () => {
  const CREDENCIAL_NOVA: Credencial = {
    email: 'nova@exemplo.com',
    papel: 'praticante',
    pessoaId: 'nova',
    sal: 'ab'.repeat(16),
    hash: 'cd'.repeat(32),
    iteracoes: 600_000,
    criadaEm: AGORA.toISOString(),
  };

  /* O que a outra aba gravou: a demonstração mais uma conta nova. */
  const comContaNova = (contaAtual: EstadoApp['contaAtual'] = null): EstadoApp => {
    const demo = criarEstadoDemo(AGORA);
    return { ...demo, contaAtual, credenciais: [...demo.credenciais, CREDENCIAL_NOVA] };
  };

  afterEach(() => vi.restoreAllMocks());

  test('adota o que outra aba gravou (conta nova, por exemplo), em vez de apagar com o estado velho', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });

    outraAbaGravou(comContaNova());

    expect(lerApp().estado.credenciais.map((c) => c.email)).toContain('nova@exemplo.com');
  });

  test('a conta de sessão desta aba continua logada quando ela ainda existe no estado novo', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: false } });

    outraAbaGravou(comContaNova());

    expect(lerApp().estado.contaAtual).toEqual({ papel: 'praticante', id: 'lucia', manterConectado: false });
    expect(lerApp().estado.credenciais.map((c) => c.email)).toContain('nova@exemplo.com');
  });

  test('a conta de sessão some quando a outra aba apagou essa pessoa', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'fulana', manterConectado: false } });

    outraAbaGravou(comContaNova());

    expect(lerApp().estado.contaAtual).toBeNull();
  });

  test('"Sair" em outra aba também desconecta esta, quando a conta era a mantida', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'praticante', id: 'lucia', manterConectado: true } });

    outraAbaGravou({ ...criarEstadoDemo(AGORA), contaAtual: null });

    expect(lerApp().estado.contaAtual).toBeNull();
  });

  test('a conta mantida por outra aba vale nesta (o localStorage é um só)', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });

    outraAbaGravou({ ...criarEstadoDemo(AGORA), contaAtual: { papel: 'acompanhante', id: 'carlos', manterConectado: true } });

    expect(lerApp().estado.contaAtual).toEqual({ papel: 'acompanhante', id: 'carlos', manterConectado: true });
  });

  test('dados apagados em outra aba (a chave some) voltam à demonstração, sem conta', () => {
    abrir({ ...comContaNova({ papel: 'praticante', id: 'lucia', manterConectado: true }) });

    localStorage.removeItem(CHAVE_DO_ESTADO);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_DO_ESTADO, newValue: null, storageArea: localStorage }));
    });

    expect(lerApp().estado.contaAtual).toBeNull();
    expect(lerApp().estado.credenciais).toHaveLength(5);
  });

  test('ignora o evento de outras chaves (preferências, por exemplo)', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });
    const antes = lerApp().estado;

    outraAbaGravou(comContaNova(), 'app-equilibrio:preferencias');

    expect(lerApp().estado).toBe(antes);
  });

  test('o estado vindo de fora não é regravado (nenhum laço entre abas)', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });
    gravarComoOutraAba(comContaNova({ papel: 'praticante', id: 'lucia', manterConectado: true }));
    const gravar = vi.spyOn(Storage.prototype, 'setItem');

    avisarOutraAba();

    expect(lerApp().estado.credenciais.map((c) => c.email)).toContain('nova@exemplo.com');
    expect(gravar.mock.calls.filter(([chave]) => chave === CHAVE_DO_ESTADO)).toHaveLength(0);
  });

  test('mudança que não altera o texto salvo não grava de novo', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });
    const gravar = vi.spyOn(Storage.prototype, 'setItem');

    act(() => lerApp().atualizar((estado) => ({ ...estado })));

    expect(gravar.mock.calls.filter(([chave]) => chave === CHAVE_DO_ESTADO)).toHaveLength(0);
  });

  test('mudança real continua sendo gravada', () => {
    abrir({ ...criarEstadoDemo(AGORA), contaAtual: null });

    act(() => lerApp().atualizar((estado) => ({ ...estado, credenciais: [...estado.credenciais, CREDENCIAL_NOVA] })));

    expect(noLocal().credenciais.map((c) => c.email)).toContain('nova@exemplo.com');
  });

  test('para de ouvir o evento quando o provedor sai da tela', () => {
    const espiao = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <ProvedorDoApp estadoInicial={{ ...criarEstadoDemo(AGORA), contaAtual: null }}>
        <Espiao />
      </ProvedorDoApp>,
    );

    unmount();

    expect(espiao.mock.calls.some(([tipo]) => tipo === 'storage')).toBe(true);
  });
});
