# Implementation Report: fases 2, 3 e 4

## Fase 2: domínio (agente ecc:tdd-guide)
- `src/dominio`: catálogo dos 8 exercícios (fiel ao manual, seção 7), perfil e nível inicial, rotina adaptativa, progressão de nível (regra do manual, 8.2), sessões, convites e vínculos de acompanhante com permissões, persistência em localStorage, dados de demonstração determinísticos (Lúcia, Rafael, Carlos, Ana, Marta).
- TDD: 261 testes; cobertura de 99,7% de statements e 97,8% de branches.
- Revisão (ecc:typescript-reviewer) apontou 4 itens ALTOS: validação profunda do JSON carregado, permissões que ignoravam a revogação, convite reutilizável e id de vínculo determinístico. Eles voltaram para o mesmo agente, junto com os itens médios e baixos do domínio.

## Fase 3: motor 3D + "sentar e levantar"
- Pesquisa sistemática documentada em `docs/pesquisa/exercicios/01-sentar-e-levantar.md`.
- `src/movimento`: vetores, IK de dois ossos, esqueleto com tornozelos fixos, quadros-chave com a carga "verdadeira" por instante, animação de sentar e levantar com 4 modos de braço (barras, uma mão, cruzados, soltos).
- `src/cena3d`: React Three Fiber, com plataforma do desenho de 06/10, cadeira, boneco low-poly atualizado por ref e OrbitControls do three (sem drei). O 3D é carregado sob demanda: início com 102 KB gzip, pacote 3D com 250 KB gzip.
- Skill `blender-motion-state-inspection` aplicada: fatos medidos antes de captura. Os testes medem quadro a quadro:
  - pés plantados;
  - ossos com comprimento constante;
  - quadril no assento;
  - joelho entre 85° e 105°;
  - tronco entre 40° e 60° na saída;
  - pico de carga na saída da cadeira;
  - mãos na barra.
- A revisão visual corrigiu o enquadramento, a direção dos cotovelos e o ponto de pegada.
- Um teste pegou um erro real nos dados: o pico de carga com barras caía na extensão. Corrigido.

## Fase 4: sensores e correção
- `src/sensores`, módulo puro:
  - `Leitura`, o formato que o hardware real também vai produzir;
  - simulador determinístico, com balanço natural e 12 desvios;
  - detectores ligados às correções do catálogo;
  - avaliação com prioridade (pare → ajuste → elogio);
  - filtro de feedback (0,4 s para aparecer, "pare" imediato, 1,2 s mínimo na tela);
  - modo automático (ciclo de 24 s: certo, erro, certo, outro erro);
  - "esperado" por exercício (pé de apoio nos unilaterais, alvos móveis na transferência de peso, meta de simetria do profissional).
- **Propriedade testada para os 8 exercícios × 3 níveis:** a execução certa nunca mostra aviso de problema, e cada erro simulável aparece como a correção certa em ≤ 0,5 s (56 testes).
- **3D reage ao erro:** `movimento/desvios.ts` aplica o desvio na pose (ex.: quadril para a direita na assimetria) e destaca em coral a região a corrigir. Há teste de que isso não tira os pés da base.
- **Tela do exercício** (`telas/Exercicio.tsx`):
  - 3D com braços conforme o apoio do nível (`?nivel=`);
  - faixa "Simular sensores" logo abaixo do 3D;
  - aviso grande (cor + ícone + título; `alert` para "pare");
  - mapa de pressão (vista de cima, 4 sensores, ponto, zona ou alvo, barra E/D, apoio nas barras);
  - "Como fazer";
  - voz em pt-BR, opcional.
- Itens da revisão de 3D resolvidos:
  - `touch-action: pan-y` (rolagem no celular);
  - `frameloop="demand"` quando pausado;
  - sem `aria-live` na legenda em loop;
  - braços por nível;
  - guarda contra NaN;
  - reinício do ciclo ao trocar de exercício;
  - margem inferior (safe area) na tela do exercício.

## Validação
- Testes fora do domínio: 96 passando (moldura, rotas, movimento, sensores).
- Verificação no navegador (375×812): o modo automático alterna os avisos; forçar "peso numa perna só" leva o mapa a 26/74, mostra o aviso âmbar "Use as duas pernas para levantar" e destaca as pernas no 3D; forçar "apoio demais" funciona; um exercício sem animação mostra os desvios próprios.
- Desktop (1366×768, moldura em 0,88): o canvas mede o layout (345×324) com `offsetSize`.

## Pendências para as próximas fases
- Fase 5: telas Hoje, Biblioteca, Progresso, Perfil, acompanhante, conclusão do treino (usar `medias` do hook para a nota da sessão).
- Fase 6: 7 animações restantes, cada uma com pesquisa própria.
