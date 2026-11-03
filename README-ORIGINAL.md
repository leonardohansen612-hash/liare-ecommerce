# LIARE

Static catalog site, with orders sent through WhatsApp. No runtime framework or third-party build dependencies.

## Editing

Edit `src/`, then run:

```sh
npm run build
npm run check
```

`dist/` is the checked-in publication output, generated from `src/`. It is not the place to author changes. The build is deterministic and does not add any browser requests or change the script execution order.

## Source map

The public `/meta-catalog.csv` is generated on every build from `src/data/products.json`, using the store's stable product IDs, canonical links and availability helpers. It includes fixed-price products, including sold-out limited editions, and excludes price-on-request items. Photos use the existing public JPEG sharing assets. Connect this URL as a scheduled primary data feed in Meta Commerce Manager; future catalog publications update it automatically. The required `quantity_to_sell_on_facebook` uses the store purchase limit: actual remaining quantities for limited editions and the existing technical cap of 999 for made-to-order candles. This cap does not represent atelier inventory or change the quantities displayed on the site.

| Area | Source |
| --- | --- |
| Page structure and metadata | `src/pages/` |
| Page sections | `src/sections/` |
| Header, navigation, search, promotion strip, footer, WhatsApp button | `src/partials/` |
| Product detail page and gallery | `src/pages/produto.html`, `src/styles/product.css`, `src/scripts/product.js` |
| Shared product links | `src/scripts/shared/product-links.js` |
| Shared style rules | `src/styles/store/` |
| Original inline page styles | `src/styles/page-base.css`, `src/styles/aromas-*.css`, `src/styles/empresas-1.css` |
| Shop styles | `src/styles/shop.css` |
| Home shelves, categories and hero | `src/scripts/app.js` |
| Shop search, sorting and price filters | `src/scripts/shop.js` |
| Product cards, aroma matching and product links | `src/scripts/shared/` |
| Bag, navigation, carousels and top strip | Other files in `src/scripts/` |
| Products and prices | `src/data/products.json` |
| Icons | `src/assets/` |
| Assembly order | `scripts/manifest.json` |

`{{include:path}}` expands a shared fragment at build time. Navigation uses `{{current:page}}` to preserve the active-page attribute. Every page includes the same header and search form. On informational pages the search submits to the shop; home and shop keep their existing interactive search.

## Responsive layout

- Mobile: up to and including 760 CSS pixels.
- Tablet: 761–991 CSS pixels.
- Desktop: from 992 CSS pixels.

These values are also used by the corresponding scripts. Keep the CSS and JavaScript synchronized when changing a breakpoint.

On the mobile home page, the header stays in normal document flow above the hero. Its two navigation/search rows must not overlay the photograph. The home header retains the brand kraft gradient; tablet and desktop keep the photo overlay.

## Preserve the appearance

The CSS files are assembled in manifest order. This preserves the current cascade, including the final desktop search dimensions and mobile overrides. Do not move or merge rules across their existing positions casually. Some base styles also appear inline in page templates; those positions are intentional and must remain stable unless a design change is requested.

The structural cleanup preserved every published file byte for byte. Styles that participate in the cascade were retained rather than deleted based only on apparent duplication.

When editing products, retain the real product data and variant behavior. All products currently appear in every category by the owner's request for design review.

## Verification and publication

`npm run check` verifies every generated file against its source and checks JavaScript syntax. For a behavior or appearance change, also verify the affected flow at the relevant widths.

Publication remains static via `.openai/hosting.json`. Build before packaging, publish the checked-in generated output, and preserve the site's audience.

## Brand palette

Change the primary kraft color in `src/styles/brand-color.txt` only. `src/styles/store/palette.css` derives the light surfaces, borders and supporting text colors from it. All pages use these shared variables, including their inline styles. The browser theme-color metadata also includes the same source value. Run build and check after changes.

## Brand typography

`src/styles/store/fonts.css` loads the navigation font (DM Sans), catalog fonts, and the self-hosted Catchy Mager logo font. It must remain first in the store CSS manifest so its Google Fonts import is valid. Catchy Mager is used only for the LIARE name; the owner confirmed a commercial license. Its font asset is `src/assets/catchy-mager.otf`.

## Aroma catalog

Aroma cards and their three standardized characteristics live in `src/sections/aromas/02-section.html`. Keep exactly three `data-characteristics` values, separated by `|`, matching the three displayed words. `aromas.js` filters across all three characteristics, using underlined Cinzel selectors. Images are landscape (2:1); each card retains its full description and links to the shop with its aroma filter.

## Product pages

Product cards use native links to `/produtos/<slug>/`. Keep each product's `slug` stable when changing its display name. The build generates a directory index for every product, with its own title, description, canonical URL and Open Graph/Twitter metadata. Sharing defaults live in `src/data/sharing.json`; JPEG copies of the approved photographs live in `src/assets/sharing/`. These tags are present in the HTML before scripts run. The product template uses a root base URL so shared navigation, images, scripts and catalog requests work from nested paths.

The default link preview uses `sharing/caixa-descobertas-previa-inteira-20261103.jpg`, a dedicated 1200 × 630 canvas. The approved portrait photograph fits entirely within the central 630 × 630 area with an ivory margin, preserving every candle in both wide and centered square previews. Keep the original photo and labels unchanged; product photos and the Meta catalog feed still use their existing assets. `imageWidth` and `imageHeight` in the sharing settings apply only to the default preview.

Legacy `produto.html?produto=<product-id>` links still work; their IDs use the existing variant or model and aroma fields. The product page renders the current catalog data, full uncropped photographs and gallery, quantity and any required choices. The card's photo and title open the detail page; its bag button adds one unit through the existing cart API and shows the confirmation without navigating. Products with required options still open the selection page. Adding to the bag uses the existing cart API and local storage, so navigation preserves the order. Cart thumbnails resolve all HTTP(S) catalog image names, including the amber range; absent or failed photographs leave the text at full width. Full-size photographs open as normal image pages.

Run `npm run test` after changes to product links, detail rendering or ordering. Browser layout verification requires the supported browser-control skill.

The box below the description reads optional `technicalDetails` from each catalog item: `aromaPyramid` (`top`, `heart`, `base`), `olfactiveFamily`, `olfactiveProfile`, `composition`, `container`, `production`, `useInstructions`, `precautions` and `burnTimeEstimate` (`minHours`/`maxHours`). Fragrance names stay in the separate Aroma field. Only show pyramid notes confirmed by the owner's essence catalog; never derive them from a fragrance's name. Missing values stay hidden; the weight remains the existing `waxWeightGrams`. Burn times display explicitly as estimates with an explanatory note, and are not inferred for other products.

Milk-shake de Morango uses a 30–40 hour estimate authorized by the owner, based on its declared 190 g and comparable coconut-wax candles. This is a comparison, not a burn-test result. Reference: https://www.acandelabra.com.br/velas-artesanais/ (190 g, advertised up to 40 hours; reviewed 2026-10-15). Its profile follows the site's existing Morango e Chantilly aroma card; its waxes follow the owner's recipe. Its Peter Paiva aroma pyramid was read from the owner's LIARE — Catálogo de Essências on 2026-10-15: https://docs.google.com/spreadsheets/d/17LsIle7c1oclPvHDmSveyy5j4XSHbznRuYfFvy81C4Q/edit (Morango com Chantilly row).

The details box follows the owner's reference with native expandable sections: olfactory profile, characteristics, directions, precautions and composition. Profile and characteristics start open; optional sections are hidden when the product has no data. Do not copy scent notes, area coverage, vegan/cruelty-free claims or ingredient lists from reference products. Milk-shake's general care copy follows https://candles.org/candle-safety-tips/ and a conservative three-hour session limit from the owner's supplied reference.

Milk-shake de Chocolate was added on 2026-10-22 with the owner's three approved photographs and a matching wide homepage campaign. Its R$75 price and stable variant ID `prod_1792672506018` were read from the atelier recipe at revision 142. Its 190 g follows the approved label. It does not inherit strawberry's aroma pyramid or burn-time estimate. The homepage uses the wide photograph on larger screens and the portrait product photograph on phones; its link opens the chocolate product page.

Caixa de Descobertas — Aromas Clássicos was added on 2026-10-29 with the owner-selected 3:4 photograph, used unchanged apart from WebP/JPEG encoding. The atelier recipe `chatgpt_cb68c2dad4c147a3c23af082`, revision 227, supplies the R$110 sale price, six fixed aromas, six 45 g candles (270 g total), coconut wax, wooden wicks, 50 ml tins, aroma card and 24 × 16 × 4 cm box. Its stable variant ID follows that recipe. The home campaign links directly to the kit page.

Latinhas · Aromas Clássicos was added on 2026-10-29 with six separate 45 g products at R$25 each and matching portrait product photographs. Stable variant IDs came from the atelier recipe catalog, revision 235. Homepage shelf, category shortcut and shop filter expose the collection. The discovery box also belongs to Latinhas and comes first in both the category and homepage shelf, followed by the six individual tins; preserve this catalog order. Existing kit, hero campaigns and prior products retain their data. Only limited editions show quantities and enforce remaining stock. Currently that is the Clássico Âmbar range, which retains its existing sold-out aromas and two-unit limits. All other candles, including the tins and discovery box, are available to order without displaying atelier stock or limiting purchases to the atelier balance. Do not copy atelier stock to ordinary made-to-order products.

The desktop discovery-box hero uses `hero-caixa-descobertas-desktop-peonias-inteira-20261103.webp`. On 2026-11-03, the Buquê de Peônias tin and adjoining left edge of the open box were repaired so the full round tin and label are visible. The portrait campaign and product photographs keep their approved assets.
