# Inventário de documentos do projeto Nivela

Data: 15/10/2026. Motivo: troca de computador.
Pasta do projeto: `C:\Users\alesx\Desktop\murilo\PaineldeNegocios`.
Repositório: <https://github.com/mmoraisg17/PaineldeNegocios> (branch `main`).

## 1. Leia primeiro: o que NÃO está no GitHub

O repositório é público. Por isso o `.gitignore` deixa estas pastas fora do Git.
**Elas existem só neste computador.** Copie todas antes de formatar ou entregar a máquina.

| Pasta (dentro de `PaineldeNegocios\docs\`) | Arquivos | Conteúdo |
|---|---|---|
| `requisitos\` | 4 PDFs | Documentos oficiais da disciplina (um tem 26 MB) |
| `pesquisa\` | 5 MD | Pesquisa de mercado, sensores e exercícios |
| `modelagem\` | 1 JPEG | Vistas da base v1 (modelagem 3D) |
| `custos\` | 2 MD + 4 XLSX | Estrutura e planilhas de custos |
| `organizacional\` | PDF, CSV, DRAWIO, MD | Guia de design organizacional e organograma |
| `tempos\` | 3 DOCX, 2 XLSX, 4 MD | Estimativa de tempos da linha produtiva |
| `fluxograma\` | cerca de 150 arquivos | Todas as versões do fluxograma, relatórios e PDFs |

Também ficam fora do Git:

- `*.job.json` da pasta `docs\mascote\` (12 arquivos; contêm o identificador da conta da ferramenta de imagens).
- `app\node_modules`, `app\dist`, `app\coverage` (se reconstroem com `npm ci`).
- `video\node_modules` e `video\out` (saídas de vídeo renderizado, como MP4 e pôster; copie `video\out` se existir e você quiser guardar).

Fora da pasta `PaineldeNegocios\` (a subpasta do Git), na pasta pai `murilo\PaineldeNegocios\`:

- `requisitos-fluxograma.pdf` e `roteiro-fluxograma.pdf`
- `laboratorio-visual\`, `imagens-app\`, `figma-plugin\`, `figma-audit\`, `figma-export\`, `figma-fix\`
- `tools\figma-variables-sync\`
- `_transferencia\` (scripts de exportar e restaurar o setup do Claude Code)
- `.claude\` (regras e skills do projeto)

Fora da pasta do projeto, mas importante:

- **Memória do Claude:** `C:\Users\alesx\.claude\projects\C--Users-alesx-Desktop-murilo-PaineldeNegocios\memory\` (19 arquivos com decisões e contexto do projeto).
- Configuração do Claude Code: `C:\Users\alesx\.claude\` (settings, agents, skills).

O guia `_transferencia\LEIA-ME.md` e os scripts `exportar-setup.ps1` e `restaurar-setup.ps1` já fazem esta cópia em um ZIP.
Atenção: o guia cita um caminho antigo (`OneDrive\Projetos\painel de negocios`). Troque pelo caminho atual.

Status do Git em 15/10/2026: `main` igual à `origin/main`. Só `app/.claude/` está sem rastreio.

---

## 2. Documentos oficiais da disciplina (recebidos)

Pasta: `docs\requisitos\` (fora do Git)

| Arquivo | O que é |
|---|---|
| `01-case-grupo-7-esporte-e-fitness.pdf` | Case do Grupo 7 |
| `02-detalhamento-das-entregas-26-2.pdf` | Detalhamento das entregas do semestre 26.2 |
| `03-tabela-de-custos-e-producao-26-2.pdf` | Tabela de custos e produção |
| `04-instrucoes-painel-de-negocios.pdf` | Instruções do Painel de Negócios (26 MB) |

---

## 3. Pesquisa e planejamento

| Arquivo | O que é |
|---|---|
| `docs\pesquisa\pesquisa-de-mercado.md` | Pesquisa de mercado (equilíbrio 60+) |
| `docs\pesquisa\sensores-pressao-correcao-exercicios.md` | Sensores de pressão e correção dos exercícios |
| `docs\pesquisa\exercicios\01-sentar-e-levantar.md` | Pesquisa do exercício 1 |
| `docs\pesquisa\exercicios\02-a-08-demais-exercicios.md` | Pesquisa dos exercícios 2 a 8 |
| `PaineldeNegocios\.claude\PRPs\prds\app-plataforma-equilibrio.prd.md` | PRD do app |
| `.claude\PRPs\plans\completed\fase-1-fundacao.plan.md` | Plano da fase 1 |
| `.claude\PRPs\reports\*.md` (5 relatórios) | Relatórios das fases 1, 2-3-4, 5, 6 e 8 |
| `docs\prototipo\README.md`, `telas.json` | Descrição do protótipo |
| `docs\prototipo\01-telas\` (32 PNG) | Capturas das telas do protótipo |

---

## 4. Produto: app Nivela

| Arquivo | O que é |
|---|---|
| `README.md` (raiz) | Visão geral do repositório |
| `docs\manual\manual-de-uso.md` e `.pdf` | Manual de uso. O PDF é de 07/10 e está **desatualizado** em relação ao MD (15/10). Atualize só no fim do projeto |
| `docs\medidas-dos-desenhos-3d.md` | Medidas dos desenhos 3D |
| `docs\auditoria-visual-referencia.md` | Auditoria visual de referência |
| `docs\auditoria-identidade-visual.md` | Auditoria da identidade visual |
| `docs\auditoria-animacoes.md` | Auditoria das animações |
| `laboratorio-visual\auditoria-5-telas.md` | Auditoria das 5 telas |
| `docs\entrega\identidade-visual-avaliacao.pdf` | PDF de avaliação da identidade visual |
| `docs\entrega\qr-code-app.png` e `.svg` | QR code do app |
| `tools\dwg-para-glb\README.md` | Conversor DWG para GLB |
| `video\README.md` | Projeto de vídeo (Remotion) |
| `laboratorio-visual\` | Experimentos visuais (app de teste, comparação de logos, mascote em Remotion) |
| `imagens-app\` | `tela-inicial.png`, `telas-destaque.png` |

---

## 5. Marca e mascote

| Arquivo | O que é |
|---|---|
| `docs\marca\logica-da-marca.md` | Lógica da marca |
| `docs\marca\nome-da-empresa.md` | Propostas de nome (Aprumo + Nivela). Verificação no INPI pendente |
| `docs\marca\logo-nivela-claro.svg`, `logo-nivela-escuro.svg` | Logos |
| `docs\marca\qr-site\qr-nivela.png` e `.svg` | QR code do site |
| `docs\mascote\plano-animacao.md` | Plano da animação do mascote |
| `docs\mascote\candidatos\` | 6 candidatos (A1 a C2): PNG e prompts |
| `docs\mascote\candidatos-2\` | 6 candidatos da 2ª rodada: PNG e prompts |
| `docs\mascote\candidatos-3\prompts.md` | Prompts da 3ª rodada |
| `docs\mascote\comparacao\` | Comparação dos finalistas (HTML, A1 e A2) |

Escolhido: mascote **A1** (kettlebell).

---

## 6. Fluxograma do processo produtivo

Pasta: `docs\fluxograma\` (fora do Git)

| Arquivo | O que é |
|---|---|
| `README.md` | Guia da pasta |
| `guia-fluxogramas-bpmn.pdf` | Guia de fluxogramas BPMN |
| `nivela-fluxograma.html`, `nivela-processo-produtivo.bpmn` | Primeira versão (HTML e BPMN) |
| `exemplo-auditado\` | Exemplo oficial auditado (DRAWIO, PNG, SVG, JSON) |
| `fluxograma-revisado\` | Revisado (DRAWIO, PDF, 4 páginas PNG e SVG) |
| `fluxograma-v2-estoque\` a `fluxograma-v6-escopo\` | Versões v2 a v6 (DRAWIO, PDF, páginas PNG e SVG, `auditoria.json`) |
| `fluxograma-laura-organizado\` | Fluxograma da Laura organizado: 17 versões DRAWIO (v2 a v16), 2 versões com tempos e prévias PNG |
| `adequacao-fluxograma-organograma-e-nomes.pdf` | Adequação de fluxograma, organograma e nomes |
| `sintese-estimativa-tempo-por-etapa.pdf` | Síntese do tempo por etapa |
| `planilha-tempo-custo-nivela.xlsx` | Planilha de tempo e custo |
| `relatorio-analise-fluxograma-v4/v5/v6.docx` | Relatórios de análise |
| `requisitos-fluxograma-producao.docx`, `-v3.docx`, `-v4.docx` | Requisitos do fluxograma |
| `roteiro-fluxograma-producao.docx` e `.pdf` | Roteiro do fluxograma |

Versão mais recente: `NIVELA_Fluxograma_v6_Atualizado_MTO_ATO_organizado_v16.drawio` (15/10).
Na pasta pai: `requisitos-fluxograma.pdf` e `roteiro-fluxograma.pdf` (cópias de 12/10).

---

## 7. Custos

Pasta: `docs\custos\` (fora do Git)

| Arquivo | O que é |
|---|---|
| `estrutura-de-custos-app.md` | Estrutura de custos do app (caminho 1, Sebraetec) |
| `pesquisa-de-mercado-reducao-de-custos.md` | Pesquisa para reduzir custos |
| `planilha-de-custos-app-nivela.xlsx` | **Planilha nova do app** (15/10): uma aba, 12/24/36 meses |
| `planilha-de-custos-app.xlsx` | Planilha anterior do app |
| `planilha-de-custos-operacao.xlsx` | Operação |
| `planilha-de-custos-operacao-enxuta.xlsx` | Operação enxuta |

---

## 8. Organização da empresa (PJ)

Pasta: `docs\organizacional\` (fora do Git)

| Arquivo | O que é |
|---|---|
| `guia-design-organizacional.pdf` | Régua da PJ: setores, pessoas, 5 níveis de custo |
| `organograma-nivela.drawio` e `.csv` | Organograma |
| `pesquisa-ferramentas-organograma.md` | Pesquisa de ferramentas de organograma |

---

## 9. Tempos da linha produtiva

Pasta: `docs\tempos\` (fora do Git)

| Arquivo | O que é |
|---|---|
| `Nivela_Tempos_Linha_Produtiva.xlsx` | Planilha de tempos (2 abas) |
| `Nivela_Tempos_Linha_Produtiva_documentada.xlsx` | Versão com documentação |
| `Nivela_Estimativa_de_Tempos_v15.docx` e `_resumo.docx` | Estimativa de tempos |
| `Passo_a_passo_planilha_de_tempos.docx` | Passo a passo da planilha |
| `tempos-consolidado.md`, `tempos-P1-P6.md`, `tempos-P2-P3.md`, `tempos-P4-P5.md` | Tempos por processo |

---

## 10. Ferramentas e regras de trabalho usadas

| Pasta | O que é |
|---|---|
| `.claude\rules\ecc\` | Regras do ECC (comum e web): 17 arquivos MD |
| `.claude\skills\` | Skills de Figma e a skill `ip-as-logo` (design de mascote/logo) |
| `figma-plugin\`, `figma-audit\`, `figma-export\`, `figma-fix\` | Plugins locais do Figma |
| `tools\figma-variables-sync\` | Sincronização de variáveis do Figma (README, LICENSE) |
| `.github\` | Configuração do GitHub (está no Git) |

Memória do Claude (19 arquivos) cobre: contexto do projeto, idioma PT-BR, escrita STE, uso do ECC, limites do Figma, escopo das animações, mascote, identidade visual (Fitbod), nome Nivela e logo, nome da empresa, custos, planilha de custos do app, tempos, fluxograma BPMN, guia organizacional e prazos da PJ.

---

## 11. Lista de conferência para a troca de máquina

- [ ] Copiar as 7 pastas ignoradas de `docs\` (seção 1).
- [ ] Copiar os arquivos da pasta pai (`laboratorio-visual`, `imagens-app`, `figma-*`, `tools`, 2 PDFs, `.claude`).
- [ ] Copiar a memória do Claude e `C:\Users\alesx\.claude\` (ou rodar `exportar-setup.ps1`).
- [ ] Copiar `video\out\` (MP4 e pôster), se existir e você quiser guardar.
- [ ] Confirmar que `git status` está limpo e que tudo foi enviado (`git push`).
- [ ] Na máquina nova: instalar Node.js LTS, Git e Claude Code; clonar o repositório; rodar `npm ci` em `app\` e `video\`.
- [ ] Entrar de novo no Claude Code, GitHub, Figma, Notion e Google Drive (os logins não vão no ZIP).
