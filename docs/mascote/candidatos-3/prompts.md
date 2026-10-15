# Mascote — rodada 3 (prompts para o Gemini)

Três direções, duas variações cada. Número 1 = canto inferior esquerdo. Número 2 = canto inferior direito.
Cada imagem é um pedido separado. Nunca peça uma folha com várias imagens.

| Código | Assunto | Cor 1 | Cor 2 | Fundo |
|---|---|---|---|---|
| A1, A2 | João-bobo | azul-marinho | laranja | areia suave |
| B1, B2 | Flamingo | coral | azul-marinho | verde-menta suave |
| C1, C2 | Tartaruga | verde-petróleo escuro | laranja | lavanda suave |

## Texto-base (troque os campos entre colchetes)

```text
Create one complete full-bleed 1:1 square image.
Background: fill the entire square with solid [FUNDO]. Keep it visible in every open area and in the corners not occupied by the character; the [CANTO] corner must be occupied by the character.
Subject: place one extremely simplified, cute, endearing [ASSUNTO] on the background, reduced to one soft rounded continuous silhouette and one defining feature.
Complexity: use only 4–7 large basic shapes and at most two broad internal color regions. Use two simple eyes and add one tiny mouth only when it helps the expression. Remove every nonessential line, outline, anatomical detail, texture, and decoration. Keep the character readable at 32 × 32.
Color behavior: use exactly three semantic colors in the complete image: [COR1] and [COR2] for the character, plus the background color. Use both character colors in broad masses and reuse them for the facial marks. Keep the character, facial marks, and background clearly separated.
Composition: keep the character upright and emerging from the [CANTO], filling about 85–95% of the square so it remains visually dominant. Cropping at the bottom or at that side is welcome. Preserve both paired features. Never center or bottom-center the character.
Style: make simplification, cuteness, and lovable baby-like appeal the strongest qualities. Use large soft forms, compact proportions, thick rounded contours, and an ultra-clean graphic treatment. Add an extremely, extremely subtle, almost imperceptible sense of depth through a barely-there neo-skeuomorphic treatment.
Finish: show only the character on the full-canvas background, with clean surfaces and normal square outer corners.
Constraints: Use no text or watermark. Add no borders, frames, cards, or presentation masks. Include one character only, with no extra subjects or scenery. Use no fragile lines, sharp tips, unnecessary outlines, tiny details, or decorative marks. Add no photorealistic material, dramatic bevel, glossy hotspot, deep occlusion, extrusion, strong three-dimensional rendering, or external cast shadow. Keep the background solid and uniform, with no texture, vignette, or lighting variation.
```

## Valores por imagem

| Código | [ASSUNTO] | [COR1] | [COR2] | [FUNDO] | [CANTO] |
|---|---|---|---|---|---|
| A1 | roly-poly tumbler toy with a big round head merged into an egg-shaped body and a heavy rounded base | deep navy blue | bright orange | gently muted warm sand | lower-left |
| A2 | (igual ao A1) | deep navy blue | bright orange | gently muted warm sand | lower-right |
| B1 | flamingo standing on one thick short leg, with a teardrop-shaped body and one short thick curved beak with a blunt rounded end | warm coral | deep navy blue | gently muted mint green | lower-left |
| B2 | (igual ao B1) | warm coral | deep navy blue | gently muted mint green | lower-right |
| C1 | turtle with one large round dome shell, a small round head in front, and four short thick stubby legs | dark teal green | bright orange | gently muted lavender | lower-left |
| C2 | (igual ao C1) | dark teal green | bright orange | gently muted lavender | lower-right |
