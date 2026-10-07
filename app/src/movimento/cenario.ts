/* Medidas da plataforma e do corpo, em metros.

   A plataforma segue o desenho da base de 06/10/2026 (docs/modelagem): caixa
   retangular com tampa, abas laterais onde as barras são presas e pés
   antiderrapantes. As cotas ainda não foram definidas pela equipe de mecânica
   (manual, Anexo A); estes são valores de projeto plausíveis e ficam todos
   aqui para mudar num lugar só quando as medidas reais chegarem. */
export const PLATAFORMA = {
  largura: 0.7, // eixo X: as barras ficam nas laterais
  profundidade: 0.5, // eixo Z
  altura: 0.12, // altura do topo da base em relação ao chão (também é o "degrau")
  alturaPes: 0.015,
  margemTampa: 0.035, // borda da tampa em volta da área dos sensores
  barraX: 0.38, // distância lateral de cada barra ao centro
  /* Pegada na altura do quadril em pé (manual, 3.3): ~0,92 m acima do topo da
     base para o boneco de referência. Faixa do mercado: 0,66–0,93 m. */
  pegadaAltura: 0.92,
  pegadaZ: { de: -0.3, ate: 0.2 },
} as const;

export const TOPO_BASE = PLATAFORMA.altura;

/* Graus por nível do seletor de inclinação (manual, 3.3). O manual define os
   níveis, não os graus: 5° por nível é decisão de projeto (faixa das pranchas
   de reabilitação de tornozelo; pesquisa da fase 6). */
export const GRAUS_POR_NIVEL_DE_INCLINACAO = 5;

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
