# App da plataforma de equilíbrio e fortalecimento (nome provisório)

*Grupo 7 · Painel de Negócios PJ Consultoria 2026.2 · PRD gerado com `ecc:prp-prd`*

## Problem Statement

Idosos que se exercitam em casa e pessoas em fortalecimento ou fisioterapia domiciliar não sabem se executam os exercícios corretamente (peso mal distribuído, compensação na perna boa, apoio excessivo) e não sabem como progredir com segurança. O resultado são medo de cair, execução errada e abandono: de 50 a 70% dos pacientes não cumprem os exercícios domiciliares. Sem correção, o treino em casa perde efeito e expõe o usuário a quedas e lesões.

## Evidence

- Quedas: ~684 mil mortes por ano no mundo; adultos com mais de 60 anos são o grupo mais afetado (OMS, ficha de 2021).
- 15,8% dos brasileiros têm 60 anos ou mais (IBGE, Censo 2022).
- O Otago Exercise Programme (força e equilíbrio em casa, 3 vezes por semana) reduz as quedas em 35–40%.
- O feedback visual de centro de pressão melhora a simetria no agachamento; sem um sistema de medição, pacientes não cumprem uma descarga parcial de peso (ver `docs/pesquisa/sensores-pressao-correcao-exercicios.md`).
- De 50 a 70% dos pacientes não cumprem os exercícios domiciliares (Physitrack, **blog de fornecedor**; validar).
- Assumption: o público 60+ aceita usar o celular durante o treino. Precisa ser validado com usuários reais (fora do escopo do protótipo).

## Proposed Solution

Um app web mobile que acompanha a plataforma doméstica (células de carga, barras retráteis, inclinação ajustável). O app monta uma **rotina adaptativa e evolutiva** a partir do perfil e de uma avaliação na plataforma, **mostra cada exercício em animação 3D** e usa a **distribuição de peso medida (simulada no protótipo)** para avisar e corrigir a execução em tempo real. O app tem duas trilhas: **Equilíbrio 60+** (foco principal) e **Fisioterapia** (joelho e tornozelo). Escolhemos um boneco 3D procedural sincronizado com o sensor simulado, em vez de vídeo, porque mostra *ao mesmo tempo* o movimento certo e a relação dele com a pressão nos pés, que é o diferencial do produto.

## Key Hypothesis

Acreditamos que **o retorno em tempo real da distribuição de peso, somado a uma rotina adaptativa**, fará **idosos e pacientes de fisioterapia** treinarem em casa com segurança e constância.
Saberemos que estamos certos quando **a simetria e a estabilidade medidas melhorarem semana a semana e a adesão passar de 70% dos treinos planejados** (no protótipo, demonstrado com dados de exemplo).

## What We're NOT Building

- Login e contas reais: o protótipo usa um modo demonstração sem senha.
- Conexão Bluetooth com hardware: os sensores são simulados.
- Chat em tempo real, videochamada ou telemonitoramento: o acompanhante vê relatórios e envia recados de mão única.
- Diagnóstico, prescrição ou promessa de reabilitação: risco regulatório (ANVISA); a linguagem é de treino e acompanhamento.
- Os outros 8 exercícios do Figma: o protótipo foca em 8 exercícios com animação 3D completa.
- Backend e banco de dados: os dados ficam no próprio aparelho (localStorage).

## Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Entendimento pelo avaliador | Percorre o fluxo (entrar → exercício com correção → progresso) em < 2 min | Teste de corredor com 2–3 pessoas fora do grupo |
| Animações 3D | 8 exercícios animados, ≥ 30 fps num celular intermediário | Medição de FPS no Chrome DevTools (emulação mobile) e num aparelho real |
| Desempenho mobile | Lighthouse Performance ≥ 80 e Accessibility ≥ 95 | Lighthouse (mobile) no deploy |
| Peso da primeira carga | < 1,5 MB de JS (gzip), com o 3D carregado sob demanda | Saída do `vite build` |
| Qualidade da lógica | ≥ 80% de cobertura nos módulos de domínio (rotina, sensores, correções) | Vitest com coverage |
| Fluxo crítico | E2E verde no fluxo do MVP | Playwright |

## Open Questions

- [ ] **Nome do app**: provisório; será auditado ao longo do projeto (fica em constante única de configuração).
- [ ] **Paleta e visual finais**: podem mudar; tudo via tokens de tema.
- [ ] **Avisos por voz** (Web Speech API, pt-BR): Should. Confirmar se entram.
- [ ] **Formato do manual**: proposta de tela "Como usar" no app + documento (PDF/Markdown) no repositório, também usado como base do POP.
- [ ] **Medidas reais da plataforma** (altura do degrau, área útil, ângulos de inclinação): afetam o modelo 3D e a validade do step-down e do búlgaro. Usar o desenho de 06/10 até haver cotas.

---

## Users & Context

**Primary User: Dona Lúcia, 68 anos**
- **Who**: aposentada, independente, mora sozinha ou com o cônjuge, usa WhatsApp, teve uma quase-queda no último ano; a filha mora longe e se preocupa.
- **Current behavior**: faz caminhadas, assiste a vídeos de exercício, mas tem medo de fazer equilíbrio sem apoio e não sabe se faz certo.
- **Trigger**: o médico recomendou "exercícios de equilíbrio e força".
- **Success state**: treina 3 vezes por semana com segurança (barras), vê que está mais firme e o app avisa quando subir de nível.

**Secondary User: Rafael, 34 anos**
- Em reabilitação de LCA/entorse; recebeu uma lista de exercícios do fisioterapeuta e quer saber se está jogando o peso certo na perna operada.

**Job to Be Done**
Quando vou treinar em casa, quero saber na hora se estou fazendo certo e qual o próximo passo, para ficar mais forte e firme sem medo de me machucar.

**Non-Users**
Idosos frágeis com alto risco de queda sem supervisão; pós-operatório imediato sem liberação do profissional; atletas de alto rendimento; crianças.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|---|---|---|
| Must | **Login com dois perfis**: Praticante (quem treina) e Acompanhante (personal, fisioterapeuta; familiar só leitura) | Pedido do grupo: o profissional acompanha alunos específicos (ex.: o personal da Dona Lúcia) |
| Must | **Vínculo por código de convite**: a praticante gera, autoriza e pode revogar (LGPD, dados de saúde) | Acesso só a quem a praticante escolheu |
| Must | **Painel do acompanhante**: lista de alunos, adesão, simetria/estabilidade, alertas, histórico; profissional ajusta a rotina e envia recados | Dá sentido ao uso com personal/fisio |
| Must | Mobile-first + **moldura de smartphone no desktop** | Avaliadores abrem no celular; se só tiverem computador, simula o app |
| Must | Modo demonstração (entrar sem senha) | Zero atrito para o avaliador |
| Must | Perfil rápido (objetivo, confiança, acessórios) + **avaliação na plataforma** (calibração do peso + 10 s de equilíbrio simulados) | Base da adaptação da rotina (R2) |
| Must | **Rotina adaptativa e evolutiva**: trilha × nível 1–3; progride com nota do sensor + percepção (fácil/ok/difícil) | Requisito central (R2) |
| Must | **Biblioteca com 2 trilhas e níveis** (Equilíbrio 60+ e Fisioterapia) | R6 |
| Must | **8 exercícios com animação 3D** (lista abaixo), cada um pesquisado sistematicamente antes de animar | R3, R7, R8 |
| Must | **Sensores simulados** sincronizados com a animação + **correção em tempo real** por exercício | R4, o diferencial do produto |
| Must | Painel do avaliador para forçar erros (ex.: "peso na ponta") | Demonstração controlada |
| Must | Tela de conclusão + progresso (dados de exemplo) | Mostra a perspectiva evolutiva |
| Must | **Manual de uso (plataforma + app)**, entregue em 07/10 | Pedido do grupo; base do POP |
| Must | Nome e tema centralizados (constante + tokens) | Nome e cores ainda vão mudar |
| Should | Avisos por voz em português | Acessibilidade 60+ |
| Should | Gráfico de progresso semanal | Pitch da hipótese |
| Should | QR code para abrir o app | Facilita na apresentação |
| Could | Modo alto contraste / tamanho de fonte | Acessibilidade extra |
| Won't | Bluetooth/hardware, contas reais, chat/vídeo, recuperar senha | Fora do prazo; roadmap |

### Os 8 exercícios (ordem de prioridade de animação)

| # | Trilha | Exercício | Acessório | O que o sensor corrige |
|---|---|---|---|---|
| 1 | 60+ | Sentar e levantar | Barras + assento | Simetria E/D ao levantar, dependência das barras |
| 2 | Fisio, joelho | Miniagachamento com descarga simétrica | Barras | % de peso em cada perna (meta definida pelo profissional, ex.: 50/50), calcanhar × ponta |
| 3 | Fisio, tornozelo | Elevação de panturrilha unilateral | Barras | Subida reta, sem rolar para fora |
| 4 | 60+ | Pés em linha (tandem) | Barras (2 mãos → 1 → nenhuma) | Oscilação; quando reduzir o apoio |
| 5 | Fisio, joelho | Descida de degrau (step-down) | A base como degrau | Descida controlada, sem desvio lateral |
| 6 | 60+ | Abdução de quadril com elástico | Elástico preso à barra | Estabilidade da perna de apoio |
| 7 | Fisio, tornozelo | Equilíbrio num pé só com inclinação | Inclinação | Oscilação; progressão por inclinação |
| 8 | 60+ | Transferência de peso com alvos | Inclinação | Controle do centro de pressão até o alvo |

*O búlgaro foi só um exemplo do grupo e saiu do escopo (07/10). Entrou o miniagachamento simétrico: após cirurgias e lesões de joelho, a pessoa tende a descarregar menos peso na perna afetada (NCT01333189).*

### MVP Scope

Fluxo completo das 6 telas abaixo com as 2 trilhas, os 8 exercícios em 3D, o sensor simulado com correções, a moldura de desktop e o manual. Reserva: uma animação que não atingir qualidade até quinta à noite entra simplificada (mesmo boneco, menos detalhe).

### User Flow

1. **Início** → "Experimentar (modo demonstração)".
2. **Perfil rápido** (3 perguntas) → **avaliação na plataforma** (2 s de calibração em pé + 10 s de equilíbrio simulados) → nível sugerido.
3. **Hoje** → rotina do dia (trilha + nível).
4. **Exercício** → animação 3D + mapa de pressão ao vivo + correção na hora + painel do avaliador.
5. **Concluído** → resumo (simetria, estabilidade) + "fácil / ok / difícil" → ajuste do próximo treino.
6. **Progresso** → evolução semanal (dados de exemplo) + subida de nível.

**Fluxo do acompanhante:** Início → "Sou acompanhante" → (demo: Carlos, personal / Ana, fisioterapeuta / Marta, filha) → **Meus alunos** → aluno → relatório (adesão, simetria, estabilidade, alertas, histórico) → **ajustar rotina** e **enviar recado** (profissional). O vínculo nasce do **código de convite** que a praticante gera em *Perfil → Acompanhantes*, onde também revoga o acesso.

---

## Technical Approach

**Feasibility**: HIGH. App estático sem backend; sensores simulados; 3D leve.

**Architecture Notes**
- **Vite + React + TypeScript** (SPA de app), em vez de Astro (que é voltado a sites de conteúdo); **Tailwind + Motion** como em LunchBox.
- **3D com Three.js via React Three Fiber**: boneco low-poly **procedural** (articulações por keyframes) + plataforma modelada a partir do desenho de 06/10. Carregamento sob demanda (code-split) para não pesar a primeira tela.
- **Sincronia pose → sensor**: cada keyframe declara a distribuição de carga esperada; o simulador interpola o centro de pressão e injeta erros (automáticos ou pelo painel do avaliador).
- **Regras de correção** puras e testáveis por exercício (entrada: leitura simulada; saída: estado + mensagem).
- **Estado e persistência**: estado local + `localStorage` com try/catch (perfil, nível, histórico).
- **Configuração central**: `APP_NAME` e tokens de tema (CSS custom properties) num só lugar. Textos usam "a plataforma" e "o app" até o nome ser decidido.
- **Perfis e permissões**: papel `praticante` | `acompanhante` (`profissional` ou `familiar`); permissões puras e testadas (familiar não ajusta rotina nem envia recado); contas de demonstração locais.
- **Deploy**: GitHub Pages via GitHub Actions a partir de `app/` no repositório PaineldeNegocios.

**Technical Risks**

| Risk | Likelihood | Mitigation |
|---|---|---|
| Prazo das 8 animações 3D | H | Ordem de prioridade; sistema de keyframes reutilizável; reserva simplificada |
| Desempenho 3D em celular fraco | M | Low-poly, sem sombras pesadas, `dpr` limitado, pausar fora da tela |
| Movimento incorreto (credibilidade) | M | Pesquisa sistemática por exercício antes de animar; checklist de execução |
| Linguagem com cara de promessa médica | M | Revisão de textos: "treino", "acompanhamento", aviso educacional |
| Tela do avaliador sem toque (desktop) | L | Moldura com interação por mouse; teste em desktop e em celular |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|---|---|---|---|---|---|
| 1 | Fundação | Projeto Vite/React/TS em `app/`, tema e nome centralizados, moldura de celular, rotas, deploy no Pages | complete | - | - | [plano](../plans/completed/fase-1-fundacao.plan.md) · [relatório](../reports/fase-1-fundacao-report.md) |
| 2 | Domínio | Catálogo dos 8 exercícios, perfil, motor de rotina adaptativa, persistência (TDD) | complete | with 3 | 1 | [relatório](../reports/fases-2-3-4-report.md) |
| 3 | Motor 3D + 1º exercício | Boneco procedural, plataforma, sistema de keyframes; pesquisa e animação de "sentar e levantar" | complete | with 2 | 1 | [relatório](../reports/fases-2-3-4-report.md) |
| 4 | Sensores e correção | Simulador de centro de pressão sincronizado com a pose, regras de correção, painel do avaliador, voz | complete | with 5 | 2, 3 | [relatório](../reports/fases-2-3-4-report.md) |
| 5 | Telas do MVP | Início com 2 perfis, perfil + avaliação, Hoje, Biblioteca, Exercício, Concluído, Progresso, Acompanhantes (convite), painel do acompanhante | complete | with 4 | 2 | [relatório](../reports/fase-5-telas-do-mvp-report.md) |
| 6 | 7 animações restantes | Pesquisa sistemática + animação de cada exercício, na ordem de prioridade | complete | with 4, 5 | 3 | [relatório](../reports/fase-6-animacoes-report.md) |
| 7 | Manual de uso | Documento plataforma + app (Markdown + PDF) em 07/10; depois, a tela "Como usar" no app | in-progress | - | - | - |
| 8 | QA e entrega | E2E, acessibilidade, desempenho mobile, revisão de código e segurança, deploy final, QR code | complete | - | 4, 5, 6, 7 | [relatório](../reports/fase-8-qa-e-entrega-report.md) |

### Phase Details

**Phase 1: Fundação**
- **Goal**: esqueleto do app publicado e navegável.
- **Scope**: Vite + React + TS + Tailwind; `APP_NAME` e tokens; moldura de smartphone no desktop (≥ 768 px); roteamento; workflow de deploy no Pages.
- **Success signal**: URL pública abre no celular em tela cheia e no desktop dentro da moldura.

**Phase 2: Domínio**
- **Goal**: lógica de negócio testada.
- **Scope**: tipos e catálogo dos exercícios (trilha, nível, acessório, métricas do sensor); perfil; geração da rotina; regra de progressão; persistência.
- **Success signal**: testes unitários verdes com cobertura ≥ 80%.

**Phase 3: Motor 3D + 1º exercício**
- **Goal**: provar o pipeline 3D com o exercício mais difícil.
- **Scope**: boneco procedural articulado; plataforma (base, barras, abas laterais); player de keyframes com loop e controle; pesquisa sistemática de "sentar e levantar"; animação fiel.
- **Success signal**: o exercício roda a ≥ 30 fps no celular, revisado contra o checklist da pesquisa.

**Phase 4: Sensores e correção**
- **Goal**: o diferencial visível.
- **Scope**: simulador de centro de pressão por pose; injeção de erros; regras por exercício; mapa de pressão (base na tela S1 do Figma); painel do avaliador; voz (Should).
- **Success signal**: no miniagachamento, forçar "peso só numa perna" gera a correção certa em < 0,5 s.

**Phase 5: Telas do MVP**
- **Goal**: fluxo completo de ponta a ponta.
- **Scope**: as 6 telas do fluxo + Biblioteca com 2 trilhas + login com 2 perfis, convite/revogação e painel do acompanhante (lista, relatório, ajustar rotina, recado); linguagem 60+ (fonte grande, alto contraste).
- **Success signal**: fluxo percorrido em < 2 min por alguém de fora do grupo.

**Phase 6: 7 animações restantes**
- **Goal**: completar os 8 exercícios.
- **Scope**: para cada um, pesquisa sistemática (execução, erros comuns, progressão), keyframes e mapeamento pose → carga.
- **Success signal**: os 8 animados e com correções; nenhum na reserva simplificada, ou reserva documentada.

**Phase 7: Manual de uso**
- **Goal**: orientar o uso da plataforma + app (prazo: 07/10).
- **Scope**: montagem/segurança da plataforma, ajuste de barras e inclinação, primeiro uso do app, calibração, leitura das correções, cuidados; tela "Como usar" no app + documento no repositório.
- **Success signal**: o manual cobre do desembalar ao primeiro treino; o grupo aprova como base do POP.

**Phase 8: QA e entrega**
- **Goal**: confiável no dia da mentoria e da apresentação.
- **Scope**: Playwright no fluxo crítico; auditoria de acessibilidade; Lighthouse mobile; revisão (code-reviewer, react/typescript-reviewer, security-reviewer); deploy final; QR code.
- **Success signal**: todas as métricas da tabela de sucesso atingidas.

### Parallelism Notes

As fases 2 (lógica pura) e 3 (3D) não compartilham código e podem andar juntas depois da fundação. As fases 4 e 5 andam em paralelo: as telas consomem a interface do simulador, que pode começar com dados falsos. A fase 6 é a mais longa e roda em paralelo com 4, 5 e 7, uma animação por vez, na ordem de prioridade.

### Cronograma-alvo (prazo: sexta 09/10)

| Dia | Foco |
|---|---|
| Qua 07/10 | **Fase 7 (manual)** + fases 1, 2 e 3 (fundação, domínio, motor 3D + 1º exercício) |
| Qui 08/10 | Fases 4, 5 e 6 (sensores, telas, animações 2–5) |
| Sex 09/10 | Fases 6 e 8 (animações 6–8, tela "Como usar", QA e deploy) |

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Plataforma do protótipo | App web mobile no GitHub Pages | App nativo, PWA instalável | Avaliadores abrem por link no celular, sem instalar |
| Exibição no desktop | Moldura de smartphone | Layout responsivo de desktop | Simula o app se só houver computador |
| Sensores | Simulados, sincronizados com a animação | Hardware real (ESP32) | Plataforma física ainda não existe |
| Animação | Boneco 3D procedural (Three.js/R3F) | Vídeo, Mixamo, Quaternius | Exercícios com a plataforma não existem prontos; sem licença; leve; sincroniza com o sensor |
| Stack | Vite + React + TS + Tailwind + Motion | Astro (padrão dos outros projetos) | SPA de app com 3D; mantém Tailwind/Motion já usados |
| Repositório | `app/` no PaineldeNegocios | Repositório separado | Pedido do grupo |
| Dados | localStorage, sem backend | Firebase/Supabase | Prazo e privacidade; demo não precisa de contas |
| Nome e visual | Constante `APP_NAME` + tokens de tema | Valores espalhados | Nome e cores ainda vão mudar |
| Trilhas | Equilíbrio 60+ (foco) + Fisioterapia | Trilha única | Público principal idoso; fisio como expansão |
| Exercícios | 4 + 4 (lista acima) | Os 16 do Figma | Prazo; profundidade > quantidade |
| Búlgaro | Removido (07/10) → miniagachamento simétrico | Manter o búlgaro | Era só exemplo; o simétrico é mais comum e mede melhor com a base |
| Perfis | Praticante + Acompanhante (profissional ajusta e envia recados; familiar só lê) | Só praticante | Pedido do grupo (07/10) |
| Vínculo | Código de convite, revogável | Busca por e-mail | Consentimento explícito (LGPD) e simples de demonstrar |
| Nome | Adiado; termos neutros + `APP_NAME` | Escolher agora | Decisão do grupo (07/10); finalista sugerido: PRUMO |

---

## Research Summary

**Market Context**
O segmento clínico (Biodex, HUR SmartBalance, Huber 360, Prokin) tem sensores, barras e jogos, mas é caro e institucional. Apps de consumo (Nymbl) não medem nada; placas portáteis (KINVENT, BTrackS) não têm apoio nem rotina guiada. O nicho livre é o uso doméstico com apoio, medição e rotina guiada. Detalhes: `docs/pesquisa/pesquisa-de-mercado.md`.

**Technical Context**
Sensores de pressão corrigem bem os erros de distribuição de peso (simetria, calcanhar × ponta, oscilação, apoio nas barras), mas não ângulos articulares. Plataformas com 4 células de carga + HX711 têm validade aceitável (correlação acima de 0,75 com plataformas de laboratório). Exercícios-base: Otago (sentar e levantar, panturrilha, tandem, apoio unipodal), elástico (meta-análise de 2025), joelho (step-up/down, búlgaro, quadríceps) e tornozelo (unipodal com progressão, panturrilha unilateral). Detalhes: `docs/pesquisa/sensores-pressao-correcao-exercicios.md`.

**ECC no desenvolvimento**
`ecc:prp-plan` por fase; `ecc:tdd-guide` no domínio; skills `motion-foundations`, `motion-patterns`, `motion-advanced`, `find-animation-opportunities` e `improve-animations` nas animações; `frontend-design`, `ui-ux-pro-max` e `accessibility` nas telas; `ecc:deep-research` na pesquisa de cada exercício; revisores `code-reviewer`, `react-reviewer`, `typescript-reviewer`, `a11y-architect`, `security-reviewer` e `e2e-runner` no QA.

---

*Generated: 2026-10-07*
*Status: DRAFT - needs validation*
