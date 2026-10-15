# Mascote animado — plano

Data: 10/10/2026. Estado: rascunho para aprovação. Nada foi alterado no app.

## Pedido

1. Tirar o mascote do ícone (o quadrado rosa da tela de entrada). Ele aparece sozinho, sem fundo.
2. Animação leve: roda no celular sem travar.
3. O mascote interage: caminha em todas as abas do praticante, não só no login e no cadastro.
   - Quem está há tempo sem treinar vê o mascote fraco.
   - Quanto mais constante o treino, mais forte ele fica.
4. Animações feitas com a skill `remotion-motion-graphics`.

## Respostas do usuário (10/10/2026)

- Força em 5 níveis, com queda gradual e volta rápida: aprovado.
- Acompanhante: o mascote fica só no praticante (a fase 2 da D4 sai do escopo).
- Referência "Muse do Instagram": o usuário enviou uma busca de imagens do Google. O Google pediu
  CAPTCHA e a busca não abriu. Falta um print ou o endereço direto de uma imagem.

## Decisões de projeto

### D1. Como o mascote chega ao celular

| Opção | Peso | Risco de travar | Decisão |
|---|---|---|---|
| Vídeo / GIF / WebP animado | 200 kB a 2 MB | Médio (decodifica a cada quadro) | Não |
| Biblioteca Lottie | 60 kB a mais no pacote | Médio | Não |
| **SVG inline + CSS `transform`** | menos de 15 kB | Baixo (compositor, sem layout) | **Sim** |

O Remotion não vai no app. Ele serve de bancada: cada ciclo (andar, parar, cansado, forte) nasce
como composição, passa pelas regras da skill (mola, escalonamento, respiro, quadros de conferência),
e as curvas aprovadas viram `linear()` em CSS. O mesmo desenho SVG alimenta as duas pontas.

### D2. Mascote solto (sem ícone)

- Redesenho vetorial do kettlebell atual: corpo, alça, olhos, bochechas, boca, braços e pernas separados.
- Fundo transparente. O corpo atual (`#191923`) some no tema escuro (fundo `#191923`).
  Solução: corpo com contorno claro de 3 px e brilho rosa na borda, testado nas duas aparências.
- Referência "Muse do Instagram": **pendente** (ver dúvida 1). Até lá, o traço segue o mascote atual.
- Favicon e ícone do aparelho (`apple-touch-icon`) continuam como estão. O pedido trata das telas.

### D3. Força do mascote

Função pura `forcaDoMascote(sessoes, agora)` em `dominio/`, com testes, sem relógio interno.

| Nível | Nome na tela | Regra proposta |
|---|---|---|
| 1 | Cansado | Sem treino há 14 dias ou mais, ou nenhum treino ainda |
| 2 | Devagar | Último treino entre 8 e 13 dias atrás |
| 3 | Em forma | Último treino há até 7 dias, menos de 2 por semana nas últimas 4 semanas |
| 4 | Forte | 2 treinos por semana ou mais, em 3 das últimas 4 semanas |
| 5 | Campeão | Meta da rotina cumprida em 4 das últimas 4 semanas |

Regras de tom (público 60+ e reabilitação):
- O nome nunca culpa. "Cansado" pede um passeio, não uma bronca.
- A queda é gradual: um nível por semana de pausa.
- A volta é rápida: um treino já sobe um nível.
- O nível aparece também em texto (cartão em Progresso). A animação nunca é a única fonte.

Cada nível muda 4 coisas: postura (curvado → ereto), braços (caídos → levantados), olhos/boca,
velocidade da caminhada (lenta → decidida). Mais tamanho dos músculos no 4 e no 5.

### D4. Onde ele aparece e como caminha

| Tela | Comportamento |
|---|---|
| Entrada / cadastro | Parado, acena. Sem caminhada (o formulário tem foco) |
| Hoje, Biblioteca, Progresso, Perfil | Faixa fina acima da barra de abas. Caminha, vira nas pontas, para às vezes |
| Concluído | Comemora conforme o nível |
| Exercício (3D) | Não aparece (a cena 3D já anima) |
| Acompanhante | Fase 2: mascote do aluno na tela do aluno, parado |

- A faixa não cobre botão: `pointer-events: none`, altura fixa (sem deslocar o conteúdo).
- Toque no mascote abre um balão curto com o estado. Alvo de toque de 48 px.
- Um mascote por tela. Nenhum em segundo plano.

### D5. Orçamento de desempenho

- Só `transform` e `opacity`. Nada de `width`, `top`, `filter` animado.
- Um loop CSS por mascote; a caminhada move um único contêiner (`translateX`).
- Pausa com a aba oculta (`visibilitychange`) e fora da tela (`IntersectionObserver`).
- `prefers-reduced-motion`: pose parada, sem caminhada.
- Peso: SVG + CSS abaixo de 15 kB (gzip). Pacote do app não cresce mais que isso.
- Medição: trace do Chrome com CPU 4× mais lenta. Sem tarefa longa (>50 ms) durante a caminhada.

## Fases

1. **Referência e desenho.** Receber a referência. Desenhar o SVG em 5 níveis. Conferir contraste nas 2 aparências.
2. **Bancada Remotion.** Composições: andar, parar, virar, cansado, forte, comemorar. Conferir quadros. Exportar curvas para CSS.
3. **Domínio.** `forcaDoMascote` com testes primeiro (limites de cada nível).
4. **Componente.** `Mascote` (SVG + CSS, props `nivel` e `pose`) e `FaixaDoMascote` (caminhada).
5. **Integração.** Entrada sem ícone; faixa no `LayoutPraticante`; cartão em Progresso; comemoração em Concluído.
6. **Verificação.** Testes unitários e de tela; 5 níveis × 2 aparências × 3 tamanhos de texto; desempenho; movimento reduzido.
7. **Publicação.** Branch, PR, mesclar na `main`, conferir o Pages.

## Riscos

- Corpo escuro some no tema escuro. Mitigação: contorno e brilho (D2).
- Animação contínua distrai quem tem baixa visão ou tonteira. Mitigação: movimento reduzido, amplitude pequena, opção de desligar em Perfil → Ajustes.
- Mascote "fraco" pode desanimar. Mitigação: tom de D3.
- A memória `escopo-animacoes` limita animação às demos 3D. Este pedido é novo e explícito, vale só para o mascote.
