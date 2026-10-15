# Lógica da marca Nivela

Data: 12/10/2026. Base: pesquisa sobre como grandes marcas ligam o nome/logo à identidade visual, e o que o Nivela herdou disso.

## 1. O que a pesquisa confirmou

Só entram aqui fatos que as fontes dizem. O que não achei está na seção 2.

| Marca | O que o logo faz pela identidade | Fonte |
|---|---|---|
| McDonald's | Os arcos dourados deixaram de ter uso restrito e viraram a base do design: podem ser usados "de forma criativa" (por exemplo, como a estrada do entregador). O redesenho de 2018–2019 trocou a variedade de elementos de cada restaurante por um sistema único e global, com o amarelo-dourado no lugar do vermelho. | [Puro Marketing](https://www.puromarketing.com/3/32417/nueva-imagen-mcdonalds-gigante-cambiado-imagen-visual-corporativa) |
| Smart Fit | O logo é só uma parte da identidade. O sorriso virou recurso gráfico (máscara de fotos e recorte de caixas). Há fonte própria (Smart Fit Muscle Display), um sistema de ícones próprio (Smart Fit Pictos) e tom de voz. O app é o centro do ecossistema. | [Nosso Meio](https://nossomeio.com.br/smart-fit-lanca-novo-posicionamento-e-reforca-evolucao-da-marca/) |
| Amazfit (Zepp Health) | O logo novo trocou contornos pontudos e letras maiúsculas pretas por letras minúsculas arredondadas, cores vivas e degradês suaves. A forma passa a mensagem: inclusão, "um mundo colorido", tudo vai ficar bem. | [Transform](https://www.transformmagazine.net/articles/2021/amazfit-unveils-new-brand-identity/), [Logos World](https://logos-world.net/bright-colors-and-soft-shapes-of-the-amazfit-logo/) |
| Teoria (Ehrenberg-Bass) | Ativos de marca (cor, forma, logo, fonte, personagem) funcionam como memória: a pessoa reconhece a marca sem ler o nome. Valem quando são únicos e usados sempre do mesmo jeito. | [Umbrex](https://umbrex.com/resources/frameworks/marketing-frameworks/distinctive-brand-assets-framework-ehrenberg-bass/) |

## 2. O que não consegui confirmar

- **Lunch Box Gastronomia e Saúde:** nenhuma fonte achada. Para incluí-la, preciso do Instagram, do site ou de uma imagem do logo.
- **Zepp (o app):** não achei guia de marca nem explicação do logo. Usei a Amazfit, da mesma empresa, como referência. Não afirmo nada sobre o desenho do app da Zepp além do que o projeto já usou (cartões por categoria e barra escura).
- **Smart Fit:** as fontes não descrevem o desenho do logo nem as cores.
- **McDonald's:** o artigo não detalha tipografia. Os fatos sobre sistema gráfico vêm de um artigo de imprensa, não do manual da marca.

## 3. A lógica que o Nivela tira disso

1. **Um ativo gráfico nasce do nome e é reaproveitado** (arcos, sorriso). No Nivela, é a **bolha**: o ponto do "i", a bolha de um nível de bolha. Ela diz o que o produto faz (nivelar o equilíbrio).
2. **A forma do logo se repete em tudo** (Amazfit: pontas redondas, minúsculas). No Nivela: traço grosso com ponta redonda e círculos. Os ícones do app já tinham traço único e pontas redondas; os gráficos também.
3. **Poucas cores, cada uma com um papel fixo.** Tinta (`#191923`) para a haste e o texto. Rosa (`#E0214F`) só para a bolha. O rosa marca **onde você está** (nível, posição no progresso); não enfeita.
4. **O mesmo desenho do logo vira peça de interface**, não só um selo no canto (McDonald's e Smart Fit usam o ativo na embalagem, na foto, no app).
5. **A forma carrega o tom.** Pontas redondas e peso calmo passam acolhimento. Por isso o mascote e as frases também não culpam.
6. **Consistência vale mais que variedade.** Nada de um estilo novo por tela.

## 4. O que foi implementado no app

| Regra | Onde |
|---|---|
| Ativo = bolha | `components/marca/Bolha.tsx` (`MedidorDeNivel`, `BarraComBolha`) |
| Nível em bolhas (uma por degrau) | Hoje (chip do exercício), Exercício (cabeçalho), Progresso (lista de níveis). Substitui os degraus retangulares de Progresso. |
| Progresso = haste de tinta com bolha rosa na ponta (o desenho do "i") | Progresso → Adesão, uma barra por semana |
| Forma do logo nos traços | Gráficos e ícones já usavam ponta redonda (mantidos) |
| Logo = ativo da marca | `components/marca/LogoNivela.tsx`, na entrada |
| Mascote com olhos e traços do mesmo vocabulário | `components/mascote/*` |

Texto e número continuam ao lado de cada bolha. A bolha nunca é a única informação (WCAG 1.4.1).

## 5. Próximos passos possíveis (não feitos)

- Fonte de títulos própria, redonda e geométrica como as letras da logo (a Amazfit e a Smart Fit têm fonte própria). Pede nova dependência de fonte e teste de leitura com 60+.
- Pictogramas próprios no lugar dos ícones genéricos (como os Smart Fit Pictos).
- Bolha como máscara de recorte em fotos e ilustrações (como o sorriso da Smart Fit).
- Incluir a Lunch Box, quando houver material.
