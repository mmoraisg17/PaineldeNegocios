# Auditoria de animações: demonstrações dos exercícios

> Data: 07/10/2026 · Somente leitura (etapas 1 a 3). **Nenhum código foi alterado.** A implementação aguarda aprovação.
>
> **Escopo definido pelo grupo:** só as **demonstrações dos exercícios**, isto é, a cena 3D da tela do exercício (`app/src/cena3d/` + `app/src/movimento/`). Ficam **fora**: microinterações da interface (botões, rotas, listas, gráficos), mapa de pressão, aviso de correção e qualquer entrega do Painel (break-even, organograma etc.).

## 0. Método e ferramentas

| Etapa | Ferramenta | Por quê |
|---|---|---|
| Inventário | leitura direta e `grep` em `cena3d/` e `movimento/` (`useFrame`, `suavizar`, `misturarPose`, `balanco`, `frameloop`, `material.color`) | Cada item abaixo foi conferido na linha citada |
| Critérios | skill `improve-animations` (catálogo de curvas e durações) + princípio da skill `ecc:blender-motion-state-inspection`: **fatos antes de screenshots** | O boneco já tem testes de fatos (pés fixos, pico de carga); toda correção precisa mantê-los verdes |
| Implementação | `ecc:tdd-guide` (testes primeiro no motor), `ecc:react-reviewer`, navegador embutido em 390 px e desktop | — |
| Higgsfield | instalado (CLI + skills, não MCP), **não recomendado** para as demonstrações (seção 5) | As demonstrações precisam de biomecânica correta e de sincronia com os sensores |

**Limitação:** as notas vêm do código e das sessões no navegador das fases 1–4. Nesta auditoria não medi FPS nem gravei vídeo; isso entra na verificação da implementação.

**Estado atual:** das 8 demonstrações previstas no PRD, **1 está implementada** (`sentar-e-levantar`). As outras 7 são da fase 6 e usarão o mesmo motor. Por isso, **corrigir o motor agora melhora as 8 de uma vez**.

---

## 1. Resumo executivo

### Pontos fortes
- **Boneco dirigido por dados:** pose e carga saem dos mesmos keyframes, então o que o corpo faz bate com o que os sensores mostram.
- **IK de duas juntas** com os tornozelos fixos (`movimento/ik.ts`): os pés não deslizam.
- **Desempenho:** `frameloop` vira `'demand'` quando pausado (`VisualizadorExercicio.tsx:64`), o delta é limitado a 0,1 s (`Boneco.tsx:112`) e a geometria é procedural, sem modelos pesados.
- **Acessibilidade:** com movimento reduzido a cena começa pausada (`telas/Exercicio.tsx:27`); a legenda da fase não tem `aria-live` de propósito (`VisualizadorExercicio.tsx:97`); a órbita tem amortecimento (`Orbita.tsx:17`).

### Os 5 maiores problemas
1. **O boneco para em toda pose-chave.** `suavizar = 0.5 − 0.5·cos(πu)` (`movimento/animacao.ts:35`) zera a velocidade no início e no fim de **cada** trecho. Em `sentarELevantar.ts` são 10 poses em 8,8 s; 6 são intermediárias (t = 1,0 · 2,2 · 2,8 · 5,8 · 7,0 · 8,0) e o corpo freia em cada uma. Parece stop-motion.
2. **Todas as juntas se movem em sincronia perfeita.** Um único `u` vale para o corpo inteiro (`animacao.ts:51` → `misturarPose`, `:55`). No sentar-e-levantar real o tronco inclina **antes** de os joelhos estenderem (fase de transferência de momento) e os braços se acomodam **depois**. Sem antecipação nem follow-through, o movimento fica de marionete.
3. **O destaque do erro pisca.** A cor coral da região é trocada com `material.color.copy` (`Boneco.tsx:103`) de um quadro para o outro, sem transição.
4. **A oscilação do erro é um metrônomo.** O desvio usa uma senoide pura de frequência fixa (`movimento/desvios.ts:14`; 1,1 Hz em `:28` e 1,4 Hz em `:30`). A oscilação postural real é irregular; a regularidade parece mecânica.
5. **Pausar e retomar é um corte seco.** A velocidade vai de 1 a 0 num quadro (`Boneco.tsx:112` + `frameloop` em `VisualizadorExercicio.tsx:64`), e em pé (t 3,9–4,8 s) o boneco fica parado como estátua.

---

## 2. Inventário e notas (etapas 1 e 2)

Notas de 1 a 5: **R** realismo físico · **F** fluidez · **C** coerência · **P** performance · **A** acessibilidade · **Ad** adequação (ajuda a entender o exercício).
✅ implementado · ❌ planejado ou inexistente.

| # | Animação | Local | Função | Tecnologia | Parâmetros atuais | R | F | C | P | A | Ad | Problema |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Interpolação das poses ✅ | `movimento/animacao.ts:35-52` | Demonstrar o exercício | `useFrame` (R3F) + função própria | easing seno por trecho; 10 poses em 8,8 s | 2 | 2 | 4 | 5 | 4 | 4 | Para em cada pose intermediária |
| 2 | Mistura de juntas ✅ | `animacao.ts:51,55` | Corpo inteiro | `lerp` por junta | um `u` para todas as juntas | 2 | 3 | 4 | 5 | 4 | 3 | Sem antecipação nem follow-through |
| 3 | Relógio do boneco ✅ | `cena3d/Boneco.tsx:109-112` | Tempo | `useFrame`, `delta` | `tempo += min(delta, 0,1) × velocidade` | 4 | 4 | 4 | 5 | 4 | 5 | OK |
| 4 | Pausa e retomada ✅ | `Boneco.tsx:112`, `VisualizadorExercicio.tsx:64` | Controle | `frameloop` demand/always | velocidade 0 ↔ 1 instantânea | 2 | 2 | 3 | 5 | 4 | 4 | Congela e arranca sem rampa |
| 5 | Oscilação do erro ✅ | `movimento/desvios.ts:14,28,30` | Mostrar o erro no corpo | senoide | 0,025 m / 4° a 1,1 Hz; 0,045 m / 9° a 1,4 Hz | 2 | 4 | 3 | 5 | 4 | 4 | Periódica demais |
| 6 | Destaque da região do erro ✅ | `Boneco.tsx:103` | Apontar onde está o erro | `material.color.copy` | troca instantânea | 2 | 1 | 3 | 5 | 3 | 4 | Pisca |
| 7 | Legenda da fase ✅ | `VisualizadorExercicio.tsx:101` | Instrução sincronizada | texto em `<figcaption>` | troca seca, cerca de 1 vez por segundo | 2 | 2 | 3 | 5 | 4 | 4 | O texto pula (a altura já é fixa, `min-h-7`) |
| 8 | Órbita da câmera ✅ | `cena3d/Orbita.tsx:17` | Ver de outro ângulo | OrbitControls | `enableDamping`, `dampingFactor` padrão 0,05 | 4 | 4 | 4 | 5 | 4 | 5 | OK, já tem inércia |
| 9 | Respiração no repouso ❌ | — | Dar vida | — | — | 1 | 2 | — | — | — | 3 | Estátua nas pausas |
| 10 | Plataforma: inclinação e barras ❌ | `cena3d/Cenario.tsx` (estático) | Mostrar o equipamento em uso | — | tampo e barras fixos | — | — | — | — | — | 2 | `equilibrio-com-inclinacao` (fase 6) precisa do tampo inclinado; o nível do exercício muda a inclinação |
| 11 | 7 demonstrações da fase 6 ❌ | PRD, fase 6 | Demonstrar | — | — | — | — | — | — | — | — | Herdam os problemas 1, 2 e 4 se o motor não for corrigido antes |

---

## 3. Motion system da demonstração (etapa 3.3)

Constantes em `app/src/movimento/animacao.ts` (o motor já é o lugar das regras de movimento):

```ts
/* Defasagem por grupo, em fração do trecho (negativo = começa antes). */
export const ATRASO_DAS_JUNTAS = { tronco: -0.12, quadril: -0.04, joelhos: 0, cabeca: 0.08, bracos: 0.15 } as const;

/* Poses de repouso: as únicas em que o corpo para (velocidade zero). */
// campo novo no keyframe: repouso?: true

/* Transições visuais */
export const TAXA_DO_DESTAQUE = 12;    // 1/s: ~200 ms para chegar a 90% da cor coral
export const RAMPA_DE_PAUSA = 0.35;    // s para a velocidade ir de 1 a 0 (e de 0 a 1)
export const LEGENDA_FADE = 0.18;      // s, só opacidade

/* Vida e irregularidade (só na pose; NÃO alteram a carga dos sensores) */
export const RESPIRACAO = { hz: 0.22, grausTronco: 0.6 } as const;
export const OSCILACAO_SECUNDARIA = { razaoHz: 0.34, peso: 0.3 } as const; // 2ª senoide do desvio

/* Equipamento */
export const INCLINACAO = { duracao: 0.8, grausMax: 3 } as const; // tampo inclina com ease-in-out
export const CURVA_EQUIPAMENTO = [0.77, 0, 0.175, 1] as const;  // cubic-bezier, peça mecânica
```

**Regras:**
- **A carga continua no tempo base.** Defasagem, respiração e irregularidade mexem só na pose desenhada, então os detectores, o mapa de pressão e os testes de fatos não mudam.
- **Sem overshoot no corpo.** O público é 60+ e a demonstração ensina um movimento controlado; um "quique" passaria a ideia errada.
- **Movimento reduzido:** a cena começa pausada (já é assim). Ao tocar em "reproduzir", roda **sem** respiração e com o destaque em troca direta.

---

## 4. Correções priorizadas (etapa 3.4)

Esforço: **P** ≤ 30 min · **M** 1–2 h. Valores **atual → novo**.

### Alta

| # | Correção | Onde | Atual → Novo | Esforço | Impacto |
|---|---|---|---|---|---|
| A1 | **Interpolação contínua** | `animacao.ts:35-52` + `repouso: true` em `sentarELevantar.ts` (t 0 · 3,9 · 4,8 · 8,8) | seno por trecho → spline Catmull-Rom (centrípeta) pelas poses; velocidade contínua nas intermediárias e zero só nas de repouso | M | Muito alto: tira o efeito stop-motion |
| A2 | **Defasagem entre juntas** | `animacao.ts:51` (`misturarPose`) | `u` único → `u` por grupo com `ATRASO_DAS_JUNTAS` (tronco lidera, braços chegam depois), limitado a [0, 1] | M | Muito alto: tira o efeito marionete |
| A3 | **Destaque com transição** | `Boneco.tsx:103` | `color.copy` instantâneo → `color.lerp(alvo, 1 − e^(−12·delta))` a cada quadro (~200 ms) | P | Alto: o erro "acende" em vez de piscar |

### Média

| # | Correção | Onde | Atual → Novo | Esforço | Impacto |
|---|---|---|---|---|---|
| M1 | **Rampa de pausa** | `Boneco.tsx:112`, `VisualizadorExercicio.tsx:64` | velocidade 0/1 seca → desacelera em 0,35 s; `frameloop` só vira `'demand'` quando a velocidade chega a 0 | P | Médio |
| M2 | **Legenda em crossfade** | `VisualizadorExercicio.tsx:101` | troca seca → opacidade em 180 ms (sem deslocamento, porque muda ~1×/s) | P | Médio |
| M3 | **Respiração no repouso** | `Boneco.tsx` (só visual) | estátua → tronco ±0,6° a 0,22 Hz; desligada com movimento reduzido | P | Médio |

### Baixa

| # | Correção | Onde | Atual → Novo | Esforço | Impacto |
|---|---|---|---|---|---|
| B1 | **Oscilação irregular** | `desvios.ts:14,28,30` | 1 senoide → senoide principal (70%) + secundária a 0,34× a frequência (30%), com o mesmo pico | P | Baixo-médio |

**Ordem dos commits:** A1 → A2 → A3 → M1 → M2 → M3 → B1. Depois de cada um rodo tipos, os testes de `movimento/` (pés fixos, pico de carga) e o build, e confiro no navegador em 390 px e no desktop.

**Risco:** A1 e A2 mexem no motor das 8 demonstrações. A1 vem com testes novos: (a) velocidade contínua nas poses intermediárias; (b) velocidade zero nas de repouso; (c) passa exatamente por cada pose. A carga continua no interpolador atual, então o mapa e os detectores não mudam.

---

## 5. Novas animações nas demonstrações (etapa 3.5)

| Ideia | Como | Quando |
|---|---|---|
| **Tampo inclinando** | O tampo gira de 0° a até 3° (pelo nível) em 0,8 s, com `CURVA_EQUIPAMENTO`, antes de o exercício começar; o boneco compensa com a IK | Necessário para `equilibrio-com-inclinacao` (fase 6) |
| **Barras subindo ou recolhendo** | As barras sobem na demonstração com apoio e recolhem na sem apoio (0,6 s, mesma curva) | Mostra o equipamento em uso; vale para os níveis com e sem apoio |
| **"Fantasma" da pose correta** | Quando há desvio, uma silhueta translúcida (opacidade 0,25) mostra a pose certa sobre o boneco errado | Torna a correção visual e direta |
| **Câmera por exercício** | Cada animação declara o ângulo ideal (de lado no sentar-e-levantar, de frente na abdução); a câmera vai até ele em 0,6 s ao abrir | Fase 6 |
| **Câmera lenta na fase crítica** | Botão "ver devagar": velocidade 0,5× com rampa de 0,35 s (reaproveita M1) | Útil para o público 60+ |

**Higgsfield:** **não** recomendo nas demonstrações. Vídeo gerado não garante a biomecânica correta (joelho alinhado, tronco na inclinação certa), não sincroniza com a carga dos sensores e não muda com o nível nem com o erro simulado. O 3D procedural cumpre tudo isso. Gerar com Higgsfield só faria sentido para material de divulgação fora do app, que está fora deste escopo.
