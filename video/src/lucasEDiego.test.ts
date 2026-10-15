import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { mediasRecentes } from '../../app/src/components/acompanhante/resumoDoAluno';
import { criarEstadoDemo } from '../../app/src/dominio/demo';
import { temposDoBulgaro } from '../../app/src/movimento/animacoes/agachamentoBulgaroExplosivo';
import { montarEsqueleto } from '../../app/src/movimento/corpo';
import { SEGMENTOS } from '../../app/src/cena3d/Boneco';
import { ehDaCamisa } from './BonecoNoQuadro';
import { coresDosAtletas } from './cores';
import { AGORA_DA_DEMO, cartoesDaDemo } from './dadosDaDemo';
import { FPS, amostraNoQuadro, cronometroNoTempo, quadroDoTempo, tempoNoQuadro, trechoNoQuadro } from './roteiro';
import {
  VELOCIDADE_LENTA,
  escurecimentoNoQuadro,
  montarRoteiroLucasEDiego,
  quadroDoPosterLD,
  trechoLD,
  trocasDeCena,
} from './roteiroLucasEDiego';
import { LINHAS_DA_COMPARACAO, textosDoCartao } from './SobreposicoesDosAtletas';

const roteiro = montarRoteiroLucasEDiego();
const todos = Array.from({ length: roteiro.duracaoEmQuadros }, (_, q) => q);
const segundos = (id: Parameters<typeof trechoLD>[1]) => {
  const t = trechoLD(roteiro, id);
  return (t.ate - t.de) / FPS;
};
const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const cartoes = cartoesDaDemo();

describe('roteiro do vídeo "LucasEDiego"', () => {
  test('frame → tempo é determinístico, em qualquer ordem de render', () => {
    const emOrdem = todos.map((q) => tempoNoQuadro(roteiro, q));
    const outro = montarRoteiroLucasEDiego();
    for (const q of [...todos].reverse()) expect(tempoNoQuadro(outro, q)).toBe(emOrdem[q]);
    expect(montarEsqueleto(amostraNoQuadro(outro, 400).pose)).toEqual(montarEsqueleto(amostraNoQuadro(roteiro, 400).pose));
    expect(cartoesDaDemo()).toEqual(cartoes);
  });

  test('~24 s: abertura 2 s, cada atleta ~8 s, comparação 4 s e fecho 1,5 s, nesta ordem', () => {
    expect(roteiro.trechos.map((t) => t.id)).toEqual(['abertura', 'lucas-lenta', 'lucas-real', 'diego-lenta', 'diego-real', 'comparacao', 'fecho']);
    expect(roteiro.duracaoEmQuadros / FPS).toBeGreaterThanOrEqual(23);
    expect(roteiro.duracaoEmQuadros / FPS).toBeLessThanOrEqual(25);
    expect(segundos('abertura')).toBe(2);
    expect(segundos('comparacao')).toBe(4);
    expect(segundos('fecho')).toBe(1.5);
    for (const atleta of ['lucas', 'diego'] as const) {
      const bloco = segundos(`${atleta}-lenta`) + segundos(`${atleta}-real`);
      expect(bloco).toBeGreaterThanOrEqual(7.5);
      expect(bloco).toBeLessThanOrEqual(8.5);
    }
    // Trechos colados, sem buraco nem sobreposição.
    roteiro.trechos.slice(1).forEach((t, i) => expect(t.de).toBe(roteiro.trechos[i]?.ate));
  });

  test('cada atleta: câmera lenta 0,5× do fim da descida até em pé, depois o ciclo inteiro em velocidade real', () => {
    const { inicioDaDescida, tFundo, tComeca, tTopo } = roteiro.tempos;
    for (const atleta of ['lucas', 'diego'] as const) {
      const lenta = trechoLD(roteiro, `${atleta}-lenta`);
      const real = trechoLD(roteiro, `${atleta}-real`);
      expect(lenta.atleta).toBe(atleta);
      expect(real.atleta).toBe(atleta);
      expect(VELOCIDADE_LENTA).toBe(0.5);
      expect(tempoNoQuadro(roteiro, lenta.de + FPS) - tempoNoQuadro(roteiro, lenta.de)).toBeCloseTo(0.5);
      expect(tempoNoQuadro(roteiro, real.de + FPS) - tempoNoQuadro(roteiro, real.de)).toBeCloseTo(1);
      // A lenta pega o fundo e a subida inteira; a real, do parado ao topo.
      expect(lenta.tempoInicial).toBeLessThan(tFundo);
      expect(tempoNoQuadro(roteiro, lenta.ate - 1)).toBeGreaterThan(tTopo);
      expect(real.tempoInicial).toBeLessThan(inicioDaDescida);
      expect(tempoNoQuadro(roteiro, real.ate - 1)).toBeGreaterThan(tTopo);
      // Subida: 36 quadros na lenta e 18 na real (0,6 s do nível 3).
      expect(quadroDoTempo(roteiro, tTopo, `${atleta}-lenta`) - quadroDoTempo(roteiro, tComeca, `${atleta}-lenta`)).toBe(36);
      expect(quadroDoTempo(roteiro, tTopo, `${atleta}-real`) - quadroDoTempo(roteiro, tComeca, `${atleta}-real`)).toBe(18);
    }
    expect(temposDoBulgaro(3)).toMatchObject({ tFundo, tComeca, tTopo });
  });

  test('o vídeo escurece só nas trocas de cena, não na emenda lenta → real', () => {
    expect(trocasDeCena(roteiro)).toEqual(['lucas-lenta', 'diego-lenta', 'comparacao'].map((id) => trechoLD(roteiro, id as 'comparacao').de));
    for (const troca of trocasDeCena(roteiro)) {
      expect(escurecimentoNoQuadro(roteiro, troca)).toBe(1);
      expect(escurecimentoNoQuadro(roteiro, troca - 1)).toBe(1);
    }
    for (const id of ['lucas-real', 'diego-real'] as const) expect(escurecimentoNoQuadro(roteiro, trechoLD(roteiro, id).de)).toBe(0);
    expect(escurecimentoNoQuadro(roteiro, 30)).toBe(0);
  });

  test('a carga nos pés cabe no medidor (até 2×), sem inclinação e com o banquinho', () => {
    for (const q of todos) expect(amostraNoQuadro(roteiro, q).carga.pes).toBeLessThanOrEqual(2);
    expect(roteiro.animacao.cadeira).toBeDefined();
    expect(JSON.stringify(roteiro.animacao)).not.toMatch(/inclinacaoDaBase/);
  });

  test('o pôster é o meio da subida do Diego na câmera lenta, e o script usa esse quadro', () => {
    const poster = quadroDoPosterLD(roteiro);
    expect(trechoNoQuadro(roteiro, poster)).toMatchObject({ id: 'diego-lenta', atleta: 'diego' });
    expect(cronometroNoTempo(roteiro.tempos, tempoNoQuadro(roteiro, poster)).etapa).toBe('subida');
    expect(pacote.scripts['poster:lucas-diego']).toContain(`--frame=${poster}`);
    expect(pacote.scripts['poster:lucas-diego']).toContain('out/lucas-e-diego-poster.png');
    expect(pacote.scripts['render:lucas-diego']).toContain('LucasEDiego out/lucas-e-diego.mp4');
  });
});

describe('números do vídeo vêm do estado de demonstração do app', () => {
  const estado = criarEstadoDemo(AGORA_DA_DEMO);

  test('a data é a fixa dos testes do app', () => {
    expect(AGORA_DA_DEMO.toISOString()).toBe('2026-10-07T15:30:00.000Z');
  });

  test('Lucas: 24 anos, por conta própria, 17 de 18 treinos, médias do relatório', () => {
    const lucas = cartoes.lucas;
    const praticante = estado.praticantes['lucas'];
    expect(lucas).toMatchObject({ nome: praticante?.perfil.nome, idade: praticante?.idade, acompanhamento: 'Treina por conta própria' });
    expect(lucas.idade).toBe(24);
    expect(lucas.ajustadoPor).toBeUndefined();
    expect(lucas.nivelDoBulgaro).toBe(praticante?.niveis['agachamento-bulgaro-explosivo']);
    expect(lucas.treinos).toMatchObject({ feitos: 17, previstos: 18, semanas: 6 });
    expect(lucas.treinos.feitos).toBe(praticante?.sessoes.length);
    const medias = mediasRecentes(praticante?.sessoes ?? []);
    expect(lucas.medias).toEqual({
      nota: Math.round(medias?.nota ?? NaN),
      simetria: Math.round(medias?.simetria ?? NaN),
      estabilidade: Math.round(medias?.estabilidade ?? NaN),
      apoio: Math.round((medias?.apoio ?? NaN) * 100),
    });
    expect(lucas.recado).toBeUndefined();
    expect(textosDoCartao(lucas)).toMatchObject({ quemAjusta: 'Rotina do app', nivel: 'búlgaro no nível 3', treinosFeitos: '17 de 18 treinos' });
  });

  test('Diego: 30 anos, ajustado por Renata, nível 3 fixo, 4 por semana, 24 de 24 e o recado dela', () => {
    const diego = cartoes.diego;
    const praticante = estado.praticantes['diego'];
    expect(diego).toMatchObject({ nome: 'Diego', idade: 30, acompanhamento: 'Acompanhado por Renata, preparadora física' });
    expect(diego.ajustadoPor).toBe(praticante?.ajuste?.autor);
    expect(diego.nivelDoBulgaro).toBe(praticante?.ajuste?.niveisFixados?.['agachamento-bulgaro-explosivo']);
    expect(diego.treinosPorSemana).toBe(praticante?.ajuste?.frequenciaSemanal);
    expect(diego.treinos).toMatchObject({ feitos: 24, previstos: 24, semanas: 6, porcentagem: 100 });
    const recado = estado.recados.find((r) => r.paraId === 'diego');
    expect(diego.recado).toEqual({ texto: recado?.texto, de: 'Renata' });
    expect(diego.recado?.texto).toBe('A subida está mais rápida a cada semana, Diego. Mantenha a descida em 3 segundos.');
    expect(textosDoCartao(diego)).toMatchObject({
      quemAjusta: 'Ajustado por Renata',
      nivel: 'búlgaro fixo no nível 3',
      frequencia: '4 treinos por semana',
      treinosFeitos: '24 de 24 treinos',
    });
  });

  test('a comparação mostra simetria, estabilidade, apoio e treinos, com os mesmos números dos cartões', () => {
    expect(LINHAS_DA_COMPARACAO.map((l) => l.titulo)).toEqual(['Simetria', 'Estabilidade', 'Apoio nas barras', 'Treinos feitos']);
    for (const cartao of [cartoes.lucas, cartoes.diego]) {
      const [simetria, estabilidade, apoio, treinos] = LINHAS_DA_COMPARACAO.map((l) => l.texto(cartao));
      expect(simetria).toBe(`${cartao.medias.simetria}%`);
      expect(estabilidade).toBe(`${cartao.medias.estabilidade}%`);
      expect(apoio).toBe(`${cartao.medias.apoio}% do peso`);
      expect(treinos).toBe(`${cartao.treinos.feitos} de ${cartao.treinos.previstos}`);
      for (const linha of LINHAS_DA_COMPARACAO) expect(linha.valor(cartao)).toBeLessThanOrEqual(100);
    }
  });

  test('nenhum número dos cartões está escrito à mão no código do vídeo', () => {
    for (const arquivo of ['LucasEDiego.tsx', 'SobreposicoesDosAtletas.tsx', 'dadosDaDemo.ts']) {
      const codigo = readFileSync(new URL(`./${arquivo}`, import.meta.url), 'utf8');
      expect(codigo).not.toMatch(/17 de 18|24 de 24|Mantenha a descida/);
    }
  });
});

describe('os dois blocos têm cores diferentes', () => {
  test('acento (cartão, selos, faixa) e camisa do boneco mudam de um atleta para o outro', () => {
    const { lucas, diego } = coresDosAtletas();
    expect(lucas.acento).toMatch(/^#[0-9a-f]{6}$/i);
    expect(diego.acento).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lucas.acento.toLowerCase()).not.toBe(diego.acento.toLowerCase());
    // A camisa usa o acento do atleta (LucasEDiego.tsx) e pinta só o tronco.
    const codigo = readFileSync(new URL('./LucasEDiego.tsx', import.meta.url), 'utf8');
    expect(codigo).toMatch(/camisa=\{atleta \? paletas\[atleta\]\.acento : undefined\}/);
    expect(SEGMENTOS.filter(ehDaCamisa)).toHaveLength(1);
    expect(SEGMENTOS.filter(ehDaCamisa)[0]?.regiao).toBe('tronco');
  });

  test('o texto sobre o acento tem contraste (branco no vermelho, escuro no âmbar)', () => {
    const luminancia = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
    };
    const contraste = (a: string, b: string) => {
      const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
      return ((claro ?? 0) + 0.05) / ((escuro ?? 0) + 0.05);
    };
    for (const { acento, sobreAcento } of Object.values(coresDosAtletas())) expect(contraste(acento, sobreAcento)).toBeGreaterThanOrEqual(4.5);
  });
});
