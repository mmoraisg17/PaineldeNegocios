"""Monta a plataforma (bandeja, 4 pinos e 2 alças) de simulacao_estacao.dwg e grava plataforma.glb.

Uso: python3 plataforma_para_glb.py simulacao.json simulacao.acds saida.glb
Origem: centro da bandeja no plano do chão, y para cima, escala real (desenho 1:10).
Os handles são os da entidade 3DSOLID no desenho (camadas "parte principal" e "peças laterais").
"""
import sys
import math
import numpy as np
import trimesh
import brep
from assemble import apply, parts

ESCALA = 0.01  # mm do desenho -> m reais (desenho em escala 1:10)
BANDEJA = 769
PINOS = (772, 775, 778, 781)
ALCAS = (784, 787)


def main(json_path, acds_path, saida):
    # malha mais grossa: a plataforma é vista de longe e o arquivo vai para o celular
    brep.PASSO_ARESTA, brep.PASSO_REFINO = math.pi / 12, math.pi / 5
    pecas = {p['handle']: p for p in parts(json_path, acds_path)[0]}
    faltam = [h for h in (BANDEJA, *PINOS, *ALCAS) if h not in pecas]
    if faltam:
        sys.exit(f'peças que não achei no desenho: {faltam}')
    pontos = {h: apply(p['M'], p['mesh'][0]) for h, p in pecas.items()}
    caixa = pontos[BANDEJA]
    origem = np.array([(caixa[:, 0].min() + caixa[:, 0].max()) / 2, (caixa[:, 1].min() + caixa[:, 1].max()) / 2, caixa[:, 2].min()])
    para_y_acima = lambda a: np.c_[a[:, 0], a[:, 2], -a[:, 1]]  # z para cima (CAD) -> y para cima (three)
    cena = trimesh.Scene()
    nomes = {BANDEJA: 'bandeja', **{h: f'pino_{i}' for i, h in enumerate(PINOS)}, **{h: f'alca_{i}' for i, h in enumerate(ALCAS)}}
    for h, nome in nomes.items():
        p = pecas[h]
        normais = para_y_acima(p['mesh'][1] @ p['M'][:3, :3].T)
        normais /= np.linalg.norm(normais, axis=1)[:, None]
        malha = trimesh.Trimesh(para_y_acima(pontos[h] - origem) * ESCALA, p['mesh'][2], vertex_normals=normais, process=False)
        cena.add_geometry(malha, node_name=nome, geom_name=nome)
    cena.export(saida)


if __name__ == '__main__':
    main(*sys.argv[1:4])
