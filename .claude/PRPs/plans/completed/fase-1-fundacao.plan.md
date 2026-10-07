# Plan: Fase 1, fundação do app

## Summary
Criar o projeto do app em `app/` (Vite + React + TypeScript + Tailwind 4), com nome e tema centralizados, uma moldura de smartphone que aparece só no desktop, as rotas das telas (com marcadores) e o deploy automático no GitHub Pages. Ao fim, a URL pública abre no celular em tela cheia e no computador dentro da moldura.

## User Story
Como avaliador do painel, quero abrir um link no celular (ou no computador) e ver o app como um aplicativo de verdade, para avaliar o produto sem instalar nada.

## Problem → Solution
Não existe código do app, só telas estáticas no Figma → esqueleto navegável publicado em `https://mmoraisg17.github.io/PaineldeNegocios/`, pronto para receber domínio, 3D e telas.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/app-plataforma-equilibrio.prd.md`
- **PRD Phase**: 1 · Fundação
- **Estimated Files**: ~20

---

## UX Design

### Before
N/A: o app não existe.

### After
```
Celular (< 768 px)                 Desktop (≥ 768 px)
┌──────────────────┐               ┌──────────────── fundo neutro ───────────────┐
│ [conteúdo]       │               │            ┌──────────────┐                 │
│                  │               │            │ ▔▔ notch ▔▔  │  Protótipo:     │
│                  │               │            │ [conteúdo]   │  abra no celular│
│                  │               │            │              │  [QR na fase 8] │
│──────────────────│               │            │──────────────│                 │
│ Hoje Bibl Prog Eu│ ← tab bar     │            │ Hoje Bibl ...│                 │
└──────────────────┘               │            └──────────────┘                 │
                                   └──────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Abrir o link | — | Tela inicial com "Sou praticante" / "Sou acompanhante" | Marcadores até a fase 5 |
| Navegar | — | Tab bar (praticante) e rotas por hash | Hash evita 404 ao recarregar no Pages |
| Desktop | — | App dentro de moldura 390×844, escalada à altura da janela | Mouse funciona como toque |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `.claude/PRPs/prds/app-plataforma-equilibrio.prd.md` | all | Escopo, decisões, telas, perfis |
| P0 | `figma-plugin/code.js` (fora do repo, em `painel de negocios/`) | 9-19 | Tokens de cor do Figma (TOK) a reproduzir |
| P1 | `LunchBox/src/styles/global.css` (projeto irmão) | 1-80 | Padrão de tokens em `@theme` com comentários do porquê |
| P1 | `LunchBox/.github/workflows/ci.yml` (projeto irmão) | 40-130 | Actions fixadas por SHA, `.node-version`, comentários em PT-BR |
| P2 | `docs/prototipo/01-telas/*.png` | — | Visual de referência (cores, botões grandes, aviso educacional) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Vite em subcaminho | vite.dev/guide/static-deploy | `base: './'` gera caminhos relativos; funciona em `/PaineldeNegocios/` e no preview local |
| GitHub Pages via Actions | actions/upload-pages-artifact v5.0.0, deploy-pages v5.0.1, configure-pages v6.0.0 | Pages já ativado com `build_type=workflow` (07/10) |
| Tailwind 4 | tailwindcss.com/docs/theme | Tokens em `@theme` viram utilitários (`bg-primaria`) e CSS vars |
| React Router (hash) | reactrouter.com | `createHashRouter`: rotas em `#/...`, sem 404 no Pages |

```
KEY_INSIGHT: o GitHub Pages não reescreve rotas para index.html.
APPLIES_TO: roteamento.
GOTCHA: com BrowserRouter, recarregar /hoje dá 404. Usar hash router.

KEY_INSIGHT: o Pages não permite cabeçalhos HTTP próprios.
APPLIES_TO: segurança.
GOTCHA: a CSP vai numa <meta http-equiv> no index.html (frame-ancestors não funciona via meta; aceitar).

KEY_INSIGHT: TypeScript 7.0 (compilador nativo) é a versão atual.
APPLIES_TO: typecheck.
GOTCHA: se `tsc` 7 falhar com alguma lib, fixar `typescript@~5.9` e registrar em Notes.
```

---

## Patterns to Mirror

### NAMING_CONVENTION
// SOURCE: LunchBox/src/components (Carrinho.tsx, Heroi.astro) e src/data (preco.ts, produtos.ts)
Componentes em PascalCase com nomes em português (`MolduraCelular.tsx`, `BarraDeAbas.tsx`); módulos de dados e config em camelCase/minúsculas (`app.ts`, `rotas.tsx`); identificadores de código em português quando são do domínio.

### COMMENT_STYLE
// SOURCE: LunchBox/astro.config.mjs:6-18, src/styles/global.css:1-20
Comentários em PT-BR que explicam **por quê** (decisão, risco, alternativa descartada), não o quê. Blocos `/* ... */` antes de decisões não óbvias.

### TOKENS
// SOURCE: LunchBox/src/styles/global.css:20-60
```css
@import 'tailwindcss';
@theme {
  --color-verde-600: #007260; /* oficial — ... */
  --font-sans: 'Archivo Variable', system-ui, ...;
}
```

### CI_ACTIONS
// SOURCE: LunchBox/.github/workflows/ci.yml:47,101
```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
- uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
  with:
    node-version-file: .node-version
    cache: npm
```

### ERROR_HANDLING / LOGGING
Não há backend. Erros de rota caem num `errorElement` amigável ("Tela não encontrada · Voltar ao início"). Sem `console.log` no código final.

### TEST_STRUCTURE
Vitest + Testing Library, padrão AAA, nomes descritivos em PT-BR:
```ts
test('mostra a moldura de celular quando a tela é larga', () => { /* Arrange / Act / Assert */ });
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `app/package.json` | CREATE | Dependências e scripts (`dev`, `build`, `preview`, `test`, `typecheck`) |
| `app/.node-version` | CREATE | `22.23.2` (mesmo dos projetos irmãos) |
| `app/.gitignore` | CREATE | `node_modules`, `dist`, `coverage` |
| `app/index.html` | CREATE | `lang="pt-BR"`, viewport com `viewport-fit=cover`, meta CSP, theme-color |
| `app/vite.config.ts` | CREATE | `base: './'`, plugins react + tailwind, config do Vitest |
| `app/tsconfig.json` | CREATE | `strict`, `jsx: react-jsx`, `moduleResolution: bundler` |
| `app/public/favicon.svg` | CREATE | Ícone simples (plataforma + pessoa), cor primária |
| `app/src/main.tsx` | CREATE | Monta `<RouterProvider>` |
| `app/src/config/app.ts` | CREATE | `APP_NAME`, `APP_TAGLINE`, `AVISO_EDUCACIONAL`: **único lugar** do nome |
| `app/src/styles/global.css` | CREATE | Tokens do Figma em `@theme`, base 60+ (fonte 18 px), safe areas, reduced motion |
| `app/src/components/MolduraCelular.tsx` | CREATE | Moldura só ≥ 768 px; no celular, tela cheia |
| `app/src/components/BarraDeAbas.tsx` | CREATE | Tab bar do praticante (Hoje, Biblioteca, Progresso, Perfil) |
| `app/src/components/TelaEmConstrucao.tsx` | CREATE | Marcador reutilizável das telas até a fase 5 |
| `app/src/rotas.tsx` | CREATE | `createHashRouter` com layouts praticante/acompanhante e `errorElement` |
| `app/src/telas/Inicio.tsx` | CREATE | Escolha de perfil (praticante / acompanhante) |
| `app/src/telas/*.tsx` | CREATE | Hoje, Biblioteca, Progresso, Perfil, Exercicio, Alunos, Aluno (marcadores) |
| `app/src/test/setup.ts` | CREATE | `@testing-library/jest-dom` |
| `app/src/components/MolduraCelular.test.tsx` | CREATE | Moldura no desktop, tela cheia no celular |
| `app/src/rotas.test.tsx` | CREATE | Início renderiza; "Sou praticante" leva a Hoje; rota inválida mostra erro amigável |
| `.github/workflows/pages.yml` | CREATE | Typecheck + testes + build de `app/` → deploy no Pages |

## NOT Building

- Lógica de domínio (rotina, perfis, convites): fase 2.
- 3D: fase 3. Ainda **não** instalar three/R3F.
- Conteúdo real das telas: fase 5.
- Playwright, Lighthouse, QR code: fase 8.
- ESLint: o projeto irmão não usa; `tsc --strict` + revisão pelos agentes ECC cobrem a fase. Reavaliar na fase 8.

---

## Step-by-Step Tasks

### Task 1: Projeto e dependências
- **ACTION**: criar `app/package.json` e instalar.
- **IMPLEMENT**: deps `react`, `react-dom`, `react-router`, `motion`, `@fontsource-variable/inter`; devDeps `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Scripts: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (`vitest run`), `typecheck`.
- **MIRROR**: CI_ACTIONS (`.node-version`).
- **GOTCHA**: ver nota do TypeScript 7.
- **VALIDATE**: `npm install` sem erro; `npm ls react` mostra uma única versão.

### Task 2: Config de build e TS
- **ACTION**: `vite.config.ts`, `tsconfig.json`, `index.html`.
- **IMPLEMENT**: `base: './'`; `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: true }`. No HTML: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `theme-color` = fundo, CSP `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'`.
- **GOTCHA**: `style-src 'unsafe-inline'` é necessário porque Motion e R3F escrevem `style` inline; documentar no comentário.
- **VALIDATE**: `npm run build` gera `dist/index.html` com caminhos `./assets/...`.

### Task 3: Nome e tema centralizados
- **ACTION**: `src/config/app.ts` e `src/styles/global.css`.
- **IMPLEMENT**: `export const APP_NAME = 'Equilíbrio';` com comentário dizendo que é nome provisório (decisão adiada em 07/10) e que nenhum outro arquivo pode ter o nome escrito. Tokens: `--color-fundo #F7F5F0`, `--color-superficie #FFFFFF`, `--color-texto #1B1F24`, `--color-texto-suave #4A5360`, `--color-primaria #0F6E5C`, `--color-primaria-suave #DDEFEA`, `--color-sobre-primaria #FFFFFF`, `--color-alerta-fundo #FFF1DC`, `--color-alerta-texto #7A4100`, `--color-perigo #B3261E`, `--color-borda #C9CED6`; `--font-sans: 'Inter Variable', system-ui, ...`; `html { font-size: 112.5% }` (18 px para o público 60+); `.tabular`; safe-area; `prefers-reduced-motion`.
- **MIRROR**: TOKENS, COMMENT_STYLE.
- **VALIDATE**: `grep -r "Equilíbrio" src` só encontra `config/app.ts`.

### Task 4: Moldura de celular
- **ACTION**: `MolduraCelular.tsx` + teste.
- **IMPLEMENT**: wrapper que, com `min-width: 768px` (via CSS, sem JS), centraliza uma tela de 390×844 com borda arredondada, entalhe e sombra, escalada para caber em `100dvh` (`aspect-ratio` + `height: min(844px, 100dvh - 48px)`). Ao lado: texto "Protótipo · melhor no celular". No celular: `min-height: 100dvh`, sem moldura. O conteúdo rola **dentro** da tela (`overflow-y: auto`) e a tab bar fica fixa no fundo da tela, não da janela.
- **GOTCHA**: `position: fixed` dentro da moldura escaparia dela. Usar layout flex coluna (conteúdo `flex-1 overflow-auto` + barra no fim).
- **VALIDATE**: teste confere `data-moldura` e a estrutura; visualmente no browser em 375 px e em 1280 px.

### Task 5: Rotas e telas marcadoras
- **ACTION**: `rotas.tsx`, `main.tsx`, telas e `BarraDeAbas`.
- **IMPLEMENT**: rotas `/` (Início), `/praticante/hoje`, `/praticante/biblioteca`, `/praticante/progresso`, `/praticante/perfil`, `/praticante/exercicio/:id`, `/acompanhante/alunos`, `/acompanhante/aluno/:id`. Layout do praticante com `BarraDeAbas` (ícones SVG inline + rótulo; alvo de toque ≥ 56 px; `aria-current`). Início: título `APP_NAME`, tagline, dois botões grandes e `AVISO_EDUCACIONAL`. `errorElement` em PT-BR.
- **VALIDATE**: `rotas.test.tsx` passa; navegação por teclado funciona (foco visível).

### Task 6: Deploy no Pages
- **ACTION**: `.github/workflows/pages.yml` na raiz do repositório.
- **IMPLEMENT**: dispara em push na `main` quando `app/**` ou o próprio workflow mudar, e por `workflow_dispatch`. Job `build` com `defaults.run.working-directory: app`: checkout (SHA), setup-node (SHA, `node-version-file: app/.node-version`, cache com `cache-dependency-path: app/package-lock.json`), `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `configure-pages`, `upload-pages-artifact` (`path: app/dist`). Job `deploy` com `deploy-pages`, `environment: github-pages`. `permissions` mínimas (`contents: read`, `pages: write`, `id-token: write`); `concurrency: pages`.
- **MIRROR**: CI_ACTIONS (SHA + comentário da versão, `persist-credentials: false`).
- **VALIDATE**: run verde no Actions; a URL abre.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| Moldura renderiza filhos | `<MolduraCelular><p>x</p></MolduraCelular>` | `x` visível dentro de `[data-tela]` | — |
| Início mostra os dois perfis | rota `/` | botões "Sou praticante" e "Sou acompanhante" | — |
| Praticante navega | clique em "Sou praticante" | tela Hoje + tab bar com `aria-current` em Hoje | — |
| Rota desconhecida | `#/nao-existe` | mensagem "Tela não encontrada" + link para o início | ✅ |
| Nome centralizado | render do Início | exibe `APP_NAME` | — |

### Edge Cases Checklist
- [ ] Tela muito baixa no desktop (altura < 700 px): a moldura encolhe sem cortar.
- [ ] Rotação do celular: layout continua em coluna.
- [ ] `prefers-reduced-motion`: sem transições.
- [ ] Recarregar numa rota interna no Pages: não dá 404 (hash).

---

## Validation Commands

### Static Analysis
```bash
cd app && npm run typecheck
```
EXPECT: zero erros de tipo.

### Unit Tests
```bash
cd app && npm test
```
EXPECT: todos passam.

### Build
```bash
cd app && npm run build
```
EXPECT: `dist/` com caminhos relativos; JS inicial < 200 KB gzip nesta fase.

### Browser Validation
```bash
cd app && npm run dev
```
EXPECT: em 375×812 sem moldura; em 1280×800 com moldura; a tab bar fica dentro da tela.

### Manual Validation
- [ ] Abrir a URL do Pages no celular e no computador.
- [ ] Recarregar em `#/praticante/biblioteca`.
- [ ] Navegar só com teclado (Tab/Enter).

---

## Acceptance Criteria
- [ ] Todas as tasks concluídas
- [ ] Typecheck, testes e build verdes local e no Actions
- [ ] URL pública funcionando (celular em tela cheia; desktop com moldura)
- [ ] Nome só em `src/config/app.ts`; cores só em `global.css`

## Completion Checklist
- [ ] Comentários em PT-BR explicando decisões
- [ ] Actions fixadas por SHA
- [ ] Sem `console.log`
- [ ] Sem valores mágicos fora dos tokens
- [ ] PRD: fase 1 → `complete`

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript 7 incompatível com alguma ferramenta | M | M | Fixar `~5.9` |
| `npm ci` no Actions sem lockfile | L | H | Commitar `app/package-lock.json` |
| CSP bloquear algo da fase 3 (workers/blob do R3F) | M | M | `worker-src blob:` já incluso; revisar na fase 3 |
| OneDrive sincronizando `node_modules` | M | L | Já está no `.gitignore`; se o OneDrive pesar, avisar o usuário |

## Notes
- `react-router` 8.x: confirmar a API `createHashRouter` ao instalar; se mudou, usar o equivalente documentado na versão.
- A moldura é puro CSS (media query) para não depender de JS nem causar flash.
