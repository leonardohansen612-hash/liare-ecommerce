function productSlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function productId(p){return p.variantCode||[p.modelCode,(p.aromas||[]).map(productSlug).join('--')].filter(Boolean).join('--')||productSlug(p.name)}
function productPath(p){return '/produtos/'+productSlug(p.slug||p.name)+'/'}
function productUrl(p){const params=new URLSearchParams();const aroma=new URLSearchParams(location.search).get('aroma');if(aroma)params.set('aroma',aroma);return productPath(p)+(params.size?'?'+params.toString():'')}
function productPhotos(p){return [...new Set([p.image,...(p.images||[])].filter(Boolean))]}
