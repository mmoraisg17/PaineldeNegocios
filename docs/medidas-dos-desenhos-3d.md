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

## Plataforma (já está nas animações)

| Peça | No desenho (x × y × z) | Real (×10) |
|---|---|---|
| Bandeja `parte principal` | 60 × 100 × 13 mm, topo plano | 0,60 × 1,00 × 0,13 m |
| Pinos laterais (4) | 6 × 6 × 8 mm, a 66 mm entre si em x e em y | 0,06 m, a 0,66 m |
| Alças em C (2) | octógonos de 24 mm | 0,24 m |
| Tampa `peças laterais` | 70 × 100 × 10 mm, com rebaixos por baixo | 0,70 × 1,00 × 0,10 m (não usada) |

`movimento/cenario.ts` passou de 0,70 × 0,50 × 0,12 m (valores de projeto) para
0,60 × 1,00 × 0,13 m. Os postes das barras ficam sobre os pinos (x = ±0,34 m,
z = ±0,33 m). O banquinho pousa em cima da plataforma, na parte de trás: com a
profundidade de 1,00 m ele cabe inteiro sobre a bandeja, o que reforça a medida.

**Suposições a confirmar com a mecânica:**
- A altura da montagem é a da bandeja (0,13 m, a mesma do desenho de simulação).
  A tampa de 70 × 100 × 10 mm, se for montada em cima, soma 0,10 m.
- O topo da bandeja é plano e é a superfície onde o pé pisa.
- Com a bandeja de 0,60 m, a perna aberta na abdução passa da borda; o pé no ar
  continua medido a partir do topo da base (`movimento/corpo.ts`).
