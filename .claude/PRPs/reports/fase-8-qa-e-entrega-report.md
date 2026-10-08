# Relatório: Fase 8, QA e entrega

## Resumo
O app passou por testes de ponta a ponta, auditoria de acessibilidade, medição de desempenho no celular e revisões de código e de segurança. Os problemas encontrados foram corrigidos, e o build final foi publicado no GitHub Pages.

## Métricas de sucesso do PRD

| Métrica | Meta | Resultado | Como foi medido |
|---|---|---|---|
| Animações 3D | 8 exercícios, ≥ 30 fps num celular intermediário | ✅ 104 a 232 fps | Chrome com CPU 4× mais lenta, 390 × 844, 6 exercícios no nível 3 |
| Desempenho mobile | Lighthouse Performance ≥ 80, Accessibility ≥ 95 | ✅ Accessibility, Best Practices e SEO 100 nas 10 telas do build local e no site publicado; no site publicado, LCP 435 ms e CLS 0,00 | Lighthouse mobile; trace do Chrome com rede Fast 4G e CPU 4× mais lenta |
| Peso da primeira carga | < 1,5 MB de JS (gzip), 3D sob demanda | ✅ 139 kB de JS + 6 kB de CSS (gzip); o 3D (253 kB gzip) só baixa na tela do exercício | Saída do `vite build` |
| Qualidade da lógica | ≥ 80% de cobertura no domínio | ✅ domínio 99,8%, sensores 100%, movimento 96%; projeto todo 95,6% das instruções | Vitest com coverage-v8 |
| Fluxo crítico | E2E verde | ✅ 5 fluxos, sem erros | Navegador real via Chrome DevTools (ver "Desvios") |
| Entendimento pelo avaliador | Fluxo em < 2 min por quem é de fora | ⏳ não medido | Teste de corredor: depende do grupo |

## Testes de ponta a ponta
Todos rodaram no build de produção (`vite preview`), num navegador isolado, com tela de celular (390 × 844, toque).

| # | Fluxo | Resultado |
|---|---|---|
| 1 | **Primeiro uso:** nome, objetivo, conectar a plataforma, calibrar, avaliar, nível sugerido → Hoje | ✅ nível 2 sugerido, rotina de 3 exercícios |
| 2 | **Treino completo** → Concluído → percepção "Fácil" → 2ª sessão → recusar a subida de nível | ✅ médias corretas; com 1 sessão o app mantém o nível (regra das 2 sessões); recusar mantém o nível 2 e os outros vão para o 3 na rotina seguinte |
| 3 | **Convite** → profissional digita o código (em minúsculas) → aluno autoriza → relatório | ✅ antes de autorizar, o aluno aparece só como "Aguardando autorização", e o endereço direto é bloqueado; depois, o relatório abre; recado limitado a 280 caracteres com contador |
| 4 | **Familiar só lê** (Marta → Dona Lúcia) | ✅ sem controles de rotina nem de recado; bloqueada num aluno que não a autorizou |
| 5 | **Teclado** na tela do exercício | ✅ ordem de foco segue a leitura; contorno de 3 px em todos os itens; Enter abre e fecha "Simular sensores" |

**Observação:** recarregar a página no meio de um treino descarta o treino em andamento, que fica só na memória. O app volta para "Hoje" sem gravar nota inventada. É o comportamento do projeto, não falha.

## QR code
`docs/entrega/qr-code-app.png` (para slide e impressão) e `qr-code-app.svg` (vetor, amplia sem perder qualidade). Aponta para https://mmoraisg17.github.io/PaineldeNegocios/.

Preto sobre branco, com margem padrão de 4 módulos e correção de erro nível Q (lê mesmo com até ~25% da imagem danificada ou coberta). Gerado com a biblioteca segno 1.6.6, instalada numa pasta temporária, fora do projeto. Falta conferir com a câmera de um celular: o Chrome no Windows não tem leitor de QR para testar aqui.

## Revisões

### Segurança (ecc:security-reviewer)
Nenhum achado crítico ou alto. O `npm audit` não encontrou vulnerabilidades, as GitHub Actions estão fixadas por SHA, e não há pontos de XSS. Corrigidos os achados baratos:
- **`.gitignore` na raiz:** os PDFs da PJ, a pesquisa e a modelagem nunca foram publicados, mas um `git add .` os levaria para o repositório público.
- **Aviso na tela inicial:** "Use dados fictícios: tudo fica só neste aparelho".
- **Recado:** cortado em 280 caracteres também ao ler do aparelho (antes só ao escrever).
- **Ids:** gerados por `crypto`, sem uma reserva duplicada com `Math.random`.

### Código (ecc:react-reviewer)
| Achado | Gravidade | Correção |
|---|---|---|
| A geometria do boneco e dos músculos era recriada 10 vezes por segundo: a tela re-renderiza a cada leitura do simulador, e os perfis eram arrays novos a cada render | Alta | Pontos do perfil com cache; argumentos das cascas calculados uma vez; `memo` no visualizador; chave do shader fixa |
| A cena pausada só redesenhava por causa do problema acima | Alta | O giro pede quadro; um vigia pede um quadro por leitura nova da base, e quadros seguidos só nas transições |
| O brilho dos músculos usava sempre o joelho esquerdo | Média | Cada perna usa o próprio joelho (teste novo) |
| O botão de velocidade trocava o texto junto com o estado; o leitor de tela dizia "1×, pressionado" | Média | Texto fixo "Câmera lenta, 0,5×", estado no `aria-pressed` e na cor; selo ✓/!/✕ com texto maior |

**Medido depois da correção:** com a animação andando, nenhum reenvio de geometria. Com ela pausada e parada, 4 limpezas de tela em 2 s (antes ~480). Girar ou trocar o desvio com a cena pausada continua redesenhando.

### Desempenho (trace do Chrome)
O CLS da tela do exercício estava em 0,10, no limite. O carregamento da cena não reservava o espaço da legenda, e a legenda pulava a cada troca de fase. Agora as duas reservam o espaço, e o CLS ficou em 0,00 no build local.

## Validação

| Nível | Status | Observação |
|---|---|---|
| Tipos | ✅ | |
| Lint (oxlint) | ✅ | sem erros; os avisos de antes continuam (padrão do relógio por ref) |
| Testes | ✅ | 910, eram 907 antes da fase |
| Build | ✅ | |
| E2E | ✅ | 5 fluxos |
| Lighthouse | ✅ | 10 telas no build local + site publicado |
| Deploy | ✅ | GitHub Actions verde; o site publicado serve os mesmos arquivos do build local |

## Desvios do plano
- **E2E sem Playwright:** o PRD pedia Playwright, que não está instalado, e uma dependência nova precisa de aprovação do grupo. Os fluxos rodaram num Chrome real controlado pelo DevTools, com o mesmo efeito, mas não ficam no repositório como teste automático.
- **FPS no celular físico:** medi só por emulação (CPU 4× mais lenta). A placa de vídeo do computador não é limitada, então falta conferir num celular real.

## Achados no caminho
- **Endereço local errado:** com `base: './'`, o `vite preview` serve o app na raiz (`localhost:4173/`), e não em `/PaineldeNegocios/`. Esse subcaminho só existe no Pages. O `curl` "passava" porque o servidor devolvia o `index.html` no lugar do JS.
- **Primeira versão do vigia de redesenho:** redesenhava a 60 fps com a cena pausada, porque a leitura da base muda o tempo todo e cada mudança renovava 1 s de quadros. Separei leitura nova (1 quadro) de troca de situação (quadros seguidos).

## Pendências que dependem do grupo
- **Ler o QR code com a câmera do celular** e conferir se abre o app.
- **Teste de corredor:** 2 ou 3 pessoas de fora do grupo, cronometrando o fluxo.
- **Celular físico:** abrir um exercício e ver se a animação está fluida.
- **Configurações do repositório (GitHub):** ativar o Dependabot e proteger o branch `main`.
- **E-mail nos commits:** os commits mostram o e-mail pessoal. Dá para usar o endereço "noreply" do GitHub daqui para a frente.
- **Link do Figma:** conferir se a permissão é "qualquer pessoa com o link pode ver".
- **Playwright:** decidir se vale instalar, para os E2E virarem teste automático.
- **Fase 7 (manual):** segue em andamento.
