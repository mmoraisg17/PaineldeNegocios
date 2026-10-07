# Relatório de implementação: Fase 6, as 7 animações restantes

## Resumo
As 8 demonstrações do catálogo estão animadas em 3D, cada uma pesquisada antes de animar (requisito R8). Todas usam o estilo "estúdio de correção" da auditoria visual: manequim, músculos em ciano, anéis de pressão, ✓/✕, seta, prumo e close-up no erro.

| # | Exercício | Destaques da animação |
|---|---|---|
| 2 | Miniagachamento simétrico | Joelho a ~35° (nível 1) e ~60° (níveis 2–3); carga 50/50; quadríceps e glúteos |
| 3 | Panturrilha unilateral | Dois pés no nível 1, um pé nos níveis 2–3; calcanhar sobe ~5,6 cm girando na ponta; câmera de lado por trás |
| 4 | Pés em linha (tandem) | Passa o peso, leva o pé à frente com o calcanhar encostado na ponta; oscilação lateral sutil e irregular |
| 5 | Descida de degrau lateral | Perna livre fora da base, entre os postes; joelho de apoio a ~70° sem ir para dentro; nível 3 50% mais lento |
| 6 | Abdução com elástico | Perna abre 22°, reta; elástico desenhado; músculo novo "abdutores" (glúteo médio) |
| 7 | Equilíbrio com inclinação | Num pé só, joelho ~22°; micro-oscilações; base a 0°, 5° e 10° por nível |
| 8 | Transferência de peso | Mesma ordem e ritmo dos alvos dos sensores (constantes compartilhadas); estratégia do tornozelo |

## Pesquisa
`docs/pesquisa/exercicios/02-a-08-demais-exercicios.md` (local, como a do sentar e levantar). Cada animação cita a seção da pesquisa no comentário do arquivo.

**Decisão de projeto:** 5° por nível do seletor de inclinação. O manual define os níveis, mas não os graus. A decisão está documentada em `movimento/cenario.ts` e na pesquisa.

## Motor (extensão)
- **`Pose.pes`:** deslocamento, elevação e calcanhar por pé, interpolados pela mesma curva.
- **`inclinacaoDaBase`:** a tampa gira na borda de trás; o pé acompanha a rampa; fora da base, o pé pisa no chão.
- **`LadoDoCorpo.apoiado`:** anéis só sob pé apoiado; músculos de perna apagam na perna no ar; o prumo mira o pé de apoio.
- **Fábrica:** `animacaoDe(id, { bracos, nivel, inclinacao })`.
- **Apoios:** `Animacao.camera` (ângulo por exercício), `Animacao.prumo` (`'centro'` ou `'apoio'`) e `Animacao.elastico`.
- **`animacoes/comum.ts`:** `quadrilParaFlexao`, `NUM_PE_SO` e `subidaDoTornozeloNaRampa`.

## Validação

| Nível | Status | Observação |
|---|---|---|
| Tipos | ✅ | |
| Lint (oxlint) | ✅ | sem erros |
| Testes | ✅ | 907, eram 722 antes da fase |
| Build | ✅ | |
| Fatos gerais, nas 8 animações × 3 níveis | ✅ | ossos com o comprimento certo, quadril alcançável, pés sem atravessar a superfície, sempre um pé apoiado, ciclo fechado, prumo alinhado na execução certa, músculos declarados |
| Fatos da pesquisa, por exercício | ✅ | ângulos e alturas da pesquisa, pés que não escorregam, sincronia com os sensores |
| Chrome em 390 px | ✅ | cada exercício conferido em um ponto-chave; varredura das 24 combinações (cena carrega e anima em tempo real), sem erros no console |
| Cartão da cena | ✅ | 360 px (era 252), câmera 15% mais perto, selo no canto direito |

## Achados no caminho (todos corrigidos)
- **Centro do corpo num pé só:** tem de ficar sobre o pé de apoio. Eu tinha posto o quadril do lado de apoio sobre o pé, o que deixava o centro 9,5 cm fora. O teste geral de prumo pegou isso.
- **Tandem:** faltava passar o peso antes de tirar o pé do chão.
- **Limite do IK:** ele nunca estica a perna 100% (`FOLGA_EXTENSAO` 0,995). "Perna reta" neste boneco é menos de 16°.
- **Tronco no tandem:** inclinava 11° junto com o deslocamento. Achei relendo o código; o teste veio depois.
- **Três testes meus estavam errados, não o código:** joelho "sobre o pé" em vez de "sem valgo"; joelho a menos de 10° impossível para o IK; tronco ≤ 6° na estratégia do tornozelo.
- **Teste da Biblioteca:** fixava a abdução como "sem animação". Agora é orientado a dados.

## Pendências
- **Não medido:** desempenho em celular físico.
- **Desenho fixo dos lados:** a demonstração usa sempre a perna esquerda de apoio, não alterna entre as pernas.
- **Itens de prioridade Baixa da auditoria visual (fora do escopo):** mini mapa muscular (V9) e equipamento no estilo do estúdio (V10).
