# Vídeo das animações (Remotion)

Duas composições: `Bulgaro` (abaixo) e `LucasEDiego` (as duas contas modelo de
demonstração lado a lado; ver a seção [Vídeo "LucasEDiego"](#vídeo-lucasediego-as-duas-contas-modelo)).

A `Bulgaro` gera um vídeo vertical (1080×1920, 30 fps, 15,6 s) do **Búlgaro explosivo** (agachamento
búlgaro com o pé de trás no banquinho e subida o mais rápida possível, sem salto) com as
mesmas poses, fases e cargas do app, para a apresentação do perfil do Lucas (conta de
demonstração: atleta de futevôlei, 24 anos, força e explosão).

Roteiro: título (2 s) → ciclo do nível 3 em câmera lenta 0,5× (8 s) → o mesmo trecho em
velocidade real (4 s) → aviso "Dados: simulação do app, não substitui orientação
profissional" (1,6 s). Durante o exercício aparecem:

- a legenda da fase (`amostra.fase`);
- o cronômetro do movimento: descida e subida em segundos **do exercício** (não do vídeo),
  com barras na mesma escala, "descida 2,5 s" contra "subida 0,6 s", calculadas de
  `temposDoBulgaro(3)`;
- o medidor da carga nos pés (`carga.pes`, em vezes o peso corporal, de 0 a 2×, com o traço
  do peso em 1× e o pico do trecho);
- na subida, a faixa "SUBIDA EXPLOSIVA · 0,6 s" e a moldura acesa na cor de destaque.

A plataforma fica sempre plana (a inclinação foi descartada para este vídeo; o teste confere).

## Como rodar

```bash
cd video
npm install            # o .npmrc liga legacy-peer-deps (bug do npm 10 com os peers do vitest)
npm run studio         # pré-visualização no navegador
npm run render         # out/bulgaro.mp4
npm run poster         # out/bulgaro-poster.png (quadro 264: meio da subida na câmera lenta)
npm run render:720     # out/bulgaro-720.mp4 (720×1280), se o 1080p demorar demais
npm test               # roteiro frame → tempo, subida × temposDoBulgaro, sem inclinação
npm run typecheck
```

`out/` e `node_modules/` não vão para o git.

**Navegador.** O `remotion.config.ts` usa, nesta ordem: a variável `NAVEGADOR_DO_VIDEO`,
o `chromium_headless_shell` do Playwright em `/opt/pw-browsers` e, sem nenhum dos dois, o
Chrome Headless Shell que o próprio Remotion baixa. O Chromium completo não serve (ele não
tem mais o modo headless antigo que o Remotion usa).

**WebGL.** O render usa `swangle` (SwiftShader, na CPU) e concorrência 2. Medido nesta
máquina sem GPU: 190–230 s para os 468 quadros em 1080×1920; o pôster, ~6 s (um quadro
avulso sem cache de empacotamento, ~17 s). Com GPU, passe `--gl=angle` e uma concorrência
maior.

## Como mudar nível, velocidade e duração

- Nível e velocidade da câmera lenta são props da composição (padrão `{"nivel": 3, "velocidadeLenta": 0.5}`):
  `npx remotion render src/index.ts Bulgaro out/bulgaro-n2.mp4 --props='{"nivel":2,"velocidadeLenta":0.5}'`.
  A duração é recalculada (`calculateMetadata`), porque a subida muda com o nível
  (1,2 s, 0,9 s e 0,6 s).
- Duração da abertura, do fecho e a janela da animação mostrada: constantes no topo de
  `src/roteiro.ts` (`ABERTURA`, `FECHO`, `ANTES_DA_DESCIDA`, `DEPOIS_DO_TOPO`).
- Enquadramento: `cameraDoVideo()` e `CAMPO_DE_VISAO` em `src/CenaDoBulgaro.tsx`.
- O pôster é o meio da subida calculado em `quadroDoPoster()`. Se o roteiro mudar, o teste
  avisa que o `--frame=` do script `poster` ficou desatualizado.

## O que vem do app (importado de `../app/src`, sem cópia)

- **Movimento:** `animacaoDe('agachamento-bulgaro-explosivo', { nivel: 3, bracos: 'cruzados', inclinacao: 0 })`,
  `temposDoBulgaro`, `amostrar`, `montarEsqueleto`, `respiracao`. A pose, a fase e a carga de
  cada quadro são as do app. O começo da descida (que o app não exporta) é o quadro-chave
  anterior ao fundo, para o vídeo não carregar uma cópia da constante `DESCIDA`.
- **Cena:** `Plataforma` e `Banquinho` (com os modelos `plataforma.glb` e `banquinho.glb`,
  o banquinho na altura de `animacao.cadeira`), `Chao`, `MaterialManequim`,
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
  `useFrame` e Tailwind); a iluminação foi repetida em `src/CenaDoBulgaro.tsx`. A câmera
  mantém a direção da vista lateral da animação, mas mais longe (5,0 m em vez de 3,6 m),
  com o alvo mais baixo e 40° de campo de visão em vez de 38°: no quadro em pé (9:16) a
  câmera do app cortava a cabeça e a plataforma e não sobrava espaço para o painel de dados.
- **Modelos GLB (`useLoader`).** O `Banquinho` e a `Plataforma` do app carregam o GLB com o
  `useLoader` do R3F dentro de um Suspense próprio (`ModeloComReserva`), que mostra caixas
  enquanto o arquivo chega. Isso funciona no `@remotion/three`, mas os primeiros quadros
  sairiam com as caixas. `EsperarModelos` (em `CenaDoBulgaro.tsx`) pede os dois arquivos ao
  mesmo `useLoader` sem Suspense próprio: a suspensão sobe até o `ThreeCanvas`, que segura o
  quadro com `delayRender` até os modelos chegarem, e aí a Plataforma e o Banquinho os acham
  no cache. Uma chamada por arquivo: o cache do `useLoader` é por lista de URLs. Por isso o
  `Banquinho` entra sem nenhuma mudança no app.

## Vídeo "LucasEDiego": as duas contas modelo

Composição `LucasEDiego` (1080×1920, 30 fps, 23,9 s, sem áudio): o mesmo búlgaro explosivo
nível 3 apresentado pelas duas contas de demonstração do app, **Lucas** (24 anos, treina por
conta própria) e **Diego** (30 anos, acompanhado pela preparadora física **Renata**). São
contas de demonstração, não pessoas reais; o fecho diz isso.

Roteiro (`src/roteiroLucasEDiego.ts`):

| Trecho | Duração | O que mostra |
| --- | --- | --- |
| Abertura | 2 s | "Força e explosão" + "Búlgaro explosivo", boneco em pé com a cor do manequim |
| Lucas | 8,2 s | câmera lenta 0,5× (4,2 s) do fim da descida até em pé, depois o ciclo inteiro em velocidade real (4 s) |
| Diego | 8,2 s | o mesmo, com o cartão e a cor dele |
| Comparação | 4 s | barras lado a lado: simetria, estabilidade, apoio nas barras e treinos feitos |
| Fecho | 1,5 s | "Dados: simulação do app, não substitui orientação profissional" e o aviso das contas de demonstração |

A câmera lenta não pega o ciclo inteiro: a 0,5× os 4 s do ciclo virariam 8 s por atleta, e o
vídeo passaria de 30 s. Ela pega o que interessa ver devagar (fim da descida, meio segundo no
fundo e a subida de 0,6 s); a velocidade real mostra o ciclo todo. Nas trocas de atleta a
imagem escurece por alguns quadros, porque o boneco passa de "em pé" para "fim da descida".

Durante cada atleta aparecem a legenda da fase, o cronômetro descida × subida
(`temposDoBulgaro(3)`), o medidor de carga nos pés (0–2×) e, no alto, o cartão do atleta.
Cada atleta tem uma cor de destaque (cartão, selos, faixa da subida e a "camisa" do boneco,
que é o tronco pintado só no vídeo): Lucas com a cor primária do app, Diego com o âmbar da
cena (`cena-atencao`), com texto escuro por cima para ter contraste.

```bash
npm run render:lucas-diego   # out/lucas-e-diego.mp4
npm run poster:lucas-diego   # out/lucas-e-diego-poster.png (quadro 396: Diego no meio da subida, com o recado)
```

**De onde vêm os números.** Nada é digitado à mão: `src/dadosDaDemo.ts` monta o estado com
`criarEstadoDemo(new Date('2026-10-07T15:30:00.000Z'))` (a data fixa dos testes do app; a
demo gera o histórico relativo a ela) e lê `praticantes.lucas`, `praticantes.diego`,
`acompanhantes` e `recados` com as mesmas funções das telas:

- médias dos últimos 3 treinos (nota, simetria, estabilidade, apoio nas barras):
  `mediasRecentes` do relatório do profissional, arredondadas como em `ResumoDoRelatorio`;
- treinos feitos nas últimas 6 semanas ("17 de 18", "24 de 24"): `resumirSemanas` +
  `adesaoDoPeriodo`, a conta da tela Progresso (extraída da tela para cá, sem mudar o
  resultado);
- quem ajustou, nível e frequência: `rotinaDoPraticante` (com o ajuste vigente da Renata);
- o recado: `estado.recados` (o da Renata para o Diego).

Valores exibidos com essa data: Lucas nota 94, simetria 89%, estabilidade 97%, apoio 1% do
peso, 17 de 18 treinos, 3 por semana (rotina do app); Diego nota 97, simetria 94%,
estabilidade 98%, apoio 1% do peso, 24 de 24 treinos, búlgaro fixo no nível 3 e 4 treinos
por semana (ajuste da Renata). Se a demo do app mudar, o vídeo muda junto; os testes
(`src/lucasEDiego.test.ts`) conferem os números contra o estado, o recado, o "17 de 18" e o
"24 de 24", a duração, o roteiro e a diferença de cor entre os blocos.

**Para mudar:** durações em `src/roteiroLucasEDiego.ts` (`ABERTURA`, `COMPARACAO`, `FECHO`,
`LENTA_ANTES_DO_FUNDO`); enquadramento em `ENQUADRAMENTO_DOS_ATLETAS` (`src/LucasEDiego.tsx`);
cores em `coresDosAtletas()` (`src/cores.ts`). Se o roteiro mudar, o teste avisa que o
`--frame=` do `poster:lucas-diego` ficou desatualizado.

## Limitações

- Sem anéis de pressão, seta de correção e fio de prumo: no app eles dependem da leitura do
  simulador de sensores, que o vídeo não roda. A carga mostrada é a "verdade" declarada pela
  animação (`Carga.pes`), não uma leitura simulada com ruído.
- O pé de trás do boneco não tem o peito do pé deitado: como no app, ele apoia a ponta dos
  dedos na borda de trás do assento, com o calcanhar alto.
- No "LucasEDiego" o movimento dos dois atletas é o mesmo (a animação do app não muda com
  a pessoa); o que os diferencia são os dados, os textos e a cor. O recado da Renata pede
  "descida em 3 segundos" e a fase do app diz "contando até 3", mas a animação do nível 3
  desce em 2,5 s, e é isso que o cronômetro mostra.
- Só o búlgaro. Outra animação do app precisa de um roteiro próprio (janela
  de tempo, textos).
- Sem áudio.
