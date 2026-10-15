/* Medidas da plataforma, em metros, tiradas do desenho 3D do Gabriel
   (simulacao_estacao.dwg, em escala 1:10; ver docs/medidas-dos-desenhos-3d.md):
   bandeja de 0,60 × 1,00 × 0,13 m com cantos arredondados, quatro pinos nas
   laterais (onde entram os postes das barras, a 0,66 m entre si nos dois
   sentidos) e duas alças em C. Falta a equipe de mecânica confirmar a altura
   da montagem final (manual, Anexo A); ela fica aqui para mudar num lugar só. */
export const PLATAFORMA = {
  largura: 0.6, // eixo X: as barras ficam nas laterais
  profundidade: 1.0, // eixo Z
  altura: 0.13, // altura do topo da base em relação ao chão (também é o "degrau")
  alturaPes: 0,
  margemTampa: 0.04, // borda da tampa em volta da área dos sensores
  barraX: 0.34, // distância lateral de cada barra ao centro (eixo dos pinos)
  /* Pegada na altura do quadril em pé (manual, 3.3): ~0,92 m acima do topo da
     base para o boneco de referência. Faixa do mercado: 0,66–0,93 m. */
  pegadaAltura: 0.92,
  pegadaZ: { de: -0.3, ate: 0.2 }, // trecho da barra que a mão alcança
  postesZ: { de: -0.33, ate: 0.33 }, // postes sobre os pinos, a 0,66 m um do outro
} as const;

export const TOPO_BASE = PLATAFORMA.altura;

/* Proporções de um adulto de ~1,65 m (referência antropométrica usual:
   coxa ≈ canela ≈ 0,25 da estatura). */
export const CORPO = {
  canela: 0.42,
  coxa: 0.42,
  alturaTornozelo: 0.08,
  peFrente: 0.17,
  peTras: 0.06,
  meiaLarguraQuadril: 0.095,
  tronco: 0.52, // do centro do quadril à base do pescoço
  meiaLarguraOmbros: 0.19,
  quedaOmbro: 0.05,
  pescoco: 0.09,
  raioCabeca: 0.105,
  braco: 0.3,
  antebracoAtePegada: 0.33, // antebraço + metade da mão
} as const;

/* Distância vertical entre a articulação do quadril e o assento quando a
   pessoa está sentada (tecido do glúteo). */
export const QUADRIL_ACIMA_DO_ASSENTO = 0.09;
