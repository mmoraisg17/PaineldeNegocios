# Auditoria de identidade visual: o protótipo × o mercado esportivo

> Data: 09/10/2026 · Escopo: **cores, tipografia, forma e tom visual** do app (casca de telas, ícone e ilustração) e a ponte com a cena 3D.
> Fora do escopo: animação (só a cena 3D, regra do grupo), manual e PDF (ficam para o fim do projeto), nome do produto (decisão adiada).
> Método: skills `competitive-platform-analysis` e `benchmark-methodology` do ECC como guia. Legenda: **[M]** medido por mim em 09/10/2026 (CSS dos sites ou cores renderizadas) · **[S]** fonte externa · **[I]** inferência minha · **[R]** recomendação.

---

## 1. Resumo

1. **O app hoje lê como bem-estar, e a causa não é só o verde.** É a combinação: verde-floresta `#0F6E5C` + verde-sálvia `#DDEFEA` + fundo bege quente `#F7F5F0` + cantos de 1,25 rem. Essa receita é a do spa e do produto natural **[I]**.
2. **O mercado esportivo usa outra receita.** Superfície escura (preto ou grafite) com **um** acento de alta saturação: laranja (Strava, VALD, KINVENT, Zwift), azul-cobalto com laranja (KINVENT, Hawkin), ou lima/"volt" (Nike, Apple Fitness+, Hinge Health). Tipografia de exibição condensada ou expandida e números como protagonistas **[M]**.
3. **Os próprios líderes de bem-estar não são verdes.** Headspace, Calm, MyFitnessPal, Fitbit e Kaia usam azul **[M]**. Numa amostra de 71 sistemas de saúde e fitness, o azul é a cor principal de 34% e o verde não é a norma **[S]**. Sair do verde é uma boa decisão de diferenciação.
4. **Achado do nosso código: a cor da marca é a própria cor de "certo".** Na casca clara, o aviso "Tudo certo" e "Muito bem" usa `primaria-suave` e `primaria-escura` (`AvisoDeCorrecao.tsx:4-5`), e o mapa de pressão pinta o estado "ok" com `primaria` (`MapaDePressao.tsx:18-19`). Num app que corrige o movimento, a marca não pode ser também o sinal de acerto. A WHOOP separa as duas de forma explícita **[S]**. **Consequência para a troca de paleta:** esses estados precisam de tokens próprios (`certo`) antes de a primária mudar, senão "Tudo certo" ficaria azul.
5. **O nosso melhor ativo "esportivo" está escondido.** A cena 3D (estúdio escuro, ciano `#2EC5FF`, laranja `#FF8A3D`) já tem cara de performance, mas só aparece na tela do exercício. A casca em volta é outra linguagem.
6. **Espaço livre no mercado [I]:** não encontrei nenhum app que una a estética de performance a texto grande e contraste alto para quem tem 60 anos ou mais. A tensão do posicionamento é **performance × legibilidade e segurança**.
7. **A troca é barata e segura.** Toda cor sai de `app/src/styles/global.css`. Só 4 arquivos têm cor escrita à mão. O token `primaria` aparece em 37 arquivos (151 usos). A dificuldade está nas decisões e na verificação, não no código.
8. **Recomendação [R]: direção A, "Arena".** Superfícies escuras de tinta para o treino, base clara fria para leitura, **laranja-sinal** como cor de marca e de dado, **cobalto** como cor de ação. O verde fica só para status. Detalhes na seção 6.

---

## 2. Brief de posicionamento (inferido, a confirmar com o grupo)

| Item | Brief |
|---|---|
| Registro de identidade | Tecnologia esportiva de performance, "laboratório de ciência do esporte" que cabe em casa. Não é spa nem clínica |
| Oferta | Plataforma com sensores de pressão e barras de apoio + app que mede e corrige a execução |
| Público | (A) idosos ativos em casa; (B) quem faz fortalecimento ou fisioterapia em casa; (C) acompanhantes: personal, fisioterapeuta, familiar |
| Diferencial | Corrige a execução em tempo real, com apoio físico seguro |
| Consequência para a análise | Pesar mais os sinais de **performance** do que os de "amigável ao idoso" ao comparar. A acessibilidade vira **piso** (WCAG AA no mínimo), não o tema visual |
| Tensão estratégica | **Performance × legibilidade/segurança 60+** |

---

## 3. Método e limites

- **Medido [M]:** busquei o HTML e o CSS das páginas iniciais, contei as cores (hexadecimais) mais usadas e as famílias de fonte. Nos sites feitos em JavaScript, medi as cores **renderizadas** no navegador (fundos por área, botões, texto).
- **Cruzamento [S]:** diretrizes oficiais da WHOOP (via busca), auditoria da Lazyweb (71 sistemas de saúde e fitness, julho/2026) e um artigo sobre o app brasileiro Mais Equilíbrio.
- **Limites, sem maquiagem:**
  - Medi **sites de marketing**, não o interior dos apps. A paleta do app pode ser diferente (a WHOOP é o exemplo: site com botão violeta, diretrizes com teal).
  - Não consegui abrir SilverSneakers, Bold, Fitbod, Sword Health, Withings, Output Sports e o PDF oficial da WHOOP. Esses ficam sem dado ou com dado de segunda mão.
  - A amostra de 71 sistemas vem de **uma só empresa** e não informa a participação do verde.
  - As capturas de tela do navegador do app falharam com o painel oculto. A análise visual se apoia em números medidos, não em imagens.
  - A "psicologia das cores" que encontrei é comentário de marketing, não pesquisa rigorosa. Uso só como convenção cultural, nunca como prova.

---

## 4. Conjunto analisado

Conjunto de 24 marcas medidas (mais o SilverSneakers, sem dado), em 3 camadas e um grupo de contraste.

### 4.1 Diretos (exercício guiado em casa, 60+ ou fisioterapia)

| Marca | Cores medidas | Tipografia | Clima | Fonte |
|---|---|---|---|---|
| **Nymbl** (EUA, prevenção de quedas) | azul-petróleo `#00456A`, bordô `#9C2B5A`, verde-escuro `#094D33`, verde-claro `#93CC78` | Bookmania (serifa) + Centra No1 | Editorial, acolhedor, "revista" | [M] site |
| **Mais Equilíbrio** (BR, UnB/CEUB, base Otago) | sem paleta publicada | "fontes grandes, cores de alto contraste, ícones simples e ilustrações uniformes" | Funcional. SUS 95,98 com 24 idosos | [S] PMC12584999 |
| **Hinge Health** | lima `#CFFB4E`, amarelo `#FFC500`, rosa `#F175D3` | brownLL + DM Sans | Fisioterapia digital em tom de **lifestyle esportivo** | [M] |
| **Kaia Health** | marinho `#0F2D5A`, azul `#4180D2`, azul-claro `#A3CFE1` | Space Grotesk | Clínico-tecnológico | [M] |
| **Physitrack** | lima `#C3F350`, verde-petróleo `#006E6D` | Inter | Ferramenta de profissional | [M] |
| SilverSneakers GO | não consegui medir | — | — | — |

### 4.2 Adjacentes (sensores de força e equilíbrio, mercado profissional)

| Marca | Cores medidas | Tipografia | Clima | Fonte |
|---|---|---|---|---|
| **KINVENT** | marinho `#232D71` + laranja `#FB7000` | Manrope | Ciência do esporte, confiável | [M] |
| **VALD** (ForceDecks) | laranja `#F16E00` sobre tinta `#232323` | Roboto Light | Laboratório, dado cru | [M] |
| **Hawkin Dynamics** | azul `#1F3F8A` / `#3B53A4`; acentos magenta `#F00F7B`, ciano `#08AEEA` | **Abolition** (condensada, exibição) + Inter | Esporte de elite | [M] |

### 4.3 Aspiracionais (performance de consumo)

| Marca | Cores medidas | Tipografia | Clima | Fonte |
|---|---|---|---|---|
| **WHOOP** | preto e branco; botão do site violeta `#4A53FF` [M]. Diretrizes: teal `#00F19F`; recuperação verde `#16EC06` / amarelo `#FFDE00` / vermelho `#FF0026`; esforço azul `#0093E7` | Proxima Nova (texto) + **DINPro nos números** | Escuro, fotográfico, "dado como protagonista" | [M] + [S]* |
| **Strava** | laranja `#FC5200` (76 usos), preto, off-white `#F9F8F5` | Boathouse (própria) | Energia, comunidade | [M] |
| **Nike Training Club** | preto/branco; azul `#1151FF`, "volt" `#D5FF44` | Helvetica Now + **Futura ND (condensada)** | Atlético, editorial | [M] |
| **Peloton** | preto `#000` / `#181A1D`, sem acento forte | Brandon Grotesque + Inter | Estúdio escuro | [M] |
| **Garmin** | preto/branco; laranja `#FF9B00` pontual | Roboto + **Oswald (condensada)** | Instrumento, utilitário | [M] |
| **Polar** | vermelho `#E51D34`; verde `#06C167` secundário | Staff (própria) | Esporte de resistência | [M] |
| **Tonal** | tinta `#1C1C1A`, menta `#70EADD`, lima `#EAFFA0` | GT America + **GT Expanded** + **GT Mono** | Tecnologia de academia | [M] |
| **Zwift** | laranja `#FB6418`, ciano `#01B2CC` | Zwift Sprint (própria, "black") | Jogo esportivo | [M] |
| **Apple Fitness+** | preto, azul `#0071E3`, lima `#AAFF00` | SF Pro | Anéis e dado | [M] |
| **Smart Fit** (BR) | amarelo `#FFCC00` + preto (o CSS traz outras cores que não consegui atribuir) | muscleFont + DM Sans | Academia popular | [M], parcial |
| **Wellhub** (BR) | rosa-vermelho `#D8385E`, roxo `#5B4191` | **NaN Holo Condensed** + Inter | Corporativo, vibrante | [M] |

\* A paleta da WHOOP vem de uma busca que cita as diretrizes oficiais. **Não consegui abrir o PDF**: tratar como [S] de segunda mão.

### 4.4 Grupo de contraste (bem-estar)

| Marca | Cores medidas | Fonte |
|---|---|---|
| Headspace | azul `#0040EA`, amarelo `#FFCE00`; fonte Apercu | [M] |
| Calm | marinho `#1A3E6F`, amarelo `#F8D22D`, violeta `#6461E0`; Figtree | [M] |
| MyFitnessPal | azul `#0066EE`; Inter | [M] |
| Fitbit / Google | azul `#0B57D0`; Google Sans | [M] |
| Oura | marinho `#253B80`; verde `#08833D` só como estado; Akkurat + serifa Editorial New | [M] |

**Leitura:** o bem-estar de mercado é **azul e amarelo**, quase nunca verde-floresta. O verde-floresta com sálvia e bege é um clichê cultural de spa, não uma regra do segmento **[I]**.

---

## 5. O que o mercado mostra: 8 padrões

| # | Padrão | Evidência |
|---|---|---|
| P1 | **Performance = base escura + um acento de alta saturação** | WHOOP, Nike, Peloton, Tonal, Garmin, Apple Fitness+, VALD [M] |
| P2 | **O laranja é a cor "ciência do esporte" mais ocupada** | Strava, VALD, KINVENT, Zwift, Garmin [M]. Quem usar laranja precisa se diferenciar pela **combinação**, não pelo matiz |
| P3 | **Lima/"volt" é o "verde" da performance** | Nike, Apple Fitness+, Hinge, Physitrack, Tonal [M]. Reprova em fundo claro: `#C6FF3D` em branco dá **1,18:1** |
| P4 | **Azul domina saúde e bem-estar** | 24 de 71 sistemas (34%) [S]; Fitbit, MyFitnessPal, Headspace, Calm, Kaia [M] |
| P5 | **Tipografia de exibição condensada ou expandida + grotesca neutra + números de caráter próprio** | Oswald (Garmin), Abolition (Hawkin), Futura ND (Nike), NaN Holo Condensed (Wellhub), GT Expanded e GT Mono (Tonal), DINPro (WHOOP) [M]/[S] |
| P6 | **Cor da marca ≠ cor de status** | WHOOP: verde, amarelo e vermelho só para recuperação; azul para esforço [S] |
| P7 | **O tema escuro é maioria, mas não regra** | 39 de 71 escuros por padrão, 32 claros [S]; Strava só lançou o modo escuro em 2024 [S]. Os apps para idosos (Nymbl, Mais Equilíbrio) são claros [M]/[S] |
| P8 | **Nenhum aliou performance e legibilidade 60+** | Dentro das 24 marcas medidas, nenhuma tem os dois [I]. Hipótese a testar, não fato. Não medi tamanho de fonte nem peso dos apps |

---

## 6. Diagnóstico do nosso app e direções

### 6.1 Onde estamos (achados F1 a F8)

| # | Achado | Evidência no código | Gravidade |
|---|---|---|---|
| F1 | A paleta lê como bem-estar | `global.css`: `--color-primaria #0F6E5C`, `--color-primaria-suave #DDEFEA`, `--color-fundo #F7F5F0`, `--radius-cartao 1.25rem` | Alta |
| F2 | **Cor da marca = cor de status "certo"** | `AvisoDeCorrecao.tsx:4-5` ("Tudo certo", "Muito bem") e `MapaDePressao.tsx:18-19, 84` ("ok" e apoio baixo) usam `primaria`. Se um dia houver um verde de status ao lado da primária, a distância de cor (ΔE) cai para 29 (visão normal) e **12 na tritanopia**. Contra o verde da cena (`#3DDC84`) a distância é 56: só se distinguem pelo brilho | Alta |
| F3 | Duas linguagens visuais | Casca clara e calma × cena escura com ciano e laranja (`--color-cena-*`) | Alta |
| F4 | Tipografia sem personalidade | Inter única (`--font-sans`). Notas e percentuais só têm `.tabular`, sem tratamento de placar | Média |
| F5 | Marca sem ícone e ilustração de performance | `favicon.svg`: boneco branco em quadrado verde. `Inicio.tsx`: círculo sálvia. Logotipo não existe (nome adiado) | Média |
| F6 | Gráficos monocromáticos | `GraficoSemanal`, `GraficoDeTreinos`: uma cor (`primaria`) para tudo | Média |
| F7 | Sem superfície escura na casca | Só a cena é escura | Média |
| F8 | O vocabulário de performance existe e está subusado | O app já tem nota de execução, nível, simetria, conquistas | Baixa (oportunidade) |

**O que já está certo e deve ser mantido:** contraste AA em tudo (texto 15:1 sobre o fundo, branco sobre a primária 6,17:1), alvos de toque de 56 px, tamanho de texto ajustável, modo de alto contraste, cor nunca sozinha na cena.

### 6.2 Três constrangimentos medidos que decidem a paleta

1. **Laranja sobre fundo claro reprova.** `#FF6A1A` sobre `#F4F6F8` dá **2,65:1** (mínimo 3:1 para ícone, 4,5:1 para texto). O laranja só funciona **sobre superfície escura** (6,56:1 sobre tinta) ou como texto escuro **sobre** o laranja. Para texto laranja em fundo claro, usar o tom escuro `#C2410C` (4,78:1).
2. **Branco sobre laranja reprova.** `#FFFFFF` sobre `#FC5200` (o laranja da Strava) dá **3,31:1**; sobre `#E8530E`, 3,70:1. O botão laranja leva **texto escuro** (6,03:1 a 6,56:1).
3. **Laranja e âmbar se confundem para quem tem deuteranopia.** ΔE entre `#FF6A1A` e o âmbar de atenção `#FFB020` é 39 (normal) e **14 (deuteranopia)**. Regra: o laranja é cor de **marca e dado**, nunca de status, e nunca fica ao lado do âmbar sem ícone e texto.

### 6.3 Quatro direções

| | **A. Arena** *(recomendada)* | **B. Laranja total** | **C. Tinta + volt** | **D. Azul puro** |
|---|---|---|---|---|
| Ideia | Treino em superfície de tinta; leitura em base clara fria. Laranja-sinal = marca e dado. Cobalto = ação | Laranja é a primária; texto escuro nos botões | Preto com acento lima neon | Cobalto único, base clara |
| Sensação de performance | 5 | 5 | 5 | 2 |
| Diferenciação no segmento | 4 (a combinação cobalto + laranja + tinta é de laboratório, como KINVENT/Hawkin, e nenhuma é senior) | 2 (Strava, VALD, KINVENT, Zwift) | 2 (Nike, Apple, Hinge, Physitrack) | 2 (azul é a norma, 34%) |
| Legibilidade 60+ | 5 (botão cobalto 5,80:1 com branco; texto 16,78:1) | 3 (laranja limita o uso em fundo claro) | 2 (lima reprova em claro; fica só no escuro) | 5 |
| Libera o verde só para status | 5 (sim) | 5 (sim) | 1 (não: lima é parente do verde que se quer evitar) | 5 (sim) |
| Reaproveita a cena 3D | 5 (a cena já usa tinta, ciano e laranja) | 4 | 3 | 3 |
| Risco (5 = menor risco) | 3 (médio: duas superfícies para manter) | 3 (médio: espaço lotado) | 2 (alto: contradiz o pedido de sair do verde) | 5 (baixo, mas genérico) |
| **Nota (soma de 6, sem peso)** | **27** | 22 | 15 | 22 |

*As notas são julgamento meu, de 1 a 5, para o grupo discutir. Não são medida. B e D empatam: B é mais esportiva, D é mais segura.*

### 6.4 Direção A em tokens (proposta, a validar)

Tudo entra em `global.css`, bloco `@theme`. Contrastes calculados em 09/10/2026.

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `fundo` | `#F4F6F8` | Fundo das telas de leitura (cinza **frio**, sai o bege quente) | — |
| `superficie` | `#FFFFFF` | Cartões | — |
| `texto` | `#11161C` | Texto | 16,78:1 no fundo |
| `texto-suave` | `#475262` | Texto secundário | 7,31:1 no fundo |
| `primaria` (ação) | `#1F4FFF` | Botões, links, foco | branco no botão **5,80:1**; link no fundo 5,35:1 |
| `primaria-escura` | `#1A44E0` | Pressionado | branco 7,13:1 |
| `primaria-suave` | `#E3EAFF` | Seleção, chips | cobalto 4,83:1; texto 15,13:1 |
| **`sinal`** (nova) | `#FF6A1A` | Marca, dado em destaque, barras, ícone grande | **só sobre superfície escura** (6,56:1 sobre tinta; 5,73:1 sobre grafite) |
| **`sinal-texto`** (nova) | `#C2410C` | Texto laranja sobre fundo claro | 4,78:1 no fundo; 5,18:1 no branco |
| **`arena`** (nova) | `#0E1217` / `#1A2027` | Superfície do treino, placar, cena | — |
| `texto-na-arena` | `#E8ECF1` / `#A5AFBD` | Texto sobre a arena | 15,84:1 / 8,47:1 |
| `acao-na-arena` | `#7C9BFF` | Cobalto claro sobre a arena | 7,15:1 |
| `certo` (só status, **novo**) | `#17753F` no claro; `#3DDC84` no escuro | Acerto. Hoje o app usa `primaria` para isso (F2) | 5,75:1 / 10,53:1 |
| `certo-suave` (**novo**) | a definir (tom claro de `#17753F`) | Fundo do aviso "Tudo certo" | a conferir na Fase 2 |
| `alerta`, `perigo` | mantêm os atuais | Atenção e parada | já em AA |
| `ciano` (dado de sensor) | `#2EC5FF` | Pressão, músculo | 9,44:1 sobre tinta |

**Regras de uso da cor [R]:**
1. Verde, âmbar e vermelho **só** para estado de correção, sempre com ícone e texto.
2. Laranja e ciano são "dado": nota, simetria, mapa de pressão, curvas. Nunca estado.
3. Cobalto é "ação": o que se toca.
4. Tinta é "treino": a tela do exercício, o placar do fim do treino, o mapa ao vivo.
5. Base clara é "leitura": listas, formulários, relatórios do acompanhante.

### 6.5 Tipografia, forma e tom (também para auditar)

- **Tipografia [R]:** manter uma grotesca legível para o texto corrido (Inter serve) e acrescentar uma fonte de **exibição** para títulos e números de placar. Candidatas gratuitas e de licença aberta, a testar em corpo grande: Barlow Condensed, Archivo (largura variável), Space Grotesk. Números com `tabular-nums`. **Critério:** não pode haver peso fino; mínimo 600 em título e 18 px no corpo.
- **Forma [R]:** reduzir o raio do cartão (de 1,25 rem para algo perto de 0,75 rem) e usar mais ângulo e linha de régua nos placares. Sem efeito de "pílula suave", que é o signo do bem-estar.
- **Ícone e ilustração [R]:** o ícone do app passa a ser a silhueta da pessoa sobre a plataforma em tinta com um traço laranja (a linha de prumo). A ilustração da página inicial perde o círculo sálvia.
- **Tom [R]:** vocabulário de placar sem prometer saúde: "nota de execução", "recorde pessoal", "sequência de semanas". Nada de "reabilitação", "cura" ou "diagnóstico" (regra ANVISA do projeto).

---

## 7. Plano de ação para auditar

**Hoje é sexta, 09/10. Os slides vencem em 15/10 às 12 h; a apresentação é em 16/10.** As datas abaixo são proposta minha, de trás para frente. A estimativa de esforço é minha para o trabalho de código e verificação; as sessões com pessoas dependem do grupo.

### Fase 0. Decidir a direção (09 a 10/10) · gate G0

| | |
|---|---|
| **O que se audita** | Brief de posicionamento e a escolha entre A, B, C e D |
| **Como** | Reunião curta do grupo com a seção 6.3 e uma prévia lado a lado (ver "Fase 2"). Skill `ecc:brand-discovery` para fechar o brief |
| **Entregável** | Direção aprovada + respostas às 5 decisões da seção 8 |
| **Passa se** | O grupo escolhe uma direção e confirma o brief |

### Fase 1. Linha de base (10/10)

| | |
|---|---|
| **O que se audita** | As 32 telas atuais, em 3 modos: normal, alto contraste, texto "muito grande" (140%) |
| **Como** | Capturas automáticas em 360 px com Playwright (skills `ecc:e2e-testing` e `ecc:browser-qa`); mapa de onde cada token é usado (`grep` dos 37 arquivos); lista dos 4 arquivos com cor escrita à mão (`cena3d/cores.ts`, `cena3d/VisualizadorExercicio.tsx`, `index.html`, `public/favicon.svg`) |
| **Entregável** | Pasta de capturas (fora do repositório, ou só as nossas) + tabela "token → arquivos" |
| **Passa se** | Existe um "antes" para comparar cada tela |

### Fase 2. Prova em tokens (10 a 11/10)

| | |
|---|---|
| **O que se audita** | Se a direção escolhida funciona de verdade nas telas-chave |
| **Como** | Branch com a troca no bloco `@theme` do `global.css` (skill `ecc:design-system`). Seis telas lado a lado, atual × proposta: Início, Hoje, Exercício, Concluído, Progresso, Relatório do aluno. Direção `ecc:frontend-design-direction` |
| **Entregável** | Prévia navegável (build de teste) + comparativo de capturas |
| **Passa se** | O grupo aprova ou ajusta; nenhuma tela perde o contraste AA |

### Fase 3. Auditoria tela a tela (11 a 12/10)

Lista de verificação aplicada às 32 telas. Cada item é "passa" ou "falha":

| # | Verificação |
|---|---|
| A1 | Cor da marca não aparece como estado (certo, atenção, parada) |
| A2 | Estado tem sempre cor **e** ícone **e** texto |
| A3 | Todo texto: 4,5:1 (3:1 só a partir de 24 px negrito); todo componente de interface: 3:1 |
| A4 | Laranja só em superfície escura, ou com texto escuro por cima |
| A5 | Números de placar usam a fonte e os numerais definidos |
| A6 | Nenhum peso de fonte abaixo de 400 no corpo e de 600 em título |
| A7 | Sem raio "macio" fora da regra; cartão, botão e campo seguem a escala definida |
| A8 | Vocabulário sem promessa médica |
| A9 | Telas de treino em superfície escura, telas de leitura em base clara, sem mistura no meio da tela |
| A10 | Alvos de toque ≥ 48 px; foco visível com a cor nova |

**Como:** agente `ecc:a11y-architect` e skills `ecc:accessibility` e `ecc:frontend-a11y` para A1 a A4 e A10; revisão manual de A5 a A9.
**Entregável:** tabela 32 telas × 10 itens, com a lista de falhas priorizada.
**Passa se:** zero falhas em A1 a A3; falhas restantes têm dono e data.

### Fase 4. Teste com pessoas (12 a 13/10, depende do grupo)

| | |
|---|---|
| **O que se audita** | A hipótese P8: a estética de performance continua legível e agradável para 60+ |
| **Como** | 5 pessoas de 60+ (familiares), 10 minutos cada, no celular. Tarefas: achar o treino de hoje; entender se o exercício foi certo ou errado; ler a nota. Duas versões (atual × proposta), ordem alternada |
| **Entregável** | Tabela com tempo, erros e preferência por pessoa |
| **Passa se** | Nenhum aumento de erro ou de tempo na versão nova; a preferência não precisa ser unânime |

### Fase 5. Implementação (13/10)

| | |
|---|---|
| **O que se faz** | **Primeiro**, separar o estado "certo" da marca: criar `certo` e `certo-suave` e trocar os usos em `AvisoDeCorrecao.tsx`, `MapaDePressao.tsx` e onde mais a auditoria A1 achar. **Depois**: tokens finais; fonte de exibição; `favicon.svg`, `theme-color`, ilustração; cores dos gráficos; cores da cena 3D (só cor, sem tocar em movimento); modo alto contraste da nova paleta |
| **Como** | Mudanças em `global.css` e nos 4 arquivos de cor escrita à mão. Testes de contraste automáticos (um teste do Vitest que falha se um par de tokens ficar abaixo de AA), a partir do `contraste.mjs` desta auditoria. Agentes `ecc:react-reviewer` e `ecc:code-reviewer` na revisão |
| **Passa se** | Tipos, lint, testes e build verdes; teste de contraste no CI |

### Fase 6. Verificação e entrega (14/10)

| | |
|---|---|
| **O que se verifica** | Daltonismo (protanopia, deuteranopia, tritanopia) nos pares de status; Lighthouse de acessibilidade ≥ 95; 360 px sem rolagem horizontal; alto contraste; texto 140% |
| **O que se entrega** | Capturas "depois" das 32 telas; protótipo do Figma atualizado pelo plugin local `figma-export` (a conta Starter limita o MCP); imagens para os slides |
| **Adiado para o fim do projeto** | Manual de uso, PDF do manual e README (decisão do grupo) |
| **Passa se** | O comparativo antes e depois mostra uma identidade única, sem tela "velha" |

### Marcos

| Data | Marco |
|---|---|
| 10/10 | G0: direção aprovada |
| 11/10 | Prévia pronta (Fase 2) |
| 12/10 | Tabela de auditoria das 32 telas (Fase 3) |
| 13/10 | Teste com pessoas + implementação (Fases 4 e 5) |
| 14/10 | Verificação, Figma e imagens para os slides (Fase 6) |
| 15/10 12 h | Slides entregues |

---

## 8. Decisões que dependem do grupo

1. **Direção:** A, B, C ou D? (Recomendo A.)
2. **Casca clara ou escura?** Recomendo duas superfícies (escura no treino, clara na leitura). Um modo escuro total é possível, mas é mais trabalho de verificação e a leitura longa cansa mais para quem tem vista cansada **[I]**.
3. **Fonte de exibição:** quais das candidatas testamos? Precisa de licença que permita uso comercial.
4. **Nome do produto:** a identidade (ícone, tipografia do logotipo) depende dele. "PRUMO" foi a finalista; se ele sair, o ícone com a **linha de prumo** vira o símbolo natural.
5. **Escopo do teste com pessoas:** há tempo e 5 voluntários de 60+ até 13/10?

## 9. Riscos

- **Prazo:** 6 dias úteis para decidir, fazer, testar e verificar. Se a Fase 4 não couber, a decisão fica sem prova com o público. Mitigação: manter a versão atual como plano B pronta (os tokens trocam em um só arquivo).
- **Contraste do laranja:** regra A4 é a mais fácil de violar sem perceber. Mitigação: o teste automático da Fase 5.
- **Mistura de linguagens:** adotar a tinta só no treino pode parecer duas marcas. Mitigação: cobalto e laranja aparecem nas duas superfícies e a fonte de exibição é a mesma.
- **Dado de mercado fraco:** a amostra de 71 sistemas é de uma só fonte e as cores vêm de sites de marketing. As direções valem como hipótese de design, não como lei do segmento.

---

## 10. Fontes

- WHOOP, [Brand & Design Guidelines (PDF oficial, não aberto)](https://developer.whoop.com/assets/files/WHOOP%20-%20Brand%20%26%20Design%20Guidelines-bdea3554e94b4ea09e68695b1e8dc8e7.pdf) · [análise da identidade](https://madegooddesigns.com/whoop-brand-guidelines/) · [resumo do design](https://www.webdesignhot.com/design.md/whoop/)
- Lazyweb Research, [Que tema os apps de saúde e fitness usam por padrão?](https://www.lazyweb.com/research/what-theme-do-health-fitness-apps-use) (71 sistemas, julho/2026)
- [Mais Equilíbrio: desenvolvimento, validação e usabilidade (PMC12584999)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12584999/)
- Strava, [modo escuro no celular (2024)](https://www.advnture.com/news/strava-dark-mode)
- Les Mills, [psicologia das cores](https://www.lesmills.com/articles/color-psychology) (convenção cultural, não prova)
- Cores, fontes e tamanhos: medidos nas páginas públicas de Strava, WHOOP, Nike, Peloton, Garmin, Polar, Tonal, Zwift, Apple Fitness+, Smart Fit, Wellhub, Nymbl, Hinge Health, Kaia, Physitrack, KINVENT, VALD, Hawkin Dynamics, Headspace, Calm, MyFitnessPal, Fitbit e Oura, em 09/10/2026.
- Contraste (WCAG 2.2, fórmula de luminância relativa) e distância de cor (CIE76 ΔE, simulação de Machado 2009) calculados com script próprio.
- Documentos do projeto: [auditoria visual da cena 3D](auditoria-visual-referencia.md) · [pesquisa de mercado](pesquisa/pesquisa-de-mercado.md)
