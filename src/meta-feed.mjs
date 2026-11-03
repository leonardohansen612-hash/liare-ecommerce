// Generated from the same catalog and identity/stock helpers used by the store.
export function metaCatalog(products, {siteUrl, productId, productPath, productStock}) {
  const columns = ['id','title','description','availability','condition','price','link','image_link','brand','quantity_to_sell_on_facebook'];
  const ids = new Set();
  const rows = products.filter(p => !p.priceOnRequest).map(p => {
    const id = productId(p);
    const amount = Number(p.price?.minValue?.amount);
    if (!id || ids.has(id)) throw new Error(`Missing or duplicate Meta product ID: ${p.name}`);
    ids.add(id);
    if (!Number.isFinite(amount) || amount <= 0 || p.price.minValue.amount !== p.price.maxValue.amount) {
      throw new Error(`Meta requires an exact positive price: ${p.name}`);
    }
    if (!p.name?.trim() || !p.image) throw new Error(`Missing Meta product data: ${id}`);
    const image = 'sharing/' + p.image.replace(/^.*\//, '').replace(/\.[^.]+$/, '.jpg');
    return [id, p.name.trim(), p.description || `${p.name.trim()}. Vela artesanal LIARE${p.waxWeightGrams ? ` com ${p.waxWeightGrams} g` : ''}.`,
      productStock(p) === 0 ? 'out of stock' : 'in stock', 'new', `${amount.toFixed(2)} BRL`,
      new URL(productPath(p), siteUrl).href, new URL(image, siteUrl).href, 'LIARE', productStock(p)];
  });
  const cell = value => '"' + String(value).replace(/"/g, '""') + '"';
  return [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
