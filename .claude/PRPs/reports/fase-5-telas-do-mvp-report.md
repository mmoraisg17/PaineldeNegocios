# Relatório de implementação: Fase 5, telas do MVP

## Resumo
Todas as telas do MVP do manual estão prontas e ligadas ao domínio (rotina adaptativa, sessões, vínculos e permissões):
- **Início:** dois perfis e contas de demonstração.
- **Primeiro uso:** perfil, conexão simulada, calibração, avaliação e nível sugerido.
- **Praticante:**
  - Hoje, com recados e o selo "Ajustado por".
  - Biblioteca e Exercício em modo treino.
  - Concluído, com a decisão de nível e a opção de recusar.
  - Progresso.
  - Perfil: acompanhantes, convite, ajustes e privacidade.
- **Acompanhante:** Meus alunos, Adicionar aluno (por código) e Relatório do aluno. O profissional ajusta a rotina e envia recados; o familiar só lê.

## Execução
- **Sessão principal:** rotas, guardas, início, contas, primeiro uso e estado (`estado/acoes.ts`, `ContextoApp.tsx`).
- **Agente A (TDD):** Hoje, Biblioteca, Concluído e Progresso.
- **Agente B (TDD):** Perfil e as três telas do acompanhante.
- **Sessão principal:** integração, recusa de nível, verificação no navegador e correções da revisão.

## Validação

| Nível | Status | Observação |
|---|---|---|
| Tipos (`tsc --noEmit`) | ✅ | sem erros |
| Testes (`vitest run`) | ✅ | 35 arquivos, 652 testes |
| Build (`npm run build`) | ✅ | aviso de chunk > 500 kB (pacote 3D, já existia) |
| Lint | — | o projeto não tem ESLint (pendência M6) |
| Navegador em 375 px | ✅ | Carlos: alunos → relatório da Lúcia → fixar nível → salvar → recado. Lúcia: recado e selo "Ajustado por Carlos" no Hoje. Perfil: confirmação de remover acesso (foco em Cancelar, Esc cancela) e geração de código |
| Texto "Muito grande" | ✅ | varredura de elementos que passam da borda em 8 rotas internas: nenhum, depois das correções |
| Desktop em 1280×800 | ✅ | moldura do celular e relatório do aluno corretos |
| Recusar mudança de nível | ✅ só em teste | 5 testes (ações e tela); não percorri um treino inteiro no navegador |
| Correções da revisão (H1, H2, M2, M5, M7) | ✅ só em teste | testes novos; não verificadas no navegador |

## Correções feitas na verificação visual
- **Botões de nível do ajuste de rotina** (`components/acompanhante/LinhaDoExercicio.tsx`): quebravam a linha em 375 px. Agora o rádio fica acima do texto, com `whitespace-nowrap` e `min-h-16`.
- **Código do convite** (`components/perfil/ConviteDoPerfil.tsx`): passava da borda no texto "Muito grande". Mudou de `text-5xl tracking-[0.3em]` para `text-4xl tracking-[0.15em]`.

## Revisão de código (`ecc:react-reviewer`)
Nenhum achado CRITICAL. O revisor confirmou que as guardas de rota, o bloqueio de acesso sem vínculo autorizado e a ausência de XSS estão corretos.

| Achado | Gravidade | Situação |
|---|---|---|
| H1: foco perdido a cada passo do primeiro uso; contagem anunciada a cada segundo | HIGH | **Corrigido.** O título do passo recebe o foco. `role="timer"` sem live; só o fim é anunciado (`role="status"`). Em Conectar, só a linha de status é live |
| H2: "Concluir" sem medidas gravava nota 0, que podia baixar o nível sozinho | HIGH | **Corrigido.** Sem 10 amostras o exercício não entra no resultado, e o treino segue |
| M7: `?treino=` sem validação (NaN) e sem conferir o exercício da rota | MEDIUM | **Corrigido.** Índice inteiro ≥ 0 e item igual ao exercício da rota |
| M2: duplo toque em "Ver meu treino de hoje" criava dois praticantes | MEDIUM | **Corrigido.** Trava por `useRef`, e `criarPraticante` saiu do updater |
| M3: `in` aceitava `'toString'` nas preferências | MEDIUM | **Corrigido.** `Object.hasOwn` + `typeof` |
| M5: nomes sem limite de tamanho | MEDIUM | **Corrigido.** `limparNome`: 40 para nome, 30 para função; aplicado nos campos, nas ações e na sanitização |
| M1: chave duplicada na lista de pendentes | MEDIUM | **Corrigido.** `key={vinculo.id}` |
| M1: nome do aluno visível ao acompanhante antes da autorização | MEDIUM | **Decisão de projeto mantida.** O próprio aluno entrega o código, e o nome confirma que o código é o certo. Nenhum dado de treino aparece antes da autorização |
| M4: `alertdialog` inline sem modal | MEDIUM | Pendente (fase 8, acessibilidade) |
| M6: falta ESLint + react-hooks + jsx-a11y | MEDIUM | Pendente. São dependências novas, precisam de aprovação |
| Baixa: código "profissional" resgatado por conta "familiar" | LOW | Pendente (fase 8) |

## Acréscimos à fase
- **Recusar a mudança de nível** (manual 8.2):
  - `DecisaoDoExercicio.nivelAnterior`, a ação `recusarMudancaDeNivel` e `recusarMudanca` no contexto.
  - No Concluído, o botão "Prefiro continuar no nível X".
- **`TAMANHO_MAXIMO_DO_RECADO` exportado** e reaproveitado em `EnviarRecado.tsx`.

## Pendências conhecidas
- **Duração do treino:** não é registrada em `ResultadoExercicio`. O "Cerca de N minutos" da tela Hoje é uma estimativa.
- **Fase 6:** faltam 7 animações. Antes delas vêm as correções do motor de movimento propostas em `docs/auditoria-animacoes.md`.
