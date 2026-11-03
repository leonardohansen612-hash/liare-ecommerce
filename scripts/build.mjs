import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { metaCatalog } from '../src/data/meta-feed.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src');
const output = resolve(root, 'dist');
const manifest = JSON.parse(await readFile(resolve(root, 'scripts/manifest.json'), 'utf8'));
const check = process.argv.includes('--check');
const cache = new Map();

async function readSource(name) {
  const path = resolve(source, name);
  if (relative(source, path).startsWith('..')) throw new Error(`Invalid source path: ${name}`);
  if (!cache.has(path)) cache.set(path, await readFile(path, 'utf8'));
  return cache.get(path);
}

// Includes are expanded at build time. The browser receives the same static files,
// without template scripts, added requests, changed markup or reordered styles.
async function expand(text, page, ancestors = []) {
  const pattern = /\{\{(include:([^}]+)|current:([^}]+))\}\}/g;
  let result = '', cursor = 0;
  for (const match of text.matchAll(pattern)) {
    result += text.slice(cursor, match.index);
    if (match[2]) {
      const name = match[2];
      if (ancestors.includes(name)) throw new Error(`Circular include: ${name}`);
      result += await expand(await readSource(name), page, [...ancestors, name]);
    } else if (match[3]) {
      result += page !== 'index' && match[3] === page ? ' aria-current="page"' : '';
    }
    cursor = match.index + match[0].length;
  }
  result += text.slice(cursor);
  if (/\{\{(?:include:|current:)/.test(result)) throw new Error('Unresolved template directive');
  return result;
}

const files = new Map();
for (const page of manifest.pages) files.set(`${page}.html`, await expand(await readSource(`pages/${page}.html`), page));

// Each product has its own HTML metadata, available before JavaScript runs so
// messaging apps can fetch the correct photograph, title and description.
const sharing = JSON.parse(await readSource('data/sharing.json'));
const products = JSON.parse(await readSource('data/products.json'));
const productLinks = {};
runInNewContext(await readSource('scripts/shared/product-links.js'), productLinks);
runInNewContext(await readSource('scripts/shared/product-stock.js'), productLinks);
files.set('meta-catalog.csv', metaCatalog(products, {siteUrl: sharing.siteUrl, ...productLinks}));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const absoluteUrl = path => new URL(path, sharing.siteUrl + '/').href;
const previewImage = image => 'sharing/' + image.replace(/^.*\//, '').replace(/\.[^.]+$/, '.jpg');
function withSharing(html, {path, title, description, image = sharing.image, imageAlt = sharing.imageAlt}) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const meta = [
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...Object.entries({
      'og:type':'website', 'og:locale':'pt_BR', 'og:site_name':sharing.siteName,
      'og:title':title, 'og:description':description, 'og:url':url,
      'og:image':imageUrl, 'og:image:type':'image/jpeg', 'og:image:alt':imageAlt,
      ...(image === sharing.image && sharing.imageWidth && sharing.imageHeight ? {'og:image:width':sharing.imageWidth, 'og:image:height':sharing.imageHeight} : {})
    }).map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}">`),
    ...Object.entries({
      'twitter:card':'summary_large_image', 'twitter:title':title,
      'twitter:description':description, 'twitter:image':imageUrl, 'twitter:image:alt':imageAlt
    }).map(([name, content]) => `<meta name="${name}" content="${escapeHtml(content)}">`)
  ].join('\n');
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace('</head>', meta + '\n</head>');
}
const productTemplate = files.get('produto.html');
const productPaths = new Set();
for (const p of products) {
  const path = productLinks.productPath(p);
  if (!p.slug || productPaths.has(path)) throw new Error(`Missing or duplicate product slug: ${p.name}`);
  productPaths.add(path);
  const name = p.name.trim();
  files.set(path.slice(1) + 'index.html', withSharing(productTemplate, {
    path, title:name + ' · LIARE',
    description:p.description || name + ' — uma criação feita à mão no ateliê LIARE.',
    image:p.image ? previewImage(p.image) : sharing.image, imageAlt:name + ' — vela artesanal LIARE'
  }));
}
for (const page of manifest.pages) {
  const html = files.get(`${page}.html`);
  files.set(`${page}.html`, withSharing(html, {
    path:page === 'index' ? '/' : `/${page}.html`,
    title:html.match(/<title>([^<]*)<\/title>/)[1],
    description:html.match(/<meta name="description" content="([^"]*)">/)[1]
  }));
}
for (const [name, parts] of Object.entries(manifest.styles)) {
  files.set(name, await expand((await Promise.all(parts.map(readSource))).join('')));
}
for (const name of manifest.scripts) files.set(name, await expand(await readSource(`scripts/${name}`)));
for (const name of manifest.data) {
  const text = await readSource(`data/${name}`);
  JSON.parse(text);
  files.set(name, text);
}
for (const name of manifest.assets) files.set(name, await readFile(resolve(source, 'assets', name)));

await mkdir(output, { recursive: true });
for (const [name, contents] of files) {
  const path = resolve(output, name);
  const expected = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (check) {
    const actual = await readFile(path);
    if (!actual.equals(expected)) throw new Error(`${name} is stale: run npm run build`);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, expected);
  }
  if (name.endsWith('.js')) {
    const syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (syntax.status !== 0) throw new Error(syntax.stderr || `Invalid JavaScript: ${name}`);
  }
}
console.log(`${check ? 'Verified' : 'Built'} ${files.size} static files.`);
