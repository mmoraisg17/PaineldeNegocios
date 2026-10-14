// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CADEIRA_SENTAR } from '../movimento/animacoes/sentarELevantar';
import { geometriasDoModelo } from './Banquinho';
import { BANQUINHO, pilhaDoBanquinho } from './banquinho';

describe('pilhaDoBanquinho', () => {
  it('põe o assento exatamente na altura da animação de sentar e levantar', () => {
    const pilha = pilhaDoBanquinho(CADEIRA_SENTAR.assentoY);
    expect(pilha.alturaDoAssento + BANQUINHO.alturaDoAssento).toBeCloseTo(CADEIRA_SENTAR.assentoY, 6);
    const ultimo = pilha.alturaDosAneis[pilha.aneis - 1] ?? 0;
    expect(ultimo + BANQUINHO.alturaDoAnel).toBeCloseTo(pilha.alturaDoAssento, 6);
  });

  it('usa 14 aros para a cadeira da animação (assento a ~0,53 m)', () => {
    expect(pilhaDoBanquinho(CADEIRA_SENTAR.assentoY).aneis).toBe(14);
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

