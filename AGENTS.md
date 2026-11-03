# LIARE maintenance

- Read README.md for the source map. Author changes in src/, never directly in dist/.
- Run npm run build, then npm run check. Commit generated dist/ with its source changes.
- Shared UI lives in src/partials; product presentation logic in src/scripts/shared. Update these once instead of copying edits across pages.
- CSS manifest order and inline style positions preserve the existing cascade. Preserve them during refactoring.
- Mobile <=760px; tablet 761–991px; desktop >=992px. Keep CSS and script breakpoints in agreement.
- No framework migration or new build dependencies are needed for ordinary edits.
- Keep all products in all categories during the owner's ongoing design review.
- Preserve actual product data, variant selection, bag persistence and the WhatsApp order flow.
- Show quantities and enforce remaining stock only for limited editions. Currently only Clássico Âmbar is limited; other candles are made to order, with trackInventory false and no stockQuantity. Do not import atelier stock into ordinary product availability.
- Structural-only refactors must preserve published markup, styles, assets and behavior. Compare generated output with the previous version before publishing.
