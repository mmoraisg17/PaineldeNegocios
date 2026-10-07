# Auditoria visual: demonstrações 3D × referência enviada

> Data: 07/10/2026 · Auditoria e implementação de V1–V8 (aprovadas pelo Murilo em 07/10: estilo híbrido, blocos Alta + Média). Ver a seção 7.
> Escopo: só as demonstrações dos exercícios (`app/src/cena3d/`, `app/src/movimento/`).
> Referência: pin do Pinterest enviado pelo Murilo (https://pin.it/70wu8Hjwp). Vídeo principal do LYFTA ("9 Shoulder exercises to try with cable", 17,6 s) + dois vídeos relacionados que a página exibe junto (40 s e 32 s).
> Os quadros foram capturados só para análise e **não** entram no repositório, que é público: são material de terceiros.

## 1. O que a referência faz

### Estilo A, LYFTA (vídeo principal)
- **Corpo anatômico em "raio-X":** corpo escuro e translúcido, com contornos claros (efeito de borda, *fresnel*) e a musculatura visível.
- **Músculos trabalhados acesos em ciano**, com brilho: ombros nos exercícios de ombro.
- **Fundo preto liso.** O equipamento aparece em cinza e branco, também meio translúcido.
- **Câmera fixa por exercício**, com ângulos variados: frente, 3/4, lado e costas, escolhidos para mostrar o músculo.
- **Movimento de captura de movimento**, contínuo e com peso.

### Estilo B, coaching (vídeos relacionados)
- **Manequim branco ou cinza liso** em estúdio escuro, com **luz de recorte**: borda clara contornando o corpo.
- **Marcações sobre o corpo:**
  - **anel verde no pé** de apoio (contato com o chão);
  - **linha laranja brilhante** ao longo da perna ou da coluna (alinhamento);
  - **seta** mostrando para onde corrigir;
  - **membro aceso em verde** no movimento certo.
- **✕ vermelho / ✓ verde** num canto da cena: execução errada ou certa.
- **Mini mapa muscular** no alto (silhueta de frente e de costas com o músculo pintado).
- **Câmera que corta para close-ups** (pé, joelho, ombro) no momento do erro.

> O estilo B é praticamente a ideia do nosso produto desenhada em 3D: o sensor acusa e o corpo mostra onde corrigir. Hoje essa informação está fora da cena, no mapa de pressão e no aviso de texto.

## 2. Comparação com a nossa demonstração atual

Notas de 1 a 5 em relação à referência (5 = no nível dela).

| # | Aspecto | Nossa cena hoje (arquivo:linha) | Referência | Nota |
|---|---|---|---|---|
| 1 | Forma do corpo | Cilindros e esferas uniformes: coxa de raio 0,062, canela 0,048 e tronco um cilindro de 0,115 (`cena3d/Boneco.tsx:31-40`) | Silhueta anatômica: ombros largos, cintura, coxa afinando no joelho, panturrilha | **1** |
| 2 | Material | `meshStandardMaterial` opaco, cores de roupa (camisa verde, calça azul-escura, pele `#c68863`) (`Boneco.tsx`, `global.css:53-56`) | A: translúcido com borda clara. B: branco liso com luz de recorte | **1** |
| 3 | Fundo e iluminação | Fundo claro, chão `#ece9e2`, hemisférica 1,4 + 1 direcional de frente (`VisualizadorExercicio.tsx:83-84`) | Estúdio escuro, luz de recorte por trás e contraste alto | **2** |
| 4 | Destaque do que importa | A região inteira pinta coral (pernas, tronco ou braços), só quando há erro (`Boneco.tsx`, `regiaoDoDesvio`) | Só o **músculo** que trabalha acende, e o brilho acompanha o esforço | **2** |
| 5 | Contato com a plataforma | Nada na cena; a pressão aparece só no mapa 2D abaixo (`components/MapaDePressao.tsx`) | Anel verde no pé de apoio | **1** |
| 6 | Certo × errado na cena | Só o aviso de texto fora da cena (`AvisoDeCorrecao.tsx`) | ✓ / ✕ dentro da cena, linha de alinhamento vermelha ou verde, seta de correção | **1** |
| 7 | Câmera | Uma posição fixa `[2.45, 1.6, 2.95]` + órbita manual (`VisualizadorExercicio.tsx:15-16`) | Ângulo escolhido por exercício; close-up no erro | **2** |
| 8 | Movimento | Curva contínua, defasagem entre partes, respiração (auditoria anterior, A1–M3) | Captura de movimento | **3** |
| 9 | Equipamento | Plataforma, barras e cadeira opacos, coloridos (`Cenario.tsx`) | Equipamento em cinza claro, coerente com o estúdio | **2** |
| 10 | Mapa muscular | Não existe | Silhueta pequena com os músculos do exercício | **1** |

**Conclusão:** o movimento já está perto (3/5). A distância está no **visual** (corpo, material, luz) e nas **marcações de correção dentro da cena**. As duas coisas dá para resolver com o que já temos (three.js + R3F, geometria procedural), **sem dependência nova e sem modelo de terceiros**.

## 3. Proposta: estilo híbrido "estúdio de correção"

**Recomendação:** juntar o melhor dos dois estilos, porque o público é 60+ e o produto é correção.
- **Do A:** os músculos do exercício acesos em ciano, com o brilho acompanhando o esforço.
- **Do B:**
  - manequim claro com luz de recorte (mais amigável que o raio-X escuro e de leitura mais fácil);
  - anel nos pés;
  - linha de alinhamento;
  - ✓ / ✕ dentro da cena;
  - close-up no erro.
- **Cor nunca sozinha:** ✓ / ✕ e setas acompanham verde e vermelho, para quem tem daltonismo.

### Tokens visuais (substituem os `--color-cena-*`)

```css
--color-cena-fundo: #0e1217;          /* estúdio escuro */
--color-cena-chao: #1a2027;
--color-cena-corpo: #d9dde2;          /* manequim claro */
--color-cena-borda: #ffffff;          /* luz de recorte / fresnel */
--color-cena-musculo: #2ec5ff;        /* músculo trabalhado (ciano) */
--color-cena-certo: #3ddc84;          /* anel e ✓ */
--color-cena-atencao: #ffb020;
--color-cena-erro: #ff4d4f;           /* anel, linha e ✕ */
--color-cena-equipamento: #8b95a3;
```

## 4. Correções priorizadas

Esforço: **P** ≤ 1 h · **M** 2–4 h · **G** ~1 dia.

### Alta (o salto visual)

| # | O que muda | Como (técnica) | Esforço | Impacto |
|---|---|---|---|---|
| V1 | **Estúdio escuro** | Fundo `--color-cena-fundo`, chão escuro com leve gradiente; luz de recorte: 2 direcionais por trás (intensidade 2,5) + hemisférica fraca (0,4) | P | Alto |
| V2 | **Corpo com silhueta anatômica** | Trocar os cilindros por `CapsuleGeometry` afinando (coxa 0,075 → 0,05 no joelho, panturrilha com volume) e o tronco por `LatheGeometry` com perfil de peito, cintura e quadril. Mesmo esqueleto, IK e testes de fatos: **só a "pele" muda** | G | Muito alto |
| V3 | **Material manequim com borda de luz** | `meshStandardMaterial` claro + *fresnel* (borda brilhante) via `onBeforeCompile`, sem pós-processamento | M | Muito alto |
| V4 | **Músculos do exercício em ciano** | Malhas finas sobre o corpo (quadríceps, glúteos, panturrilhas, abdômen, ombros); cada animação declara os seus. O brilho segue o esforço, ligado à `Carga.pes` (no sentar e levantar, o quadríceps acende na saída da cadeira) | M | Alto |

### Média (correção dentro da cena: o diferencial do produto)

| # | O que muda | Como | Esforço | Impacto |
|---|---|---|---|---|
| V5 | **Anel de pressão em cada pé** | Anel sob cada pé, com tamanho e brilho proporcionais à carga daquele pé (`cargaEsquerda` do simulador). Verde = ok, âmbar = atenção, vermelho = pare | M | Muito alto |
| V6 | **✓ / ✕ e seta de correção** | Ícone no canto da cena (HTML sobre o canvas) com o estado da avaliação. Seta 3D apontando o lado para onde levar o peso | M | Alto |
| V7 | **Linha de alinhamento** | Linha brilhante joelho → tornozelo (ou coluna), vermelha no desvio e verde no certo | M | Médio |
| V8 | **Câmera por exercício + close-up no erro** | Cada animação declara o ângulo ideal. No erro, a câmera aproxima (0,6 s, curva suave) da região e volta depois. Desligado com movimento reduzido; a órbita manual continua | M | Médio |

### Baixa

| # | O que muda | Como | Esforço |
|---|---|---|---|
| V9 | Mini mapa muscular | Silhueta SVG frente e costas no canto, com os músculos do exercício | P |
| V10 | Equipamento no estilo do estúdio | Plataforma, barras e cadeira em cinza `--color-cena-equipamento`, com a área dos sensores acesa | P |

**Ordem sugerida:** V1 → V3 → V2 → V4 → V5 → V6 → V7 → V8 → V9 → V10. Tudo é procedural: as 7 animações da fase 6 herdam o estilo automaticamente.

## 5. O que não vou fazer, e por quê

- **Copiar os modelos ou vídeos do LYFTA ou dos outros vídeos:** são material de terceiros e o repositório é público. Fica só o estilo como inspiração.
- **Modelo humano pronto** (glTF/Mixamo) com captura de movimento:
  - exigiria refazer o esqueleto, o IK e os testes de fatos;
  - a licença da Mixamo não permite redistribuir os arquivos;
  - o prazo é 16/10, e a fase 6 ainda tem 7 exercícios.
- **Brilho por pós-processamento** (`@react-three/postprocessing`): seria uma dependência nova e pesa no celular. O *fresnel* e malhas aditivas dão um brilho parecido sem ela.
- **Higgsfield nas demonstrações:** vídeo gerado não segue os sensores nem os níveis (decisão anterior do grupo).

## 6. Riscos

- **Desempenho:** a malha mais detalhada (V2) e a transparência (V4) custam mais GPU. Mitigação: geometria com poucos segmentos (≤ 16), sem sombras em tempo real e `dpr` limitado a 2 (já é assim). Mediremos FPS antes e depois.
- **Contraste para 60+:** num fundo escuro, os textos e botões sobre a cena precisam de contraste AA. O ✓ / ✕ tem forma, não só cor.
- **Tempo:** V1–V8 somam cerca de 2 dias. Fazer antes da fase 6 encurta o tempo dela.

---

## 7. Implementação (V1–V8)

Um commit por item no branch `feat/visual-estudio`. Depois de cada um rodei tipos, lint (oxlint), a suíte completa (722 testes no fim) e o build, e conferi no Chrome (DevTools) em 390 px.

| # | Commit | O que foi verificado |
|---|---|---|
| V1 | `9eec5b7` | Estúdio escuro; o chão some na névoa sem horizonte marcado |
| V3 | `9a1002b` | Manequim claro; shader *fresnel* compila sem erros no console |
| V2 | `101088d` | Close na saída da cadeira: coxa e panturrilha com volume, cintura, articulações discretas. 19 testes dos perfis |
| V4 | `a06e350` | Quadríceps em ciano na extensão do joelho e quase apagado em pé. 7 testes do esforço com a animação real |
| V5 | `1a48994` | "Peso numa perna só": anéis âmbar, maior no pé carregado (25% / 75%). 8 testes |
| V6 | `5be0c71` | "Peso numa perna só": selo ! Atenção e seta para a esquerda. "Execução certa": ✓ verde, anéis verdes iguais e sem seta. 10 testes |
| V7 | `fbc45c0` | Fio de prumo âmbar fora do meio com peso numa perna. 3 testes (alinhado o ciclo inteiro na execução certa) |
| V8 | `5c50d3f` | Com erro nas pernas, a câmera desce e aproxima; no tamanho real do cartão (252 px) o corpo continua inteiro. 5 testes |

**Desvios do plano e ajustes:**
- **V4:**
  - Mistura **normal** em vez de aditiva: sobre o corpo claro, a aditiva virava quase branco.
  - Desconto de 15° de "flexão de repouso": o boneco fica em pé com cerca de 16° de joelho, e sem isso o quadríceps acenderia parado.
- **V2:** a cabeça visível ficou com 9 cm de raio, contra os 10,5 cm do esqueleto, e não ficou oval. A esfera não gira com o pescoço, e uma cabeça oval ficaria "em pé" com o tronco inclinado.
- **V6:** o selo é `aria-hidden`, porque o `AvisoDeCorrecao` já anuncia o estado ao leitor de tela.
- **Ambiente:** o servidor de desenvolvimento serviu CSS antigo uma vez, e as cores novas não apareceram. O build de produção estava certo; reiniciar o servidor resolveu.

**Desempenho:** no Chrome sem limite de CPU, com tudo ligado, foram cerca de 222 fps no desktop, contra cerca de 233 antes. Não medi em celular físico; a limitação de CPU do Chrome não representa um aparelho real, porque nesse modo o WebGL é desenhado por software.

**Ficou de fora (Baixa):**
- V9: mini mapa muscular.
- V10: equipamento no estilo do estúdio. A cadeira de madeira e a plataforma continuam com as cores antigas.
