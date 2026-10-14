"""Monta o banquinho retrátil do desenho do Gabriel e grava banquinho.glb.

Uso: python3 banquinho_para_glb.py banquinho.json banquinho.acds saida.glb
(o .json e o .acds saem do dwgread; ver README.md)
"""
import sys
import numpy as np
import trimesh
from assemble import apply, parts

ESCALA = 0.01  # mm do desenho -> m reais: o desenho está em escala 1:10


def malha_da_peca(p):
    pontos = apply(p['M'], p['mesh'][0])
    normais = p['mesh'][1] @ p['M'][:3, :3].T
    triangulos = p['mesh'][2]
    centro = (pontos.min(0) + pontos.max(0)) / 2
    pontos = pontos - np.array([centro[0], centro[1], pontos[:, 2].min()])  # origem: centro da base
    para_y_acima = lambda a: np.c_[a[:, 0], a[:, 2], -a[:, 1]]  # z para cima (CAD) -> y para cima (three)
    normais = para_y_acima(normais)
    normais /= np.linalg.norm(normais, axis=1)[:, None]
    return trimesh.Trimesh(para_y_acima(pontos) * ESCALA, triangulos, vertex_normals=normais, process=False)


def main(json_path, acds_path, saida):
    pecas, _ = parts(json_path, acds_path)
    aneis, assento = [], None
    for p in pecas:
        tam = np.ptp(apply(p['M'], p['mesh'][0]), 0)
        if p['layer'] == 'puxador' and abs(tam[0] - tam[1]) < 0.3 and 4.5 < tam[2] < 5.5 and 33 < tam[0] < 43.6:
            aneis.append((tam[0], p))
        if p['handle'] == 6361:  # bandeja do assento, 45 mm no desenho
            assento = p
    aneis.sort(key=lambda a: -a[0])
    if len(aneis) != 17 or assento is None:
        sys.exit(f'esperava 17 aros e o assento; achei {len(aneis)} aros, assento={assento is not None}')
    cena = trimesh.Scene()
    for i, (_, p) in enumerate(aneis):
        cena.add_geometry(malha_da_peca(p), node_name=f'anel_{i:02d}', geom_name=f'anel_{i:02d}')
    cena.add_geometry(malha_da_peca(assento), node_name='assento', geom_name='assento')
    cena.export(saida)


if __name__ == '__main__':
    main(*sys.argv[1:4])
