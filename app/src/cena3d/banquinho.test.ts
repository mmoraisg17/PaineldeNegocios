// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CADEIRA_SENTAR } from '../movimento/animacoes/sentarELevantar';
import { PLATAFORMA, TOPO_BASE } from '../movimento/cenario';
import { geometriasDoModelo } from './Banquinho';
import { BANQUINHO, pilhaDoBanquinho } from './banquinho';

describe('pilhaDoBanquinho', () => {
  it('põe o assento exatamente na altura da animação de sentar e levantar', () => {
    const pilha = pilhaDoBanquinho(CADEIRA_SENTAR.assentoY);
    expect(pilha.alturaDoAssento + BANQUINHO.alturaDoAssento).toBeCloseTo(CADEIRA_SENTAR.assentoY, 6);
    const ultimo = pilha.alturaDosAneis[pilha.aneis - 1] ?? 0;
    expect(ultimo + BANQUINHO.alturaDoAnel).toBeCloseTo(pilha.alturaDoAssento, 6);
  });

  it('usa 14 aros do chão e 10 aros quando pousa em cima da plataforma', () => {
    expect(pilhaDoBanquinho(CADEIRA_SENTAR.assentoY).aneis).toBe(14);
    const naPlataforma = pilhaDoBanquinho(CADEIRA_SENTAR.assentoY, TOPO_BASE);
    expect(naPlataforma.aneis).toBe(10);
    expect(naPlataforma.alturaDosAneis[0]).toBeCloseTo(TOPO_BASE + BANQUINHO.alturaDoPrimeiroAnel, 6);
    expect(naPlataforma.alturaDoAssento + BANQUINHO.alturaDoAssento).toBeCloseTo(CADEIRA_SENTAR.assentoY, 6);
  });

  it('o banquinho cabe inteiro em cima da plataforma, sem passar da borda de trás', () => {
    const raio = BANQUINHO.diametroDoAssento / 2;
    const centro = (CADEIRA_SENTAR.frenteZ + CADEIRA_SENTAR.fundoZ) / 2;
    expect(centro - raio).toBeGreaterThanOrEqual(-PLATAFORMA.profundidade / 2 - 0.02);
    expect(centro + raio).toBeLessThanOrEqual(PLATAFORMA.profundidade / 2);
  });

  it('mantém os aros sobrepostos, sem abrir vão entre eles', () => {
    const { alturaDosAneis } = pilhaDoBanquinho(CADEIRA_SENTAR.assentoY);
    for (let k = 1; k < alturaDosAneis.length; k++) {
      const passo = (alturaDosAneis[k] ?? 0) - (alturaDosAneis[k - 1] ?? 0);
      expect(passo).toBeGreaterThan(0.025);
      expect(passo).toBeLessThan(BANQUINHO.alturaDoAnel);
    }
  });

  it('limita a pilha ao que existe no desenho', () => {
    expect(pilhaDoBanquinho(5).aneis).toBe(BANQUINHO.aneis);
    expect(pilhaDoBanquinho(0).aneis).toBe(2);
  });
});

describe('banquinho.glb', () => {
  const arquivo = readFileSync(resolve(process.cwd(), 'src/assets/modelos/banquinho.glb'));
  const buffer = arquivo.buffer.slice(arquivo.byteOffset, arquivo.byteOffset + arquivo.byteLength);
  const carregar = () => new Promise<ReturnType<typeof geometriasDoModelo>>((resolve, reject) => {
    new GLTFLoader().parse(buffer, '', (gltf) => resolve(geometriasDoModelo(gltf.scene)), reject);
  });

  it('traz os 17 aros e o assento, em metros reais', async () => {
    const geometrias = await carregar();
    for (let k = 0; k < BANQUINHO.aneis; k++) expect(geometrias.has(`anel_${String(k).padStart(2, '0')}`)).toBe(true);
    expect(geometrias.has('assento')).toBe(true);

    const medida = (nome: string) => {
      const g = geometrias.get(nome)!;
      g.computeBoundingBox();
      return new Box3().copy(g.boundingBox!).getSize(new Box3().min.clone());
    };
    const primeiro = medida('anel_00');
    expect(primeiro.x).toBeCloseTo(0.434, 3); // 43,4 mm × escala 1:10
    expect(primeiro.y).toBeCloseTo(BANQUINHO.alturaDoAnel, 3);
    expect(medida('anel_16').x).toBeCloseTo(0.338, 3);
    const assento = medida('assento');
    expect(assento.x).toBeCloseTo(BANQUINHO.diametroDoAssento, 3);
    expect(assento.y).toBeCloseTo(BANQUINHO.alturaDoAssento, 3);
  });

  it('cabe dentro do fundo da cadeira da animação', () => {
    expect(BANQUINHO.diametroDoAssento).toBeLessThanOrEqual(CADEIRA_SENTAR.frenteZ - CADEIRA_SENTAR.fundoZ + 0.04);
  });
});

describe('plataforma.glb', () => {
  const arquivo = readFileSync(resolve(process.cwd(), 'src/assets/modelos/plataforma.glb'));
  const buffer = arquivo.buffer.slice(arquivo.byteOffset, arquivo.byteOffset + arquivo.byteLength);

  it('tem a bandeja, os 4 pinos e as 2 alças, nas medidas de PLATAFORMA', async () => {
    const geometrias = await new Promise<ReturnType<typeof geometriasDoModelo>>((ok, erro) => {
      new GLTFLoader().parse(buffer, '', (gltf) => ok(geometriasDoModelo(gltf.scene)), erro);
    });
    for (const nome of ['bandeja', 'pino_0', 'pino_1', 'pino_2', 'pino_3', 'alca_0', 'alca_1']) expect(geometrias.has(nome)).toBe(true);
    const bandeja = geometrias.get('bandeja')!;
    bandeja.computeBoundingBox();
    const tamanho = bandeja.boundingBox!.getSize(new Box3().min.clone());
    expect(tamanho.x).toBeCloseTo(PLATAFORMA.largura, 3);
    expect(tamanho.y).toBeCloseTo(PLATAFORMA.altura, 3);
    expect(tamanho.z).toBeCloseTo(PLATAFORMA.profundidade, 3);
    // Os pinos ficam sobre o eixo das barras.
    for (const nome of ['pino_0', 'pino_1', 'pino_2', 'pino_3']) {
      const g = geometrias.get(nome)!;
      g.computeBoundingBox();
      const centro = g.boundingBox!.getCenter(new Box3().min.clone());
      expect(Math.abs(centro.x)).toBeCloseTo(0.33, 2);
      expect(Math.abs(centro.z)).toBeCloseTo(PLATAFORMA.postesZ.ate, 1);
    }
  });
});
