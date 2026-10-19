# Aplicação das logos do TDB Responde

As duas imagens fornecidas pelo responsável em 19/10/2026 são a referência da marca. Preservar desenho, proporções, cores e texto; não substituir o símbolo por ícones genéricos.

- `frontend/public/img/logo-simbolo.png` (512 × 492): símbolo sem texto, usado no menu dos painéis, ao lado do nome do sistema.
- `frontend/public/img/logo-completa.png` (840 × 672): logo com nome e assinatura, usada no header, footer e login.
- `frontend/public/img/favicon.png` (64 × 64): aplicação do símbolo sem texto no navegador.
- `frontend/public/img/apple-touch-icon.png` (180 × 180): aplicação do símbolo sem texto no atalho móvel.

Usar `object-contain` ou altura automática, mantendo a proporção. No footer escuro, a base branca acompanha a logo completa com pouco preenchimento para garantir a leitura do nome azul-marinho. A logo da instituição parceira permanece em `frontend/public/img/turmadobem.png`.

## Preparação dos arquivos

Ferramenta integrada `imagegen`, em modo de edição com transparência, a partir das duas imagens fornecidas. Os arquivos finais foram exportados nos tamanhos acima, preservando a proporção e o canal de transparência. Os arquivos anteriores `logo.png`, `logo-header.png` e `favicon.svg` foram preservados, mas não são mais referenciados pela aplicação React.

### Prompt do símbolo

Precise asset preparation of the attached OFFICIAL brand logo, NOT a redesign. Edit target: provided blue smiling tooth with blue heart at top right and light blue speech bubble behind it. Remove ONLY the external white/near-white background outside the logo, making it genuinely transparent. Preserve the white filled tooth interior and all white areas enclosed by the tooth's blue contour. Preserve exact original tooth shape, face, heart, speech bubble silhouette, proportions, blue colors and gradients, smooth edges. Do not recolor, redraw, reinterpret, stylize, simplify, add text, replace anything or add shadows. Trim the excessive outer empty margins so the entire logo occupies about 94 percent of the output canvas, with just a small even transparent safe margin, and ensure no clipping. Produce a crisp high resolution transparent PNG for this exact official symbol, used on dashboard navigation and favicon.

### Prompt da logo completa

Use case: precise official brand asset background removal. Edit target: the attached FULL TDB Responde official logo. Keep the entire design EXACTLY as supplied: blue smiling tooth, heart, light blue speech bubble, lowercase wordmark 'tdb responde', exact tagline 'Unificando atendimentos que fazem o bem.' and blue smile underline. Do not redesign, redraw, recolor, change fonts, change lettering, change shapes, remove any logo element, or rearrange components. Only remove the external white/near-white background, with genuine transparency, smooth clean antialiased edges without stray specks or white halo. Preserve the WHITE FILLED TOOTH interior and all white parts enclosed by the blue tooth contour. Also make the empty spaces between letters and inside letter counters transparent as appropriate. Tighten framing to remove excessive exterior white margin, leaving about 3 percent even safe transparent margin around the complete art. Entire logo must remain visible and proportional. Crisp transparent PNG at high resolution, ideal for website header and footer. Preserve exact blue colors and navy wordmark. No added background, no new text, no additional designs.
