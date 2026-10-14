# Medidas tiradas dos desenhos 3D do Gabriel

Fonte: `banquinho_retrátil.dwg`, `estacao_de_treino_multifuncional.dwg` e
`simulacao_estacao.dwg` (AutoCAD 2018, milímetros, **escala 1:10**). Conversão
em `tools/dwg-para-glb/`. Os desenhos são folhas de peças em vista explodida.

## Banquinho retrátil (já está nas animações)

| Peça | No desenho | Real (×10) |
|---|---|---|
| Aros telescópicos | 17 aros, Ø 43,4 → 33,8 mm, 5 mm de altura, passo de 3 mm | Ø 0,434 → 0,338 m, 0,05 m, passo de 0,03 m |
| Assento (bandeja) | Ø 45 × 5,25 mm | Ø 0,45 × 0,0525 m |

Prova da escala: com 14 aros, o assento fica a ~0,53 m, que é a altura que a
animação de sentar e levantar já usava, e o Ø 0,45 m cabe nos 0,42 m de fundo
da cadeira da animação. Sem a escala 1:10 nada disso bate.

## Plataforma (ainda não ligada nas animações; precisa de decisão)

| Peça | No desenho (x × y × z) | Real (×10) |
|---|---|---|
| Tampa / placa `peças laterais` | 70 × 100 × 10 mm | 0,70 × 1,00 × 0,10 m |
| Bandeja `parte principal` | 60 × 100 × 13 mm | 0,60 × 1,00 × 0,13 m |
| Pinos laterais (4) | 6 × 6 × 7 mm, a 66 mm entre si em x, 66 em y | 0,06 m, a 0,66 m |
| Alças em C (2) | octógonos de 24 mm | 0,24 m |

Hoje `movimento/cenario.ts` usa 0,70 × **0,50** × 0,12 m (valores de projeto,
como o próprio comentário diz). A **largura** bate com o desenho (0,70 m); a
**profundidade do desenho é 1,00 m**, o dobro, e a altura fica entre 0,10 e
0,13 m conforme a montagem. Mudar a profundidade para 1,00 m move a origem da
inclinação (borda de trás) e a cadeira, então muda os centímetros de
elevação do calcanhar em cada nível. Por isso não foi alterado sem confirmação.
