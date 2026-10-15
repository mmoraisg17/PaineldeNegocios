# Vídeo das animações (Remotion)

Gera um vídeo vertical (1080×1920, 30 fps, ~12 s) do **Salto vertical (CMJ)** com as
mesmas poses, fases e cargas do app, para a apresentação do perfil do Lucas (conta de
demonstração: atleta de futevôlei, 24 anos, fortalecimento e explosão).

Roteiro: título (2 s) → salto nível 3 em câmera lenta 0,5× → o mesmo trecho em
velocidade real → aviso "Dados: simulação do app, não substitui orientação profissional".
Durante o salto aparecem a legenda da fase (`amostra.fase`) e um medidor da carga nos pés
(`carga.pes`, em vezes o peso corporal, com o pico do trecho).

## Como rodar

```bash
cd video
npm install            # o .npmrc liga legacy-peer-deps (bug do npm 10 com os peers do vitest)
npm run studio         # pré-visualização no navegador
npm run render         # out/salto.mp4
npm run poster         # out/salto-poster.png (quadro 132: ápice do voo, ~2,0 s da animação)
npm run render:720     # out/salto-720.mp4 (720×1280), se o 1080p demorar demais
npm test               # roteiro frame → tempo
npm run typecheck
```

`out/` e `node_modules/` não vão para o git.

**Navegador.** O `remotion.config.ts` usa, nesta ordem: a variável `NAVEGADOR_DO_VIDEO`,
o `chromium_headless_shell` do Playwright em `/opt/pw-browsers` e, sem nenhum dos dois, o
Chrome Headless Shell que o próprio Remotion baixa. O Chromium completo não serve (ele não
tem mais o modo headless antigo que o Remotion usa).

**WebGL.** O render usa `swangle` (SwiftShader, na CPU) e concorrência 2. Medido nesta
máquina sem GPU: 172 s para os 361 quadros em 1080×1920 no primeiro render (com o
empacotamento) e 104 s nos seguintes; o pôster, ~5 s. Com GPU, passe `--gl=angle` e
uma concorrência maior.

## Como mudar nível, velocidade e duração

- Nível e velocidade da câmera lenta são props da composição (padrão `{"nivel": 3, "velocidadeLenta": 0.5}`):
  `npx remotion render src/index.ts Salto out/salto-n2.mp4 --props='{"nivel":2,"velocidadeLenta":0.5}'`.
  A duração é recalculada (`calculateMetadata`), porque o tempo de voo muda com o nível.
- Duração da abertura, do fecho e a janela da animação mostrada: constantes no topo de
  `src/roteiro.ts` (`ABERTURA`, `FECHO`, `ANTES_DA_DESCIDA`, `DEPOIS_DO_POUSO`).
- O pôster é o ápice do voo calculado em `quadroDoPoster()`. Se o roteiro mudar, o teste
  avisa que o `--frame=` do script `poster` ficou desatualizado.

## O que vem do app (importado de `../app/src`, sem cópia)

- **Movimento:** `saltoComContramovimento`, `temposDoSalto`, `amostrar`, `montarEsqueleto`,
  `respiracao`. A pose, a fase e a carga de cada quadro são as do app.
- **Cena:** `Plataforma` (com o modelo `plataforma.glb`), `Chao`, `MaterialManequim`,
  `CascasDosMusculos`/`atualizarMusculos`, perfis do corpo e `posicionarSegmento`.
- **Corpo do boneco:** `SEGMENTOS`, `JUNTAS` e `achatamento` de `cena3d/Boneco.tsx`. Essas
  três foram as únicas mudanças no app: passaram a ser exportadas, sem mudar comportamento.
- **Cores:** os tokens `--color-cena-*` de `app/src/styles/global.css`, lidos pela mesma
  `lerCoresDaCena` do app.

O que **não** dá para reaproveitar direto, e por quê:

- O componente `Boneco` avança o próprio relógio no `useFrame` (`tempo += delta`). No
  Remotion o tempo tem de vir de `useCurrentFrame()`: cada quadro é renderizado isolado e
  fora de ordem. Por isso `src/BonecoNoQuadro.tsx` monta o mesmo corpo com as peças acima,
  recebendo a pose pronta do quadro.
- A iluminação e a câmera estão escritas dentro de `VisualizadorExercicio` (que também usa
  `useFrame` e Tailwind); a iluminação foi repetida em `src/CenaDoSalto.tsx`. A câmera usa a
  posição e o alvo da animação, com campo de visão de 46° em vez de 38°: no quadro em pé
  (9:16), 38° cortava a cabeça no ápice e não sobrava espaço para a legenda.

## Limitações

- Sem anéis de pressão, seta de correção e fio de prumo: no app eles dependem da leitura do
  simulador de sensores, que o vídeo não roda. A carga mostrada é a "verdade" declarada pela
  animação (`Carga.pes`), não uma leitura simulada com ruído.
- Só a composição do salto. Outra animação do app precisa de um roteiro próprio (janela de
  tempo, textos).
- Sem áudio.
