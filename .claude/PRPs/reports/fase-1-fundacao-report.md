# Implementation Report: Fase 1, fundação do app

## Summary
Projeto `app/` criado com Vite 8 + React 19 + TypeScript 7 + Tailwind 4 + react-router 8 (hash). Nome e tema estão centralizados (`src/config/app.ts`, `src/styles/global.css`). A moldura de smartphone aparece só no desktop e o app tem tela inicial com dois perfis, layout do praticante com barra de abas, telas marcadoras, tela de erro amigável e workflow de deploy no GitHub Pages.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium |
| Confidence | — | Alta: todas as validações locais verdes |
| Files Changed | ~20 | 20 (18 em `app/`, 1 workflow, 1 `launch.json` fora do repo) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Projeto e dependências | done | TypeScript 7.0.2 funcionou; sem fallback para 5.9 |
| 2 | Config de build e TS | done | CSP em meta; `base: './'` |
| 3 | Nome e tema centralizados | done | Desvio: teste de "nome único" removido (ver abaixo) |
| 4 | Moldura de celular | done | Desvio: escala com `zoom` em vez de encolher a largura |
| 5 | Rotas e telas marcadoras | done | Exercício e acompanhante sem barra de abas |
| 6 | Deploy no Pages | done | Actions fixadas por SHA |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | done | `tsc --noEmit` sem erros |
| Unit Tests | done | 10 testes (moldura, escala, rotas, erro) |
| Build | done | JS 101 KB gzip (meta da fase: < 200 KB); caminhos relativos |
| Integration | done | Preview local medido em 375×812 (sem moldura) e 1366×768 (moldura a 0,83, layout de 390 px, sem rolagem) |
| Edge Cases | done | Rota inexistente → "Tela não encontrada"; janela baixa → escala mínima 0,5 |

## Deviations from Plan
- **Moldura escalada com `zoom`, não encolhida.** O plano previa altura `min(844px, 100dvh − 48px)` com `aspect-ratio`. Medido em 1280×720, isso estreitava a tela para 284 px, menos que um celular real, e o texto quebrava diferente. Agora o aparelho tem sempre 390 × 844 e é reduzido inteiro (escala calculada em `useLayoutEffect`, antes da pintura).
- **Teste de "nome só em config" removido.** O nome de trabalho ("Equilíbrio") é também palavra do domínio (trilha "Equilíbrio 60+"); a busca de texto daria falso positivo. A regra ficou documentada no comentário de `config/app.ts`.
- **CI usa `npx vite build`** depois de `typecheck` e `test` separados, para não rodar o `tsc` duas vezes.

## Revisão (ecc:react-reviewer)
Nenhum item crítico. Corrigidos nesta fase:
- Respiro da moldura em px (24 px), batendo com o cálculo da escala (antes 1,5rem = 27 px gerava 6 px de rolagem).
- Marco `<main>` no layout do praticante e nas telas cheias (exercício, acompanhante).
- Título por tela + foco no `<h1>` ao navegar (`hooks/useTituloDaTela.ts`), WCAG 2.4.2.
- Aba ativa com pílula de fundo + negrito (não só cor); `role="list"` na lista.
- Moldura só com `min-height: 600px` também (celular deitado fica em tela cheia).
- `<MotionConfig reducedMotion="user">`.
- `cancel-in-progress: false` no deploy.

Registrados para fases seguintes:
- **Fase 3:** testar o `<Canvas>` do R3F dentro do `zoom` da moldura (medição e raycast); se falhar, usar `resize={{ offsetSize: true }}`/`events.compute` ou trocar a escala. CSP: incluir `wasm-unsafe-eval`/`connect-src data: blob:` só se usar GLTF/Draco (o plano é geometria procedural).
- **Fase 5:** safe-area inferior nas telas sem barra de abas; navegação de volta no exercício e no acompanhante.

## Issues Encountered
- Capturas de tela do painel de navegador falharam (timeout de renderização); a verificação visual foi feita medindo o layout via JavaScript.
- O GateGuard do ECC bloqueava a primeira gravação de cada arquivo; resolvido pelo usuário com `GATEGUARD_EXEMPT_GLOBS` para `app/**` e `docs/**`.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `src/components/MolduraCelular.test.tsx` | 5 | Conteúdo dentro da tela, aviso do desktop, escala (alta, notebook, mínimo) |
| `src/rotas.test.tsx` | 5 | Início, praticante → Hoje com aba ativa, acompanhante sem abas, exercício sem abas, 404 amigável |

## Next Steps
- [x] Revisão de código (ecc:react-reviewer)
- [ ] Merge na `main` e primeiro deploy
- [ ] Fase 2 (domínio) e fase 3 (motor 3D) em paralelo
